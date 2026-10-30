import {
  BACKEND_BASE,
  cleanString,
  clientIp,
  rateLimit,
  readBody,
  requestJson,
  sendJson,
  serviceAuthHeaders,
  verifyAdmin,
} from "./_lib/upstream.js";

const SETTINGS_URL = `${BACKEND_BASE}/settings`;
const MAX_REVIEWS = 100;

async function readReviews() {
  const res = await requestJson(SETTINGS_URL);
  if (!res.ok) return null;
  return Array.isArray(res.data?.reviews) ? res.data.reviews : [];
}

export default async function handler(req, res) {
  const noStore = { "Cache-Control": "no-store" };

  if (req.method === "POST") {
    if (!rateLimit(`reviews:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
      return sendJson(res, 429, { ok: false, error: "too_many_requests" }, noStore);
    }

    const body = readBody(req);
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
    const newReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: cleanString(body.name, 60) || "სტუმარი",
      rating,
      comment: cleanString(body.comment, 1000),
      table: cleanString(body.table, 10) || "—",
      date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" }),
    };

    const existing = await readReviews();
    if (existing === null) return sendJson(res, 502, { ok: false, error: "upstream_unavailable" }, noStore);

    // NOTE: read-modify-write on the shared settings document (see api/calls.js).
    const saved = await requestJson(SETTINGS_URL, {
      method: "PUT",
      headers: serviceAuthHeaders(),
      body: { reviews: [newReview, ...existing].slice(0, MAX_REVIEWS) },
      timeoutMs: 10000,
    });
    if (!saved.ok) {
      console.error("[/api/reviews] upstream write failed with status", saved.status);
      return sendJson(res, 502, { ok: false, error: "upstream_write_failed" }, noStore);
    }
    return sendJson(res, 201, { ok: true, review: newReview }, noStore);
  }

  if (req.method === "GET") {
    if (!(await verifyAdmin(req))) return sendJson(res, 401, { error: "unauthorized" }, noStore);
    const reviews = await readReviews();
    if (reviews === null) return sendJson(res, 502, { error: "upstream_unavailable" }, noStore);
    return sendJson(res, 200, { reviews }, noStore);
  }

  return sendJson(res, 405, { error: "Method not allowed" }, { ...noStore, Allow: "GET, POST" });
}
