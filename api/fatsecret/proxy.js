import { callFatSecret } from "../_lib/fatsecret.js";

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const method = Array.isArray(q.method) ? q.method[0] : q.method;
    if (!method) {
      res.status(400).json({ error: "Missing 'method' query param" });
      return;
    }
    const query = {};
    for (const [k, v] of Object.entries(q)) {
      query[k] = Array.isArray(v) ? v[0] : v;
    }
    const r = await callFatSecret(query);
    res.status(r.status);
    res.setHeader("Content-Type", r.contentType);
    res.send(r.text);
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
