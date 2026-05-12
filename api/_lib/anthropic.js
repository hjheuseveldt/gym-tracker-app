// Thin wrapper around Anthropic Messages API.
// Uses Claude Sonnet 4.5 by default. No SDK dependency — just fetch.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_MODEL = "claude-sonnet-4-5";

function requireKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error("ANTHROPIC_API_KEY environment variable is not set");
    err.code = "NO_KEY";
    throw err;
  }
  return key;
}

// Non-streaming JSON-ish call. Returns the assistant text.
export async function anthropicComplete({ system, messages, model, maxTokens, temperature }) {
  const key = requireKey();
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 1200,
    temperature: temperature == null ? 0.7 : temperature,
    system,
    messages,
  };
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error("Anthropic " + r.status + ": " + text.slice(0, 500));
    err.status = r.status;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw new Error("Anthropic returned non-JSON: " + text.slice(0, 200));
  }
  const out = (parsed.content || [])
    .filter((b) => b && b.type === "text")
    .map((b) => b.text)
    .join("");
  return { text: out, raw: parsed };
}

// Streams the assistant response to the given Node response object as SSE.
// The client receives Anthropic's native event stream (`event: content_block_delta`, etc.)
// and parses it incrementally for the chat UI.
export async function anthropicStreamToResponse(res, { system, messages, model, maxTokens, temperature }) {
  const key = requireKey();
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 1500,
    temperature: temperature == null ? 0.8 : temperature,
    system,
    messages,
    stream: true,
  };

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    res.statusCode = upstream.status || 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Anthropic " + upstream.status, detail: errText.slice(0, 500) }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }
  } catch (e) {
    try {
      res.write("event: error\ndata: " + JSON.stringify({ error: String(e && e.message) || "stream error" }) + "\n\n");
    } catch (_e) {}
  } finally {
    res.end();
  }
}
