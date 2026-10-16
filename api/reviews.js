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
      const name = String(body.name || "სტუმარი").trim() || "სტუმარი";
      const rating = Number(body.rating) || 5;
      const comment = String(body.comment || "").trim();
      const table = String(body.table || "").trim();

      const newReview = {
        id: Date.now(),
        name,
        rating,
        comment,
        table: table || "—",
        date: new Date().toISOString().split("T")[0],
      };

      // Pull current reviews from settings and prepend
      let existingReviews = [];
      try {
        const settingsRes = await fetchJson(BACKEND_SETTINGS_URL);
        if (settingsRes.ok && Array.isArray(settingsRes.data?.reviews)) {
          existingReviews = settingsRes.data.reviews;
        }
      } catch {}

      const updatedReviews = [newReview, ...existingReviews].slice(0, 100);

      // Persist to backend settings
      try {
        await fetchJson(BACKEND_SETTINGS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews: updatedReviews }),
        });
      } catch (err) {
        console.warn("[API Reviews] Failed to save to upstream settings:", err.message);
      }

      return res.status(200).json({ ok: true, review: newReview, message: "Review submitted successfully" });
    } catch (err) {
      console.error("[API Reviews] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "GET") {
    try {
      const settingsRes = await fetchJson(BACKEND_SETTINGS_URL);
      const reviews = (settingsRes.ok && Array.isArray(settingsRes.data?.reviews)) ? settingsRes.data.reviews : [];
      return res.status(200).json({ reviews });
    } catch (err) {
      return res.status(200).json({ reviews: [] });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
