import React from "react";
import ProductCard from "./ProductCard";
import { useLanguage } from "../context/LanguageContext";

export default function CategorySection({ category }) {
  const { getLocalizedField } = useLanguage();
  const title = getLocalizedField(category.title || category.name);
  const products = category.products || [];

  if (products.length === 0) return null;

  return (
    <section
      id={`category-${category.id}`}
      className="scroll-mt-40 mb-14 transition-all"
    >
      {/* Category Heading: Clean, bold Georgian typography with bottom spacing */}
      <div className="flex items-center space-x-3 mb-6 pb-2 border-b border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
          {products.length}
        </span>
      </div>

      {/* Strict 4-Column Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
