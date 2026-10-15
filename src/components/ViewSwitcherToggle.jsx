import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { useViewMode } from "../context/ViewModeContext";

export default function ViewSwitcherToggle({ className = "" }) {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div
      className={`inline-flex md:hidden items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 ${className}`}
      role="group"
      aria-label="View Switcher"
    >
      {/* 1. Grid View Button */}
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          viewMode === "grid"
            ? "bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        }`}
        aria-label="Grid View"
        title="Grid View"
      >
        <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
      </button>

      {/* 2. List View Button */}
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          viewMode === "list"
            ? "bg-white dark:bg-gray-900 text-black dark:text-white shadow-xs"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        }`}
        aria-label="List View"
        title="List View"
      >
        <List className="w-4 h-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
