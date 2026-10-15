import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function CategoryCard({ category, onClick }) {
  const { getLocalizedField } = useLanguage();
  const title = getLocalizedField(category.title || category.name);

  return (
    <div
      onClick={() => onClick(category)}
      className="group relative w-full flex flex-col rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800"
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
  );
}
