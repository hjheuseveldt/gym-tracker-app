// Thin wrapper around xAI (Grok) Chat Completions API.
// OpenAI-compatible — no SDK dependency, just fetch.
//
// Spend guard (emergency):
// - Set XAI_ENABLED=1 (or "true") in the server env to allow calls.
// - Without that flag, every call fails closed so a leaked/abused key path stops.
// - Prefer grok-4.3 + reasoning_effort=none for cost.

const XAI_URL = "https://api.x.ai/v1/chat/completions";
export const DEFAULT_MODEL = "grok-4.3";

function requireKey() {
  const enabled = process.env.XAI_ENABLED;
  if (enabled !== "1" && enabled !== "true") {
    const err = new Error(
      "XAI_ENABLED is off — set XAI_ENABLED=1 in Vercel after rotating your xAI key to re-enable AI"
    );
    err.code = "DISABLED";
    throw err;
  }
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

function applyDefaults(body, { reasoningEffort }) {
  // Default off to avoid burning thinking tokens. Callers can override.
  const effort = reasoningEffort == null ? "none" : reasoningEffort;
  if (effort !== "") body.reasoning_effort = effort;
  return body;
}

// Simple per-instance rate limit (helps on warm lambdas / Node server; fails soft on cold starts).
const rateBuckets = new Map();
export function rateLimitOrThrow(bucketKey, max, windowMs) {
  const now = Date.now();
  let b = rateBuckets.get(bucketKey);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(bucketKey, b);
  }
  b.count += 1;
  if (b.count > max) {
    const err = new Error("Rate limit exceeded — try again in a minute");
    err.code = "RATE_LIMIT";
    err.status = 429;
    throw err;
  }
}

export function clientKeyFromReq(req) {
  const xf = (req && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "";
  const first = String(xf).split(",")[0].trim();
  return first || (req && req.socket && req.socket.remoteAddress) || "unknown";
}

export function xaiErrorStatus(err) {
  if (!err) return 500;
  if (err.code === "NO_KEY" || err.code === "DISABLED") return 503;
  if (err.code === "RATE_LIMIT" || err.status === 429) return 429;
  return err.status && Number.isFinite(err.status) ? err.status : 500;
}

// Non-streaming call. Returns the assistant text.
export async function xaiComplete({ system, messages, model, maxTokens, temperature, reasoningEffort }) {
  const key = requireKey();
  const body = applyDefaults(
    {
      model: model || DEFAULT_MODEL,
      max_tokens: maxTokens || 600,
      temperature: temperature == null ? 0.7 : temperature,
      messages: buildMessages({ system, messages }),
    },
    { reasoningEffort }
  );
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
export async function xaiStreamToResponse(res, { system, messages, model, maxTokens, temperature, reasoningEffort }) {
  const key = requireKey();
  const body = applyDefaults(
    {
      model: model || DEFAULT_MODEL,
      max_tokens: maxTokens || 700,
      temperature: temperature == null ? 0.8 : temperature,
      messages: buildMessages({ system, messages }),
      stream: true,
    },
    { reasoningEffort }
  );

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
