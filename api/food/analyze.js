import { xaiComplete } from "../_lib/xai.js";

export const config = { maxDuration: 60 };

const MAX_IMAGE_CHARS = 8_000_000; // ~6MB base64 is plenty after client compress
const ALLOWED_MIME = { "image/jpeg": true, "image/jpg": true, "image/png": true };

const SYSTEM_PROMPT = `You estimate nutrition from a photo of food or a meal.
Respond with JSON only — no markdown fences, no commentary.
Shape:
{
  "food_name": string (short dish name),
  "serving_description": string (what you estimated, e.g. "1 plate" or "200g"),
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "low" | "medium" | "high",
  "notes": string (brief caveat, optional)
}
Rules:
- Numbers are for the entire portion visible (totals, not per 100g).
- protein, carbs, fat are grams; calories are kcal. All must be >= 0.
- Prefer a single combined estimate for the plate if multiple foods are visible.
- If the image is not food, still return the JSON shape with food_name "Unknown" and zeros, confidence "low", and a note.`;

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
    // Allow data-URL prefix
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
        {
          type: "text",
          text: "Estimate nutrition for this meal. JSON only.",
        },
        {
          type: "image_url",
          image_url: { url: dataUrl, detail: "low" },
        },
      ],
    };

    const { text } = await xaiComplete({
      system: SYSTEM_PROMPT,
      messages: [userMsg],
      model: "grok-4.3",
      temperature: 0.2,
      maxTokens: 250,
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
    res.statusCode = err && err.code === "NO_KEY" ? 503 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String((err && err.message) || err) }));
  }
}
