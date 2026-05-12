import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function fatSecretDevPlugin(env) {
  return {
    name: "fatsecret-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/fatsecret/proxy", async (req, res) => {
        try {
          if (env.FATSECRET_CLIENT_ID) process.env.FATSECRET_CLIENT_ID = env.FATSECRET_CLIENT_ID;
          if (env.FATSECRET_CLIENT_SECRET) process.env.FATSECRET_CLIENT_SECRET = env.FATSECRET_CLIENT_SECRET;
          const mod = await import("./api/_lib/fatsecret.js");
          const url = new URL(req.url, "http://localhost");
          const query = {};
          url.searchParams.forEach((v, k) => {
            query[k] = v;
          });
          if (!query.method) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing 'method' query param" }));
            return;
          }
          const r = await mod.callFatSecret(query);
          res.statusCode = r.status;
          res.setHeader("Content-Type", r.contentType);
          res.end(r.text);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String((err && err.message) || err) }));
        }
      });
    },
  };
}

function coachDevPlugin(env) {
  return {
    name: "coach-dev-proxy",
    configureServer(server) {
      const mount = (route, modPath) => {
        server.middlewares.use(route, async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "POST only" }));
            return;
          }
          try {
            if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
            const mod = await import(modPath + "?t=" + Date.now());
            await mod.default(req, res);
          } catch (err) {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: String((err && err.message) || err) }));
            }
          }
        });
      };
      mount("/api/coach/chat", "./api/coach/chat.js");
      mount("/api/coach/highlights", "./api/coach/highlights.js");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), fatSecretDevPlugin(env), coachDevPlugin(env)],
    server: {
      open: true,
      proxy: {
        "/api/oura": {
          target: "https://api.ouraring.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/oura/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (env.OURA_TOKEN) {
                proxyReq.setHeader("Authorization", `Bearer ${env.OURA_TOKEN}`);
              }
            });
          },
        },
      },
    },
  };
});
