let cachedToken = null;
let tokenExpiresAt = 0;

async function fetchToken() {
  const id = process.env.FATSECRET_CLIENT_ID;
  const secret = process.env.FATSECRET_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET not set");
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const resp = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`FatSecret token request failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  cachedToken = data.access_token;
  const ttl = (data.expires_in || 86400) * 1000;
  tokenExpiresAt = Date.now() + ttl;
  return cachedToken;
}

export async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;
  return await fetchToken();
}

export async function callFatSecret(query) {
  const token = await getToken();
  const url = new URL("https://platform.fatsecret.com/rest/server.api");
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  if (!url.searchParams.has("format")) url.searchParams.set("format", "json");
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await resp.text();
  return {
    status: resp.status,
    text,
    contentType: resp.headers.get("content-type") || "application/json",
  };
}
