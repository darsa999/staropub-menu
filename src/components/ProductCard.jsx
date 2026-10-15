import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useViewMode } from "../context/ViewModeContext";

export default function ProductCard({ product }) {
  const { t, getLocalizedField } = useLanguage();
  const { addItem } = useCart();
  const { viewMode } = useViewMode();
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const handleAdd = (e) => {
    if (e) e.stopPropagation();
    addItem(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
    }, 1200);
  };

  const formattedPrice = Number(product.price).toFixed(2);
  const localizedTitle = getLocalizedField(product.name);

  return (
    <>
      {/* ─── MOBILE LIST VIEW ROW (visible only when viewMode === 'list' on mobile/tablet < 1024px) ─── */}
      {viewMode === "list" && (
        <div className="lg:hidden w-full pt-4 first:pt-0 flex items-center justify-between gap-3 sm:gap-4 bg-transparent group">
          {/* Left: Square rounded food photo (w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 object-cover) */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-800 shadow-xs">
            <img
              src={product.image}
              alt={localizedTitle}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {!product.available && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600/90">
                  ამოიწურა
                </span>
              </div>
            )}
          </div>

          {/* Right: Flex column containing Title at top, Price & Action button at bottom */}
          <div className="flex-1 min-w-0 pl-1 sm:pl-2 flex flex-col justify-between self-stretch py-1">
            {/* Dish title in bold Georgian typography at the top */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {localizedTitle}
              </h3>
            </div>

            {/* Bottom row: Price on left and black "+ დამატება" action button on right */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-2">
              <div className="flex items-baseline">
                <span className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {formattedPrice}
                </span>
                <span className="ml-1 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {t("currency")}
                </span>
              </div>

              <button
                onClick={handleAdd}
                disabled={!product.available}
                type="button"
                className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0 ${
                  isAddedRecently
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                }`}
                aria-label={`${t("addToCart")} ${localizedTitle}`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t("added")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>{t("addToCart")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GRID CARD (Used on mobile when viewMode === 'grid', and ALWAYS on desktop >= lg) ─── */}
      <div
        className={`group w-full flex-col justify-between bg-white dark:bg-zinc-900 rounded-3xl p-3 sm:p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 ${
          viewMode === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div>
          {/* Image Container: On mobile aspect-square, on desktop lg:aspect-[4/3] */}
          <div className="relative w-full aspect-square lg:aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-800 mb-2.5 sm:mb-3.5">
            <img
              src={product.image}
              alt={localizedTitle}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {!product.available && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600/90">
                  ამოიწურა
                </span>
              </div>
            )}
          </div>

          {/* Product Title: Clear Georgian typography */}
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 leading-snug line-clamp-2 px-1">
            {localizedTitle}
          </h3>
        </div>

        {/* Bottom Bar / Action Row: Price and button stacked or compact underneath */}
        <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
          {/* Left: Price in GEL */}
          <div className="flex items-baseline">
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {formattedPrice}
            </span>
            <span className="ml-1 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t("currency")}
            </span>
          </div>

          {/* Right: Action button "+ დამატება" with shopping cart icon */}
          <button
            onClick={handleAdd}
            disabled={!product.available}
            type="button"
            className={`w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
              isAddedRecently
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            }`}
            aria-label={`${t("addToCart")} ${localizedTitle}`}
          >
            {isAddedRecently ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t("added")}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t("addToCart")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
