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
 * Fetch full grouped menu data (categories with nested products) strictly from the server.
 * Zero localStorage caching and zero mock fallbacks.
 */
export async function getMenuData() {
  try {
    const res = await fetch("/api/menu", {
      cache: "no-store",
      headers: { Accept: "application/json" },
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
    console.warn("[StaroPub API] /api/menu fetch error:", err.message);
  }

  // Direct same-origin proxy fallback (/api/categories + /api/dishes)
  try {
    const [catRes, dishRes, settingsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/categories`, { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch(`${API_BASE_URL}/dishes`, { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch(`${API_BASE_URL}/settings`, { cache: "no-store", headers: { Accept: "application/json" } }).catch(() => null),
    ]);

    if (catRes.ok && dishRes.ok) {
      const [categories, dishes] = await Promise.all([catRes.json(), dishRes.json()]);
      const settings = settingsRes && settingsRes.ok ? await settingsRes.json().catch(() => ({})) : {};
      const unavailableSet = new Set(
        Array.isArray(settings?.unavailableDishIds) ? settings.unavailableDishIds : []
      );
      return transformMenuData(categories, dishes, API_ORIGIN, unavailableSet);
    }
  } catch (err) {
    console.warn("[StaroPub API] Direct proxy fetch error:", err.message);
  }

  return [];
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
