import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { t, getLocalizedField } = useLanguage();
  const { addItem } = useCart();
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const handleAdd = () => {
    addItem(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
    }, 1200);
  };

  const formattedPrice = Number(product.price).toFixed(2);
  const localizedTitle = getLocalizedField(product.name);

  return (
    <div className="group w-full flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-3xl p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div>
        {/* Image Container: Rounded corners, aspect ratio matching food photography, subtle hover zoom */}
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-800 mb-3.5">
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
        <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 leading-snug line-clamp-2 px-1">
          {localizedTitle}
        </h3>
      </div>

      {/* Bottom Bar / Action Row */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 px-1">
        {/* Left: Price in GEL */}
        <div className="flex items-baseline">
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {formattedPrice}
          </span>
          <span className="ml-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {t("currency")}
          </span>
        </div>

        {/* Right: Action button "+ დამატება" with shopping cart icon */}
        <button
          onClick={handleAdd}
          disabled={!product.available}
          type="button"
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
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
  );
}
