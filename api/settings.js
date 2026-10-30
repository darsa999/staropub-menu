import { normalizePublicSettings } from "../shared/menuTransform.js";
import { fetchServerSettings, invalidateCache } from "./menu.js";
import { BACKEND_BASE, forwardedAuthHeaders, readBody, requestJson, sendJson, verifyAdmin } from "./_lib/upstream.js";

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method === "PUT" || req.method === "PATCH") {
    // Admin writes are proxied to the backend with the caller's own credentials;
    // the backend remains the authority on authorization.
    const upstream = await requestJson(`${BACKEND_BASE}/settings`, {
      method: req.method,
      headers: forwardedAuthHeaders(req),
      body: readBody(req),
      timeoutMs: 15000,
    });
    if (upstream.ok) invalidateCache();
    return sendJson(
      res,
      upstream.status || 502,
      upstream.data ?? { error: "Upstream unavailable" },
      { "Cache-Control": "no-store" }
    );
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD, PUT, PATCH" });
  }

  const wantsRefresh = req.query?.refresh === "true";
  const isRefresh = wantsRefresh && (await verifyAdmin(req)) === "ok";

  let data = {};
  try {
    data = await fetchServerSettings(isRefresh);
  } catch (err) {
    console.error("[/api/settings]", err);
  }

  // Only feature flags are public; waiterCalls, reviews etc. never leave the server here.
  return sendJson(res, 200, normalizePublicSettings(data), {
    "Cache-Control": wantsRefresh
      ? "no-store"
      : "public, max-age=0, s-maxage=30, stale-while-revalidate=86400",
  });
}
