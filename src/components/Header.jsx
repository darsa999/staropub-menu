import React from "react";
import { Sun, Moon, ShoppingBag, Globe, UtensilsCrossed } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";

export default function Header({ onOpenLanguageDrawer, onLogoClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { language, languages, t } = useLanguage();
  const { totalCount, openCart } = useCart();

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border-b border-gray-200/80 dark:border-zinc-800 transition-colors duration-200">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Restaurant Brand & Welcome */}
          <div
            onClick={onLogoClick}
            className="flex items-center space-x-3.5 sm:space-x-4 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onLogoClick && onLogoClick();
              }
            }}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shadow-amber-900/15 border border-amber-600/30 shrink-0 group-hover:scale-105 transition-transform bg-[#0a2318]">
              <img
                src="/logo.jpg"
                alt="StaroPub Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                  PUB &amp; RESTAURANT
                </span>
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                StaroPub-სტარო პაბი
              </h1>
            </div>
          </div>

          {/* Right: Actions (Theme Toggle, Language Switcher, Cart Button) */}
          {/* NOTE: Absolutely no user login / profile icon per core rules */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className="p-2.5 rounded-full text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Language Switcher Trigger */}
            <button
              onClick={onOpenLanguageDrawer}
              type="button"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 text-sm font-medium transition-all shadow-sm"
              title={t("selectLanguage")}
            >
              <span className="text-base leading-none select-none">{currentLang.flag}</span>
              <span className="font-semibold text-xs tracking-wider">{currentLang.subLabel}</span>
            </button>

            {/* Cart Button with Dynamic Badge */}
            <button
              onClick={openCart}
              type="button"
              className="relative flex items-center justify-center p-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm animate-pulse">
                  {totalCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
