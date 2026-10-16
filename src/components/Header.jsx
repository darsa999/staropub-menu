import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, Menu, Sun, Moon, Info, ChevronRight, Share2, Bell, Receipt, MessageSquareHeart } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";

/**
 * Clean SVG flag icons for language selector
 */
export function FlagIcon({ code, className = "w-7 h-[18px]" }) {
  if (code === "en") {
    return (
      <svg className={className} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="20" fill="#B22234" />
        <rect y="1.54" width="30" height="1.54" fill="#FFFFFF" />
        <rect y="4.62" width="30" height="1.54" fill="#FFFFFF" />
        <rect y="7.69" width="30" height="1.54" fill="#FFFFFF" />
        <rect y="10.77" width="30" height="1.54" fill="#FFFFFF" />
        <rect y="13.85" width="30" height="1.54" fill="#FFFFFF" />
        <rect y="16.92" width="30" height="1.54" fill="#FFFFFF" />
        <rect width="12" height="10.77" fill="#3C3B6E" />
        <circle cx="2.5" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="6" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="9.5" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="4.25" cy="4.2" r="0.6" fill="#FFFFFF" />
        <circle cx="7.75" cy="4.2" r="0.6" fill="#FFFFFF" />
        <circle cx="2.5" cy="6.2" r="0.6" fill="#FFFFFF" />
        <circle cx="6" cy="6.2" r="0.6" fill="#FFFFFF" />
        <circle cx="9.5" cy="6.2" r="0.6" fill="#FFFFFF" />
        <circle cx="4.25" cy="8.2" r="0.6" fill="#FFFFFF" />
        <circle cx="7.75" cy="8.2" r="0.6" fill="#FFFFFF" />
      </svg>
    );
  }
  if (code === "ru") {
    return (
      <svg className={className} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="6.67" fill="#FFFFFF" />
        <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
        <rect y="13.34" width="30" height="6.66" fill="#D52B1E" />
      </svg>
    );
  }
  // Default: Georgian Flag (KA)
  return (
    <svg className={className} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect x="13" width="4" height="20" fill="#FF0000" />
      <rect y="8" width="30" height="4" fill="#FF0000" />
      <path d="M5 4h3M6.5 2.5v3" stroke="#FF0000" strokeWidth="1.2" strokeLinecap="square" />
      <path d="M22 4h3M23.5 2.5v3" stroke="#FF0000" strokeWidth="1.2" strokeLinecap="square" />
      <path d="M5 16h3M6.5 14.5v3" stroke="#FF0000" strokeWidth="1.2" strokeLinecap="square" />
      <path d="M22 16h3M23.5 14.5v3" stroke="#FF0000" strokeWidth="1.2" strokeLinecap="square" />
    </svg>
  );
}

/**
 * Compact pill-shaped theme toggle matching exact reference styling
 */
