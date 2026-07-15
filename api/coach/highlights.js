import {
  xaiComplete,
  rateLimitOrThrow,
  clientKeyFromReq,
  xaiErrorStatus,
} from "../_lib/xai.js";
import { highlightsSystemPrompt } from "../_lib/coachPrompt.js";

export const config = { maxDuration: 30 };

const MAX_CONTEXT_CHARS = 10_000;
const MAX_SIGNALS_CHARS = 4_000;

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 200_000) {
        const err = new Error("Body too large");
        err.status = 413;
        reject(err);
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function stripFences(s) {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  return t.trim();
}

function pickArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.highlights)) return parsed.highlights;
  if (parsed && Array.isArray(parsed.cards)) return parsed.cards;
  return null;
}

function normalizeCard(c) {
  if (!c || typeof c !== "object") return null;
  const kind = ["win", "watch", "fix"].includes(c.kind) ? c.kind : "watch";
  const title = typeof c.title === "string" ? c.title.slice(0, 80) : "";
  const body = typeof c.body === "string" ? c.body.slice(0, 600) : "";
  if (!title || !body) return null;
  return { kind, title, body };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }
  try {
    rateLimitOrThrow("hl:" + clientKeyFromReq(req), 3, 60_000);

    const body = await readJsonBody(req);
    let signalsJson = JSON.stringify(body.signals || []);
    let contextJson = JSON.stringify(body.context || {});
    if (signalsJson.length > MAX_SIGNALS_CHARS) signalsJson = signalsJson.slice(0, MAX_SIGNALS_CHARS) + "…";
    if (contextJson.length > MAX_CONTEXT_CHARS) contextJson = contextJson.slice(0, MAX_CONTEXT_CHARS) + "…";
    const system = highlightsSystemPrompt(signalsJson, contextJson);
    const userMsg = {
      role: "user",
      content: "Return JSON array of 4-6 highlight cards now.",
    };
    const { text } = await xaiComplete({
      system,
      messages: [userMsg],
      model: "grok-4.3",
      temperature: 0.4,
      maxTokens: 700,
      reasoningEffort: "none",
    });
    let parsed;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch (_e) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Model returned non-JSON", raw: text.slice(0, 400) }));
      return;
    }
    const arr = pickArray(parsed);
    if (!arr) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Model returned wrong shape", raw: text.slice(0, 400) }));
      return;
    }
    const cards = arr.map(normalizeCard).filter(Boolean).slice(0, 6);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ highlights: cards }));
  } catch (err) {
    res.statusCode = xaiErrorStatus(err);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String((err && err.message) || err) }));
  }
}
