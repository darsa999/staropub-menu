import React, { useEffect } from "react";
import { X, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function LanguageDrawer({ isOpen, onClose }) {
  const { language, setLanguage, languages, t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-zinc-800">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("selectLanguage")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3 flex-1 overflow-y-auto">
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/20 text-gray-900 dark:text-white shadow-sm ring-1 ring-amber-600"
                      : "border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/80 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl select-none">{item.flag}</span>
                    <div>
                      <div className="font-semibold text-base">
                        {item.label}
                      </div>
                      <div className="text-xs uppercase font-medium text-gray-400 dark:text-zinc-500">
                        {item.subLabel}
                      </div>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-gray-300 dark:border-zinc-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Drawer Footer note */}
          <div className="p-6 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-400 dark:text-zinc-500 text-center">
            {t("restaurantName")} • OFOODO 2026©
          </div>

        </div>
      </div>
    </div>
  );
}
