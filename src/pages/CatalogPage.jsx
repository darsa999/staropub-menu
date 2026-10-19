import React from "react";
import { ArrowLeft, UtensilsCrossed, X } from "lucide-react";
import SearchBar from "../components/SearchBar";
import CategorySection from "../components/CategorySection";
import { useLanguage } from "../context/LanguageContext";

export default function CatalogPage({
  categories,
  searchQuery,
  onSearchChange,
  onBackToHome,
  isLoading,
}) {
  const { t } = useLanguage();

  return (
    <div className="w-full pt-6">
      {/* Navigation back to Categories Home View */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToHome}
          type="button"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1.5 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          <span>მთავარი / {t("categoriesTitle")}</span>
        </button>

        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline flex items-center space-x-1"
          >
            <span>ძებნის გასუფთავება</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Search & Actions Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onViewAllProducts={() => {
          onSearchChange("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isAllProductsActive={!searchQuery}
      />

      {/* Loading Skeletons */}
      {(isLoading || (!categories || categories.length === 0)) && !searchQuery && (
        <div className="space-y-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="animate-pulse">
              <div className="h-7 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-3.5 border border-gray-200/60 dark:border-zinc-800"
                  >
                    <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-zinc-800 mb-3.5" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when live search returns zero results */}
      {!isLoading && categories.length === 0 && searchQuery && (
        <div className="py-24 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-8 my-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t("noProductsFound")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mb-6">
            საძიებო სიტყვით „{searchQuery}“ კერძები ვერ მოიძებნა.
          </p>
          <button
            onClick={() => onSearchChange("")}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>ძებნის გასუფთავება</span>
          </button>
        </div>
      )}

      {/* Grouped Category Sections Container */}
      {!isLoading &&
        categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
          />
        ))}
    </div>
  );
}