function ThemeTogglePill({ isDark, toggleTheme, className = "" }) {
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className={`rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 flex items-center gap-2 cursor-pointer shadow-sm hover:border-gray-300 transition select-none ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-black dark:bg-white shrink-0 transition-colors" />
      <span className="text-[10px] leading-tight font-medium text-slate-500 dark:text-gray-300 select-none text-left">
        {isDark ? "Dark" : "Light"}
        <br />
        Mode
      </span>
    </button>
  );
}

/**
 * Minimalist shopping cart outline with dynamic count badge
 */
function CartButton({ totalCount, openCart }) {
  return (
    <button
      onClick={openCart}
      type="button"
      className="relative p-1 text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition cursor-pointer focus:outline-none"
      aria-label="Shopping Cart"
    >
      <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-200" strokeWidth={1.8} />
      <span className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm select-none">
        {totalCount}
      </span>
    </button>
  );
}

export default function Header({ onOpenLanguageDrawer, onLogoClick, onNavigateToAbout }) {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { totalCount, openCart } = useCart();
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareMenu = async () => {
    const shareData = {
      title: "StaroPub - სტარო პაბი",
      text: "StaroPub-ის ციფრული მენიუ",
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        } catch {}
      }
    }
  };

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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
                if (onLogoClick) onLogoClick();
              }
            }}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shadow-amber-900/15 border border-amber-600/30 shrink-0 group-hover:scale-105 transition-transform bg-[#0a2318]">
              <img
                src="/logo.jpg"
                alt="StaroPub Logo"
                decoding="async"
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

          {/* Right Desktop Controls (hidden md:flex items-center gap-3) */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Pill-shaped Theme Toggle */}
            <ThemeTogglePill isDark={isDark} toggleTheme={toggleTheme} />

            {/* Share Menu Trigger */}
            {settings.customMenuEnabled && (
              <div className="relative">
                <button
                  onClick={handleShareMenu}
                  type="button"
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer shadow-xs flex items-center justify-center"
                  title={t("shareMenu")}
                  aria-label="Share menu"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {shareCopied && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap z-50">
                    {t("shareSuccess")}
                  </span>
                )}
              </div>
            )}

            {/* Rectangular Flat Flag Trigger */}
            <button
              onClick={onOpenLanguageDrawer}
              type="button"
              className="rounded-sm border border-gray-200 dark:border-gray-700 hover:opacity-90 transition cursor-pointer overflow-hidden shadow-xs flex items-center justify-center"
              title={t("selectLanguage")}
              aria-label="Select language"
            >
              <FlagIcon code={language} className="w-7 h-[18px] block object-cover" />
            </button>

            {/* Minimalist Shopping Cart Outline Icon with Badge (if cart enabled) */}
            {settings.isCartEnabled && (
              <CartButton totalCount={totalCount} openCart={openCart} />
            )}

          </div>

          {/* Right Mobile Controls (md:hidden flex items-center gap-2.5) */}
          <div className="md:hidden flex items-center gap-2.5">
            {/* Share Trigger for Mobile if enabled */}
            {settings.customMenuEnabled && (
              <button
                onClick={handleShareMenu}
                type="button"
                className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                title={t("shareMenu")}
                aria-label="Share menu"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Quick-access Cart Icon visible with its quantity badge (if cart enabled) */}
            {settings.isCartEnabled && (
              <CartButton totalCount={totalCount} openCart={openCart} />
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              type="button"
              className="p-2 rounded-xl text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-over Drawer mounted via React Portal */}
      {isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dark semi-transparent backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container: fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col p-6 overflow-y-auto */}
          <div
            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col p-6 overflow-y-auto border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Header: Pub Title & Logo + Close Button ("✕") with clear padding and click handler to set isMobileMenuOpen = false */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-600/30 shrink-0 bg-[#0a2318] shadow-sm">
                  <img src="/logo.jpg" alt="StaroPub Logo" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    StaroPub-სტარო პაბი
                  </h2>
                  <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">
                    PUB &amp; RESTAURANT
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
                className="p-2 -mr-1.5 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-xl font-bold leading-none flex items-center justify-center w-10 h-10 select-none"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body (Clear list with spacious touch targets) */}
            <div className="py-6 flex-1 space-y-5">
              {/* 1. "ჩვენს შესახებ" (About Us) button/link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onNavigateToAbout) onNavigateToAbout();
                }}
                type="button"
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-bold hover:bg-amber-500/20 active:scale-[0.99] transition-all border border-amber-600/20 text-left cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-base font-bold">{t("aboutUs")}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-amber-600/80 dark:text-amber-400/80" />
              </button>

              {/* 2. Theme Mode Switcher: Dedicated row with label "თემა" (Theme) and the pill-shaped Light/Dark toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <span className="text-base font-bold text-gray-800 dark:text-gray-100">
                    {t("theme")}
                  </span>
                </div>
                <ThemeTogglePill isDark={isDark} toggleTheme={toggleTheme} />
              </div>

              {/* 3. Language Switcher: Row/List showing all languages with flags (ქართული, English, Русский) */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("selectLanguage")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "ka", name: "ქართული" },
                    { code: "en", name: "English" },
                    { code: "ru", name: "Русский" },
                  ].map((item) => {
                    const isSelected = language === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLanguage(item.code);
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-sm ring-1 ring-amber-600/30"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:border-gray-300"
                        }`}
                      >
                        <div className="rounded-xs overflow-hidden border border-gray-200/60 shadow-xs mb-1.5">
                          <FlagIcon code={item.code} className="w-7 h-[18px] block object-cover" />
                        </div>
                        <span className="text-xs font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Table Services & Actions */}
              {(settings.callWaiterEnabled || settings.requestBillEnabled || settings.customMenuEnabled || settings.reviewFormEnabled) && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {t("service")}
                  </div>

                  {settings.callWaiterEnabled && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent("staropub:open-waiter"));
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold border border-amber-600/20 text-left cursor-pointer hover:bg-amber-500/20 transition"
                    >
                      <span className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold">{t("callWaiter")}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-600/70" />
                    </button>
                  )}

                  {settings.requestBillEnabled && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent("staropub:open-bill"));
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-white font-bold border border-zinc-200 dark:border-zinc-700 text-left cursor-pointer hover:bg-zinc-200/70 transition"
                    >
                      <span className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold">{t("requestBill")}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}

                  {settings.customMenuEnabled && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleShareMenu();
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 text-left cursor-pointer hover:border-gray-300 transition"
                    >
                      <span className="flex items-center gap-3">
                        <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm">{t("shareMenu")}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {settings.reviewFormEnabled && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent("staropub:open-review"));
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700 text-left cursor-pointer hover:border-gray-300 transition"
                    >
                      <span className="flex items-center gap-3">
                        <MessageSquareHeart className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm">{t("leaveReview")}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              )}

              {/* 4. Cart Action: Clear button with Cart icon and item counter badge (visible only when cart enabled) */}
              {settings.isCartEnabled && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCart();
                  }}
                  type="button"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.99] text-left cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                    <span className="text-base font-bold">{t("cartTitle")}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
                    {totalCount}
                  </span>
                </button>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 text-center shrink-0">
              StaroPub • OFOODO 2026©
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
