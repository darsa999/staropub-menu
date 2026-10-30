import React from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LoadError({ onRetry }) {
  const { t } = useLanguage();

  return (
    <div role="alert" className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-8 my-6">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 opacity-80" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("menuLoadError")}</h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mb-6">{t("menuLoadErrorHint")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm"
      >
        <RefreshCw className="w-4 h-4" />
        <span>{t("retry")}</span>
      </button>
    </div>
  );
}
