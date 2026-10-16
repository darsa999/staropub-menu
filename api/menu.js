import https from "node:https";
import { mockCategories, mockProducts } from "../src/data/mockData.js";

const BACKEND_BASE = "https://staropub-menu.onrender.com/api";
const CACHE_TTL_MS = 60 * 1000; // 60 seconds server-side in-memory cache
const UPSTREAM_TIMEOUT_MS = 8500; // 8.5s timeout to stay safely within Vercel 10s limit

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
 * Builds static fallback menu data so /api/menu always has valid categories & products
 * even during a cold-start timeout when memoryCache is not yet warm.
 */
function getFallbackMenuData() {
  return (mockCategories || []).map((cat) => {
    const catProducts = (mockProducts || []).filter(
      (p) => p.categoryId === cat.id || p.categoryId === cat.id.replace("-", "_")
    );
    return {
      ...cat,
      products: catProducts,
    };
  });
}

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
          res.resume(); // Drain socket to prevent memory leaks
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
 * Uses AbortController (8-10s limit) and never throws, returning fallbackValue on failure.
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
    image = `${apiOrigin}/Images/staropub_main.jpg`;
  }

  const isUnavailable =
    unavailableSet &&
    (unavailableSet.has(id) ||
      (dish.id && unavailableSet.has(String(dish.id))) ||
      (dish._id && unavailableSet.has(String(dish._id))));

  const available = isUnavailable
    ? false
    : dish.available !== undefined
      ? Boolean(dish.available)
      : dish.isAvailable !== undefined
        ? Boolean(dish.isAvailable)
        : true;

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
  };
}

/**
 * Transforms raw categories and dishes into grouped categories with nested products.
 */
export function transformMenuData(rawCategories, rawDishes, apiOrigin = "https://staropub-menu.onrender.com", unavailableSet = null) {
  const adaptedProducts = (rawDishes || []).map((dish) =>
    adaptDishToProduct(dish, apiOrigin, unavailableSet)
  );

  return (rawCategories || []).map((cat) => {
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
      image = `${apiOrigin}/Images/staropub_main.jpg`;
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
 * Server-side orchestrator that fetches categories, dishes, and settings
 * from Render backend securely with /api strictly prepended.
 * Resilient against partial failures and cold-start timeouts.
 */
export async function fetchServerMenu() {
  const now = Date.now();
  if (Array.isArray(memoryCache.data) && memoryCache.data.length > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
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

  // If at least one of categories or dishes is available, transform with safe fallbacks
  if (
    (Array.isArray(categories) && categories.length > 0) ||
    (Array.isArray(dishes) && dishes.length > 0)
  ) {
    const unavailableSet = new Set(
      Array.isArray(settings?.unavailableDishIds) ? settings.unavailableDishIds : []
    );

    const effectiveCategories =
      Array.isArray(categories) && categories.length > 0 ? categories : mockCategories;
    const effectiveDishes = Array.isArray(dishes) ? dishes : [];

    const transformed = transformMenuData(
      effectiveCategories,
      effectiveDishes,
      "https://staropub-menu.onrender.com",
      unavailableSet
    );

    if (Array.isArray(transformed) && transformed.length > 0) {
      // Only cache for full TTL if both categories and dishes were available
      if (Array.isArray(categories) && categories.length > 0 && Array.isArray(dishes)) {
        memoryCache.data = transformed;
        memoryCache.timestamp = now;
      } else if (!memoryCache.data) {
        memoryCache.data = transformed;
      }
      return transformed;
    }
  }

  // Fallback 1: Return last known good in-memory cache even if expired
  if (Array.isArray(memoryCache.data) && memoryCache.data.length > 0) {
    return memoryCache.data;
  }

  // Fallback 2: Return static fallback menu data so /api/menu never fails with 500
  return getFallbackMenuData();
}

/**
 * Vercel Serverless Function Handler (/api/menu)
 * Always returns HTTP 200 with valid JSON menu data.
 */
export default async function handler(req, res) {
  let data = [];
  try {
    data = await fetchServerMenu();
    if (!Array.isArray(data) || data.length === 0) {
      data = memoryCache.data || getFallbackMenuData();
    }
  } catch (err) {
    console.error("[Serverless /api/menu Fallback Notice]:", err);
    data = memoryCache.data || getFallbackMenuData();
  }

  // Support Node.js runtime res object
  if (res && typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (typeof res.status === "function") {
      return res.status(200).json(data);
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  }

  // Support Web Standard Response (Vercel Edge or unit tests)
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

