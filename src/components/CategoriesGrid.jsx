import React from "react";
import CategoryCard from "./CategoryCard";
import { useViewMode } from "../context/ViewModeContext";

export default function CategoriesGrid({ categories, onSelectCategory, isLoading }) {
  const { viewMode } = useViewMode();

  if (isLoading || !Array.isArray(categories) || categories.length === 0) {
    return (
      <div
        className={
          viewMode === "list"
            ? "flex flex-col gap-3 divide-y divide-gray-100 dark:divide-zinc-800 lg:divide-y-0 lg:grid lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
            : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
        }
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800"
          >
            <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-zinc-800" />
            <div className="bg-stone-900 p-4">
              <div className="h-5 bg-stone-700 rounded-md w-3/5 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === "list"
          ? "flex flex-col gap-3 divide-y divide-gray-100 dark:divide-zinc-800 lg:divide-y-0 lg:grid lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
          : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:gap-8 w-full"
      }
    >
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={onSelectCategory}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
