import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function StickyCategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}) {
  const { getLocalizedField } = useLanguage();
  const scrollContainerRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll the horizontal category nav so that the active tab is centered/visible
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;

      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      // If the tab is out of view or near the edges, scroll it into view
      if (
        tabRect.left < containerRect.left + 40 ||
        tabRect.right > containerRect.right - 40
      ) {
        tab.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeCategoryId]);

  const handleArrowScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="sticky top-20 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 transition-colors shadow-xs">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center">
        
        {/* Left Arrow Button */}
        <button
          onClick={() => handleArrowScroll("left")}
          type="button"
          aria-label="Scroll categories left"
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 shadow-xs hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all mr-2 shrink-0"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable Tabs Row */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const title = getLocalizedField(cat.title || cat.name);

            return (
              <button
                key={cat.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => onSelectCategory(cat.id)}
                type="button"
                className={`group py-3.5 whitespace-nowrap text-sm sm:text-base transition-all flex items-center shrink-0 border-b-2 font-medium ${
                  isActive
                    ? "border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span className="relative">
                  {title}
                  {cat.products && (
                    <span
                      className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                          : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                      }`}
                    >
                      {cat.products.length}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleArrowScroll("right")}
          type="button"
          aria-label="Scroll categories right"
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 shadow-xs hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all ml-2 shrink-0"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>

      </div>
    </div>
  );
}
