// Resolve API Base URL safely in browser (Vite) and Node
const env = typeof import.meta !== "undefined" && import.meta?.env ? import.meta.env : {};

// Internal same-origin API Base URL:
// In browser/Vercel/Vite, points to relative '/api'
const isBrowser = typeof window !== "undefined";
export const API_BASE_URL = (
  env.VITE_API_URL || (isBrowser ? "/api" : "https://staropub-menu.onrender.com/api")
).replace(/\/+$/, "");

// Base origin for resolving media assets (Cloudinary URLs remain untouched)
export const API_ORIGIN = "https://staropub-menu.onrender.com";

export const USE_REAL_BACKEND = true;

/**
 * Same-origin endpoint fetcher:
 * Queries the same-origin proxied /api route with zero CORS restrictions.
 */
export async function fetchEndpoint(endpointPath, options = {}) {
  const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  const primaryUrl = `${API_BASE_URL}${cleanPath}`;
  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok) {
      return { ok: true, response: res, url: primaryUrl };
    }
  } catch (err) {
    console.warn(`[StaroPub API] Route ${primaryUrl} network failure: ${err.message}`);
  }
  return { ok: false, status: 500 };
}

/**
 * Extracts a clean numeric price from a dish object.
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
 * Optimizes an image URL (specifically Cloudinary assets) with automatic WebP/AVIF format,
 * intelligent quality compression, and size-specific boundary constraints.
 */
