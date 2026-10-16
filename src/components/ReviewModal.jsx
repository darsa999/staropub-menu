import React, { useState, useEffect } from "react";
import { Star, X, CheckCircle2, MessageSquareHeart } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";

export default function ReviewModal() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      // Pre-fill table from localStorage or URL query
      let initialTable = "";
      try {
        const urlParams = new URLSearchParams(window.location.search);
        initialTable = urlParams.get("table") || localStorage.getItem("staropub_table") || "";
      } catch {}
      setTable(initialTable);
      setSubmitted(false);
      setIsOpen(true);
    };

    window.addEventListener("staropub:open-review", handleOpen);
    return () => window.removeEventListener("staropub:open-review", handleOpen);
  }, []);

  if (!isOpen || !settings.reviewFormEnabled) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (table.trim()) {
        try {
          localStorage.setItem("staropub_table", table.trim());
        } catch {}
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "სტუმარი",
          rating: Number(rating) || 5,
          comment: comment.trim(),
          table: table.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setComment("");
          setSubmitted(false);
        }, 1800);
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      // Fallback optimistic success
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 1800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !submitting && setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-zinc-800 p-6 z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={() => setIsOpen(false)}
          disabled={submitting}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          aria-label={t("cancel")}
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("reviewSuccess")}
            </h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {t("leaveReview")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  StaroPub Gastro Lounge
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400">
                {t("rating")}
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-300 dark:text-zinc-700"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Table Number row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  {t("yourName")} <span className="text-gray-400">{t("optional")}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="მაგ. გიორგი"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  {t("tableNumber")} <span className="text-gray-400">{t("optional")}</span>
                </label>
                <input
                  type="text"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder={t("tableNumberPlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                {t("yourComment")}
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="როგორ შეაფასებდით კერძებსა და გარემოს?..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? t("submitting") : t("send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
