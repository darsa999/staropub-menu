import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { getOptimizedImageUrl } from "../services/api";

export default function CartDrawer() {
  const {
    items,
    totalCount,
    totalPrice,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { t, getLocalizedField } = useLanguage();
  const { settings, isSettingsLoaded } = useSettings();
  const [isOrdered, setIsOrdered] = useState(false);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock scroll
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsOrdered(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen || !isSettingsLoaded || !(settings?.isCartEnabled || settings?.cartEnabled)) return null;

  const handleCheckout = () => {
    setIsOrdered(true);
    setTimeout(() => {
      clearCart();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("cartTitle")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {totalCount} {t("itemsCount")}
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isOrdered ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("orderReceived")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs">
                  {t("orderSentSuccess")}
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("emptyCart")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs">
                  {t("emptyCartSubtext")}
                </p>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const localizedTitle = getLocalizedField(product.name);
                const itemTotal = (product.price * quantity).toFixed(2);

                return (
                  <div
                    key={product.id}
                    className="flex items-center space-x-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800"
                  >
                    <img
                      src={getOptimizedImageUrl(product.image, { width: 160 })}
                      alt={localizedTitle}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {localizedTitle}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {Number(product.price).toFixed(2)} {t("currency")}
                      </p>

                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 flex items-center justify-center text-gray-700 dark:text-zinc-200 hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 dark:text-white w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 flex items-center justify-center text-gray-700 dark:text-zinc-200 hover:bg-gray-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch">
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {itemTotal} {t("currency")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && !isOrdered && (
            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 space-y-4 bg-gray-50/50 dark:bg-zinc-900">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                  <span>{t("subtotal")}</span>
                  <span>
                    {totalPrice.toFixed(2)} {t("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200/60 dark:border-zinc-800">
                  <span>{t("total")}</span>
                  <span className="text-amber-700 dark:text-amber-400">
                    {totalPrice.toFixed(2)} {t("currency")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  type="button"
                  className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-md flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
                >
                  <span>{t("checkout")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={clearCart}
                  type="button"
                  className="w-full py-2 px-3 text-xs text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                >
                  {t("clearCart")}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
