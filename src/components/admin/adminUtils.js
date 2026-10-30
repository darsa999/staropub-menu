import { resolveMediaUrl } from "../../services/api";

/** Resolves an image path or preview URL (blob:/data:/http) for display in the admin. */
export const resolveImageSrc = (img) => resolveMediaUrl(img);

export function parseMultiPrice(rawOrItem) {
  if (!rawOrItem) return null;

  let pricesArray = null;
  if (typeof rawOrItem === "object") {
    if (Array.isArray(rawOrItem.prices) && rawOrItem.prices.length > 0) {
      pricesArray = rawOrItem.prices;
    } else if (typeof rawOrItem.price === "string") {
      return parseMultiPrice(rawOrItem.price);
    }
  }

  if (pricesArray) {
    const valid = pricesArray.filter(
      p => p && p.size && p.price !== undefined && p.price !== null && String(p.price).trim() !== ""
    );
    const nonZero = valid.filter(p => {
      const n = typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace("₾", "").replace(",", ".").trim());
      return !isNaN(n) && n > 0;
    });
    if (nonZero.length > 0) {
      return nonZero.map(p => {
        const num = typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace("₾", "").replace(",", ".").trim());
        const priceStr = isNaN(num) ? String(p.price) : `₾${num.toFixed(2)}`;
        return { size: p.size, price: priceStr, priceNum: isNaN(num) ? 0 : num };
      });
    }
  }

  if (typeof rawOrItem !== "string") return null;
  const lines = rawOrItem.split(/\n|\n|\|/).map(l => l.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    const sizeMatch = line.match(/^([\d.,]+\s*[ლმლმL][\w]*)/u);
    if (sizeMatch) {
      const size = sizeMatch[1].trim();
      const rest = line.slice(sizeMatch[0].length).replace(/^[-:–—\s]+/, "").trim();
      const numMatch = rest.match(/([\d.,]+)/);
      const num = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : NaN;
      if (!isNaN(num) && num > 0) {
        const priceStr = `₾${num.toFixed(2)}`;
        parsed.push({ size, price: priceStr, priceNum: num });
      }
    }
  }
  return parsed.length > 0 ? parsed : null;
}

export function getVolumeSizesForDish(categoryKey, dishName, categoryLabels = {}, dbCategories = []) {
  const catObj = dbCategories.find(c => (c.id || c._id) === categoryKey) || {};
  const catLabel = (categoryLabels[categoryKey]?.ka || catObj.name_ka || categoryKey || "").toLowerCase();
  const nameKa = (dishName || "").toLowerCase();

  const isBeer = categoryKey === "beer" || catLabel.includes("ლუდი") || catLabel.includes("beer") || catLabel.includes("пиво");
  const isSpirits = categoryKey === "Alcohol" || categoryKey === "alcohol" || categoryKey === "spirits" || catLabel.includes("სპირტიანი") || catLabel.includes("spirits") || catLabel.includes("крепкие") || catLabel.includes("alcohol");
  const isChacha = nameKa.includes("სოფლის ჭაჭა") || nameKa.includes("ჭაჭა");

  if (isBeer) {
    return ["0.4 ლ", "1.0 ლ"];
  }
  if (isSpirits || isChacha) {
    return ["0.25 ლ", "0.5 ლ"];
  }
  return null;
}
