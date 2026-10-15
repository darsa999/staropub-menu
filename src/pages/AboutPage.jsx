import React from "react";
import { Phone, MapPin, ExternalLink, ArrowLeft, Compass } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Static pub settings - eliminates network roundtrip and /settings 404
const PUB_SETTINGS = {
  isOpen: true,
  workingHours: "10:00 – 23:00",
  workingDays: "ყოველდღე",
  matchDayNote: "მატჩის დღეებში პაბი მუშაობს მატჩის ბოლომდე",
  contactPhone: "+995 595 93 11 19",
};

export default function AboutPage({ onBackToHome }) {
  const { t } = useLanguage();

  const isOpen = PUB_SETTINGS.isOpen;
  const workingHours = PUB_SETTINGS.workingHours;
  const workingDays = PUB_SETTINGS.workingDays;
  const matchDayNote = PUB_SETTINGS.matchDayNote;
  const contactPhone = PUB_SETTINGS.contactPhone;

  return (
    <div className="w-full pt-6">
      {/* Navigation back to Menu / Categories */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToHome}
          type="button"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1.5 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          <span>{t("navHome")} / მენიუ</span>
        </button>
      </div>

      {/* ─── SECTION 1: 360° Interior Tour Hero Block ─── */}
      <section
        id="virtual-tour-section"
        className="relative w-full min-h-[400px] sm:min-h-[480px] rounded-3xl overflow-hidden border border-amber-900/20 dark:border-zinc-800 shadow-xl bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-10 text-center group"
      >
        {/* Atmospheric Pub Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/staropub_main.jpg"
            alt="StaroPub Interior"
            className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out opacity-40 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/60" />
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/80" />
        </div>

        {/* 360° Interactive Placeholder Center Content */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Animated 360 Panoramic Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500/15 border-2 border-amber-400/50 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20 group-hover:border-amber-300 group-hover:scale-105 transition-all duration-300">
              <Compass className="w-9 h-9 sm:w-11 sm:h-11 animate-[spin_16s_linear_infinite]" />
              <span className="absolute bottom-2 text-[10px] sm:text-xs font-black tracking-widest text-amber-300">
                360°
              </span>
            </div>
            {/* Subtle Pulse Halo */}
            <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping -z-10" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md font-serif">
            დაათვალიერე სტარო პაბი
          </h1>

          {/* Status Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-xs sm:text-sm font-medium text-amber-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>ვირტუალური 360° ტური მალე დაემატება</span>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-zinc-300/80 max-w-lg leading-relaxed">
            ჩაეფელით სტაროპაბის ავთენტურ გარემოში, დაათვალიერეთ დარბაზი და მყუდრო სივრცეები პირდაპირ თქვენი მოწყობილობიდან.
          </p>
        </div>
      </section>

      {/* ─── SECTION 2: Contact, Working Hours & Google Maps Card ─── */}
      <section className="mt-8 rounded-3xl p-6 sm:p-8 lg:p-10 bg-[#F5F2EB] dark:bg-zinc-900 border border-amber-900/10 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* ── LEFT COLUMN: Information, Status, Schedule & Contacts ── */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Header: Label & Status Pill */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-400/80 block">
                    სტატუსი & სამუშაო საათები
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-serif">
                      {workingHours}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400">
                      {workingDays}
                    </span>
                  </div>
                </div>

                {/* Status Badge: Pulsing Green or Red Dot */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-xs shrink-0 ${
                    isOpen
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      isOpen ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <span>{isOpen ? "ღიაა" : "დაკეტილია"}</span>
                </div>
              </div>

              {/* Match Days Note */}
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed -mt-2">
                {matchDayNote}
              </p>

              {/* Slogan Banner */}
              <div className="py-3.5 px-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 text-center">
                <span className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-400 font-serif tracking-wide">
                  სტაროპაბში შეკრების დროა!
                </span>
              </div>

              {/* Call Action Button */}
              <a
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                className="w-full bg-[#E8830C] hover:bg-[#D47506] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md shadow-amber-600/20 text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>დარეკვა: {contactPhone}</span>
              </a>

              {/* Address Field */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700/80 text-sm font-semibold text-gray-800 dark:text-zinc-200 shadow-xs">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>ილია ვეკუას 20 (გლდანი)</span>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">
                სოციალური ქსელები
              </span>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://www.facebook.com/StaroPub1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-xs sm:text-sm font-bold transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/staropub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-xs sm:text-sm font-bold transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-[#E4405F]" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Google Maps & Direct Navigation ── */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              {/* Header row: Location label, large title, Maps direct link */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-400/80 block">
                    ლოკაცია რუკაზე
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white mt-1 font-serif leading-tight">
                    ილია ვეკუას 20 (გლდანი)
                  </h3>
                </div>

                <a
                  href="https://www.google.com/maps?q=StaroPub+Tbilisi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full transition-colors shrink-0"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                </a>
              </div>

              {/* Interactive Google Maps Frame */}
              <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-gray-200/80 dark:border-zinc-700/80 bg-gray-100 dark:bg-zinc-950 shadow-inner">
                <iframe
                  title="StaroPub Location"
                  src="https://www.google.com/maps?q=StaroPub+Tbilisi&output=embed"
                  className="w-full h-full border-0 block"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Footer note inside Card */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200/80 dark:border-zinc-800 text-xs sm:text-sm font-medium flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>ილია ვეკუას ქ. #20, თბილისი</span>
              </div>
              <span className="font-bold text-amber-700 dark:text-amber-400 font-serif">
                StaroPub Gastro Lounge
              </span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
