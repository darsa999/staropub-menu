import https from "node:https";

export const maxDuration = 60;

const BACKEND_BASE = "https://staropub-menu.onrender.com/api";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes server-side in-memory cache
const UPSTREAM_TIMEOUT_MS = 35000; // 35s timeout to handle Render cold-starts safely

let memoryCache = {
  data: null,
  categories: null,
  dishes: null,
  settings: null,
  timestamp: 0,
};

// Resilient HTTPS agent for Node.js environments
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

/**
 * Low-level HTTPS JSON fetcher with AbortController & socket timeout support.
 */
function fetchNodeJson(url, timeoutMs = UPSTREAM_TIMEOUT_MS, signal = null) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error(`Request aborted for ${url}`));
    }

    const req = https.get(
      url,
      {
        agent: httpsAgent,
        timeout: timeoutMs,
        headers: { Accept: "application/json" },
      },
      (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (err) {
            reject(new Error(`JSON parse error from ${url}: ${err.message}`));
          }
        });
      }
    );

    const onAbort = () => {
      req.destroy();
      reject(new Error(`Request aborted (timeout) for ${url}`));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("close", () => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    });
  });
}

/**
 * Safe wrapper for individual upstream endpoint calls.
 * Uses AbortController and never throws, returning fallbackValue on failure.
 */
