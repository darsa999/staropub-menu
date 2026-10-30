import { transformMenuData, normalizePublicSettings, API_ORIGIN } from "../shared/menuTransform.js";
import { BACKEND_BASE, requestJson, sendJson, verifyAdmin } from "./_lib/upstream.js";

export const maxDuration = 60;

const MENU_TTL_MS = 60 * 1000;
const SETTINGS_TTL_MS = 30 * 1000;
const UPSTREAM_TIMEOUT_MS = 35000; // Render free-tier cold starts can take ~30s

const cache = {
  menu: null,
  menuAt: 0,
  categories: null,
  dishes: null,
  settings: null,
  settingsAt: 0,
};

/** Drops the in-memory caches of this instance (called after admin writes). */
export function invalidateCache() {
  cache.menuAt = 0;
  cache.settingsAt = 0;
}

async function fetchList(path) {
  const res = await requestJson(`${BACKEND_BASE}${path}`, { timeoutMs: UPSTREAM_TIMEOUT_MS });
  return res.ok && Array.isArray(res.data) ? res.data : null;
}

/**
 * Returns the raw upstream settings document (including private fields such as
 * waiterCalls and reviews). Never expose this directly to the public.
 */
export async function fetchServerSettings(bypassCache = false) {
  if (!bypassCache && cache.settings && Date.now() - cache.settingsAt < SETTINGS_TTL_MS) {
    return cache.settings;
  }

  const res = await requestJson(`${BACKEND_BASE}/settings`, { timeoutMs: 8000 });
  if (res.ok && res.data && typeof res.data === "object") {
    cache.settings = res.data;
    cache.settingsAt = Date.now();
    return res.data;
  }
  return cache.settings || {};
}

/** Fetches categories, dishes and settings and returns the grouped menu. */
export async function fetchServerMenu(bypassCache = false) {
  if (!bypassCache && cache.menu?.length && Date.now() - cache.menuAt < MENU_TTL_MS) {
    return cache.menu;
  }

  const [rawCategories, rawDishes, settings] = await Promise.all([
    fetchList("/categories"),
    fetchList("/dishes"),
    fetchServerSettings(bypassCache),
  ]);

  if (rawCategories?.length) cache.categories = rawCategories;
  if (rawDishes) cache.dishes = rawDishes;

  const categories = rawCategories?.length ? rawCategories : cache.categories;
  if (!categories?.length) return cache.menu || [];

  const { unavailableDishIds } = normalizePublicSettings(settings);
  const transformed = transformMenuData(
    categories,
    rawDishes || cache.dishes || [],
    API_ORIGIN,
    new Set(unavailableDishIds)
  );

  // Only mark the cache fresh when every upstream call succeeded.
  if (rawCategories?.length && rawDishes) {
    cache.menu = transformed;
    cache.menuAt = Date.now();
  } else if (!cache.menu) {
    cache.menu = transformed;
  }
  return transformed;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD" });
  }

  // Cache bypass is reserved for admins so it cannot be used to hammer the backend.
  const wantsRefresh = req.query?.refresh === "true";
  const isRefresh = wantsRefresh && (await verifyAdmin(req));

  let data = [];
  try {
    data = await fetchServerMenu(isRefresh);
  } catch (err) {
    console.error("[/api/menu]", err);
    data = cache.menu || [];
  }

  const hasData = Array.isArray(data) && data.length > 0;
  const cacheHeader = hasData && !wantsRefresh
    ? "public, max-age=0, s-maxage=60, stale-while-revalidate=86400"
    : "no-store";

  return sendJson(res, hasData ? 200 : 503, data, { "Cache-Control": cacheHeader });
}
