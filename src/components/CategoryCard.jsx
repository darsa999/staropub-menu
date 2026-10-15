import React from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useViewMode } from "../context/ViewModeContext";

export default function CategoryCard({ category, onClick }) {
  const { getLocalizedField } = useLanguage();
  const { viewMode } = useViewMode();
  const title = getLocalizedField(category.title || category.name);
  const productsCount = category.products?.length || 0;

  return (
    <>
      {/* ─── MOBILE LIST VIEW ROW (visible only when viewMode === 'list' on mobile/tablet < 1024px) ─── */}
      {viewMode === "list" && (
        <div
          onClick={() => onClick(category)}
          className="lg:hidden w-full pt-3.5 first:pt-0 flex items-center justify-between gap-3.5 sm:gap-4 cursor-pointer group select-none bg-transparent"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(category);
            }
          }}
          aria-label={title}
        >
          {/* Left: Square rounded photo */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-800 shadow-xs">
            <img
              src={category.image}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Right: Title, Count & Chevron */}
          <div className="flex-1 min-w-0 pl-1 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                {productsCount} კერძი
              </p>
            </div>
            <div className="p-2 rounded-full text-gray-400 group-hover:text-amber-600 transition-colors shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* ─── GRID CARD (Used on mobile when viewMode === 'grid', and ALWAYS on desktop >= lg) ─── */}
      <div
        onClick={() => onClick(category)}
        className={`group relative w-full flex-col rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 ${
          viewMode === "list" ? "hidden lg:flex" : "flex"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(category);
          }
        }}
        aria-label={title}
      >
        {/* Food presentation dish image container */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
          <img
            src={category.image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {/* Subtle hover gradient sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
        </div>

        {/* Bottom banner overlay / bar: Dark brownish-black translucent strip with bold Georgian text */}
        <div className="w-full bg-[#1c1917]/95 dark:bg-black/90 py-3.5 px-4 text-center border-t border-stone-800/40">
          <h3 className="text-white font-bold text-base sm:text-lg tracking-wide leading-snug truncate">
            {title}
          </h3>
        </div>
      </div>
    </>
  );
}
