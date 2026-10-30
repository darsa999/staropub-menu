// Helpers shared by the Vercel functions. Files under api/_lib are not exposed as routes.

export const BACKEND_BASE = (process.env.BACKEND_API_URL || "https://staropub-menu.onrender.com/api").replace(/\/+$/, "");

/**
 * Fetches JSON from the upstream backend with a hard timeout. Never throws.
 * TLS certificates are verified (Node's default).
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
export async function requestJson(url, { method = "GET", headers = {}, body, timeoutMs = 8000 } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn(`[upstream] ${method} ${url} failed: ${err.message}`);
    return { ok: false, status: 0, data: null };
  }
}

/** Authorization header for server-to-server writes, if a service token is configured. */
export function serviceAuthHeaders() {
  const token = process.env.BACKEND_SERVICE_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Forwards the caller's credentials (bearer token and/or session cookie) upstream. */
export function forwardedAuthHeaders(req) {
  const headers = {};
  const auth = req?.headers?.authorization;
  const cookie = req?.headers?.cookie;
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;
  return headers;
}

const adminCache = new Map();
const ADMIN_CACHE_TTL_MS = 60 * 1000;
// Long enough for a cold Render start; a short timeout used to look like "not an admin".
const ADMIN_CHECK_TIMEOUT_MS = 35000;

/**
 * Verifies the caller is a logged-in admin by asking the backend's /auth/me.
 * @returns {Promise<"ok" | "unauthenticated" | "forbidden" | "unavailable">}
 *   "unavailable" means the backend could not be reached, which is not an auth failure.
 */
export async function verifyAdmin(req) {
  const headers = forwardedAuthHeaders(req);
  const key = `${headers.Authorization || ""}|${headers.Cookie || ""}`;
  if (key === "|") return "unauthenticated";

  const cached = adminCache.get(key);
  if (cached && Date.now() - cached < ADMIN_CACHE_TTL_MS) return "ok";

  const res = await requestJson(`${BACKEND_BASE}/auth/me`, { headers, timeoutMs: ADMIN_CHECK_TIMEOUT_MS });
  if (res.ok) {
    if (adminCache.size > 500) adminCache.clear();
    adminCache.set(key, Date.now());
    return "ok";
  }
  adminCache.delete(key);
  if (res.status === 401) return "unauthenticated";
  if (res.status === 403) return "forbidden";
  console.warn(`[verifyAdmin] backend /auth/me unavailable (status ${res.status})`);
  return "unavailable";
}

/** Sends the response for a failed verifyAdmin() result. */
export function sendAdminCheckFailure(res, result) {
  const status = result === "unavailable" ? 503 : result === "forbidden" ? 403 : 401;
  const error = result === "unavailable" ? "auth_backend_unavailable" : result === "forbidden" ? "not_admin" : "admin_unverified";
  return sendJson(res, status, { error }, { "Cache-Control": "no-store" });
}

const rateBuckets = new Map();

/**
 * Best-effort, per-instance fixed-window rate limiter.
 * @returns {boolean} true when the request is allowed
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    if (rateBuckets.size > 5000) rateBuckets.clear();
    rateBuckets.set(key, { start: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req) {
  const fwd = req?.headers?.["x-forwarded-for"];
  return (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || req?.socket?.remoteAddress || "unknown";
}

export function readBody(req) {
  if (!req?.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return req.body;
}

export function sendJson(res, status, data, headers = {}) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

/** Trims a value to a string of at most `max` characters. */
export function cleanString(value, max) {
  return String(value ?? "").trim().slice(0, max);
}