async function safeFetchEndpoint(url, fallbackValue = null, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const data = await fetchNodeJson(url, timeoutMs, controller.signal);
    return data ?? fallbackValue;
  } catch (err) {
    console.warn(`[Serverless /api/menu] Upstream warning for ${url}: ${err.message}`);
    return fallbackValue;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extracts a clean numeric price from dish object.
 */
export function extractNumericPrice(dish) {
  if (!dish) return 0;

  if (Array.isArray(dish.prices) && dish.prices.length > 0) {
    for (const p of dish.prices) {
      const val = typeof p?.price === "number" ? p.price : parseFloat(String(p?.price || ""));
      if (!isNaN(val) && val > 0) return val;
    }
  }

  if (typeof dish.price === "number" && !isNaN(dish.price)) {
    return dish.price;
  }

  if (typeof dish.price === "string") {
    const gelMatch = dish.price.match(/(\d+(?:\.\d+)?)\s*₾/);
    if (gelMatch) {
      const parsed = parseFloat(gelMatch[1]);
      if (!isNaN(parsed)) return parsed;
    }

    const dashMatch = dish.price.match(/[-:]\s*(\d+(?:\.\d+)?)/);
    if (dashMatch) {
      const parsed = parseFloat(dashMatch[1]);
      if (!isNaN(parsed)) return parsed;
    }

    const parsed = parseFloat(dish.price);
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
}

/**
 * Optimizes an image URL (specifically Cloudinary assets) with automatic WebP/AVIF format
 * and intelligent quality compression.
 */
export function getOptimizedImageUrl(url, { width = 600, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string") return url || "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    const parts = trimmed.split("/image/upload/");
    if (parts.length === 2) {
      const prefix = `${parts[0]}/image/upload`;
      let rest = parts[1];

      const transforms = [];
      if (format) transforms.push(`f_${format}`);
      if (quality) transforms.push(`q_${quality}`);
      if (width) transforms.push(`w_${width},c_limit`);
      const transformStr = transforms.join(",");

      const existingTransformRegex = /^(?:[a-z]_[a-zA-Z0-9_-]+(?:,[a-z]_[a-zA-Z0-9_-]+)*\/)/;
      if (existingTransformRegex.test(rest)) {
        rest = rest.replace(existingTransformRegex, `${transformStr}/`);
      } else {
        rest = `${transformStr}/${rest}`;
      }
      return `${prefix}/${rest}`;
    }
  }

  return trimmed;
}

/**
 * Resolves media URL to full accessible URL.
 */
export function resolveMediaUrl(imagePath, apiOrigin = "https://staropub-menu.onrender.com") {
  if (!imagePath || typeof imagePath !== "string") return "";
  const trimmed = imagePath.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const origin = apiOrigin.replace(/\/+$/, "");
  if (trimmed.startsWith("/")) {
    return `${origin}${trimmed}`;
  }
  if (
    trimmed.startsWith("Images/") ||
    trimmed.startsWith("images/") ||
    trimmed.startsWith("uploads/")
  ) {
    return `${origin}/${trimmed}`;
  }

  return `${origin}/Images/${trimmed}`;
}

/**
 * Adapts raw dish object into frontend product shape.
 */
export function adaptDishToProduct(dish, apiOrigin = "https://staropub-menu.onrender.com", unavailableSet = null) {
  const id = String(dish.id || dish._id || `dish_${Math.random()}`);
  const categoryId = String(dish.category || dish.categoryId || "");

  const name = {
    ka: dish.name_ka || dish.name || "",
    en: dish.name_en || dish.name || "",
    ru: dish.name_ru || dish.name || "",
  };

  const description = {
    ka: dish.desc_ka || dish.description || "",
    en: dish.desc_en || dish.description || "",
    ru: dish.desc_ru || dish.description || "",
  };

  const price = extractNumericPrice(dish);
  let image = resolveMediaUrl(dish.image, apiOrigin);
  if (!image) {
    image = "/Images/staropub_main.jpg";
  }

  const isUnavailable =
    (unavailableSet &&
      (unavailableSet.has(id) ||
        (dish.id && unavailableSet.has(String(dish.id))) ||
        (dish._id && unavailableSet.has(String(dish._id))))) ||
    dish.available === false ||
    dish.isAvailable === false;

  const available = !isUnavailable;

  return {
    id,
    categoryId,
    category: categoryId,
    name,
    title: name,
    description,
    price,
    rawPrice: dish.price,
    prices: Array.isArray(dish.prices) ? dish.prices : [],
    image,
    available,
    order: typeof dish.order === "number" ? dish.order : 0,
  };
}

/**
 * Transforms raw categories and dishes into grouped categories with nested products.
 */
export function transformMenuData(rawCategories, rawDishes, apiOrigin = "https://staropub-menu.onrender.com", unavailableSet = null) {
  const sortedRawDishes = [...(rawDishes || [])].sort(
    (a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0)
  );
  const sortedRawCategories = [...(rawCategories || [])].sort(
    (a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0)
  );

  const adaptedProducts = sortedRawDishes.map((dish) =>
    adaptDishToProduct(dish, apiOrigin, unavailableSet)
  );

  return sortedRawCategories.map((cat) => {
    const id = String(cat.id || cat._id || "");
    const catProducts = adaptedProducts.filter(
      (p) =>
        p.categoryId === id ||
        p.categoryId.toLowerCase() === id.toLowerCase() ||
        p.categoryId === id.replace("-", "_") ||
        p.categoryId === id.replace("_", "-")
    );

    const name = {
      ka: cat.name_ka || cat.name || cat.title?.ka || id,
      en: cat.name_en || cat.name || cat.title?.en || id,
      ru: cat.name_ru || cat.name || cat.title?.ru || id,
    };

    let image = cat.image ? resolveMediaUrl(cat.image, apiOrigin) : "";
    if (!image) {
      const firstWithImage = catProducts.find(
        (p) => p.image && !p.image.includes("staropub_main.jpg")
      );
      if (firstWithImage) {
        image = firstWithImage.image;
      }
    }
    if (!image && catProducts.length > 0 && catProducts[0].image) {
      image = catProducts[0].image;
    }
    if (!image) {
      image = "/Images/staropub_main.jpg";
    }

    return {
      id,
      slug: cat.slug || id,
      name,
      title: name,
      icon: cat.icon || "🍽️",
      image,
      isHot: Boolean(cat.isHot),
      order: typeof cat.order === "number" ? cat.order : 0,
      products: catProducts,
    };
  });
}

/**
 * Server-side orchestrator that fetches live categories, dishes, and settings
 * directly from Render backend with /api strictly prepended.
 */
export async function fetchServerMenu(bypassCache = false) {
  const now = Date.now();
  if (!bypassCache && Array.isArray(memoryCache.data) && memoryCache.data.length > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  // Concurrent server-side fetches wrapped in individual safe handlers
  const [rawCategories, rawDishes, rawSettings] = await Promise.all([
    safeFetchEndpoint(`${BACKEND_BASE}/categories`, null, UPSTREAM_TIMEOUT_MS),
    safeFetchEndpoint(`${BACKEND_BASE}/dishes`, null, UPSTREAM_TIMEOUT_MS),
    safeFetchEndpoint(`${BACKEND_BASE}/settings`, null, 5000),
  ]);

  const categories = Array.isArray(rawCategories) && rawCategories.length > 0
    ? rawCategories
    : memoryCache.categories;

  const dishes = Array.isArray(rawDishes) && rawDishes.length > 0
    ? rawDishes
    : memoryCache.dishes;

  const settings = rawSettings && typeof rawSettings === "object"
    ? rawSettings
    : memoryCache.settings || {};

  if (Array.isArray(categories) && categories.length > 0) {
    memoryCache.categories = categories;
  }
  if (Array.isArray(dishes) && dishes.length > 0) {
    memoryCache.dishes = dishes;
  }
  if (rawSettings && typeof rawSettings === "object") {
    memoryCache.settings = rawSettings;
  }

  if (Array.isArray(categories) && categories.length > 0) {
    const unavailableSet = new Set(
      Array.isArray(settings?.unavailableDishIds) ? settings.unavailableDishIds : []
    );

    const transformed = transformMenuData(
      categories,
      Array.isArray(dishes) ? dishes : [],
      "https://staropub-menu.onrender.com",
      unavailableSet
    );

    if (Array.isArray(transformed) && transformed.length > 0) {
      if (Array.isArray(rawCategories) && rawCategories.length > 0 && Array.isArray(rawDishes)) {
        memoryCache.data = transformed;
        memoryCache.timestamp = now;
      } else if (!memoryCache.data) {
        memoryCache.data = transformed;
      }
      return transformed;
    }
  }

  if (Array.isArray(memoryCache.data) && memoryCache.data.length > 0) {
    return memoryCache.data;
  }

  return [];
}

/**
 * Server-side orchestrator that fetches live settings with in-memory caching and safe fallbacks.
 */
export async function fetchServerSettings(bypassCache = false) {
  const now = Date.now();
  if (
    !bypassCache &&
    memoryCache.settings &&
    typeof memoryCache.settings === "object" &&
    Object.keys(memoryCache.settings).length > 0 &&
    now - (memoryCache.settingsTimestamp || 0) < 60000
  ) {
    return memoryCache.settings;
  }

  const raw = await safeFetchEndpoint(`${BACKEND_BASE}/settings`, null, 8000);
  if (raw && typeof raw === "object") {
    memoryCache.settings = raw;
    memoryCache.settingsTimestamp = now;
    return raw;
  }

  if (memoryCache.settings && typeof memoryCache.settings === "object") {
    return memoryCache.settings;
  }

  return {
    isCartEnabled: false,
    cartEnabled: false,
    callWaiterEnabled: false,
    requestBillEnabled: false,
    customMenuEnabled: false,
    reviewFormEnabled: false,
  };
}

/**
 * Vercel Serverless Function Handler (/api/menu)
 * Always returns live server menu data with Edge Stale Caching.
 */
export default async function handler(req, res) {
  let data = [];
  const isRefresh =
    req?.query?.refresh === "true" ||
    req?.headers?.["cache-control"]?.includes("no-cache");

  try {
    data = await fetchServerMenu(isRefresh);
    if (!Array.isArray(data) || data.length === 0) {
      if (Array.isArray(memoryCache.data) && memoryCache.data.length > 0) {
        data = memoryCache.data;
      }
    }
  } catch (err) {
    console.error("[Serverless /api/menu Notice]:", err);
    if (Array.isArray(memoryCache.data) && memoryCache.data.length > 0) {
      data = memoryCache.data;
    }
  }

  const hasData = Array.isArray(data) && data.length > 0;
  // Edge Stale Caching:
  // Once fetched, Vercel CDN caches for 300s and serves stale for up to 86400s (24h) while revalidating
  const cacheHeader = hasData && !isRefresh
    ? "s-maxage=300, stale-while-revalidate=86400"
    : "no-cache, no-store, must-revalidate";

  const statusCode = hasData ? 200 : (isRefresh ? 200 : 503);

  if (res && typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", cacheHeader);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (typeof res.status === "function") {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    return res.end(JSON.stringify(data));
  }

  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheHeader,
      "Access-Control-Allow-Origin": "*",
    },
  });
}


