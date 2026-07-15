import {
  xaiStreamToResponse,
  rateLimitOrThrow,
  clientKeyFromReq,
  xaiErrorStatus,
} from "../_lib/xai.js";
import { chatSystemPrompt } from "../_lib/coachPrompt.js";

export const config = { maxDuration: 45 };

const MAX_MSGS = 8;
const MAX_MSG_CHARS = 1200;
const MAX_CONTEXT_CHARS = 12_000;

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }
  try {
    rateLimitOrThrow("chat:" + clientKeyFromReq(req), 8, 60_000);

    const body = await readJsonBody(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "messages[] required" }));
      return;
    }
    let contextJson = JSON.stringify(body.context || {});
    if (contextJson.length > MAX_CONTEXT_CHARS) {
      contextJson = contextJson.slice(0, MAX_CONTEXT_CHARS) + "…";
    }
    const system = chatSystemPrompt(contextJson);
    const cleanMessages = messages
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, MAX_MSG_CHARS),
      }))
      .slice(-MAX_MSGS);
    if (!cleanMessages.length) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "no usable messages" }));
      return;
    }
    await xaiStreamToResponse(res, {
      system,
      messages: cleanMessages,
      model: "grok-4.3",
      maxTokens: 500,
      temperature: 0.6,
      reasoningEffort: "none",
    });
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = xaiErrorStatus(err);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: String((err && err.message) || err) }));
    } else {
      try {
        res.write("event: error\ndata: " + JSON.stringify({ error: String((err && err.message) || err) }) + "\n\n");
        res.end();
      } catch (_e) {}
    }
  }
}
