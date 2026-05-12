import { anthropicStreamToResponse } from "../_lib/anthropic.js";
import { chatSystemPrompt } from "../_lib/coachPrompt.js";

export const config = { maxDuration: 60 };

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
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
    const body = await readJsonBody(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "messages[] required" }));
      return;
    }
    const contextJson = JSON.stringify(body.context || {}, null, 2);
    const system = chatSystemPrompt(contextJson);
    const cleanMessages = messages
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    if (!cleanMessages.length) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "no usable messages" }));
      return;
    }
    await anthropicStreamToResponse(res, { system, messages: cleanMessages });
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = err && err.code === "NO_KEY" ? 503 : 500;
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
