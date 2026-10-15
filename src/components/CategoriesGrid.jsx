import React from "react";
import CategoryCard from "./CategoryCard";

export default function CategoriesGrid({ categories, onSelectCategory, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={onSelectCategory}
        />
      ))}
    </div>
  );
}
