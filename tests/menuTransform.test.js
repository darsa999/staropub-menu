import { describe, expect, it } from "vitest";
import {
  extractNumericPrice,
  filterMenu,
  getOptimizedImageUrl,
  normalizePublicSettings,
  resolveMediaUrl,
  transformMenuData,
} from "../shared/menuTransform.js";

describe("extractNumericPrice", () => {
  it.each([
    [{ price: 12.5 }, 12.5],
    [{ price: "15" }, 15],
    [{ price: "15,50" }, 15.5],
    [{ price: "0.5 ლ - 8 ₾" }, 8],
    [{ price: "0.4 ლ: 6.5" }, 6.5],
    [{ prices: [{ size: "0.4", price: "" }, { size: "1", price: "9" }] }, 9],
    [{ prices: [{ price: 0 }], price: 4 }, 4],
    [{ price: "free" }, 0],
    [null, 0],
  ])("%j → %d", (dish, expected) => {
    expect(extractNumericPrice(dish)).toBe(expected);
  });
});

describe("getOptimizedImageUrl", () => {
  const base = "https://res.cloudinary.com/demo/image/upload";

  it("adds transforms to a plain Cloudinary URL", () => {
    expect(getOptimizedImageUrl(`${base}/v1/a.jpg`, { width: 300 })).toBe(`${base}/f_auto,q_auto,w_300,c_limit/v1/a.jpg`);
  });

  it("replaces existing transforms instead of stacking them", () => {
    expect(getOptimizedImageUrl(`${base}/w_100,q_50/v1/a.jpg`, { width: 300 })).toBe(`${base}/f_auto,q_auto,w_300,c_limit/v1/a.jpg`);
  });

  it("leaves other URLs alone", () => {
    expect(getOptimizedImageUrl("/Images/x.jpg")).toBe("/Images/x.jpg");
    expect(getOptimizedImageUrl("")).toBe("");
  });
});

describe("resolveMediaUrl", () => {
  it("resolves relative paths against the API origin", () => {
    expect(resolveMediaUrl("a.jpg", "https://api.test/")).toBe("https://api.test/Images/a.jpg");
    expect(resolveMediaUrl("/uploads/a.jpg", "https://api.test")).toBe("https://api.test/uploads/a.jpg");
    expect(resolveMediaUrl("uploads/a.jpg", "https://api.test")).toBe("https://api.test/uploads/a.jpg");
  });

  it("keeps absolute, data and blob URLs", () => {
    for (const url of ["https://x.test/a.jpg", "data:image/png;base64,AA", "blob:abc"]) {
      expect(resolveMediaUrl(url)).toBe(url);
    }
  });
});

describe("transformMenuData", () => {
  const categories = [
    { id: "beer", name_ka: "ლუდი", order: 2 },
    { _id: "hot_dishes", name_ka: "ცხელი", order: 1, image: "hot.jpg" },
    { id: "empty", order: 3 },
  ];
  const dishes = [
    { id: "d2", category: "hot-dishes", name_ka: "ნეკნები", price: 20, order: 2 },
    { id: "d1", category: "HOT_DISHES", name_ka: "ხინკალი", price: "1.2", order: 1 },
    { _id: "d3", category: "beer", name_ka: "პილზნერი", price: 7, image: "https://res.cloudinary.com/x/image/upload/b.jpg" },
    { category: "beer", name_ka: "უცნობი", price: 5 },
  ];

  const menu = transformMenuData(categories, dishes, "https://api.test", new Set(["d3"]));

  it("sorts categories and dishes by order", () => {
    expect(menu.map((c) => c.id)).toEqual(["hot_dishes", "beer", "empty"]);
    expect(menu[0].products.map((p) => p.id)).toEqual(["d1", "d2"]);
  });

  it("matches category keys regardless of case and -/_", () => {
    expect(menu[0].products).toHaveLength(2);
  });

  it("marks unavailable dishes", () => {
    expect(menu[1].products.find((p) => p.id === "d3").available).toBe(false);
    expect(menu[0].products.every((p) => p.available)).toBe(true);
  });

  it("gives id-less dishes a deterministic id", () => {
    const again = transformMenuData(categories, dishes, "https://api.test");
    const id = menu[1].products.find((p) => p.name.ka === "უცნობი").id;
    expect(id).toBe("dish_beer_უცნობი");
    expect(again[1].products.find((p) => p.name.ka === "უცნობი").id).toBe(id);
  });

  it("picks category images: own image, then first real product image, then fallback", () => {
    expect(menu[0].image).toBe("https://api.test/Images/hot.jpg");
    expect(menu[1].image).toBe("https://res.cloudinary.com/x/image/upload/b.jpg");
    expect(menu[2].image).toBe("/Images/staropub_main.jpg");
  });

  it("handles missing input", () => {
    expect(transformMenuData(null, null)).toEqual([]);
  });
});

describe("filterMenu", () => {
  const menu = [
    { id: "a", products: [{ name: { ka: "ხინკალი", en: "Khinkali", ru: "Хинкали" } }] },
    { id: "b", products: [{ name: { ka: "ლუდი", en: "Beer", ru: "Пиво" } }] },
  ];

  it("returns the same menu for an empty query", () => {
    expect(filterMenu(menu, "  ")).toBe(menu);
  });

  it("matches any language and hides empty categories", () => {
    expect(filterMenu(menu, "пив").map((c) => c.id)).toEqual(["b"]);
    expect(filterMenu(menu, "KHIN").map((c) => c.id)).toEqual(["a"]);
    expect(filterMenu(menu, "zzz")).toEqual([]);
  });
});

describe("normalizePublicSettings", () => {
  it("never leaks private fields", () => {
    const out = normalizePublicSettings({
      cartEnabled: true,
      isFeedbackEnabled: true,
      waiterCalls: [{ table: "1" }],
      reviews: [{ name: "x" }],
    });
    expect(out).not.toHaveProperty("waiterCalls");
    expect(out).not.toHaveProperty("reviews");
    expect(out.isCartEnabled).toBe(true);
    expect(out.reviewFormEnabled).toBe(true);
  });

  it("defaults everything to off", () => {
    expect(normalizePublicSettings(null)).toMatchObject({
      isCartEnabled: false,
      callWaiterEnabled: false,
      requestBillEnabled: false,
      unavailableDishIds: [],
    });
  });
});
