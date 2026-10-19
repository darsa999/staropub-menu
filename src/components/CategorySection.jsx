import React from "react";
import ProductCard from "./ProductCard";
import ViewSwitcherToggle from "./ViewSwitcherToggle";
import { useLanguage } from "../context/LanguageContext";
import { useViewMode } from "../context/ViewModeContext";

export default function CategorySection({ category, isFirstSection = false }) {
  const { getLocalizedField } = useLanguage();
  const { viewMode } = useViewMode();
  const title = getLocalizedField(category.title || category.name);
  const products = category.products || [];

  if (products.length === 0) return null;

  return (
    <section
      id={`category-${category.id}`}
      className="scroll-mt-40 mb-14 transition-all"
    >
      {/* Category Heading: Clean, bold Georgian typography with count and right-aligned View Switcher */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
            {products.length}
          </span>
        </div>

        {/* Mobile-only View Switcher Toggle */}
        <ViewSwitcherToggle />
      </div>

      {/* Responsive Product Grid / List */}
      <div
        className={
          viewMode === "list"
            ? "flex flex-col gap-4 divide-y divide-gray-100 dark:divide-zinc-800 lg:divide-y-0 lg:grid lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
            : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
        }
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={isFirstSection && index < 4}
          />
        ))}
      </div>
    </section>
  );
}
