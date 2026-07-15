import {
  xaiComplete,
  rateLimitOrThrow,
  clientKeyFromReq,
  xaiErrorStatus,
} from "../_lib/xai.js";

export const config = { maxDuration: 45 };

const MAX_IMAGE_CHARS = 1_200_000; // tighter cap after client compress (~900KB)
const ALLOWED_MIME = { "image/jpeg": true, "image/jpg": true, "image/png": true };

const SYSTEM_PROMPT = `Estimate nutrition from a meal photo. JSON only, no fences.
{"food_name":string,"serving_description":string,"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":"low"|"medium"|"high","notes":string}
Numbers are for the visible portion. Macros in grams. Prefer one combined plate estimate.`;

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
    let raw = "";
    let tooBig = false;
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 2_000_000) tooBig = true;
    });
    req.on("end", () => {
      if (tooBig) {
        const err = new Error("Body too large");
        err.status = 413;
        reject(err);
        return;
      }
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
  let t = String(s || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  return t.trim();
}

function numOrNull(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeEstimate(raw) {
  if (!raw || typeof raw !== "object") return null;
  const food_name = typeof raw.food_name === "string" ? raw.food_name.trim().slice(0, 120) : "";
  const serving_description =
    typeof raw.serving_description === "string" ? raw.serving_description.trim().slice(0, 120) : "1 serving";
  const calories = numOrNull(raw.calories);
  const protein = numOrNull(raw.protein);
  const carbs = numOrNull(raw.carbs);
  const fat = numOrNull(raw.fat);
  if (!food_name) return null;
  if (calories == null || calories < 0) return null;
  if (protein == null || protein < 0) return null;
  if (carbs == null || carbs < 0) return null;
  if (fat == null || fat < 0) return null;
  const conf = ["low", "medium", "high"].includes(raw.confidence) ? raw.confidence : "medium";
  const notes = typeof raw.notes === "string" ? raw.notes.trim().slice(0, 300) : "";
  return {
    food_name,
    serving_description: serving_description || "1 serving",
    calories: Math.round(calories * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    confidence: conf,
    notes,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }
  try {
    rateLimitOrThrow("food:" + clientKeyFromReq(req), 6, 60_000);

    const body = await readJsonBody(req);
    let mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase().trim() : "image/jpeg";
    if (mimeType === "image/jpg") mimeType = "image/jpeg";
    if (!ALLOWED_MIME[mimeType]) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "mimeType must be image/jpeg or image/png" }));
      return;
    }
    let imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const dataUrlMatch = /^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/i.exec(imageBase64);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1].toLowerCase() === "image/jpg" ? "image/jpeg" : dataUrlMatch[1].toLowerCase();
      imageBase64 = dataUrlMatch[2];
    }
    imageBase64 = imageBase64.replace(/\s/g, "");
    if (!imageBase64 || imageBase64.length < 32) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "imageBase64 required" }));
      return;
    }
    if (imageBase64.length > MAX_IMAGE_CHARS) {
      res.statusCode = 413;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Image too large — compress before upload" }));
      return;
    }

    const dataUrl = "data:" + mimeType + ";base64," + imageBase64;
    const userMsg = {
      role: "user",
      content: [
        { type: "text", text: "Estimate nutrition. JSON only." },
        { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
      ],
    };

    const { text } = await xaiComplete({
      system: SYSTEM_PROMPT,
      messages: [userMsg],
      model: "grok-4.3",
      temperature: 0.1,
      maxTokens: 200,
      reasoningEffort: "none",
    });

    let parsed;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch (_e) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Model returned non-JSON", raw: String(text).slice(0, 400) }));
      return;
    }

    const estimate = normalizeEstimate(parsed);
    if (!estimate) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Model returned invalid estimate", raw: String(text).slice(0, 400) }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ estimate }));
  } catch (err) {
    res.statusCode = xaiErrorStatus(err);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String((err && err.message) || err) }));
  }
}
