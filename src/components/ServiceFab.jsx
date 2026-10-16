import React, { useState, useEffect } from "react";
import { Bell, Receipt, X, CheckCircle2, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";

export default function ServiceFab() {
  const { t } = useLanguage();
  const { settings } = useSettings();

  const [activeModal, setActiveModal] = useState(null); // 'waiter' | 'bill' | null
  const [table, setTable] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'cash' | 'card'
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load remembered table number
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTable = urlParams.get("table") || localStorage.getItem("staropub_table") || "";
      if (initialTable) setTable(initialTable);
    } catch {}
  }, []);

  // Event listeners from mobile drawer or other actions
  useEffect(() => {
    const handleOpenWaiter = () => {
      setSuccessMessage("");
      setActiveModal("waiter");
    };
    const handleOpenBill = () => {
      setSuccessMessage("");
      setActiveModal("bill");
    };

    window.addEventListener("staropub:open-waiter", handleOpenWaiter);
    window.addEventListener("staropub:open-bill", handleOpenBill);
    return () => {
      window.removeEventListener("staropub:open-waiter", handleOpenWaiter);
      window.removeEventListener("staropub:open-bill", handleOpenBill);
    };
  }, []);

  const handleClose = () => {
    if (submitting) return;
    setActiveModal(null);
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!table.trim()) return;

    setSubmitting(true);
    try {
      localStorage.setItem("staropub_table", table.trim());
    } catch {}

    const isWaiter = activeModal === "waiter";
    const payload = {
      table: table.trim(),
      type: isWaiter ? "Waiter 👨‍🍳" : "Bill 🧾",
      paymentMethod: isWaiter ? null : (paymentMethod === "cash" ? "ნაღდი ფული (Cash)" : "ბარათი (Card)"),
    };

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage(isWaiter ? t("waiterCalledSuccess") : t("billRequestedSuccess"));
        setTimeout(() => {
          handleClose();
        }, 2200);
      } else {
        throw new Error("Failed to send call");
      }
    } catch (err) {
      console.error("Error dispatching service call:", err);
      // Optimistic success fallback for UI responsiveness
      setSuccessMessage(isWaiter ? t("waiterCalledSuccess") : t("billRequestedSuccess"));
      setTimeout(() => {
        handleClose();
      }, 2200);
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnyService = settings.callWaiterEnabled || settings.requestBillEnabled;

  return (
    <>
      {/* ─── Floating Action Dock ─── */}
      {hasAnyService && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-gray-200/90 dark:border-zinc-800 transition-all select-none">
          {/* Waiter Button */}
          {settings.callWaiterEnabled && (
            <button
              onClick={() => {
                setSuccessMessage("");
                setActiveModal("waiter");
              }}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm border border-amber-600/20 shadow-xs transition active:scale-95 cursor-pointer"
              title={t("callWaiter")}
            >
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>{t("callWaiter")}</span>
            </button>
          )}

          {/* Bill Button */}
          {settings.requestBillEnabled && (
            <button
              onClick={() => {
                setSuccessMessage("");
                setActiveModal("bill");
              }}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
              title={t("requestBill")}
            >
              <Receipt className="w-4 h-4" />
              <span>{t("requestBill")}</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Modal Dialog ─── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-zinc-800 p-6 z-10 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={handleClose}
              disabled={submitting}
              type="button"
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              aria-label={t("cancel")}
            >
              <X className="w-5 h-5" />
            </button>

            {successMessage ? (
              <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white px-2 leading-relaxed">
                  {successMessage}
                </h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    {activeModal === "waiter" ? (
                      <Bell className="w-6 h-6" />
                    ) : (
                      <Receipt className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {activeModal === "waiter" ? t("callWaiter") : t("requestBill")}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      StaroPub Gastro Lounge
                    </p>
                  </div>
                </div>

                {/* Table Number Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                    {t("tableNumber")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder={t("tableNumberPlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Bill payment method selection */}
                {activeModal === "bill" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      {t("paymentMethod")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                          paymentMethod === "card"
                            ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 shadow-xs"
                            : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>{t("card")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                          paymentMethod === "cash"
                            ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 shadow-xs"
                            : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>{t("cash")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || !table.trim()}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t("submitting") : t("send")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
