// Shared between the Vercel functions (api/) and the browser bundle (src/).
// Keep this file free of Node- or DOM-specific APIs.

export const API_ORIGIN = "https://staropub-menu.onrender.com";
export const FALLBACK_IMAGE = "/Images/staropub_main.jpg";

/**
 * @typedef {{ ka: string, en: string, ru: string }} LocalizedText
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} categoryId
 * @property {string} category
 * @property {LocalizedText} name
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {number} price
 * @property {unknown} rawPrice
 * @property {Array<{ size?: string, price?: number | string }>} prices
 * @property {string} image
 * @property {boolean} available
 * @property {number} order
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} slug
 * @property {LocalizedText} name
 * @property {LocalizedText} title
 * @property {string} icon
 * @property {string} image
 * @property {boolean} isHot
 * @property {number} order
 * @property {Product[]} products
 */

/**
 * Extracts a clean numeric price from a raw dish object.
 * @returns {number}
 */
export function extractNumericPrice(dish) {
  if (!dish) return 0;

  if (Array.isArray(dish.prices) && dish.prices.length > 0) {
    for (const p of dish.prices) {
      const val = typeof p?.price === "number" ? p.price : parseFloat(String(p?.price || "").replace(",", "."));
      if (!isNaN(val) && val > 0) return val;
    }
  }

  if (typeof dish.price === "number" && !isNaN(dish.price)) {
    return dish.price;
  }

  if (typeof dish.price === "string") {
    const gelMatch = dish.price.match(/(\d+(?:[.,]\d+)?)\s*₾/);
    if (gelMatch) {
      const parsed = parseFloat(gelMatch[1].replace(",", "."));
      if (!isNaN(parsed)) return parsed;
    }

    const dashMatch = dish.price.match(/[-:]\s*(\d+(?:[.,]\d+)?)/);
    if (dashMatch) {
      const parsed = parseFloat(dashMatch[1].replace(",", "."));
      if (!isNaN(parsed)) return parsed;
    }

    const parsed = parseFloat(dish.price.replace(",", "."));
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
}

const EXISTING_TRANSFORM_REGEX = /^(?:[a-z]_[a-zA-Z0-9_-]+(?:,[a-z]_[a-zA-Z0-9_-]+)*\/)/;

/**
 * Adds Cloudinary format/quality/width transforms. Non-Cloudinary URLs are returned unchanged.
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

      if (EXISTING_TRANSFORM_REGEX.test(rest)) {
        rest = rest.replace(EXISTING_TRANSFORM_REGEX, `${transformStr}/`);
      } else {
        rest = `${transformStr}/${rest}`;
      }
      return `${prefix}/${rest}`;
    }
  }

  return trimmed;
}

/**
 * Returns src, srcSet and sizes attributes for responsive image rendering.
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
 * Resolves a stored media path to a fully qualified URL.
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

function byOrder(a, b) {
  return (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0);
}

/** Normalizes category keys so "Hot_Dishes", "hot-dishes" and "hot_dishes" match. */
export function normalizeCategoryKey(key) {
  return String(key || "").toLowerCase().replaceAll("_", "-");
}

/**
 * Adapts a raw dish object into the frontend product shape.
 * @returns {Product}
 */
export function adaptDishToProduct(dish, apiOrigin = API_ORIGIN, unavailableSet = null) {
  const categoryId = String(dish.category || dish.categoryId || "");
  // Deterministic fallback id so React keys and cart entries survive refetches.
  const id = String(dish.id || dish._id || `dish_${categoryId}_${dish.name_ka || dish.name || dish.name_en || ""}`);

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

  const image = resolveMediaUrl(dish.image, apiOrigin) || FALLBACK_IMAGE;

  const isUnavailable =
    (unavailableSet &&
      (unavailableSet.has(id) ||
        (dish.id && unavailableSet.has(String(dish.id))) ||
        (dish._id && unavailableSet.has(String(dish._id))))) ||
    dish.available === false ||
    dish.isAvailable === false;

  return {
    id,
    categoryId,
    category: categoryId,
    name,
    title: name,
    description,
    price: extractNumericPrice(dish),
    rawPrice: dish.price,
    prices: Array.isArray(dish.prices) ? dish.prices : [],
    image,
    available: !isUnavailable,
    order: typeof dish.order === "number" ? dish.order : 0,
  };
}

/**
 * Groups raw dishes under their categories, both sorted by `order`.
 * @returns {Category[]}
 */
export function transformMenuData(rawCategories, rawDishes, apiOrigin = API_ORIGIN, unavailableSet = null) {
  const productsByCategory = new Map();
  for (const dish of [...(rawDishes || [])].sort(byOrder)) {
    const product = adaptDishToProduct(dish, apiOrigin, unavailableSet);
    const key = normalizeCategoryKey(product.categoryId);
    if (!productsByCategory.has(key)) productsByCategory.set(key, []);
    productsByCategory.get(key).push(product);
  }

  return [...(rawCategories || [])].sort(byOrder).map((cat) => {
    const id = String(cat.id || cat._id || "");
    const catProducts = productsByCategory.get(normalizeCategoryKey(id)) || [];

    const name = {
      ka: cat.name_ka || cat.name || cat.title?.ka || id,
      en: cat.name_en || cat.name || cat.title?.en || id,
      ru: cat.name_ru || cat.name || cat.title?.ru || id,
    };

    const image =
      (cat.image ? resolveMediaUrl(cat.image, apiOrigin) : "") ||
      catProducts.find((p) => p.image && !p.image.includes("staropub_main.jpg"))?.image ||
      catProducts[0]?.image ||
      FALLBACK_IMAGE;

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
 * Filters a menu by a search query across all three languages, hiding empty categories.
 * @param {Category[]} menu
 * @param {string} query
 * @returns {Category[]}
 */
export function filterMenu(menu, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return menu;

  return menu
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p) =>
        [p.name?.ka, p.name?.en, p.name?.ru].some((n) => (n || "").toLowerCase().includes(q))
      ),
    }))
    .filter((cat) => cat.products.length > 0);
}

/**
 * Normalizes the public feature-flag settings shape.
 */
export function normalizePublicSettings(data) {
  const d = data && typeof data === "object" ? data : {};
  const bool = (v) => (typeof v === "boolean" ? v : false);
  const isCart = typeof d.isCartEnabled === "boolean" ? d.isCartEnabled : bool(d.cartEnabled);

  return {
    isCartEnabled: isCart,
    cartEnabled: isCart,
    callWaiterEnabled: bool(d.callWaiterEnabled),
    requestBillEnabled: bool(d.requestBillEnabled),
    customMenuEnabled: bool(d.customMenuEnabled),
    reviewFormEnabled: typeof d.reviewFormEnabled === "boolean" ? d.reviewFormEnabled : bool(d.isFeedbackEnabled),
    bannerSettings: d.bannerSettings || null,
    unavailableDishIds: Array.isArray(d.unavailableDishIds) ? d.unavailableDishIds : [],
  };
}
