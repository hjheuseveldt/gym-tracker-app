// Thin wrapper around xAI (Grok) Chat Completions API.
// OpenAI-compatible — no SDK dependency, just fetch.

const XAI_URL = "https://api.x.ai/v1/chat/completions";
export const DEFAULT_MODEL = "grok-4.5";

function requireKey() {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    const err = new Error("XAI_API_KEY environment variable is not set");
    err.code = "NO_KEY";
    throw err;
  }
  return key;
}

function buildMessages({ system, messages }) {
  const out = [];
  if (system) out.push({ role: "system", content: system });
  for (const m of messages || []) {
    if (!m) continue;
    out.push({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: m.content,
    });
  }
  return out;
}

// Non-streaming call. Returns the assistant text.
export async function xaiComplete({ system, messages, model, maxTokens, temperature }) {
  const key = requireKey();
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 1200,
    temperature: temperature == null ? 0.7 : temperature,
    messages: buildMessages({ system, messages }),
  };
  const r = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + key,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error("xAI " + r.status + ": " + text.slice(0, 500));
    err.status = r.status;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw new Error("xAI returned non-JSON: " + text.slice(0, 200));
  }
  const out =
    parsed &&
    parsed.choices &&
    parsed.choices[0] &&
    parsed.choices[0].message &&
    parsed.choices[0].message.content;
  return { text: typeof out === "string" ? out : "", raw: parsed };
}

// Streams the assistant response to the given Node response object as SSE
// (OpenAI-compatible chat.completion.chunk events).
export async function xaiStreamToResponse(res, { system, messages, model, maxTokens, temperature }) {
  const key = requireKey();
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 1500,
    temperature: temperature == null ? 0.8 : temperature,
    messages: buildMessages({ system, messages }),
    stream: true,
  };

  const upstream = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + key,
      accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    res.statusCode = upstream.status || 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "xAI " + upstream.status, detail: errText.slice(0, 500) }));
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
