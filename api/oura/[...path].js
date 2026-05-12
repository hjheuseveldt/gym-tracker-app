export default async function handler(req, res) {
  const token = process.env.OURA_TOKEN;
  if (!token) {
    res.status(500).json({ error: "OURA_TOKEN environment variable is not set" });
    return;
  }

  const { path, ...query } = req.query;
  const subPath = Array.isArray(path) ? path.join("/") : path || "";
  const url = new URL(`https://api.ouraring.com/${subPath}`);
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.set(key, value);
  }

  try {
    const ouraRes = await fetch(url.toString(), {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const text = await ouraRes.text();
    res.status(ouraRes.status);
    res.setHeader("Content-Type", ouraRes.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: "Upstream Oura request failed", detail: String(err) });
  }
}
