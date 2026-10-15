import React from "react";
import ProductCard from "./ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { UtensilsCrossed } from "lucide-react";

export default function ProductGrid({ products, isLoading }) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white dark:bg-zinc-900 rounded-3xl p-3.5 border border-gray-200/60 dark:border-zinc-800"
          >
            <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-zinc-800 mb-3.5" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mb-4" />
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-zinc-800/80">
              <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
              <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-xl w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-8 my-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8 opacity-70" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t("noProductsFound")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm">
          სცადეთ სხვა საძიებო სიტყვა ან აირჩიეთ განსხვავებული კატეგორია.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
