import https from "node:https";

const BACKEND_SETTINGS_URL = "https://staropub-menu.onrender.com/api/settings";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      agent: httpsAgent,
      timeout: 8000,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          resolve({ status: res.statusCode, data: parsed, ok: res.statusCode >= 200 && res.statusCode < 300 });
        } catch (err) {
          resolve({ status: res.statusCode, data, ok: false });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.status(204).end();
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const table = String(body.table || "1").trim();
      const type = String(body.type || "Waiter 👨🍳").trim();
      const paymentMethod = String(body.paymentMethod || "").trim();

      const newCall = {
        id: Date.now(),
        table,
        type: paymentMethod ? `${type} (${paymentMethod})` : type,
        time: new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      // Pull current waiterCalls from settings and prepend
      let existingCalls = [];
      try {
        const settingsRes = await fetchJson(BACKEND_SETTINGS_URL);
        if (settingsRes.ok && Array.isArray(settingsRes.data?.waiterCalls)) {
          existingCalls = settingsRes.data.waiterCalls;
        }
      } catch {}

      const updatedCalls = [newCall, ...existingCalls].slice(0, 50);

      // Persist to backend settings
      try {
        await fetchJson(BACKEND_SETTINGS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waiterCalls: updatedCalls }),
        });
      } catch (err) {
        console.warn("[API Calls] Failed to save to upstream settings:", err.message);
      }

      return res.status(200).json({ ok: true, call: newCall, message: "Call registered successfully" });
    } catch (err) {
      console.error("[API Calls] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "GET") {
    try {
      const settingsRes = await fetchJson(BACKEND_SETTINGS_URL);
      const calls = (settingsRes.ok && Array.isArray(settingsRes.data?.waiterCalls)) ? settingsRes.data.waiterCalls : [];
      return res.status(200).json({ calls });
    } catch (err) {
      return res.status(200).json({ calls: [] });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