export function getOptimizedImageUrl(url, { width = 600, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string") return url || "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Cloudinary image transformation
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

      // If already has transformation parameters (e.g., starts with f_auto...), replace it
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
 * Returns src, srcSet, and sizes attributes for responsive high-performance image rendering.
 */
export function getResponsiveImageProps(
  url,
  {
    defaultWidth = 600,
    widths = [320, 480, 640],
    sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  } = {}
) {
  const src = getOptimizedImageUrl(url, { width: defaultWidth });
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return { src };
  }

  const srcSet = widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(", ");

  return { src, srcSet, sizes };
}

/**
 * Normalizes and resolves an image URL to a full accessible URL.
 */
export function resolveMediaUrl(imagePath, apiOrigin = API_ORIGIN) {
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

  const origin = (apiOrigin || "").replace(/\/+$/, "");
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
 * Transforms a raw staropub dish object into the product interface
 * expected by restaurant-menu-app components (ProductCard, CartContext).
 */
export function adaptDishToProduct(dish, apiOrigin = API_ORIGIN, unavailableSet = null) {
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
  };
}

/**
 * Transforms raw categories and dishes into grouped categories with nested products.
 */
export function transformMenuData(rawCategories, rawDishes, apiOrigin = API_ORIGIN, unavailableSet = null) {
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

let inFlightMenuPromise = null;

/**
 * Low-level direct proxy fallback fetcher (/api/categories + /api/dishes + /api/settings).
 */
export async function fetchDirectFallback(timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [catRes, dishRes, settingsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/categories`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }),
      fetch(`${API_BASE_URL}/dishes`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }),
      fetch(`${API_BASE_URL}/settings`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }).catch(() => null),
    ]);

    if (catRes.ok && dishRes.ok) {
      const [categories, dishes] = await Promise.all([catRes.json(), dishRes.json()]);
      const settings =
        settingsRes && settingsRes.ok ? await settingsRes.json().catch(() => ({})) : {};
      const unavailableSet = new Set(
        Array.isArray(settings?.unavailableDishIds) ? settings.unavailableDishIds : []
      );
      if (Array.isArray(categories) && categories.length > 0) {
        const transformed = transformMenuData(categories, dishes, API_ORIGIN, unavailableSet);
        if (Array.isArray(transformed) && transformed.length > 0) {
          return transformed;
        }
      }
    }
  } catch (err) {
    console.warn("[StaroPub API] Direct proxy fallback attempt warning:", err.message);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Attempts a single menu fetch cycle:
 * Queries /api/menu (benefiting from Vercel CDN Edge Cache), and if delayed (>2.5s)
 * triggers a parallel direct fallback to ensure fast completion.
 */
async function attemptMenuFetch(forceRefresh = false) {
  let fallbackTimer = null;
  let fallbackPromise = null;

  const serverlessPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    try {
      const url = forceRefresh ? `/api/menu?refresh=true&t=${Date.now()}` : `/api/menu`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        ...(forceRefresh ? { cache: "no-store" } : {}),
      });

      if (res.ok) {
        const payload = await res.json();
        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.categories)
            ? payload.categories
            : Array.isArray(payload?.menu)
              ? payload.menu
              : [];

        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn("[StaroPub API] Serverless /api/menu warning:", err.message);
    } finally {
      clearTimeout(timer);
    }
    return null;
  })();

  // If serverless takes longer than 2.5s (e.g. cold start), trigger direct fallback in parallel
  const delayedFallbackStarter = new Promise((resolve) => {
    fallbackTimer = setTimeout(() => {
      fallbackPromise = fetchDirectFallback(25000);
      resolve(fallbackPromise);
    }, 2500);
  });

  // Whichever completes first with non-empty categories returns immediately
  const winner = await Promise.race([
    serverlessPromise.then((data) => (data && data.length > 0 ? data : new Promise(() => {}))),
    delayedFallbackStarter.then((p) => p).then((data) => (data && data.length > 0 ? data : new Promise(() => {}))),
    new Promise((resolve) => setTimeout(() => resolve(null), 30000)),
  ]);

  if (fallbackTimer) clearTimeout(fallbackTimer);

  if (Array.isArray(winner) && winner.length > 0) {
    return winner;
  }

  // If race didn't catch an immediate winner, check serverless promise
  const serverlessResult = await serverlessPromise;
  if (Array.isArray(serverlessResult) && serverlessResult.length > 0) {
    return serverlessResult;
  }

  // Fallback to direct call if not already run
  if (!fallbackPromise) {
    fallbackPromise = fetchDirectFallback(25000);
  }
  const fallbackResult = await fallbackPromise;
  if (Array.isArray(fallbackResult) && fallbackResult.length > 0) {
    return fallbackResult;
  }

  return null;
}

/**
 * Fetch full grouped menu data (categories with nested products) strictly from the server.
 * Implements Edge CDN cache, resilient parallel fallback, and auto-retry with exponential backoff (up to 3 retries).
 */
export async function getMenuData(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);
  if (!forceRefresh && inFlightMenuPromise) {
    return inFlightMenuPromise;
  }

  const promise = (async () => {
    const maxRetries = typeof options?.maxRetries === "number" ? options.maxRetries : 3;
    const retryDelays = [2000, 3500, 5000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const isCurrentRefresh = forceRefresh && attempt === 0;
        const data = await attemptMenuFetch(isCurrentRefresh);
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn(`[StaroPub API] Menu attempt ${attempt + 1} exception:`, err.message);
      }

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt] || 5000;
        console.info(`[StaroPub API] Menu empty/failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.warn("[StaroPub API] All menu fetch attempts exhausted.");
    return [];
  })().finally(() => {
    if (!forceRefresh) {
      inFlightMenuPromise = null;
    }
  });

  if (!forceRefresh) {
    inFlightMenuPromise = promise;
  }

  return promise;
}

/**
 * Fetch restaurant categories (delegates to getMenuData)
 */
export async function getCategories() {
  return getMenuData();
}

/**
 * Fetch products with optional filtering by categoryId and search query
 */
export async function getProducts(categoryIdOrOptions = null, searchQueryParam = "") {
  let categoryId = null;
  let search = "";

  if (typeof categoryIdOrOptions === "object" && categoryIdOrOptions !== null) {
    categoryId = categoryIdOrOptions.categoryId || null;
    search = categoryIdOrOptions.search || "";
  } else {
    categoryId = categoryIdOrOptions;
    search = searchQueryParam || "";
  }

  const menu = await getMenuData();
  let allProducts = [];
  for (const cat of menu) {
    if (Array.isArray(cat.products)) {
      allProducts.push(...cat.products);
    }
  }

  if (categoryId && categoryId !== "all") {
    allProducts = allProducts.filter(
      (p) =>
        p.categoryId === categoryId ||
        p.categoryId.toLowerCase() === categoryId.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allProducts = allProducts.filter((p) => {
      const nameKa = (p.name?.ka || p.title?.ka || "").toLowerCase();
      const nameEn = (p.name?.en || p.title?.en || "").toLowerCase();
      const nameRu = (p.name?.ru || p.title?.ru || "").toLowerCase();
      return nameKa.includes(q) || nameEn.includes(q) || nameRu.includes(q);
    });
  }

  return allProducts;
}
