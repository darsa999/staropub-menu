import React from "react";
import { Phone, Mail, UtensilsCrossed } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Footer({ onNavHome, onNavAbout }) {
  const { t } = useLanguage();

  return (
    <footer className="bg-zinc-950 text-zinc-400 mt-20 border-t border-zinc-800/80">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 pb-12 border-b border-zinc-800">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <div
              onClick={onNavHome}
              className="flex items-center space-x-3 cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-600/30 shadow-md group-hover:scale-105 transition-transform bg-[#0a2318] shrink-0">
                <img
                  src="/logo.jpg"
                  alt="StaroPub Logo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                {t("restaurantName")}
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {t("footerSlogan")}
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("contact")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">{t("phone")}</span>
                  <a
                    href="tel:+995595931119"
                    className="text-zinc-200 hover:text-amber-400 transition-colors font-medium"
                  >
                    +995 595 93 11 19
                  </a>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-500">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">{t("email")}</span>
                  <a
                    href="mailto:staropub25@gmail.com"
                    className="text-zinc-200 hover:text-amber-400 transition-colors font-medium break-all"
                  >
                    staropub25@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t("navigation")}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavHome}
                  className="hover:text-amber-400 transition-colors text-zinc-300 text-left"
                >
                  {t("navHome")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavAbout}
                  className="hover:text-amber-400 transition-colors text-zinc-300 text-left"
                >
                  {t("navAbout")}
                </button>
              </li>
              <li>
                <a
                  href="#terms"
                  className="hover:text-amber-400 transition-colors text-zinc-300"
                >
                  {t("navTerms")}
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="hover:text-amber-400 transition-colors text-zinc-300"
                >
                  {t("navPrivacy")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Note */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 space-y-3 sm:space-y-0">
          <p>{t("copyright")}</p>
          <p className="flex items-center space-x-1">
            <span>StaroPub Gastro Lounge • All Rights Reserved</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
