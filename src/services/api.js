export {
  API_ORIGIN,
  extractNumericPrice,
  getOptimizedImageUrl,
  getResponsiveImageProps,
  resolveMediaUrl,
  adaptDishToProduct,
  transformMenuData,
  filterMenu,
  normalizePublicSettings,
} from "../../shared/menuTransform.js";

const env = import.meta.env || {};

// Origin of the Render backend (auth, categories, dishes, uploads). VITE_API_URL has been
// configured both with and without a trailing "/api", so accept either form.
// Empty means same-origin, i.e. the /api proxy in vercel.json / vite.config.js.
export const BACKEND_ORIGIN = String(env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

const MENU_TIMEOUT_MS = 45000; // the function itself waits up to 35s for a cold Render start
const RETRY_DELAYS_MS = [2000, 4000];

let inFlightMenuPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchMenuOnce(forceRefresh, authHeaders) {
  const url = forceRefresh ? `/api/menu?refresh=true&t=${Date.now()}` : "/api/menu";
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders },
    signal: AbortSignal.timeout(MENU_TIMEOUT_MS),
    ...(forceRefresh ? { cache: "no-store" } : {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  if (!Array.isArray(payload) || payload.length === 0) throw new Error("Empty menu");
  return payload;
}

/**
 * Fetches the grouped menu (categories with nested products) from /api/menu,
 * which is served from the Vercel edge cache. Retries with backoff.
 *
 * @param {{ forceRefresh?: boolean, authHeaders?: Record<string, string> }} [options]
 * @returns {Promise<import("../../shared/menuTransform.js").Category[]>} resolves to [] when every attempt failed
 */
export function getMenuData({ forceRefresh = false, authHeaders = {} } = {}) {
  if (!forceRefresh && inFlightMenuPromise) return inFlightMenuPromise;

  const promise = (async () => {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await fetchMenuOnce(forceRefresh && attempt === 0, authHeaders);
      } catch (err) {
        console.warn(`[StaroPub API] Menu attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
    return [];
  })();

  if (!forceRefresh) {
    inFlightMenuPromise = promise.finally(() => {
      inFlightMenuPromise = null;
    });
    return inFlightMenuPromise;
  }
  return promise;
}

/**
 * POSTs JSON to a same-origin endpoint and throws on non-2xx responses.
 */
export async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
