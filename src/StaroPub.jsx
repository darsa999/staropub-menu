import React, { useRef, useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// ─── Firebase Client Initialization ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBItCODkqjOBCSTHQLst_zimOnsrYcPUGo",
  authDomain: "staropub-menu.firebaseapp.com",
  projectId: "staropub-menu",
  storageBucket: "staropub-menu.firebasestorage.app",
  messagingSenderId: "211658818022",
  appId: "1:211658818022:web:e944e70d38b71515b25627",
  measurementId: "G-GQ5PKEN8SW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getTimestampedUrl = (url) => {
  if (!url) return "";
  const cleanUrl = url.split("?t=")[0];
  return `${cleanUrl}?t=${Date.now()}`;
};

// ─── Timing constants ─────────────────────────────────────────────────────────
const POUR_DURATION_MS  = 2000;

// ─── Loading text ─────────────────────────────────────────────────────────────
const LOADING_TEXT = {
  ka: "მენიუ იტვირთება...",
  en: "The menu is loading...",
  ru: "Меню загружается...",
};

// ─── "Daily Special" badge label ─────────────────────────────────────────────
const DAILY_SPECIAL_LABEL = { ka: "✦ დღის შეთავაზება", en: "✦ Daily Special", ru: "✦ Блюдо дня" };
const BANNER_DEFAULT_BADGES = { ka: "დღის შეთავაზება", en: "Daily Special", ru: "Блюдо дня" };
const BANNER_DEFAULT_TEXTS = {
  ka: "საფირმო ჩეხური ნეკნები - 15% ფასდაკლება!",
  en: "Signature Czech Ribs - 15% Off!",
  ru: "Фирменные чешские ребрышки - Скидка 15%!",
};

// ─── Category labels ──────────────────────────────────────────────────────────
const INITIAL_CATEGORY_LABELS = {
  grill:      { ka: "🔥 გრილი",               en: "🔥 Grill",        ru: "🔥 Гриль" },
  khinkali:   { ka: "🥟 ხინკალი",             en: "🥟 Khinkali",     ru: "🥟 Хинкали" },
  hot_dishes: { ka: "🍲 ცხელი კერძები",       en: "🍲 Hot Dishes",   ru: "🍲 Горячие блюда" },
  cold_dishes:{ ka: "🥗 ცივი კერძები",        en: "🥗 Cold Dishes",  ru: "🥗 Холодные закуски" },
  soup:       { ka: "🍜 წვნიანი კერძები",     en: "🍜 Soups",        ru: "🍜 Супы" },
  salad:      { ka: "🥗 სალათები",            en: "🥗 Salads",       ru: "🥗 Salaty" },
  cheese:     { ka: "🧀 ყველი",               en: "🧀 Cheese",       ru: "🧀 Сыр" },
  bakery:     { ka: "🫓 ცომეული",             en: "🫓 Bakery",       ru: "🫓 Выпечка" },
  fish:       { ka: "🐟 თევზეული",            en: "🐟 Fish",         ru: "🐟 Рыба" },
  side:       { ka: "🍚 გარნირი",             en: "🍚 Side Dishes",  ru: "🍚 Гарниры" },
  beer:       { ka: "🍺 ლუდი",               en: "🍺 Beer",         ru: "🍺 Пиво" },
  hot_drink:  { ka: "☕ ცხელი სასმელები",     en: "☕ Hot Drinks",   ru: "☕ Горячие напитки" },
  Alcohol:    { ka: "🥃 სპირტიანი სასმელები", en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  sauces:     { ka: "🫙 სოუსები",             en: "🫙 Sauces",       ru: "🫙 Соусы" },
  snacks:     { ka: "🍟 წასახემსებელი",       en: "🍟 Snacks",       ru: "🍟 Закуски" },
};

const INITIAL_CATEGORY_ICONS = {
  grill: "🔥", khinkali: "🥟", hot_dish: "🍲", soup: "🍜", salad: "🥗",
  cheese: "🧀", bakery: "🫓", fish: "🐟", side: "🍚", beer: "🍺",
  hot_drink: "☕", alcohol: "🥃", spirits: "🥃", sauces: "🫙", snacks: "🍟",
};

// ─── Categories that get the hot-steam effect ─────────────────────────────────
const INITIAL_HOT_CATEGORIES = new Set(["grill", "hot_dishes", "hot_dish", "soup", "khinkali"]);

const FOOTER_TEXT = {
  tagline: {
    ka: "სტაროპაბიში შეკრების დროა",
    en: "It's time to gather at StaroPub",
    ru: "Время собираться в СтароПаб",
  },
  copyright: {
    ka: "© 2026 სტაროპაბი. ყველა უფლება დაცულია.",
    en: "© 2026 StaroPub. All rights reserved.",
    ru: "© 2026 СтароПаб. Все права защищены.",
  },
};

const LANG_LABELS = { ka: "ქარ", en: "ENG", ru: "РУС" };

// ─── Theme palettes ───────────────────────────────────────────────────────────
const THEME = {
  dark: {
    appBg:          "radial-gradient(ellipse at top, #0f172a 0%, #020617 70%, #000000 100%)",
    headerBg:       "linear-gradient(180deg,rgba(15,23,42,0.98) 0%,rgba(9,13,26,0.95) 100%)",
    headerBorder:   "1px solid rgba(245,158,11,0.25)",
    cardBg:         "linear-gradient(145deg, #1e293b, #0f172a)",
    cardBorder:     "1px solid rgba(245,158,11,0.15)",
    cardName:       "#f59e0b",
    cardDesc:       "#64748b",
    tabInactiveBg:  "rgba(255,255,255,0.04)",
    tabInactiveBdr: "rgba(245,158,11,0.15)",
    tabInactiveClr: "#94a3b8",
    searchBg:       "#0b0f19",
    searchBorder:   "rgba(245,158,11,0.20)",
    searchColor:    "#f59e0b",
    searchPlaceholder: "rgba(245,158,11,0.45)",
    imgFallbackBg:  "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)",
    modalBg:        "linear-gradient(160deg,#0f172a 0%,#020617 100%)",
    modalBorder:    "rgba(245,158,11,0.22)",
    modalName:      "#ffffff",
    modalDesc:      "#94a3b8",
    modalPriceBg:   "rgba(255,255,255,0.025)",
    modalPriceBdr:  "rgba(245,158,11,0.22)",
    modalPriceLbl:  "#d97706",
    footerBg:       "linear-gradient(0deg, rgba(2,6,23,0.99) 0%, rgba(15,23,42,0.97) 100%)",
    footerBorder:   "rgba(245,158,11,0.2)",
    bodyText:       "#cbd5e1",
    brandName:      "#f59e0b",
    brandSub:       "#d97706",
    noResultsColor: "rgba(245,158,11,0.6)",
    carouselFrame:  "linear-gradient(145deg, #0f172a, #1e293b, #0f172a)",
    carouselBorder: "rgba(245,158,11,0.22)",
    carouselChip:   "rgba(245,158,11,0.18)",
    carouselChipBdr:"rgba(245,158,11,0.25)",
    carouselChipClr:"#f59e0b",
    carouselDesc:   "#94a3b8",
  },
  light: {
    appBg:          "linear-gradient(180deg, #fcfbf9 0%, #f5f0e8 100%)",
    headerBg:       "linear-gradient(180deg, rgba(252,248,240,0.98) 0%, rgba(248,243,232,0.97) 100%)",
    headerBorder:   "1px solid rgba(180,120,40,0.18)",
    cardBg:         "linear-gradient(145deg, #f4f1eb, #ede8de)",
    cardBorder:     "1px solid rgba(160,100,30,0.18)",
    cardName:       "#1c1510",
    cardDesc:       "#57534e",
    tabInactiveBg:  "rgba(0,0,0,0.04)",
    tabInactiveBdr: "rgba(160,100,30,0.2)",
    tabInactiveClr: "#78634a",
    searchBg:       "#f0ebe0",
    searchBorder:   "rgba(180,120,30,0.30)",
    searchColor:    "#1c1510",
    searchPlaceholder: "rgba(100,70,30,0.55)",
    imgFallbackBg:  "linear-gradient(135deg, #e8dcc8 0%, #d8ccb0 50%, #efe5cf 100%)",
    modalBg:        "linear-gradient(160deg,#faf7f0 0%,#f0ebe0 100%)",
    modalBorder:    "rgba(180,120,30,0.25)",
    modalName:      "#1c1510",
    modalDesc:      "#57534e",
    modalPriceBg:   "rgba(0,0,0,0.025)",
    modalPriceBdr:  "rgba(160,100,30,0.22)",
    modalPriceLbl:  "#9a7040",
    footerBg:       "linear-gradient(0deg, rgba(240,230,210,0.99) 0%, rgba(245,238,222,0.97) 100%)",
    footerBorder:   "rgba(160,100,30,0.2)",
    bodyText:       "#2b1d0c",
    brandName:      "#b86010",
    brandSub:       "#9a7040",
    noResultsColor: "rgba(140,90,30,0.65)",
    carouselFrame:  "linear-gradient(145deg, #f2ede3, #e8e0d0, #f2ede3)",
    carouselBorder: "rgba(160,100,30,0.25)",
    carouselChip:   "rgba(184,101,32,0.12)",
    carouselChipBdr:"rgba(180,110,30,0.28)",
    carouselChipClr:"#8a5020",
    carouselDesc:   "#6b5540",
  },
};

function formatPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return p;
  return `₾${n.toFixed(2)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HOT STEAM OVERLAY — pure CSS, shown only for hot categories
// ══════════════════════════════════════════════════════════════════════════════
function HotSteamOverlay() {
  return (
    <>
      <style>{`
        @keyframes steamRise0 {
          0%   { transform: translateY(0)     scaleX(1)    rotate(-2deg); opacity: 0; }
          15%  { opacity: 0.55; }
          70%  { opacity: 0.3; }
          100% { transform: translateY(-60px) scaleX(1.6)  rotate(4deg);  opacity: 0; }
        }
        @keyframes steamRise1 {
          0%   { transform: translateY(0)     scaleX(1)    rotate(3deg);  opacity: 0; }
          15%  { opacity: 0.45; }
          70%  { opacity: 0.22; }
          100% { transform: translateY(-55px) scaleX(1.8)  rotate(-5deg); opacity: 0; }
        }
        @keyframes steamRise2 {
          0%   { transform: translateY(0)     scaleX(1)    rotate(-4deg); opacity: 0; }
          15%  { opacity: 0.5; }
          70%  { opacity: 0.28; }
          100% { transform: translateY(-65px) scaleX(1.5)  rotate(6deg);  opacity: 0; }
        }
        .steam-wisp-0 { animation: steamRise0 2.2s 0.0s ease-out infinite; }
        .steam-wisp-1 { animation: steamRise1 2.6s 0.7s ease-out infinite; }
        .steam-wisp-2 { animation: steamRise2 2.0s 1.3s ease-out infinite; }
      `}</style>
      {[
        { cls: "steam-wisp-0", left: "22%",  width: 8,  height: 28 },
        { cls: "steam-wisp-1", left: "50%",  width: 6,  height: 22 },
        { cls: "steam-wisp-2", left: "74%",  width: 9,  height: 32 },
      ].map(({ cls, left, width, height }, i) => (
        <div key={i} className={cls} style={{
          position: "absolute",
          bottom: "55%",
          left,
          width,
          height,
          borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
          background: "rgba(255,255,255,0.55)",
          filter: "blur(3px)",
          pointerEvents: "none",
          zIndex: 4,
          transformOrigin: "bottom center",
        }} />
      ))}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — BEER POUR SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function MasterPourScreen({ lang = "ka", isDark = false }) {
  const pourBg = isDark
    ? "radial-gradient(ellipse at 50% 30%, #0f172a 0%, #020617 55%, #000 100%)"
    : "radial-gradient(ellipse at 50% 30%, #fdf9f2 0%, #f5eed8 55%, #ede0be 100%)";
  const titleColor    = isDark ? "#f59e0b" : "#b86010";
  const subtitleColor = isDark ? "#d97706" : "#a07840";
  const loadTextColor = isDark ? "#f59e0b" : "#8a6020";
  const taglineColor  = isDark ? "#1e293b" : "#c8a060";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: pourBg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: "background 0.3s",
    }}>
      <style>{`
        @keyframes masterFill {
          0%   { height: 0%; }
          12%  { height: 10%; }
          50%  { height: 56%; }
          80%  { height: 72%; }
          100% { height: 76%; }
        }
        .master-fill { animation: masterFill ${POUR_DURATION_MS}ms cubic-bezier(0.38,0,0.18,1) forwards; }

        @keyframes masterFoam {
          0%   { height: 0px;  bottom: 0%;  opacity: 0; }
          12%  { height: 5px;  bottom: 9%;  opacity: 0.9; }
          50%  { height: 20px; bottom: 55%; opacity: 1; }
          80%  { height: 30px; bottom: 71%; opacity: 1; }
          100% { height: 32px; bottom: 75%; opacity: 1; }
        }
        .master-foam { animation: masterFoam ${POUR_DURATION_MS}ms cubic-bezier(0.38,0,0.18,1) forwards; }

        @keyframes streamFlow {
          0%,100% { transform: scaleX(1);    }
          25%      { transform: scaleX(0.72); }
          50%      { transform: scaleX(1.08); }
          75%      { transform: scaleX(0.80); }
        }
        .stream-body { animation: streamFlow 0.52s ease-in-out infinite; transform-origin: center top; }

        @keyframes streamShimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 300%; }
        }
        .stream-shimmer {
          background: linear-gradient(
            180deg,
            #fbbf24 0%, #f59e0b 18%, #d97706 36%,
            #fbbf24 50%, #d97706 68%, #b45309 85%,
            transparent 100%
          );
          background-size: 100% 300%;
          animation: streamShimmer 0.45s linear infinite;
        }

        @keyframes bubbleRise {
          0%   { transform: translateY(0)     scale(1);   opacity: 0.8; }
          80%  { transform: translateY(-58px) scale(1.1); opacity: 0.3; }
          100% { transform: translateY(-68px) scale(0.7); opacity: 0; }
        }
        .b0 { animation: bubbleRise 2.0s 0.1s ease-in infinite; }
        .b1 { animation: bubbleRise 1.7s 0.8s ease-in infinite; }
        .b2 { animation: bubbleRise 2.3s 1.4s ease-in infinite; }
        .b3 { animation: bubbleRise 1.5s 0.4s ease-in infinite; }

        @keyframes foamBubble {
          0%,100% { transform: scale(1);   opacity: 0.9; }
          50%      { transform: scale(1.6); opacity: 0.35; }
        }
        .fb0 { animation: foamBubble 1.0s 0.00s ease-in-out infinite; }
        .fb1 { animation: foamBubble 1.0s 0.33s ease-in-out infinite; }
        .fb2 { animation: foamBubble 1.0s 0.66s ease-in-out infinite; }
        .fb3 { animation: foamBubble 1.0s 1.00s ease-in-out infinite; }

        @keyframes liquidSheen {
          0%,100% { opacity: 0.12; transform: translateX(-100%); }
          50%      { opacity: 0.30; transform: translateX(100%); }
        }
        .liquid-sheen { animation: liquidSheen 1.9s ease-in-out infinite; }

        @keyframes titleReveal {
          from { opacity: 0; letter-spacing: 6px; transform: translateY(6px); }
          to   { opacity: 1; letter-spacing: 3px; transform: translateY(0); }
        }
        .pour-title { animation: titleReveal 1.0s 0.25s ease-out both; }

        @keyframes loadGlow {
          0%,100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        .load-text { animation: loadGlow 1.8s ease-in-out infinite; }

        @keyframes twinkle {
          0%,100% { opacity: 0; transform: scale(0.3); }
          50%      { opacity: 1; transform: scale(1.3); }
        }
        .sp0 { animation: twinkle 1.9s 0.1s ease-in-out infinite; }
        .sp1 { animation: twinkle 1.9s 0.9s ease-in-out infinite; }
        .sp2 { animation: twinkle 1.9s 1.5s ease-in-out infinite; }

        @keyframes handlePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,160,60,0); }
          50%      { box-shadow: 0 0 12px 3px rgba(200,160,60,0.12); }
        }
        .tap-handle { animation: handlePulse 2.2s ease-in-out infinite; }
      `}</style>

      <div className="pour-title" style={{ color: titleColor, fontSize: 28, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "3px", marginBottom: 5, textShadow: isDark ? "0 2px 28px rgba(245,158,11,0.55)" : "none" }}>
        StaroPub
      </div>
      <div className="pour-title" style={{ color: subtitleColor, fontSize: 11, letterSpacing: "4px", marginBottom: 36, fontFamily: "'Georgia', serif", animationDelay: "0.5s" }}>
        სტაროპაბი
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="tap-handle" style={{ width: 22, height: 56, background: "linear-gradient(160deg, #4b5563 0%, #374151 40%, #1f2937 70%, #374151 100%)", borderRadius: "10px 10px 4px 4px", boxShadow: "0 4px 16px rgba(0,0,0,0.7), inset 1px 2px 4px rgba(255,255,255,0.18), inset -1px 0 3px rgba(0,0,0,0.4)", position: "relative" }}>
          {[12, 22, 32].map((top, i) => (
            <div key={i} style={{ position: "absolute", top, left: 3, right: 3, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
          ))}
          <div style={{ position: "absolute", top: 4, left: 5, width: 4, bottom: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.22), transparent)", borderRadius: 3 }} />
        </div>
        <div style={{ width: 48, height: 14, background: "linear-gradient(180deg, #6b7280 0%, #4b5563 50%, #374151 100%)", borderRadius: "4px 4px 6px 6px", boxShadow: "0 3px 10px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,255,0.2)", position: "relative" }}>
          <div style={{ position: "absolute", top: 3, left: 8, width: 12, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
          <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 16, height: 8, background: "linear-gradient(180deg, #4b5563, #2d2d2d)", borderRadius: "2px 2px 6px 6px", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
        </div>
        <div style={{ marginTop: 1, display: "flex", justifyContent: "center" }}>
          <div className="stream-body" style={{ width: 11, height: 72, borderRadius: "2px 2px 5px 5px", overflow: "hidden" }}>
            <div className="stream-shimmer" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: 130, height: 185, marginTop: -2 }}>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 110, height: 170, background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", borderRadius: "8px 8px 18px 18px", border: "2.5px solid rgba(255,255,255,0.16)", overflow: "hidden", boxShadow: "0 8px 44px rgba(0,0,0,0.75), inset 0 2px 0 rgba(255,255,255,0.1), inset -2px 0 10px rgba(0,0,0,0.2)" }}>
          <div className="master-fill" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(180deg, #d08820 0%, #b86510 35%, #9a5008 70%, #7a3c04 100%)", boxShadow: "inset 0 4px 14px rgba(255,180,30,0.2)" }}>
            <div className="liquid-sheen" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,220,100,0.38), transparent)" }} />
            {[{ left: "18%", size: 5, cls: "b0" }, { left: "48%", size: 4, cls: "b1" }, { left: "74%", size: 6, cls: "b2" }, { left: "33%", size: 3, cls: "b3" }].map(({ left, size, cls }, i) => (
              <div key={i} className={cls} style={{ position: "absolute", bottom: 4, left, width: size, height: size, background: "rgba(255,210,80,0.7)", borderRadius: "50%" }} />
            ))}
            {[{ top: "28%", left: "22%", cls: "sp0", size: 5 }, { top: "54%", left: "65%", cls: "sp1", size: 4 }, { top: "40%", left: "44%", cls: "sp2", size: 3 }].map(({ top, left, cls, size }, i) => (
              <div key={i} className={cls} style={{ position: "absolute", top, left, width: size, height: size, background: "rgba(255,230,100,0.9)", borderRadius: "50%", boxShadow: "0 0 5px rgba(255,220,80,0.8)" }} />
            ))}
          </div>
          <div className="master-foam" style={{ position: "absolute", left: -1, right: -1, background: "linear-gradient(180deg, #ffffff 0%, #f8f2e4 55%, #eeddb8 100%)", borderRadius: "6px 6px 0 0", boxShadow: "0 -2px 14px rgba(255,255,255,0.28)" }}>
            {[12, 30, 52, 74].map((left, i) => (
              <div key={i} className={`fb${i}`} style={{ position: "absolute", bottom: 3, left, width: 7, height: 7, background: "rgba(255,255,255,0.95)", borderRadius: "50%", boxShadow: "0 0 4px rgba(255,255,255,0.6)" }} />
            ))}
            {[18, 56, 88].map((left, i) => (
              <div key={i} style={{ position: "absolute", top: -3, left, width: 5, height: 8, background: "rgba(255,255,255,0.65)", borderRadius: "50% 50% 0 0" }} />
            ))}
          </div>
          <div style={{ position: "absolute", top: 0, left: 6, width: 8, bottom: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)", pointerEvents: "none" }} />
        </div>
        <div style={{ position: "absolute", right: 0, top: 28, height: 80, width: 22, border: "3px solid rgba(255,255,255,0.16)", borderLeft: "none", borderRadius: "0 14px 14px 0", boxShadow: "3px 0 10px rgba(0,0,0,0.3)" }} />
        <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 124, height: 8, background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)", borderRadius: "0 0 12px 12px", border: "1.5px solid rgba(255,255,255,0.1)", borderTop: "none" }} />
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p className="load-text" style={{ color: loadTextColor, fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "0.4px", margin: 0 }}>
          {LOADING_TEXT[lang] || LOADING_TEXT.ka}
        </p>
        <p style={{ color: taglineColor, fontSize: 10, letterSpacing: "1.5px", marginTop: 8 }}>
          StaroPub · QR მენიუ
        </p>
      </div>
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// PRICE BLOCK
// ══════════════════════════════════════════════════════════════════════════════
function parseMultiPrice(raw) {
  if (typeof raw !== "string") return null;
  if (!raw) return null;
  const lines = raw.split(/\\n|\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return lines.map(line => {
    const sizeMatch = line.match(/^([\d.,]+\s*[ლმლმ][\w]*)/u);
    const size = sizeMatch ? sizeMatch[1].trim() : "";
    const rest = sizeMatch ? line.slice(sizeMatch[0].length).trim() : line;
    const numMatch = rest.match(/([\d.,]+)/);
    const num = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : NaN;
    const priceStr = isNaN(num) ? rest : `₾${num.toFixed(2)}`;
    return { size, price: priceStr };
  });
}

function PriceBlock({ item, modal = false, th }) {
  const t = th || THEME.light;
  const multi = parseMultiPrice(item.price);
  if (multi) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: modal ? 10 : 5, width: "100%" }}>
        {multi.map(({ size, price }, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ color: modal ? t.modalPriceLbl : "#a08060", fontFamily: "'Georgia', serif", fontSize: modal ? 14 : 12, fontWeight: 600, letterSpacing: "0.3px" }}>{size}</span>
            <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: modal ? 22 : 15, fontWeight: 700 }}>{price}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: modal ? "flex-start" : "flex-end" }}>
      <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: modal ? 28 : 17, fontWeight: 700 }}>
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ITEM CARD
// ══════════════════════════════════════════════════════════════════════════════
function ItemCard({
  item, lang, onOpen, th,
  customMenuEnabled = false, selected = false, onToggleSelect = null,
  cartItems = [], onAddToCart, onUpdateQuantity,
  categoryIcons, hotCategories
}) {
  const t = th || THEME.light;
  if (!item) return null;

  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image && typeof item.image === "string" ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `Images/${item.image}`) : "";
  const category = item.category || "";
  const fallback = (categoryIcons && categoryIcons[category]) || INITIAL_CATEGORY_ICONS[category] || "🍽️";
  const isHot    = (hotCategories && hotCategories.has(category)) || INITIAL_HOT_CATEGORIES.has(category);

  const shimmerDelay = React.useMemo(
    () => `-${(Math.random() * 8).toFixed(2)}s`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id || item.name_ka]
  );

  const multi = parseMultiPrice(item.price);
  const cartEntries = cartItems.filter(x => x.dishId === item.id);
  const totalQty = cartEntries.reduce((acc, x) => acc + x.quantity, 0);

  return (
    <div
      onClick={() => onOpen && onOpen(item)}
      style={{
        background: t.cardBg, border: t.cardBorder,
        borderRadius: 12, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
        position: "relative", cursor: "pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ width: "100%", height: 160, background: t.imgFallbackBg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgSrc && (
          <img src={imgSrc} alt={name} loading="lazy"
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        )}
        <div style={{ display: imgSrc ? "none" : "flex", fontSize: 48, position: "absolute", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span>{fallback}</span>
        </div>
        {isHot && <HotSteamOverlay />}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.5))", height: 60 }} />

        {/* Custom Selection Overlay Checkbox */}
        {customMenuEnabled && onToggleSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              width: 24, height: 24, borderRadius: "50%",
              background: selected ? "linear-gradient(135deg, #b86520, #e8a030)" : "rgba(0,0,0,0.5)",
              border: `1.5px solid ${selected ? "#f0c060" : "rgba(255,255,255,0.6)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: selected ? "0 0 8px rgba(245,158,11,0.5)" : "none",
            }}
          >
            {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</span>}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px", color: t.cardName, fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3, transition: "color 0.3s" }}>{name}</h3>
        {desc && <p style={{ margin: "0 0 12px", color: t.cardDesc, fontSize: 12, lineHeight: 1.5, flex: 1, transition: "color 0.3s" }}>{desc}</p>}
        <PriceBlock item={item} th={t} />

        {/* Inline Card Cart Selector */}
        {totalQty === 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (multi) {
                onOpen && onOpen(item);
              } else {
                const priceNum = parseFloat(item.price) || 0;
                onAddToCart && onAddToCart(item, "", priceNum);
              }
            }}
            style={{
              background: "linear-gradient(135deg, #b86520, #7a3a08)",
              border: `1px solid ${t.brandName}`,
              borderRadius: 8, color: "#fff",
              padding: "8px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", marginTop: 12, transition: "all 0.2s",
              width: "100%", textAlign: "center", fontFamily: "'Georgia', serif",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            🛒 {lang === "ka" ? "კალათაში დამატება" : lang === "ru" ? "В корзину" : "Add to Cart"}
          </button>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 12, width: "100%", background: "rgba(0,0,0,0.15)",
              border: `1.5px solid ${t.brandName}`, borderRadius: 8, padding: "4px 8px",
              boxSizing: "border-box"
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (multi) {
                  const match = cartEntries[0];
                  if (match) onUpdateQuantity && onUpdateQuantity(match.id, -1);
                } else {
                  onUpdateQuantity && onUpdateQuantity(`${item.id}-default`, -1);
                }
              }}
              style={{
                background: "none", border: "none", color: t.brandName,
                fontSize: 16, fontWeight: "bold", cursor: "pointer", width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              -
            </button>
            <span style={{ fontSize: 13, fontWeight: "bold", color: t.modalName }}>
              {totalQty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (multi) {
                  const match = cartEntries[0];
                  if (match) {
                    onUpdateQuantity && onUpdateQuantity(match.id, 1);
                  } else {
                    onOpen && onOpen(item);
                  }
                } else {
                  onUpdateQuantity && onUpdateQuantity(`${item.id}-default`, 1);
                }
              }}
              style={{
                background: "none", border: "none", color: t.brandName,
                fontSize: 16, fontWeight: "bold", cursor: "pointer", width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none", zIndex: 3, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-50%", left: "-50%", width: "55%", height: "200%",
          background: "linear-gradient(135deg, transparent 20%, rgba(255,245,200,0.05) 38%, rgba(255,255,255,0.11) 50%, rgba(255,245,200,0.05) 62%, transparent 80%)",
          animation: `diagGleam 8s ${shimmerDelay} linear infinite`,
        }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DISH DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════════
function DishModal({ item, lang, onClose, th, onAddToCart, categoryIcons, categoryLabels, hotCategories }) {
  const t = th || THEME.light;
  if (!item) return null;

  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image && typeof item.image === "string" ? (item.image.startsWith("http") || item.image.startsWith("data:") ? item.image : `Images/${item.image}`) : "";
  const category = item.category || "";
  const fallback = (categoryIcons && categoryIcons[category]) || INITIAL_CATEGORY_ICONS[category] || "🍽️";
  const catObj   = (categoryLabels && categoryLabels[category]) || INITIAL_CATEGORY_LABELS[category];
  const catLabel = catObj ? catObj[lang] : category;
  const isHot    = (hotCategories && hotCategories.has(category)) || INITIAL_HOT_CATEGORIES.has(category);
  const PRICE_LABEL = { ka: "ფასი", en: "Price", ru: "Цена" };

  const multi = parseMultiPrice(item.price);
  const [selectedOpt, setSelectedOpt] = useState(multi ? multi[0] : null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes modalBdIn  { from{opacity:0} to{opacity:1} }
        @keyframes modalCardIn {
          from { opacity:0; transform:scale(0.95) translateY(14px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        .modal-close:hover { background:rgba(255,255,255,0.16)!important; color:#fff!important; }
        .modal-scroll { overflow-y:auto; max-height:90vh; }
        @media(min-width:640px){
          .modal-grid   { grid-template-columns:1fr 1fr!important; }
          .modal-img    { min-height:340px!important; }
          .modal-scroll { max-height:none; overflow-y:visible; }
          .modal-right  { overflow-y:auto; max-height:90vh; }
        }
      `}</style>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(7px)", WebkitBackdropFilter:"blur(7px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"12px", animation:"modalBdIn 0.22s ease-out" }}>
        <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:860, background: t.modalBg, border:`1px solid ${t.modalBorder}`, borderRadius:20, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,160,60,0.05)", position:"relative", animation:"modalCardIn 0.28s cubic-bezier(0.34,1.15,0.64,1)", transition:"background 0.3s" }}>
          <div className="modal-grid modal-scroll" style={{ display:"grid", gridTemplateColumns:"1fr" }}>
            {/* Image */}
            <div className="modal-img" style={{ minHeight:220, background:t.imgFallbackBg, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {imgSrc && (
                <img src={imgSrc} alt={name} loading="lazy"
                  onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                  style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}
                />
              )}
              <div style={{ display: imgSrc ? "none" : "flex", fontSize:80, position:"absolute", inset:0, flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span>{fallback}</span>
              </div>
              {/* Hot steam in modal too */}
              {isHot && <HotSteamOverlay />}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:t === THEME.dark ? "linear-gradient(transparent,rgba(2,6,23,0.88))" : "linear-gradient(transparent,rgba(240,230,210,0.88))", pointerEvents:"none" }} />
              {catLabel && (
                <div style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.62)", border:"1px solid rgba(180,120,40,0.35)", backdropFilter:"blur(8px)", borderRadius:20, padding:"4px 13px", color:"#c8a050", fontSize:11, fontWeight:600 }}>
                  {catLabel}
                </div>
              )}
            </div>
            {/* Content */}
            <div className="modal-right" style={{ padding:"28px 28px 30px", display:"flex", flexDirection:"column" }}>
              <h2 style={{ margin:"0 0 12px", color: t.modalName, fontFamily:"'Georgia',serif", fontSize:"clamp(19px,3vw,27px)", fontWeight:700, lineHeight:1.25, paddingRight:44, transition:"color 0.3s" }}>{name}</h2>
              <div style={{ height:1, background:`linear-gradient(90deg,${t.brandSub},transparent)`, marginBottom:16 }} />
              {desc ? <p style={{ margin:"0 0 22px", color: t.modalDesc, fontSize:14, lineHeight:1.75, flex:1, transition:"color 0.3s" }}>{desc}</p> : <div style={{ flex:1 }} />}
              <div style={{ padding:"16px 18px", background: t.modalPriceBg, border:`1px solid ${t.modalPriceBdr}`, borderRadius:14, marginTop:"auto" }}>
                <div style={{ color: t.modalPriceLbl, fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}>{PRICE_LABEL[lang] || "ფასი"}</div>
                {multi ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {multi.map((opt, i) => (
                      <label key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="radio"
                            name="modal-size-opt"
                            checked={selectedOpt?.size === opt.size}
                            onChange={() => setSelectedOpt(opt)}
                            style={{ accentColor: "#e8a030" }}
                          />
                          <span style={{ color: t.modalPriceLbl, fontSize: 13, fontWeight: 600 }}>{opt.size}</span>
                        </div>
                        <span style={{ color: "#e8a030", fontSize: 16, fontWeight: 700 }}>{opt.price}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <PriceBlock item={item} modal={true} th={t} />
                )}
              </div>
              <button
                onClick={() => {
                  if (multi && selectedOpt) {
                    const priceNum = parseFloat(selectedOpt.price.replace("₾", "").replace(",", ".")) || 0;
                    onAddToCart(item, selectedOpt.size, priceNum);
                  } else {
                    const priceNum = parseFloat(item.price) || 0;
                    onAddToCart(item, "", priceNum);
                  }
                  onClose();
                }}
                style={{
                  background: "linear-gradient(135deg, #b86520, #7a3a08)",
                  border: `1px solid ${t.brandName}`,
                  borderRadius: 12, color: "#fff",
                  padding: "12px 24px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  width: "100%", marginTop: 16, fontFamily: "'Georgia', serif",
                  boxShadow: "0 4px 14px rgba(184,101,32,0.4)"
                }}
              >
                🛒 {lang === "ka" ? "კალათაში დამატება" : lang === "ru" ? "Добавить в корзину" : "Add to Cart"}
              </button>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" style={{ position:"absolute", top:14, right:14, zIndex:10, width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.11)", color:"#909090", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:17, lineHeight:1, transition:"all 0.2s" }} aria-label="Close">✕</button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER
// ══════════════════════════════════════════════════════════════════════════════
function LangSwitcher({ lang, setLang, th }) {
  const t = th || THEME.light;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "rgba(180,120,40,0.10)", border: "1px solid rgba(180,120,40,0.3)", borderRadius: 8, color: "#e0b050", padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
        🌐 {LANG_LABELS[lang]}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: t === THEME.dark ? "linear-gradient(180deg, #1e293b, #0f172a)" : "linear-gradient(180deg, #faf6ec, #f0e8d4)", border: `1px solid ${t.modalBorder}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", minWidth: 90, zIndex: 200 }}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }} style={{ width: "100%", padding: "9px 14px", background: lang === code ? "rgba(184,101,32,0.25)" : "transparent", border: "none", borderBottom: "1px solid rgba(180,120,40,0.1)", color: lang === code ? t.brandName : t.tabInactiveClr, fontSize: 12, fontWeight: lang === code ? 700 : 500, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
              onMouseEnter={e => { if (lang !== code) e.target.style.background = "rgba(180,120,40,0.08)"; }}
              onMouseLeave={e => { if (lang !== code) e.target.style.background = "transparent"; }}
            >{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ABOUT-VIEW TRANSLATIONS & COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
const ABOUT_TEXT = {
  aboutUs:    { ka: "ჩვენს შესახებ",   en: "About Us",        ru: "О нас" },
  backHome:   { ka: "მთავარი გვერდი",  en: "Home",            ru: "На главную" },
  open:       { ka: "ღიაა",            en: "Open",            ru: "Открыто" },
  closed:     { ka: "დაკეტილია",       en: "Closed",          ru: "Закрыто" },
  hours:      { ka: "სამუშაო საათები:", en: "Working Hours:",  ru: "Часы работы:" },
  matchDay:   { ka: "მატჩის დღეებში პაბი მუშაობს მატჩის ბოლომდე", en: "On match days, the pub is open until the end of the match", ru: "В дни матчей паб работает до конца матча" },
  location:   { ka: "ადგილმდებარეობა", en: "Location",        ru: "Адрес" },
  phone:      { ka: "ტელეფონი",        en: "Phone",           ru: "Телефон" },
  email:      { ka: "მაილი",           en: "Email",           ru: "E-mail" },
  wolt:       { ka: "გვიპოვეთ ვოლტზე", en: "Find us on Wolt", ru: "Найдите нас на Wolt" },
};

function IconFacebook({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
}
function IconInstagram({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
}

function AboutBeerMug({ isOpen }) {
  return (
    <>
      <style>{`
        @keyframes aboutBubble { 0%{transform:translateY(0) scale(1);opacity:0.8} 80%{transform:translateY(-38px) scale(1.1);opacity:0.25} 100%{transform:translateY(-46px) scale(0.6);opacity:0} }
        @keyframes aboutFoamPulse { 0%,100%{transform:scale(1);opacity:0.9} 50%{transform:scale(1.5);opacity:0.35} }
        @keyframes aboutSheen { 0%,100%{opacity:0.1;transform:translateX(-100%)} 50%{opacity:0.28;transform:translateX(100%)} }
        @keyframes statusGlow { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.25)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .ab0{animation:aboutBubble 1.9s 0.1s ease-in infinite} .ab1{animation:aboutBubble 1.6s 0.7s ease-in infinite} .ab2{animation:aboutBubble 2.1s 1.3s ease-in infinite}
        .afb0{animation:aboutFoamPulse 1.0s 0.0s ease-in-out infinite} .afb1{animation:aboutFoamPulse 1.0s 0.33s ease-in-out infinite} .afb2{animation:aboutFoamPulse 1.0s 0.66s ease-in-out infinite}
        .about-sheen{animation:aboutSheen 2.0s ease-in-out infinite}
        .status-open{animation:statusGlow 2.0s ease-in-out infinite}
        .about-social-link:hover{background:rgba(180,120,40,0.14)!important;color:#f0c060!important;border-color:rgba(200,140,40,0.5)!important}
      `}</style>
      <div style={{ position:"relative", width:64, height:90, opacity:isOpen?1:0.35, transition:"opacity 0.5s", flexShrink:0 }}>
        <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:50, height:80, background:"linear-gradient(160deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.01) 100%)", borderRadius:"5px 5px 12px 12px", border:"2px solid rgba(255,255,255,0.14)", overflow:"hidden", boxShadow:"0 4px 18px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          {isOpen && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"72%", background:"linear-gradient(180deg,#c07818 0%,#a05808 40%,#7a3c04 100%)", boxShadow:"inset 0 3px 10px rgba(255,170,20,0.18)" }}>
              <div className="about-sheen" style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,220,100,0.32),transparent)" }} />
              {[{left:"20%",cls:"ab0"},{left:"50%",cls:"ab1"},{left:"75%",cls:"ab2"}].map(({left,cls},i) => (
                <div key={i} className={cls} style={{ position:"absolute", bottom:3, left, width:4, height:4, background:"rgba(255,210,80,0.75)", borderRadius:"50%" }} />
              ))}
            </div>
          )}
          {isOpen && (
            <div style={{ position:"absolute", left:-1, right:-1, bottom:"70%", height:14, background:"linear-gradient(180deg,#fff 0%,#f4edd8 100%)", borderRadius:"4px 4px 0 0", boxShadow:"0 -1px 8px rgba(255,255,255,0.25)" }}>
              {[6,20,36].map((left,i) => (
                <div key={i} className={`afb${i}`} style={{ position:"absolute", bottom:2, left, width:5, height:5, background:"rgba(255,255,255,0.95)", borderRadius:"50%" }} />
              ))}
            </div>
          )}
          <div style={{ position:"absolute", top:0, left:4, width:5, bottom:0, background:"linear-gradient(180deg,rgba(255,255,255,0.08),transparent)", pointerEvents:"none" }} />
        </div>
        <div style={{ position:"absolute", right:0, top:14, height:40, width:14, border:"2.5px solid rgba(255,255,255,0.13)", borderLeft:"none", borderRadius:"0 10px 10px 0" }} />
        <div style={{ position:"absolute", bottom:-3, left:"50%", transform:"translateX(-50%)", width:56, height:5, background:"rgba(255,255,255,0.06)", borderRadius:"0 0 8px 8px", border:"1px solid rgba(255,255,255,0.08)", borderTop:"none" }} />
      </div>
    </>
  );
}

function AboutView({ lang, th, aboutImage }) {
  const t      = th || THEME.light;
  const isDark = t === THEME.dark;
  const currentHour = new Date().getHours();
  const isMatchDay  = false;
  const isOpen      = isMatchDay || (currentHour >= 10 && currentHour < 23);
  const cardBg     = isDark ? "linear-gradient(145deg, #1e293b, #0f172a)" : "linear-gradient(145deg, #f4f1eb, #ede8de)";
  const cardBorder = isDark ? "rgba(245,158,11,0.15)" : "rgba(160,100,30,0.18)";
  const labelColor = isDark ? "#94a3b8" : "#9a7040";
  const valueColor = isDark ? "#f59e0b" : "#1c1510";

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"0 16px 120px" }}>
      <div style={{ width:"100%", height:220, borderRadius:"0 0 20px 20px", overflow:"hidden", background:isDark?"linear-gradient(135deg,#0f172a,#1e293b,#020617)":"linear-gradient(135deg,#e8dcc8,#d8ccb0,#efe5cf)", position:"relative", marginBottom:24 }}>
        <img src={aboutImage || "Images/staropub.webp"} alt="StaroPub" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72) 100%)" }} />
        <div style={{ position:"absolute", bottom:20, left:20 }}>
          <div style={{ color:"#f59e0b", fontSize:26, fontWeight:700, fontFamily:"'Georgia',serif", letterSpacing:"0.5px", textShadow:"0 2px 16px rgba(0,0,0,0.7)" }}>StaroPub</div>
          <div style={{ color:"rgba(245,158,11,0.65)", fontSize:11, letterSpacing:"2px" }}>სტაროპაბი</div>
        </div>
      </div>
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:"20px 22px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:30, background:isOpen?"rgba(74,222,128,0.12)":"rgba(180,40,40,0.12)", border:`1px solid ${isOpen?"rgba(74,222,128,0.35)":"rgba(180,40,40,0.35)"}`, marginBottom:12 }} className={isOpen?"status-open":""}>
              <span style={{ width:9, height:9, borderRadius:"50%", background:isOpen?"#4ade80":"#c04040", display:"inline-block", boxShadow:isOpen?"0 0 7px rgba(74,222,128,0.7)":"none" }} />
              <span style={{ fontSize:14, fontWeight:700, fontFamily:"'Georgia',serif", color:isOpen?"#4ade80":"#e06060", letterSpacing:"0.3px" }}>{ABOUT_TEXT[isOpen?"open":"closed"][lang]}</span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ color:labelColor, fontSize:11, fontWeight:600, letterSpacing:"0.5px" }}>{ABOUT_TEXT.hours[lang]}</span>
              <span style={{ color:valueColor, fontSize:15, fontWeight:700, fontFamily:"'Georgia',serif" }}>10:00 – 23:00</span>
            </div>
            <p style={{ color:isDark?"#64748b":"#9a7040", fontSize:11, lineHeight:1.55, margin:"8px 0 0" }}>{ABOUT_TEXT.matchDay[lang]}</p>
          </div>
          <AboutBeerMug isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
function SiteFooter({ lang, visible, th, currentView, setCurrentView, isAdmin }) {
  const t = th || THEME.dark;
  return (
    <footer style={{ position:"fixed", left:0, right:0, bottom:0, zIndex:50, background:t.footerBg, borderTop:`1px solid ${t.footerBorder}`, padding:"10px 24px 12px", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", transform:visible?"translateY(0)":"translateY(100%)", opacity:visible?1:0, pointerEvents:visible?"auto":"none", transition:"transform 0.32s ease-in-out, opacity 0.32s ease-in-out, background 0.3s" }}>
      <style>{`
        .footer-grid { display:grid; grid-template-columns:1fr; gap:10px; max-width:1200px; margin:0 auto; text-align:center; align-items:center; }
        @media(min-width:640px) { .footer-grid { grid-template-columns:1fr 1fr 1fr; text-align:left; gap:0; } .footer-center { text-align:center!important; } .footer-right { text-align:right!important; } }
        .footer-nav-link { color:#8a6040; text-decoration:none; font-size:12px; font-weight:600; letter-spacing:0.3px; transition:color 0.2s; cursor:pointer; background:none; border:none; padding:0; font-family:'Georgia',serif; }
        .footer-nav-link:hover { color:#f0c060; }
      `}</style>
      <div className="footer-grid">
        <div style={{ display:"flex", flexDirection:"column", gap:5, justifyContent:"center", alignItems:"center" }}>
          <button className="footer-nav-link" onClick={() => setCurrentView(currentView === "menu" ? "about" : "menu")}>
            {currentView === "menu" ? ABOUT_TEXT.aboutUs[lang] : ABOUT_TEXT.backHome[lang]}
          </button>
        </div>
        <div className="footer-center" style={{ textAlign:"center" }}>
          <div style={{ color:"#c8a050", fontSize:12, fontWeight:700, fontFamily:"'Georgia',serif", lineHeight:1.4 }}>{FOOTER_TEXT.tagline[lang]}</div>
          <div style={{ marginTop:3, color:"#4a3018", fontSize:9, letterSpacing:"1px" }}>StaroPub · სტაროპაბი · QR მენიუ</div>
        </div>

      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({
  lang, onClose, onLogout, onSaveSuccess,
  waiterCalls, setWaiterCalls,
  bannerSettings, setBannerSettings,
  customMenuEnabled, setCustomMenuEnabled,
  callWaiterEnabled, setCallWaiterEnabled,
  requestBillEnabled, setRequestBillEnabled,
  reviewFormEnabled, setReviewFormEnabled,
  reviews, setReviews,
  bgImage, setBgImage,
  aboutImage, setAboutImage,
  unavailableDishIds = [], setUnavailableDishIds,
  allItems = [], setAllItems,
  categoryOrder = [], setCategoryOrder,
  dishOrder = [], setDishOrder,
  categoryLabels, setCategoryLabels,
  categoryIcons, setCategoryIcons,
  hotCategories, setHotCategories,
  dbCategories, setDbCategories
}) {
  const [activeAdminSection, setActiveAdminSection] = useState("calls");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Save states and handler
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      if (categoryOrder.length > 0) {
        await fetch(`${API_URL}/api/categories/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: categoryOrder, order: categoryOrder }),
          credentials: "include"
        });
      }

      if (dishOrder.length > 0) {
        await fetch(`${API_URL}/api/dishes/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: dishOrder, order: dishOrder }),
          credentials: "include"
        });
      }

      await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callWaiterEnabled,
          requestBillEnabled,
          bannerSettings,
          customMenuEnabled
        }),
        credentials: "include"
      });

      if (onSaveSuccess) {
        await onSaveSuccess();
      }

      const msg = lang === "ka" ? "✓ ცვლილებები წარმატებით შენახულია!" : lang === "ru" ? "✓ Изменения успешно сохранены!" : "✓ Changes saved successfully!";
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      setToastMessage(`⚠️ ${err.message}`);
      setTimeout(() => setToastMessage(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Visual appearance settings states
  const [bgImageFile, setBgImageFile] = useState(null);
  const [aboutImageFile, setAboutImageFile] = useState(null);

  const handleUpdateBgImage = async (e) => {
    e.preventDefault();
    if (!bgImageFile) {
      alert(lang === "ka" ? "გთხოვთ აირჩიოთ ფაილი" : "Please select an image file");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("image", bgImageFile);
      const res = await fetch(`${API_URL}/api/settings/upload-bg`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${text.substring(0, 80)}`);
      }

      if (!res.ok) throw new Error(data.error || `Upload failed with status ${res.status}`);

      // Cache busting parameter
      const cacheBustUrl = getTimestampedUrl(data.bgImage);
      setBgImage(cacheBustUrl);
      setBgImageFile(null);
      alert(lang === "ka" ? "ბექგრაუნდის სურათი წარმატებით განახლდა!" : "Background image updated successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleUpdateAboutImage = async (e) => {
    e.preventDefault();
    if (!aboutImageFile) {
      alert(lang === "ka" ? "გთხოვთ აირჩიოთ ფაილი" : "Please select an image file");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("image", aboutImageFile);
      const res = await fetch(`${API_URL}/api/settings/upload-about`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${text.substring(0, 80)}`);
      }

      if (!res.ok) throw new Error(data.error || `Upload failed with status ${res.status}`);

      // Cache busting parameter
      const cacheBustUrl = getTimestampedUrl(data.aboutImage);
      setAboutImage(cacheBustUrl);
      setAboutImageFile(null);
      alert(lang === "ka" ? "ჩვენს შესახებ სურათი წარმატებით განახლდა!" : "About Us image updated successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const [selectedSortCategory, setSelectedSortCategory] = useState("");

  useEffect(() => {
    if (!selectedSortCategory && categoryOrder.length > 0) {
      setSelectedSortCategory(categoryOrder[0]);
    }
  }, [categoryOrder, selectedSortCategory]);

  // Category creation states
  const [newCatKey, setNewCatKey]   = useState("");
  const [newCatKa, setNewCatKa]     = useState("");
  const [newCatEn, setNewCatEn]     = useState("");
  const [newCatRu, setNewCatRu]     = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatImageFile, setNewCatImageFile] = useState(null);

  // Dish creation states
  const [newDishNameKa, setNewDishNameKa] = useState("");
  const [newDishNameEn, setNewDishNameEn] = useState("");
  const [newDishNameRu, setNewDishNameRu] = useState("");
  const [newDishDescKa, setNewDishDescKa] = useState("");
  const [newDishDescEn, setNewDishDescEn] = useState("");
  const [newDishDescRu, setNewDishDescRu] = useState("");
  const [newDishPrice, setNewDishPrice]   = useState("");
  const [newDishCat, setNewDishCat]       = useState("");
  const [newDishImageFile, setNewDishImageFile] = useState(null);

  useEffect(() => {
    if (!newDishCat && categoryOrder.length > 0) {
      setNewDishCat(categoryOrder[0]);
    }
  }, [categoryOrder, newDishCat]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const key = newCatKey.trim().toLowerCase();
    if (!key) return alert("გთხოვთ მიუთითოთ კატეგორიის გასაღები (მაგ: dessert)!");
    if (categoryOrder.includes(key)) return alert("კატეგორია ამ გასაღებით უკვე არსებობს!");

    const formData = new FormData();
    formData.append("id", key);
    formData.append("name_ka", newCatKa.trim() || key);
    formData.append("name_en", newCatEn.trim() || key);
    formData.append("name_ru", newCatRu.trim() || key);
    formData.append("icon", newCatIcon.trim() || "🍽️");
    formData.append("isHot", "false");
    if (newCatImageFile) {
      formData.append("image", newCatImageFile);
    }

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კატეგორიის დამატება ვერ მოხერხდა");
      }
      const createdCategory = await response.json();
      const catId = createdCategory.id || createdCategory._id;

      setDbCategories(prev => [...prev, createdCategory]);
      setCategoryOrder(prev => [...prev, catId]);
      setCategoryLabels(prev => ({
        ...prev,
        [catId]: {
          ka: createdCategory.name_ka || catId,
          en: createdCategory.name_en || catId,
          ru: createdCategory.name_ru || catId,
        }
      }));
      setCategoryIcons(prev => ({
        ...prev,
        [catId]: createdCategory.icon || "🍽️"
      }));

      setNewCatKey("");
      setNewCatKa("");
      setNewCatEn("");
      setNewCatRu("");
      setNewCatIcon("");
      setNewCatImageFile(null);
      // Try to reset file input via standard query selector or key reset
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
      if (fileInput) fileInput.value = "";

      alert("კატეგორია წარმატებით დაემატა!");
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    }
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    if (!newDishNameKa.trim()) return alert("გთხოვთ მიუთითოთ კერძის დასახელება ქართულად!");
    if (!newDishCat) return alert("გთხოვთ აირჩიოთ კერძის კატეგორია!");
    const priceNum = parseFloat(newDishPrice);
    if (isNaN(priceNum) || priceNum <= 0) return alert("გთხოვთ მიუთითოთ კერძის ფასი!");

    const formData = new FormData();
    formData.append("name_ka", newDishNameKa.trim());
    formData.append("name_en", newDishNameEn.trim() || newDishNameKa.trim());
    formData.append("name_ru", newDishNameRu.trim() || newDishNameKa.trim());
    formData.append("desc_ka", newDishDescKa.trim());
    formData.append("desc_en", newDishDescEn.trim());
    formData.append("desc_ru", newDishDescRu.trim());
    formData.append("price", `${priceNum} ₾`);
    formData.append("category", newDishCat);
    if (newDishImageFile) {
      formData.append("image", newDishImageFile);
    }

    try {
      const response = await fetch(`${API_URL}/api/dishes`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კერძის დამატება ვერ მოხერხდა");
      }
      const createdDish = await response.json();
      const dishObj = {
        ...createdDish,
        id: createdDish.id || createdDish._id
      };

      setAllItems(prev => [...prev, dishObj]);

      setNewDishNameKa("");
      setNewDishNameEn("");
      setNewDishNameRu("");
      setNewDishDescKa("");
      setNewDishDescEn("");
      setNewDishDescRu("");
      setNewDishPrice("");
      setNewDishImageFile(null);
      // Try to reset file input via standard query selector or key reset
      const fileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
      fileInputs.forEach(input => { input.value = ""; });

      alert("კერძი წარმატებით დაემატა!");
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (catKey) => {
    const labelObj = categoryLabels[catKey] || { ka: catKey };
    const label = labelObj.ka || catKey;

    const categoryDishesCount = allItems.filter(dish => dish.category === catKey).length;
    let confirmMsg = `ნამდვილად გსურთ კატეგორიის "${label}" წაშლა?`;
    if (categoryDishesCount > 0) {
      confirmMsg += `\n\nგაფრთხილება: ეს კატეგორია შეიცავს ${categoryDishesCount} კერძს. კატეგორიის წაშლით ეს კერძებიც წაიშლება!`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        const response = await fetch(`${API_URL}/api/categories/${catKey}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("კატეგორიის წაშლა ვერ მოხერხდა");
        }

        setCategoryOrder(prev => prev.filter(x => x !== catKey));
        setDbCategories(prev => prev.filter(x => (x.id || x._id) !== catKey));
        if (categoryDishesCount > 0) {
          setAllItems(prev => prev.filter(dish => dish.category !== catKey));
        }

        setCategoryLabels(prev => {
          const next = { ...prev };
          delete next[catKey];
          return next;
        });
        setCategoryIcons(prev => {
          const next = { ...prev };
          delete next[catKey];
          return next;
        });

        alert(`კატეგორია "${label}" წარმატებით წაიშალა!`);
      } catch (err) {
        alert(`შეცდომა: ${err.message}`);
      }
    }
  };

  const handleDeleteDish = async (dishId) => {
    const dish = allItems.find(x => x.id === dishId);
    if (!dish) return;
    const name = dish.name_ka || dish.name_en || "";

    if (window.confirm(`ნამდვილად გსურთ კერძის "${name}" წაშლა?`)) {
      try {
        const response = await fetch(`${API_URL}/api/dishes/${dishId}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("კერძის წაშლა ვერ მოხერხდა");
        }

        setAllItems(prev => prev.filter(x => x.id !== dishId));
        alert(`კერძი "${name}" წარმატებით წაიშალა!`);
      } catch (err) {
        alert(`შეცდომა: ${err.message}`);
      }
    }
  };

  const moveCategory = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categoryOrder.length) return;

    const newOrder = [...categoryOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIndex];
    newOrder[newIndex] = temp;

    setCategoryOrder(newOrder);

    try {
      const response = await fetch(`${API_URL}/api/categories/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newOrder, order: newOrder }),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კატეგორიების რიგითობის განახლება ვერ მოხერხდა");
      }
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
      // Revert if error
      setCategoryOrder(categoryOrder);
    }
  };

  const categoryDishes = allItems
    .filter(dish => dish.category === selectedSortCategory)
    .sort((a, b) => {
      const idxA = dishOrder.indexOf(a.id);
      const idxB = dishOrder.indexOf(b.id);
      return (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
    });

  const moveDish = async (dishId, direction) => {
    const indexInOrder = dishOrder.indexOf(dishId);
    if (indexInOrder === -1) return;
    const currentFilteredIndex = categoryDishes.findIndex(d => d.id === dishId);
    const targetFilteredIndex = currentFilteredIndex + direction;
    if (targetFilteredIndex < 0 || targetFilteredIndex >= categoryDishes.length) return;

    const targetDishId = categoryDishes[targetFilteredIndex].id;
    const targetIndexInOrder = dishOrder.indexOf(targetDishId);
    if (targetIndexInOrder === -1) return;

    const newOrder = [...dishOrder];
    const temp = newOrder[indexInOrder];
    newOrder[indexInOrder] = newOrder[targetIndexInOrder];
    newOrder[targetIndexInOrder] = temp;

    setDishOrder(newOrder);

    try {
      const response = await fetch(`${API_URL}/api/dishes/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newOrder, order: newOrder }),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("კერძების რიგითობის განახლება ვერ მოხერხდა");
      }
    } catch (err) {
      alert(`შეცდომა: ${err.message}`);
      // Revert if error
      setDishOrder(dishOrder);
    }
  };

  const bannerImages = [
    { label: "საფირმო ჩეხური ნეკნები", value: "sapirmo chexuri neknebi.jpg" },
    { label: "ღორის მწვადი", value: "goris mcvadi.jpg" },
    { label: "ღორის ნეკნები", value: "goris nekni.jpg" },
    { label: "სტაროპაბის მთავარი ფონი", value: "staropub_main.jpg" },
  ];

  return (
    <div className="admin-container">
      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          color: #f0c060;
          background: #0a0f1d;
          width: 100%;
          flex-direction: row;
          position: relative;
        }
        .admin-sidebar {
          width: 280px;
          min-width: 280px;
          border-right: 1px solid rgba(245,158,11,0.2);
          background: #060a13;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 10;
        }
        .admin-content {
          flex: 1;
          padding: 32px 40px;
          overflow-y: auto;
          background: #0a0f1d;
          width: 100%;
        }
        .admin-mobile-header {
          display: none;
        }
        .admin-sidebar-backdrop {
          display: none;
        }
        .admin-sidebar-close-btn {
          display: none;
        }
        @media (max-width: 767px) {
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1001;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 5px 0 25px rgba(0, 0, 0, 0.8);
            border-right: 1px solid rgba(245,158,11,0.3);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-sidebar-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(245,158,11,0.2);
            color: #f0c060;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1002;
          }
          .admin-content {
            padding: 80px 16px 20px;
            overflow-y: auto;
          }
          .admin-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: #060a13;
            border-bottom: 1px solid rgba(245,158,11,0.2);
            padding: 0 16px;
            z-index: 999;
          }
          .hamburger-btn {
            background: linear-gradient(135deg, #b86520, #7a3a08);
            border: 1px solid #e8a030;
            border-radius: 8px;
            color: #fff;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .admin-sidebar-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
          }
          .save-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        }
      `}</style>

      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="hamburger-btn">
          ☰ მენიუ
        </button>
        <span style={{ fontSize: 14, fontWeight: "bold", fontFamily: "'Georgia', serif", color: "#f0c060" }}>
          ადმინისტრატორი
        </span>
        <button
          onClick={handleGlobalSave}
          disabled={isSaving}
          style={{
            background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
            border: "1px solid #4ade80",
            borderRadius: 8,
            color: "#fff",
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 800,
            cursor: isSaving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          {isSaving ? <span className="save-spinner" /> : "💾"}
          {lang === "ka" ? "შენახვა" : lang === "ru" ? "Сохранить" : "Save"}
        </button>
      </div>

      {/* Dark backdrop overlay for mobile */}
      {isMobileSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <div className={`admin-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        {/* Close Button on Mobile */}
        <button className="admin-sidebar-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
          ✕
        </button>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 20, color: "#f0c060" }}>ადმინისტრატორი</h2>
          <span style={{ fontSize: 10, color: "#8a6040", letterSpacing: "1px", textTransform: "uppercase" }}>StaroPub Menu</span>
        </div>

        {/* Vertical Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {[
            { key: "calls", label: `🔔 გამოძახებები (${waiterCalls.length})` },
            { key: "banner", label: "📢 ბანერის პარამეტრები" },
            { key: "global", label: "⚙️ გლობალური პარამეტრები" },
            { key: "look", label: "🎨 საიტის იერსახის მართვა" },
            { key: "reviews", label: `💬 შეფასებები (${reviews.length})` },
            { key: "availability", label: `🚫 ხელმისაწვდომობა (${allItems.length})` },
            { key: "sorting", label: "↕️ სორტირება და რიგითობა" },
            { key: "create", label: "➕ კერძის/კატეგორიის დამატება" },
          ].map(tab => {
            const isActive = activeAdminSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveAdminSection(tab.key);
                  setIsMobileSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: isActive ? "linear-gradient(135deg, #b86520, #7a3a08)" : "rgba(255,255,255,0.03)",
                  border: isActive ? "1px solid #e8a030" : "1px solid rgba(180,120,40,0.15)",
                  borderRadius: 12,
                  color: isActive ? "#fff" : "#8a6040",
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Save, Logout and Close */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(245,158,11,0.15)", paddingTop: 16 }}>
          <button
            onClick={handleGlobalSave}
            disabled={isSaving}
            style={{
              background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: "1px solid #4ade80",
              borderRadius: 10,
              color: "#ffffff",
              padding: "10px 14px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(34,197,94,0.3)"
            }}
          >
            {isSaving ? (
              <>
                <span className="save-spinner" />
                {lang === "ka" ? "ინახება..." : lang === "ru" ? "Сохранение..." : "Saving..."}
              </>
            ) : (
              <>
                💾 {lang === "ka" ? "ცვლილებების შენახვა" : lang === "ru" ? "Сохранить изменения" : "Save Changes"}
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            სისტემიდან გამოსვლა
          </button>
          <button
            onClick={onClose}
            style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)", borderRadius: 10, color: "#f0c060", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            დახურვა
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            background: toastMessage.startsWith("⚠️") ? "rgba(220,38,38,0.95)" : "linear-gradient(135deg, #15803d, #166534)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2)",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.3s ease"
          }}>
            {toastMessage}
          </div>
        )}

        {/* Top Header Action Bar inside Admin Content */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(245,158,11,0.18)"
        }}>
          <div>
            <span style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
              {lang === "ka" ? "ადმინისტრატორის პანელი" : lang === "ru" ? "Панель администратора" : "Admin Panel"}
            </span>
            <h2 style={{ margin: "2px 0 0", fontFamily: "'Georgia', serif", fontSize: 22, color: "#f0c060", fontWeight: 700 }}>
              {activeAdminSection === "calls" && (lang === "ka" ? "🔔 გამოძახებები" : "🔔 Calls")}
              {activeAdminSection === "banner" && (lang === "ka" ? "📢 ბანერის პარამეტრები" : "📢 Banner Settings")}
              {activeAdminSection === "global" && (lang === "ka" ? "⚙️ გლობალური პარამეტრები" : "⚙️ Global Settings")}
              {activeAdminSection === "look" && (lang === "ka" ? "🎨 საიტის იერსახის მართვა" : "🎨 Appearance")}
              {activeAdminSection === "reviews" && (lang === "ka" ? "💬 შეფასებები" : "💬 Reviews")}
              {activeAdminSection === "availability" && (lang === "ka" ? "🚫 ხელმისაწვდომობა" : "🚫 Availability")}
              {activeAdminSection === "sorting" && (lang === "ka" ? "↕️ სორტირება და რიგითობა" : "↕️ Sorting & Order")}
              {activeAdminSection === "create" && (lang === "ka" ? "➕ კერძის/კატეგორიის დამატება" : "➕ Add Item/Category")}
            </h2>
          </div>

          <button
            onClick={handleGlobalSave}
            disabled={isSaving}
            style={{
              background: isSaving ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: "1px solid #4ade80",
              borderRadius: 12,
              color: "#ffffff",
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 800,
              cursor: isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
              transition: "all 0.2s ease",
              fontFamily: "'Georgia', serif",
              whiteSpace: "nowrap"
            }}
          >
            {isSaving ? (
              <>
                <span className="save-spinner" />
                {lang === "ka" ? "ინახება..." : lang === "ru" ? "Сохранение..." : "Saving..."}
              </>
            ) : (
              <>
                💾 {lang === "ka" ? "ცვლილებების შენახვა" : lang === "ru" ? "Сохранить изменения" : "Save Changes"}
              </>
            )}
          </button>
        </div>
        
        {activeAdminSection === "calls" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>მიმტანისა და ანგარიშის გამოძახება რეალურ დროში</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  const now = new Date().toLocaleTimeString();
                  setWaiterCalls(prev => [{ id: Date.now(), table: "3", type: "მიმტანი 💁‍♂️", time: now }, ...prev]);
                }}
                style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.25)", color: "#e8a030", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                + მაგიდა 3 მიმტანი (სიმულაცია)
              </button>
              <button
                onClick={() => {
                  const now = new Date().toLocaleTimeString();
                  setWaiterCalls(prev => [{ id: Date.now(), table: "5", type: "ანგარიში 🧾", time: now }, ...prev]);
                }}
                style={{ background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.25)", color: "#e8a030", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                + მაგიდა 5 ანგარიში (სიმულაცია)
              </button>
              <button
                onClick={() => setWaiterCalls([])}
                style={{ background: "rgba(180,40,40,0.1)", border: "1px solid rgba(180,40,40,0.25)", color: "#e06060", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}
              >
                ყველას წაშლა
              </button>
            </div>

            {waiterCalls.length === 0 ? (
              <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>მაგიდებიდან აქტიური გამოძახება არ არის.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {waiterCalls.map(call => (
                  <div key={call.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: 14 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: "bold" }}>მაგიდა {call.table}</span>
                      <span style={{ background: "rgba(184,101,32,0.15)", color: "#e8a030", fontSize: 11, padding: "2px 8px", borderRadius: 10, marginLeft: 10 }}>
                        {call.type === "Waiter 💁‍♂️" || call.type === "მიმტანი 💁‍♂️" ? "მიმტანი 💁‍♂️" : call.type === "Bill 🧾" || call.type === "ანგარიში 🧾" ? "ანგარიში 🧾" : call.type}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "#8a6040" }}>{call.time}</span>
                      <button
                        onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))}
                        style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                      >
                        დასრულება
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeAdminSection === "global" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 650 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontFamily: "'Georgia', serif", fontSize: 22, color: "#f0c060" }}>გლობალური პარამეტრები</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#8a6040" }}>მომსახურების ფუნქციონალისა და ღილაკების მართვა საიტზე</p>
            </div>

            {/* Call Waiter Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: "18px 22px", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#e8a030", fontWeight: 700 }}>💁‍♂️ ოფიციანტის გამოძახება</h4>
                <span style={{ fontSize: 12, color: "#8a6040", lineHeight: 1.4, display: "block" }}>სტუმრისთვის ოფიციანტის გამოძახების ფუნქციის ჩართვა/გათიშვა</span>
              </div>
              <button
                onClick={() => setCallWaiterEnabled(prev => !prev)}
                style={{
                  background: callWaiterEnabled ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(74,48,24,0.6)",
                  color: callWaiterEnabled ? "#ffffff" : "#94a3b8",
                  border: `1px solid ${callWaiterEnabled ? "#4ade80" : "rgba(180,120,40,0.3)"}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {callWaiterEnabled ? "ჩართულია ✓" : "გათიშულია ✕"}
              </button>
            </div>

            {/* Request Bill Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, padding: "18px 22px", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#e8a030", fontWeight: 700 }}>🧾 ანგარიშის მოთხოვნა</h4>
                <span style={{ fontSize: 12, color: "#8a6040", lineHeight: 1.4, display: "block" }}>სტუმრისთვის ანგარიშის მოთხოვნის ფუნქციის ჩართვა/გათიშვა</span>
              </div>
              <button
                onClick={() => setRequestBillEnabled(prev => !prev)}
                style={{
                  background: requestBillEnabled ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(74,48,24,0.6)",
                  color: requestBillEnabled ? "#ffffff" : "#94a3b8",
                  border: `1px solid ${requestBillEnabled ? "#4ade80" : "rgba(180,120,40,0.3)"}`,
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {requestBillEnabled ? "ჩართულია ✓" : "გათიშულია ✕"}
              </button>
            </div>
          </div>
        )}

        {activeAdminSection === "look" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 600 }}>
            <div>
              <h3 style={{ margin: "0 0 8px", fontFamily: "'Georgia', serif", fontSize: 22, color: "#f0c060" }}>საიტის იერსახის მართვა</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#8a6040" }}>საიტის ვიზუალური ნაწილის რედაქტირება</p>
            </div>

            {/* Block A */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 16, padding: 24 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8a030" }}>ბექგრაუნდის სურათის ატვირთვა</h4>
              <form onSubmit={handleUpdateBgImage} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBgImageFile(e.target.files[0])}
                  style={{ color: "#cbd5e1", fontSize: 13 }}
                />
                <button
                  type="submit"
                  style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #b86520, #7a3a08)", border: "1px solid #e8a030", borderRadius: 10, color: "#fff", padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
                >
                  სურათის განახლება
                </button>
              </form>
            </div>

            {/* Block B */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 16, padding: 24 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8a030" }}>ჩვენს შესახებ გვერდის ფოტო</h4>
              <form onSubmit={handleUpdateAboutImage} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAboutImageFile(e.target.files[0])}
                  style={{ color: "#cbd5e1", fontSize: 13 }}
                />
                <button
                  type="submit"
                  style={{ alignSelf: "flex-start", background: "linear-gradient(135deg, #b86520, #7a3a08)", border: "1px solid #e8a030", borderRadius: 10, color: "#fff", padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
                >
                  სურათის განახლება
                </button>
              </form>
            </div>
          </div>
        )}

        {activeAdminSection === "banner" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ margin: 0, fontFamily: "'Georgia', serif" }}>სარეკლამო ბანერის კონსტრუქტორი</h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>ბანერის ჩვენების ჩართვა</span>
              <button
                onClick={() => setBannerSettings(b => ({ ...b, enabled: !b.enabled }))}
                style={{
                  background: bannerSettings.enabled ? "#4ade80" : "#4a3018",
                  color: bannerSettings.enabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {bannerSettings.enabled ? "აქტიური" : "გათიშული"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბანერის სარეკლამო ტექსტი</label>
              <input
                type="text"
                value={bannerSettings.text}
                onChange={e => setBannerSettings(b => ({ ...b, text: e.target.value }))}
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბეიჯის სათაური</label>
              <input
                type="text"
                value={bannerSettings.badge}
                onChange={e => setBannerSettings(b => ({ ...b, badge: e.target.value }))}
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase" }}>ბანერის სურათი</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {bannerImages.map(img => (
                  <button
                    key={img.value}
                    onClick={() => setBannerSettings(b => ({ ...b, image: img.value }))}
                    style={{
                      background: bannerSettings.image === img.value ? "rgba(184,101,32,0.2)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${bannerSettings.image === img.value ? "#f0c060" : "rgba(180,120,40,0.15)"}`,
                      color: bannerSettings.image === img.value ? "#f0c060" : "#8a6040",
                      borderRadius: 8, padding: "8px 12px", fontSize: 11, cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={bannerSettings.image}
                onChange={e => setBannerSettings(b => ({ ...b, image: e.target.value }))}
                placeholder="ან ჩაწერეთ სურათის ლინკი/სახელი..."
                style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", marginTop: 8 }}
              />
            </div>
          </div>
        )}

        {activeAdminSection === "global" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontFamily: "'Georgia', serif" }}>ფუნქციების კონფიგურაცია</h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(180,120,40,0.1)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>მენიუს შერჩევა და გაზიარება</div>
                <div style={{ fontSize: 11, color: "#8a6040" }}>საშუალებას აძლევს მომხმარებლებს შეადგინონ და გააზიარონ საკუთარი მენიუ.</div>
              </div>
              <button
                onClick={() => setCustomMenuEnabled(!customMenuEnabled)}
                style={{
                  background: customMenuEnabled ? "#4ade80" : "#4a3018",
                  color: customMenuEnabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {customMenuEnabled ? "ჩართული" : "გათიშული"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold" }}>შეფასების ფორმის საჯარო ჩვენება</div>
                <div style={{ fontSize: 11, color: "#8a6040" }}>აჩვენებს ღილაკს სტუმრებისთვის შეფასების დასაწერად.</div>
              </div>
              <button
                onClick={() => setReviewFormEnabled(!reviewFormEnabled)}
                style={{
                  background: reviewFormEnabled ? "#4ade80" : "#4a3018",
                  color: reviewFormEnabled ? "#000" : "#fff",
                  border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {reviewFormEnabled ? "ხილული" : "დამალული"}
              </button>
            </div>
          </div>
        )}

        {activeAdminSection === "reviews" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>სტუმრების შეფასებების ჟურნალი</h3>
            {reviews.length === 0 ? (
              <p style={{ color: "#8a6040", textAlign: "center", margin: "40px 0" }}>სტუმრების შეფასებები ჯერ არ არის შემოსული.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {reviews.map(rev => (
                  <div key={rev.id || `${rev.date}-${rev.name}`} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: "bold", fontSize: 14 }}>{rev.name}</span>
                        <span style={{ fontSize: 11, color: "#8a6040", marginLeft: 10 }}>მაგიდა {rev.table}</span>
                      </div>
                      <div style={{ color: "#f59e0b" }}>
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p style={{ color: "#cbd5e1", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{rev.comment}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#8a6040" }}>
                      <span>{rev.date}</span>
                      <span style={{ color: "#4ade80" }}>📧 იმიტირებული იმეილი გაეგზავნა ადმინისტრატორს</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeAdminSection === "availability" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>კერძების ხელმისაწვდომობის მენეჯერი</h3>
            <p style={{ fontSize: 12, color: "#8a6040", marginBottom: 16 }}>
              გამორთეთ კერძები, რათა დროებით დამალოთ ისინი მენიუს ძირითადი ბადიდან და ყოველდღიური შემოთავაზებებიდან.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 6 }}>
              {allItems.map(dish => {
                const dishName = dish.name_ka || dish.name_en || "";
                const isAvailable = !unavailableDishIds.includes(dish.id);
                return (
                  <div key={dish.id || dish.name_ka} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: "10px 14px" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: "bold", color: isAvailable ? "#f0c060" : "#64748b" }}>{dishName}</span>
                      <span style={{ fontSize: 10, color: "#8a6040", marginLeft: 10, textTransform: "uppercase" }}>
                        {categoryLabels[dish.category]?.ka || dish.category}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUnavailableDishIds(prev =>
                          prev.includes(dish.id) ? prev.filter(id => id !== dish.id) : [...prev, dish.id]
                        );
                      }}
                      style={{
                        background: isAvailable ? "#4ade80" : "#4a3018",
                        color: isAvailable ? "#000" : "#fff",
                        border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: "bold", transition: "all 0.2s"
                      }}
                    >
                      {isAvailable ? "აქტიური" : "გათიშული"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeAdminSection === "sorting" && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif" }}>პრიორიტეტებისა და სორტირების მენეჯერი</h3>
            
            {/* Category sorting section */}
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ margin: "0 0 12px", fontFamily: "'Georgia', serif", fontSize: 16 }}>კატეგორიების რიგითობა</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "none", overflow: "visible" }}>
                {categoryOrder.map((cat, idx) => {
                  const catLabelObj = categoryLabels[cat] || { ka: cat, en: cat, ru: cat };
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: "8px 12px" }}>
                      <span style={{ fontSize: 13, fontWeight: "bold" }}>{catLabelObj.ka || cat}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => moveCategory(idx, -1)}
                          disabled={idx === 0}
                          style={{
                            background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                            borderRadius: 6, color: idx === 0 ? "#4a3018" : "#f0c060",
                            width: 32, height: 32, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                          }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveCategory(idx, 1)}
                          disabled={idx === categoryOrder.length - 1}
                          style={{
                            background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                            borderRadius: 6, color: idx === categoryOrder.length - 1 ? "#4a3018" : "#f0c060",
                            width: 32, height: 32, cursor: idx === categoryOrder.length - 1 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                          }}
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          style={{
                            background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
                            borderRadius: 6, color: "#ef4444",
                            padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                          }}
                        >
                          წაშლა
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dishes sorting section */}
            <div>
              <h4 style={{ margin: "0 0 12px", fontFamily: "'Georgia', serif", fontSize: 16 }}>კერძების რიგითობა</h4>
              
              <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6, overflow: "visible" }}>
                <label style={{ fontSize: 12, color: "#8a6040", textTransform: "uppercase", fontWeight: "bold" }}>აირჩიეთ კატეგორია</label>
                <select
                  value={selectedSortCategory}
                  onChange={e => setSelectedSortCategory(e.target.value)}
                  style={{
                    background: "#141210", border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", width: "100%", fontFamily: "'Georgia', serif",
                    colorScheme: "dark", overflow: "visible"
                  }}
                >
                  {categoryOrder.map(cat => {
                    const catLabelObj = categoryLabels[cat] || { ka: cat, en: cat, ru: cat };
                    return (
                      <option key={cat} value={cat} style={{ background: "#141210", color: "#f0c060" }}>
                        {catLabelObj.ka || cat}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 6 }}>
                {categoryDishes.length === 0 ? (
                  <p style={{ color: "#8a6040", fontSize: 12, textAlign: "center", margin: "20px 0" }}>ამ კატეგორიაში კერძები არ არის.</p>
                ) : (
                  categoryDishes.map((dish, idx) => {
                    const dishName = dish.name_ka || dish.name_en || "";
                    return (
                      <div key={dish.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(180,120,40,0.12)", borderRadius: 10, padding: "8px 12px" }}>
                        <span style={{ fontSize: 13, color: "#cbd5e1" }}>{dishName}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => moveDish(dish.id, -1)}
                            disabled={idx === 0}
                            style={{
                              background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                              borderRadius: 6, color: idx === 0 ? "#4a3018" : "#f0c060",
                              width: 32, height: 32, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveDish(dish.id, 1)}
                            disabled={idx === categoryDishes.length - 1}
                            style={{
                              background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                              borderRadius: 6, color: idx === categoryDishes.length - 1 ? "#4a3018" : "#f0c060",
                              width: 32, height: 32, cursor: idx === categoryDishes.length - 1 ? "default" : "pointer", fontSize: 12, fontWeight: "bold"
                            }}
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => handleDeleteDish(dish.id)}
                            style={{
                              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
                              borderRadius: 6, color: "#ef4444",
                              padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: "bold"
                            }}
                          >
                            წაშლა
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeAdminSection === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Form 1: Add Category */}
            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(180,120,40,0.15)", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                ➕ ახალი კატეგორიის დამატება
              </h3>
              <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>გასაღები (ID / Key)</label>
                    <input
                      type="text"
                      required
                      placeholder="მაგ: desserts"
                      value={newCatKey}
                      onChange={e => setNewCatKey(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ემოჯი / იკონი</label>
                    <input
                      type="text"
                      placeholder="მაგ: 🍰"
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (KA)</label>
                    <input
                      type="text"
                      required
                      placeholder="დესერტები"
                      value={newCatKa}
                      onChange={e => setNewCatKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (EN)</label>
                    <input
                      type="text"
                      required
                      placeholder="Desserts"
                      value={newCatEn}
                      onChange={e => setNewCatEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სახელი (RU)</label>
                    <input
                      type="text"
                      required
                      placeholder="Десерты"
                      value={newCatRu}
                      onChange={e => setNewCatRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>კატეგორიის სურათი (ატვირთვა)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewCatImageFile(e.target.files[0])}
                    style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg,#b86520,#7a3a08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#fff", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", marginTop: 8, width: "fit-content" }}
                >
                  კატეგორიის დამატება
                </button>
              </form>
            </div>

            {/* Form 2: Add Dish */}
            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(180,120,40,0.15)", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Georgia', serif", fontSize: 18, color: "#f0c060" }}>
                ➕ ახალი კერძის დამატება
              </h3>
              <form onSubmit={handleCreateDish} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (KA)</label>
                    <input
                      type="text"
                      required
                      placeholder="ჩიზქეიქი"
                      value={newDishNameKa}
                      onChange={e => setNewDishNameKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (EN)</label>
                    <input
                      type="text"
                      placeholder="Cheesecake"
                      value={newDishNameEn}
                      onChange={e => setNewDishNameEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>დასახელება (RU)</label>
                    <input
                      type="text"
                      placeholder="Чизкейк"
                      value={newDishNameRu}
                      onChange={e => setNewDishNameRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (KA)</label>
                    <input
                      type="text"
                      placeholder="კენკრის სოუსით"
                      value={newDishDescKa}
                      onChange={e => setNewDishDescKa(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (EN)</label>
                    <input
                      type="text"
                      placeholder="With berry sauce"
                      value={newDishDescEn}
                      onChange={e => setNewDishDescEn(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>აღწერა (RU)</label>
                    <input
                      type="text"
                      placeholder="С ягодным соусом"
                      value={newDishDescRu}
                      onChange={e => setNewDishDescRu(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>ფასი (₾ / ლარი)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="12.50"
                      value={newDishPrice}
                      onChange={e => setNewDishPrice(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>კატეგორია</label>
                    <select
                      value={newDishCat}
                      onChange={e => setNewDishCat(e.target.value)}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13, height: 41 }}
                    >
                      {categoryOrder.map(cat => {
                        const labelObj = categoryLabels[cat] || { ka: cat };
                        return (
                          <option key={cat} value={cat}>
                            {labelObj.ka || cat}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#8a6040", textTransform: "uppercase" }}>სურათი (ატვირთვა)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setNewDishImageFile(e.target.files[0])}
                      style={{ background: "#141210", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 10, color: "#f0c060", outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ background: "linear-gradient(135deg,#b86520,#7a3a08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#fff", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", marginTop: 8, width: "fit-content"}}
                >
                  კერძის დამატება
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function StaroPub() {
  const [lang, setLang]                 = useState("ka");
  const [allItems, setAllItems]         = useState([]);
  const [activeTab, setActiveTab]       = useState(null);
  const [error, setError]               = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  
  // RESTORE CLIENT-SIDE THEME TOGGLE
  const [isDark, setIsDark]             = useState(false);
  const [currentView, setCurrentView]   = useState("menu");

  const [categoryLabels, setCategoryLabels] = useState(INITIAL_CATEGORY_LABELS);
  const [categoryIcons, setCategoryIcons] = useState(INITIAL_CATEGORY_ICONS);
  const [hotCategories, setHotCategories] = useState(INITIAL_HOT_CATEGORIES);
  const [dbCategories, setDbCategories] = useState([]);

  // Admin and availability states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRememberMe, setAuthRememberMe] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const url = authTab === "login"
      ? `${API_URL}/api/auth/login`
      : `${API_URL}/api/auth/register`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          rememberMe: authRememberMe
        }),
        credentials: "include"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ავტორიზაცია ვერ მოხერხდა");
      }
      setIsAdmin(true);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthRememberMe(false);
      setCurrentView("admin");
      
      const u = new URL(window.location.href);
      u.searchParams.set("admin", "true");
      window.history.pushState({}, "", u.toString());
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSocialLogin = async (providerName) => {
    setAuthError("");
    try {
      let provider;
      if (providerName === "google") {
        provider = googleProvider;
      } else {
        throw new Error("Unsupported provider");
      }

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/social-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
        credentials: "include"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "სოციალური ავტორიზაცია ვერ მოხერხდა");
      }
      setIsAdmin(true);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      setCurrentView("admin");

      const u = new URL(window.location.href);
      u.searchParams.set("admin", "true");
      window.history.pushState({}, "", u.toString());
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logoTimerRef = useRef(null);

  const handleLogoPressStart = useCallback(() => {
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
    }
    logoTimerRef.current = setTimeout(() => {
      if (isAuthenticated) {
        setCurrentView("admin");
      } else {
        setAuthModalOpen(true);
      }
      logoTimerRef.current = null;
    }, 5000);
  }, [isAuthenticated]);

  const handleLogoPressEnd = useCallback(() => {
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
      logoTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (logoTimerRef.current) {
        clearTimeout(logoTimerRef.current);
      }
    };
  }, []);

  const [unavailableDishIds, setUnavailableDishIds] = useState([]);
  const [categoryOrder, setCategoryOrder]             = useState([]);
  const [dishOrder, setDishOrder]                     = useState([]);

  // Cart and checkout states
  const [cartItems, setCartItems]                     = useState([]);
  const [cartOpen, setCartOpen]                       = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen]     = useState(false);

  const addToCart = useCallback((item, size, price) => {
    const cartId = `${item.id}-${size || "default"}`;
    setCartItems(prev => {
      const idx = prev.findIndex(x => x.id === cartId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, {
        id: cartId,
        dishId: item.id,
        name_ka: item.name_ka || "",
        name_en: item.name_en || "",
        name_ru: item.name_ru || "",
        image: item.image || "",
        category: item.category || "",
        size: size || "",
        price: parseFloat(price) || 0,
        quantity: 1
      }];
    });
    showToast(lang === "ka" ? "კერძი დაემატა კალათაში!" : lang === "ru" ? "Блюдо добавлено в корзину!" : "Item added to cart!");
  }, [lang]);

  const removeFromCart = useCallback((cartId) => {
    setCartItems(prev => prev.filter(x => x.id !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId, delta) => {
    setCartItems(prev => {
      const idx = prev.findIndex(x => x.id === cartId);
      if (idx === -1) return prev;
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return prev.filter(x => x.id !== cartId);
      }
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Security fallback: if not admin, currentView cannot be admin
  useEffect(() => {
    if (currentView === "admin" && !isAdmin) {
      setCurrentView("menu");
    }
  }, [currentView, isAdmin]);

  const t = isDark ? THEME.dark : THEME.light;

  // Mobile menu drawer open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ─── Table Number Parsing ────────────────────────────────────────────────
  const tableNumber = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("table") || "1";
  }, []);

  // ─── Floating actions & dialogs state ────────────────────────────────────
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Waiter & Bill request system ───────────────────────────────────────
  const [waiterCalls, setWaiterCalls] = useState([
    { id: 1, table: "3", type: "Waiter 💁‍♂️", time: "15:20:00" },
    { id: 2, table: "2", type: "Bill 🧾", time: "15:22:15" },
  ]);

  const handleCallWaiter = () => {
    const now = new Date().toLocaleTimeString();
    const newCall = { id: Date.now(), table: tableNumber, type: "Waiter 💁‍♂️", time: now };
    setWaiterCalls(prev => [newCall, ...prev]);
    showToast(lang === "ka" ? "მოთხოვნა გაიგზავნა! ოფიციანტი მალე მოვა." : lang === "ru" ? "Запрос отправлен! Официант скоро подойдет." : "Request sent! Waiter will arrive shortly.");
    setFloatingMenuOpen(false);
  };

  const handleCallBill = () => {
    const now = new Date().toLocaleTimeString();
    const newCall = { id: Date.now(), table: tableNumber, type: "Bill 🧾", time: now };
    setWaiterCalls(prev => [newCall, ...prev]);
    showToast(lang === "ka" ? "ანგარიშის მოთხოვნა გაიგზავნა!" : lang === "ru" ? "Запрос счета отправлен!" : "Bill request sent!");
    setFloatingMenuOpen(false);
  };

  // ─── Custom selection and sharing ────────────────────────────────────────
  const [selectedDishIds, setSelectedDishIds] = useState([]);
  const [customMenuEnabled, setCustomMenuEnabled] = useState(true);
  const [callWaiterEnabled, setCallWaiterEnabled] = useState(true);
  const [requestBillEnabled, setRequestBillEnabled] = useState(true);
  const [bgImage, setBgImage] = useState("");
  const [aboutImage, setAboutImage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selection = urlParams.get("selection");
    if (selection) {
      const ids = selection.split(",").filter(Boolean);
      setSelectedDishIds(ids);
      setActiveTab("selection");
    }
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedDishIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCopyShareLink = () => {
    const idsString = selectedDishIds.join(",");
    const shareUrl = `${window.location.origin}${window.location.pathname}?selection=${idsString}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(lang === "ka" ? "ბმული კოპირებულია!" : lang === "ru" ? "Ссылка скопирована!" : "Share link copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy link: ", err);
    });
  };

  // ─── Banner Settings ─────────────────────────────────────────────────────
  const [bannerSettings, setBannerSettings] = useState({
    enabled: true,
    text: "საფირმო ჩეხური ნეკნები - 15% ფასდაკლება!",
    image: "sapirmo chexuri neknebi.jpg",
    badge: "დღის შეთავაზება",
  });

  // ─── Reviews log & modal form state ──────────────────────────────────────
  const [reviewFormEnabled, setReviewFormEnabled] = useState(true);
  const [reviews, setReviews] = useState([
    { id: 1, name: "გიორგი", rating: 5, comment: "საუკეთესო ნეკნები და ლუდია ქალაქში!", date: "2026-07-01", table: "3" },
    { id: 2, name: "Elena", rating: 4, comment: "Great atmosphere and quick service.", date: "2026-07-02", table: "5" }
  ]);
  const [tempRating, setTempRating] = useState(0);
  const [tempName, setTempName] = useState("");
  const [tempComment, setTempComment] = useState("");

  const handleSubmitReview = () => {
    if (tempRating === 0) return;
    const now = new Date().toISOString().split("T")[0];
    const newReview = {
      id: Date.now(),
      name: tempName.trim() || (lang === "ka" ? "სტუმარი" : lang === "ru" ? "Гость" : "Guest"),
      rating: tempRating,
      comment: tempComment.trim(),
      date: now,
      table: tableNumber
    };
    setReviews(prev => [newReview, ...prev]);
    console.log("Email Notification Sent to Admin: staropub25@gmail.com", {
      subject: `New Feedback from Table ${tableNumber}`,
      body: `Rating: ${newReview.rating}/5 stars\nComment: ${newReview.comment}\nDate: ${newReview.date}`
    });
    setFeedbackModalOpen(false);
    showToast(lang === "ka" ? "გმადლობთ შეფასებისთვის!" : lang === "ru" ? "Спасибо за ваш отзыв!" : "Thank you for your feedback!");
  };

  // ─── Smart footer scroll ──────────────────────────────────────────────────
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const atBottom = window.innerHeight + currentY >= document.documentElement.scrollHeight - 10;
      const atTop    = currentY <= 10;
      if (atBottom || atTop) setIsFooterVisible(true);
      else if (currentY > lastScrollY.current) setIsFooterVisible(false);
      else setIsFooterVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Phase machine: "pour" (Beer Glass animation) → "menu" ───────────────
  const [phase, setPhase] = useState("pour");
  const tabsRef     = useRef(null);

  const refreshMenuData = useCallback(async () => {
    try {
      const catRes = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
      if (catRes.ok) {
        const categoriesData = await catRes.json();
        const labels = {};
        const icons = {};
        const hot = new Set();
        categoriesData.forEach(cat => {
          const key = cat.id || cat._id;
          labels[key] = {
            ka: cat.name_ka || key,
            en: cat.name_en || key,
            ru: cat.name_ru || key,
          };
          icons[key] = cat.icon || "🍽️";
          if (cat.isHot) hot.add(key);
        });

        setCategoryLabels(labels);
        setCategoryIcons(icons);
        setHotCategories(hot);
        setDbCategories(categoriesData);
        setCategoryOrder(categoriesData.map(cat => cat.id || cat._id));
      }

      const settingsRes = await fetch(`${API_URL}/api/settings`, { credentials: "include" });
      if (settingsRes.ok) {
        const settingsMap = await settingsRes.json();
        if (settingsMap.bgImage) setBgImage(getTimestampedUrl(settingsMap.bgImage));
        if (settingsMap.aboutImage) setAboutImage(getTimestampedUrl(settingsMap.aboutImage));
        if (typeof settingsMap.callWaiterEnabled === 'boolean') setCallWaiterEnabled(settingsMap.callWaiterEnabled);
        if (typeof settingsMap.requestBillEnabled === 'boolean') setRequestBillEnabled(settingsMap.requestBillEnabled);
        if (settingsMap.bannerSettings) setBannerSettings(settingsMap.bannerSettings);
        if (typeof settingsMap.customMenuEnabled === 'boolean') setCustomMenuEnabled(settingsMap.customMenuEnabled);
      }

      const dishRes = await fetch(`${API_URL}/api/dishes`, { credentials: "include" });
      if (dishRes.ok) {
        const dishesData = await dishRes.json();
        const formattedDishes = dishesData.map(dish => ({
          ...dish,
          id: dish.id || dish._id,
        }));
        setAllItems(formattedDishes);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to refresh menu data:", err);
    }
  }, []);

  useEffect(() => {
    const startTime = Date.now();

    const fetchData = async () => {
      try {
        try {
          const meRes = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
          if (meRes.ok) {
            setIsAdmin(true);
            setIsAuthenticated(true);
          } else {
            setIsAdmin(false);
            setIsAuthenticated(false);
            setCurrentView(prev => prev === "admin" ? "menu" : prev);
          }
        } catch (meErr) {
          console.warn("Session validation failed:", meErr);
        }

        const catRes = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
        if (!catRes.ok) throw new Error("კატეგორიების ჩატვირთვა ვერ მოხერხდა");
        const categoriesData = await catRes.json();

        const dishRes = await fetch(`${API_URL}/api/dishes`, { credentials: "include" });
        if (!dishRes.ok) throw new Error("კერძების ჩატვირთვა ვერ მოხერხდა");
        const dishesData = await dishRes.json();

        const labels = {};
        const icons = {};
        const hot = new Set();
        categoriesData.forEach(cat => {
          const key = cat.id || cat._id;
          labels[key] = {
            ka: cat.name_ka || key,
            en: cat.name_en || key,
            ru: cat.name_ru || key,
          };
          icons[key] = cat.icon || "🍽️";
          if (cat.isHot) {
            hot.add(key);
          }
        });

        setCategoryLabels(labels);
        setCategoryIcons(icons);
        setHotCategories(hot);
        setDbCategories(categoriesData);

        const formattedDishes = dishesData.map(dish => ({
          ...dish,
          id: dish.id || dish._id,
        }));

        setAllItems(formattedDishes);
        setCategoryOrder(categoriesData.map(cat => cat.id || cat._id));
        setError(null);
      } catch (err) {
        setError(`შეცდომა მონაცემების ჩატვირთვისას: ${err.message}`);
      } finally {
        // Ensure the Beer Glass preloader plays for at least POUR_DURATION_MS, and until data finishes loading
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, POUR_DURATION_MS - elapsed);
        setTimeout(() => {
          setPhase("menu");
        }, remaining);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allItems.length > 0) {
      setDishOrder(prev => {
        const next = [...prev];
        allItems.forEach(dish => {
          if (!next.includes(dish.id)) {
            next.push(dish.id);
          }
        });
        return next.filter(id => allItems.some(dish => dish.id === id));
      });
    }
  }, [allItems]);

  const categories = categoryOrder;

  const items = React.useMemo(() => {
    const availableItems = allItems.filter(it => !unavailableDishIds.includes(it.id));
    const q = searchQuery.trim().toLowerCase();
    
    let filtered = [];
    if (q) {
      filtered = availableItems.filter(it =>
        (it.name_ka || "").toLowerCase().includes(q) ||
        (it.name_en || "").toLowerCase().includes(q) ||
        (it.name_ru || "").toLowerCase().includes(q)
      );
    } else if (activeTab === "selection") {
      filtered = availableItems.filter(it => selectedDishIds.includes(it.id));
    } else {
      filtered = availableItems.filter(it => !activeTab || it.category === activeTab);
    }
    
    return [...filtered].sort((a, b) => {
      const idxA = dishOrder.indexOf(a.id);
      const idxB = dishOrder.indexOf(b.id);
      return (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
    });
  }, [allItems, activeTab, searchQuery, selectedDishIds, unavailableDishIds, dishOrder]);

  const grillSpecials = React.useMemo(() => {
    const filtered = allItems.filter(d => (d.category === "grill" || d.category_ka === "გრილი") && !unavailableDishIds.includes(d.id));
    return [...filtered].sort((a, b) => {
      const idxA = dishOrder.indexOf(a.id);
      const idxB = dishOrder.indexOf(b.id);
      return (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
    });
  }, [allItems, unavailableDishIds, dishOrder]);

  const NO_RESULTS_TEXT   = { ka: "კერძი ვერ მოიძებნა", en: "No items found", ru: "Ничего не найдено" };
  const SEARCH_PLACEHOLDER = { ka: "მოძებნე კერძი...", en: "Search dish...", ru: "Найти блюдо..." };

  const scrollTab = useCallback((key) => {
    setActiveTab(key);
    if (tabsRef.current && key !== "selection") {
      const btn = tabsRef.current.querySelector(`[data-key="${key}"]`);
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const isPour = phase === "pour";
  const isMenu = phase === "menu";

  return (
    <div style={{
      minHeight: "100vh",
      background: bgImage ? `url("${bgImage}") center/cover no-repeat fixed` : t.appBg,
      fontFamily: "'Georgia','DejaVu Serif',serif",
      color: t.bodyText,
      position: "relative",
      transition: "color 0.35s, background 0.4s",
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: bgImage ? (isDark ? "rgba(8,12,24,0.75)" : "rgba(252,247,241,0.75)") : (isDark ? "rgba(8,12,24,0.92)" : "rgba(252,247,241,0.90)"),
        transition: "background 0.4s"
      }} />

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes diagGleam {
          0%   { transform:translateX(-180%) translateY(180%); opacity:0; }
          6%   { opacity:1; }
          31%  { transform:translateX(180%) translateY(-180%); opacity:1; }
          37%  { opacity:0; }
          100% { transform:translateX(180%) translateY(-180%); opacity:0; }
        }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(180,120,40,0.3); border-radius:2px; }
        .tabs-row::-webkit-scrollbar { display:none; }
        @media(min-width:768px)  { .menu-grid { grid-template-columns:repeat(4,1fr)!important; } }
        @media(min-width:1024px) { .menu-grid { grid-template-columns:repeat(5,1fr)!important; } }

        /* 3D Category grid animations */
        .category-card {
          background: ${isDark ? "linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.5))" : "linear-gradient(145deg, rgba(244,241,235,0.8), rgba(237,232,222,0.6))"};
          border: 1px solid ${isDark ? "rgba(245,158,11,0.22)" : "rgba(180,120,40,0.22)"};
          border-radius: 16px;
          padding: 0;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
        }
        .category-card:hover {
          transform: translateY(-8px) rotateX(4deg) rotateY(-4deg);
          border-color: ${isDark ? "rgba(245,158,11,0.6)" : "rgba(180,120,40,0.6)"};
          box-shadow: 0 16px 36px rgba(0,0,0,0.55), 0 0 15px rgba(245,158,11,0.15);
        }
        .category-card:hover .category-card-img {
          transform: scale(1.08) !important;
        }
        .category-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transition: all 0.6s ease;
        }
        .category-card:hover::before {
          left: 150%;
        }

        /* Floating action button animations */
        .floating-btn {
          width: 50px; height: 50px; border-radius: 50%;
          background: ${isDark ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #f4f1eb, #ede8de)"};
          border: 1px solid ${isDark ? "rgba(245,158,11,0.35)" : "rgba(180,120,40,0.35)"};
          color: ${isDark ? "#f59e0b" : "#b86010"}; display: flex; align-items: center; justify-content: center;
          font-size: 20px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .floating-btn:hover {
          transform: scale(1.08) translateY(-2px);
          border-color: ${isDark ? "rgba(245,158,11,0.7)" : "rgba(180,120,40,0.7)"};
          box-shadow: 0 8px 24px rgba(245,158,11,0.25);
        }
        .floating-label {
          position: absolute; right: 60px; background: ${isDark ? "rgba(15,23,42,0.92)" : "rgba(252,248,240,0.92)"};
          border: 1px solid ${isDark ? "rgba(245,158,11,0.3)" : "rgba(180,120,40,0.3)"}; color: ${isDark ? "#f59e0b" : "#b86010"};
          padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 700;
          white-space: nowrap; pointer-events: none; opacity: 0; transform: translateX(10px);
          transition: all 0.2s ease;
        }
        .floating-btn-wrap:hover .floating-label {
          opacity: 1; transform: translateX(0);
        }
        .floating-btn-wrap {
          display: flex; align-items: center; position: relative;
        }

        /* Desktop vs Mobile Header Controls */
        .desktop-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mobile-hamburger-btn {
          display: none;
        }

        @media (max-width: 767px) {
          .desktop-header-actions {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      {isPour && <MasterPourScreen lang={lang} isDark={isDark} />}

      {/* Header */}
      {!isPour && (
        <header style={{ position:"sticky", top:0, zIndex:100, background:t.headerBg, borderBottom:t.headerBorder, backdropFilter:"blur(12px)", padding:"0 16px", transition:"background 0.3s, border-color 0.3s" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", height:64, gap:12 }}>
            <div
              onMouseDown={handleLogoPressStart}
              onMouseUp={handleLogoPressEnd}
              onMouseLeave={handleLogoPressEnd}
              onTouchStart={handleLogoPressStart}
              onTouchEnd={handleLogoPressEnd}
              onContextMenu={e => e.preventDefault()}
              style={{ display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0, userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            >
              <img src="Images/logo.jpg" alt="StaroPub Logo" loading="lazy"
                style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}
                onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
              />
              <div style={{ display:"none", width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#c87820,#7a4010)", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}>🍺</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:t.brandName, fontSize:18, fontWeight:700, letterSpacing:"0.5px", lineHeight:1.1, transition:"color 0.3s" }}>StaroPub</div>
              <div style={{ color:t.brandSub, fontSize:10, letterSpacing:"1px", transition:"color 0.3s" }}>სტაროპაბი</div>
            </div>
            
            {/* Desktop-only Header Actions */}
            <div className="desktop-header-actions">
              {/* Shopping Cart Trigger */}
              <button onClick={() => setCartOpen(true)} title="Shopping Cart"
                style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${isDark ? "rgba(245,158,11,0.28)" : "rgba(180,120,40,0.28)"}`, color: t.brandName, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s", position: "relative" }}
                aria-label="Shopping Cart">
                🛒
                {cartItems.reduce((acc, x) => acc + x.quantity, 0) > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: "linear-gradient(135deg, #b86520, #e8a030)", color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.brandName}`, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                    {cartItems.reduce((acc, x) => acc + x.quantity, 0)}
                  </span>
                )}
              </button>


              
              {/* Restored Theme Switcher */}
              <button onClick={() => setIsDark(d => !d)} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${isDark ? "rgba(245,158,11,0.28)" : "rgba(180,120,40,0.28)"}`, color: t.brandName, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s" }}
                aria-label="Toggle theme">
                {isDark ? "☀️" : "🌙"}
              </button>
              
              <LangSwitcher lang={lang} setLang={setLang} th={t} />
            </div>

            {/* Mobile Shopping Cart Trigger */}
            <button onClick={() => setCartOpen(true)} className="mobile-hamburger-btn" style={{
              background: "none", border: "none", color: t.brandName,
              fontSize: 22, cursor: "pointer", padding: 6, lineHeight: 1, position: "relative",
              marginRight: 6
            }} aria-label="Open Cart">
              🛒
              {cartItems.reduce((acc, x) => acc + x.quantity, 0) > 0 && (
                <span style={{ position: "absolute", top: -2, right: -2, background: "linear-gradient(135deg, #b86520, #e8a030)", color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.brandName}`, boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
                  {cartItems.reduce((acc, x) => acc + x.quantity, 0)}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button onClick={() => setMobileMenuOpen(true)} className="mobile-hamburger-btn" style={{
              background: "none", border: "none", color: t.brandName,
              fontSize: 28, cursor: "pointer", padding: 6, lineHeight: 1
            }} aria-label="Open menu">
              ☰
            </button>
          </div>

          {/* Search bar - available globally in menu view */}
          {isMenu && categories.length > 0 && currentView === "menu" && (
            <div style={{ maxWidth:1200, margin:"0 auto", padding:"8px 0 4px" }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:isDark?"rgba(245,158,11,0.45)":"rgba(180,120,40,0.45)", fontSize:15, pointerEvents:"none", lineHeight:1 }}>🔍</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDER[lang]}
                  style={{ width:"100%", boxSizing:"border-box", background:t.searchBg, border:`1px solid ${t.searchBorder}`, borderRadius:12, padding:"10px 14px 10px 40px", color:t.searchColor, fontSize:14, fontFamily:"'Georgia','DejaVu Serif',serif", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s, background 0.3s, color 0.3s", caretColor:isDark?"#f59e0b":"#b86010" }}
                  onFocus={e => { e.target.style.borderColor=isDark?"rgba(245,158,11,0.55)":"rgba(180,120,40,0.55)"; e.target.style.boxShadow=isDark?"0 0 0 2px rgba(245,158,11,0.08)":"0 0 0 2px rgba(180,120,40,0.08)"; }}
                  onBlur={e =>  { e.target.style.borderColor=t.searchBorder; e.target.style.boxShadow="none"; }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:isDark?"rgba(245,158,11,0.5)":"rgba(180,120,40,0.5)", cursor:"pointer", fontSize:14, lineHeight:1, padding:2 }} aria-label="Clear search">✕</button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Category Tabs (Only shown when viewing a specific category, not on landing grid) */}
          {isMenu && categories.length > 0 && currentView === "menu" && activeTab !== null && (
            <div ref={tabsRef} className="tabs-row" style={{ display:"flex", gap:4, overflowX:"auto", padding:"8px 0 10px", maxWidth:1200, margin:"0 auto", scrollbarWidth:"none" }}>
              {categories.map(cat => {
                const catObj = categoryLabels[cat];
                const label  = catObj ? catObj[lang] : cat;
                const active = activeTab === cat;
                return (
                  <button key={cat} data-key={cat} onClick={() => scrollTab(cat)} style={{ whiteSpace:"nowrap", flexShrink:0, background:active?"linear-gradient(135deg,#b86520,#7a3a08)":t.tabInactiveBg, border:`1px solid ${active?"rgba(200,120,40,0.6)":t.tabInactiveBdr}`, color:active?"#fff":t.tabInactiveClr, borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:active?700:500, cursor:"pointer", transition:"all 0.25s", boxShadow:active?"0 2px 12px rgba(184,101,32,0.4)":"none" }}>
                    {label}
                  </button>
                );
              })}
              {customMenuEnabled && selectedDishIds.length > 0 && (
                <button data-key="selection" onClick={() => scrollTab("selection")} style={{ whiteSpace:"nowrap", flexShrink:0, background:activeTab === "selection"?"linear-gradient(135deg,#b86520,#7a3a08)":t.tabInactiveBg, border:`1px solid ${activeTab === "selection"?"rgba(200,120,40,0.6)":t.tabInactiveBdr}`, color:activeTab === "selection"?"#fff":t.tabInactiveClr, borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.25s" }}>
                  🌟 {lang === "ka" ? "ჩემი არჩევანი" : lang === "ru" ? "Мой выбор" : "My Selection"} ({selectedDishIds.length})
                </button>
              )}
            </div>
          )}
        </header>
      )}

      {/* Main Viewport */}
      {!isPour && currentView === "menu" && (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"16px 16px 112px", position:"relative", zIndex:1 }}>

          {isMenu && error && (
            <div style={{ margin:"40px auto", maxWidth:480, padding:"20px 24px", background:"rgba(180,40,40,0.12)", border:"1px solid rgba(180,40,40,0.3)", borderRadius:12, color:"#e08080", fontSize:13, lineHeight:1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {isMenu && !error && (
            <>
              {/* Dynamic Header Advertisement Banner */}
              {bannerSettings.enabled && !searchQuery && (
                <>
                  <style>{`
                    .promo-banner-wrapper {
                      position: relative;
                      width: 100%;
                      margin-top: 20px;
                      margin-bottom: 36px;
                    }
                    .promo-banner-card {
                      width: 100%;
                      height: 240px;
                      border-radius: 20px;
                      overflow: hidden;
                      position: relative;
                      box-shadow: 0 12px 36px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.12);
                      transition: all 0.3s ease;
                    }
                    .promo-banner-badge {
                      position: absolute;
                      top: 0;
                      left: 20px;
                      transform: translateY(-50%);
                      z-index: 10;
                      font-size: 11px;
                      padding: 6px 16px;
                      border-radius: 20px;
                      white-space: nowrap;
                    }
                    .promo-banner-text {
                      font-size: 18px;
                    }
                    @media(min-width: 640px) {
                      .promo-banner-badge {
                        left: 28px !important;
                        font-size: 13px !important;
                        padding: 7px 22px !important;
                      }
                      .promo-banner-card {
                        height: 320px !important;
                      }
                      .promo-banner-text {
                        font-size: 24px !important;
                      }
                    }
                    @media(min-width: 1024px) {
                      .promo-banner-card {
                        height: 380px !important;
                      }
                      .promo-banner-text {
                        font-size: 28px !important;
                      }
                    }
                  `}</style>
                  {(() => {
                    const bannerImgSrc = bannerSettings.image.startsWith("http") || bannerSettings.image.startsWith("Images")
                      ? bannerSettings.image
                      : `Images/${bannerSettings.image}`;

                    const rawBadge = bannerSettings.badge || "";
                    const rawText  = bannerSettings.text || "";

                    let activeBadge = "";
                    if (typeof rawBadge === "object" && rawBadge[lang]) {
                      activeBadge = rawBadge[lang];
                    } else if (
                      !rawBadge ||
                      rawBadge.replace(/^✦\s*/, "").trim() === "დღის შეთავაზება" ||
                      rawBadge.replace(/^✦\s*/, "").trim() === "Daily Special" ||
                      rawBadge.replace(/^✦\s*/, "").trim() === "Блюдо дня"
                    ) {
                      activeBadge = `✦ ${BANNER_DEFAULT_BADGES[lang] || BANNER_DEFAULT_BADGES.ka}`;
                    } else {
                      activeBadge = rawBadge;
                    }

                    let activeText = "";
                    if (typeof rawText === "object" && rawText[lang]) {
                      activeText = rawText[lang];
                    } else if (
                      !rawText ||
                      rawText.trim() === "საფირმო ჩეხური ნეკნები - 15% ფასდაკლება!" ||
                      rawText.trim() === "Signature Czech Ribs - 15% Off!" ||
                      rawText.trim() === "Фирменные чешские ребрышки - Скидка 15%!"
                    ) {
                      activeText = BANNER_DEFAULT_TEXTS[lang] || BANNER_DEFAULT_TEXTS.ka;
                    } else {
                      activeText = rawText;
                    }

                    return (
                      <div className="promo-banner-wrapper">
                        {/* 50% Overlapping Top Border Badge (Positioned at Start / Left) */}
                        <span className="promo-banner-badge" style={{
                          background: "linear-gradient(135deg, #b86520 0%, #e8a030 100%)",
                          color: "#fff", fontWeight: 800, letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontFamily: "'Georgia', serif", display: "inline-block",
                          boxShadow: "0 4px 14px rgba(184,101,32,0.6), 0 0 0 2px rgba(12, 10, 9, 0.8)",
                          border: `1px solid ${isDark ? "#f59e0b" : "#b86010"}`,
                        }}>
                          {activeBadge}
                        </span>

                        {/* Main Container Card */}
                        <div className="promo-banner-card" style={{
                          background: isDark ? "#060a13" : "#1a1208",
                          border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(180, 120, 40, 0.35)"}`,
                        }}>
                          {/* Ambient Blurred Background for seamless margin fill */}
                          <img
                            src={bannerImgSrc}
                            alt=""
                            style={{
                              width: "100%", height: "100%", objectFit: "cover",
                              filter: "blur(24px)", opacity: 0.5, transform: "scale(1.2)",
                              position: "absolute", inset: 0
                            }}
                            onError={e => { e.target.style.display = "none"; }}
                          />
                          {/* Main Fully Visible Banner Image */}
                          <img
                            src={bannerImgSrc}
                            alt="Promotional Banner"
                            style={{
                              width: "100%", height: "100%", objectFit: "contain",
                              position: "absolute", inset: 0, zIndex: 1
                            }}
                            onError={e => { e.target.style.display = "none"; }}
                          />
                          {/* Contrast Gradient Overlay */}
                          <div style={{
                            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.85) 100%)",
                          }} />
                          {/* Text Title Overlay */}
                          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24, zIndex: 3 }}>
                            <p className="promo-banner-text" style={{
                              color: "#fff", fontWeight: 700, margin: 0,
                              textShadow: "0 2px 8px rgba(0,0,0,0.9)", fontFamily: "'Georgia', serif",
                              letterSpacing: "0.3px", lineHeight: 1.25
                            }}>
                              {activeText}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ── LANDING VIEW: Category Grid ── */}
              {activeTab === null && !searchQuery ? (
                <>


                  {/* Grid of Categories */}
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ color: t.brandName, fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, marginBottom: 16, borderLeft: `4px solid ${t.brandSub}`, paddingLeft: 10 }}>
                      {lang === "ka" ? "კატეგორიები" : lang === "ru" ? "Категории" : "Categories"}
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      <style>{`
                        @media(min-width:640px) {
                          .categories-landing-grid { grid-template-columns: repeat(3, 1fr) !important; }
                        }
                        @media(min-width:1024px) {
                          .categories-landing-grid { grid-template-columns: repeat(4, 1fr) !important; }
                        }
                      `}</style>
                      <div className="categories-landing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, width: "100%", gridColumn: "span 2" }}>
                        {categories.map(cat => {
                          const labelObj = categoryLabels[cat] || { ka: cat, en: cat, ru: cat };
                          const icon = categoryIcons[cat] || "🍽️";
                          const count = allItems.filter(item => item.category === cat && !unavailableDishIds.includes(item.id)).length;
                          
                          const catObj = dbCategories.find(c => (c.id || c._id) === cat);
                          const catImage = catObj?.image;
                          const firstDishWithImage = allItems.find(item => item.category === cat && !unavailableDishIds.includes(item.id) && item.image);

                          let imgSrc = "";
                          if (catImage) {
                            imgSrc = catImage;
                          } else if (firstDishWithImage) {
                            const dishImg = firstDishWithImage.image;
                            imgSrc = (dishImg.startsWith("http://") || dishImg.startsWith("https://") || dishImg.startsWith("data:")) ? dishImg : `Images/${dishImg}`;
                          }

                          return (
                            <div key={cat} onClick={() => scrollTab(cat)} className="category-card">
                              {/* Top image or icon fallback */}
                              <div style={{ width: "100%", height: 110, overflow: "hidden", position: "relative", borderBottom: t.cardBorder }}>
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={labelObj[lang]}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      transition: "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
                                    }}
                                    className="category-card-img"
                                  />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: t.imgFallbackBg || "rgba(0,0,0,0.1)" }}>
                                    <span style={{ fontSize: 36 }}>{icon}</span>
                                  </div>
                                )}
                              </div>

                              {/* Bottom text block */}
                              <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
                                <span style={{ color: t.cardName || t.brandName, fontWeight: 700, fontSize: 14, lineHeight: 1.2, textAlign: "center" }}>
                                  {labelObj[lang]}
                                </span>
                                <span style={{ color: t.tabInactiveClr, fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                                  {count} {lang === "ka" ? "კერძი" : lang === "ru" ? "блюд" : "items"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {/* Custom Selection Grid Item */}
                        {customMenuEnabled && selectedDishIds.length > 0 && (
                          <div
                            onClick={() => setActiveTab("selection")}
                            className="category-card"
                            style={{
                              border: `1.5px dashed ${t.brandName}`,
                              background: "rgba(245,158,11,0.04)"
                            }}
                          >
                            {/* Top Selection Icon Wrapper */}
                            <div style={{ width: "100%", height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.08)", borderBottom: t.cardBorder }}>
                              <span style={{ fontSize: 36, animation: "badgePulse 2s infinite" }}>🌟</span>
                            </div>

                            {/* Bottom Selection Title and Count */}
                            <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
                              <span style={{ color: t.brandName, fontWeight: 700, fontSize: 14, lineHeight: 1.2, textAlign: "center" }}>
                                {lang === "ka" ? "ჩემი არჩევანი" : lang === "ru" ? "Мой выбор" : "My Selection"}
                              </span>
                              <span style={{ color: t.tabInactiveClr, fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                                {selectedDishIds.length} {lang === "ka" ? "კერძი" : lang === "ru" ? "блюд" : "items"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ── SUB-GRID VIEW: Specific Category Items or Search Results ── */
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <button
                      onClick={() => setActiveTab(null)}
                      style={{
                        background: "rgba(180,120,40,0.1)",
                        border: "1px solid rgba(180,120,40,0.3)",
                        borderRadius: 20, color: t.brandName,
                        padding: "8px 18px", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.2s", fontFamily: "'Georgia', serif"
                      }}
                      onMouseEnter={e => e.target.style.background = "rgba(180,120,40,0.2)"}
                      onMouseLeave={e => e.target.style.background = "rgba(180,120,40,0.1)"}
                    >
                      ← {lang === "ka" ? "კატეგორიები" : lang === "ru" ? "Категории" : "Categories"}
                    </button>

                    {activeTab === "selection" && (
                      <button
                        onClick={handleCopyShareLink}
                        style={{
                          background: "linear-gradient(135deg, #b86520, #7a3a08)",
                          border: `1.5px solid ${t.brandName}`,
                          borderRadius: 20, color: "#fff",
                          padding: "8px 18px", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          boxShadow: "0 4px 12px rgba(184,101,32,0.3)", transition: "all 0.2s",
                          fontFamily: "'Georgia', serif"
                        }}
                      >
                        🔗 {lang === "ka" ? "ბმულის კოპირება" : lang === "ru" ? "Скопировать ссылку" : "Copy Shared Menu Link"}
                      </button>
                    )}
                  </div>

                  {activeTab === "selection" && selectedDishIds.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: t.noResultsColor }}>
                      <span style={{ fontSize: 40, opacity: 0.5 }}>🌟</span>
                      <p style={{ marginTop: 12 }}>{lang === "ka" ? "თქვენ ჯერ არ შეგირჩევიათ კერძები" : lang === "ru" ? "Вы еще не выбрали блюда" : "You have not selected any dishes yet."}</p>
                    </div>
                  )}

                  {items.length === 0 && (activeTab !== "selection" || selectedDishIds.length > 0) ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260, gap:14, animation:"fadeIn 0.3s ease-out" }}>
                      <span style={{ fontSize:48, opacity:0.35 }}>🔍</span>
                      <p style={{ color:t.noResultsColor, fontFamily:"'Georgia','DejaVu Serif',serif", fontSize:15, fontWeight:600, letterSpacing:"0.3px", margin:0, textAlign:"center" }}>{NO_RESULTS_TEXT[lang]}</p>
                    </div>
                  ) : (
                    <div key={`${activeTab}-${searchQuery}`} className="menu-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, animation:"fadeIn 0.4s ease-out" }}>
                      {items.map((item) => (
                        <ItemCard
                          key={item.id || `${item.category}-${item.name_ka}`}
                          item={item}
                          lang={lang}
                          onOpen={setSelectedDish}
                          th={t}
                          customMenuEnabled={customMenuEnabled}
                          selected={selectedDishIds.includes(item.id)}
                          onToggleSelect={handleToggleSelect}
                          cartItems={cartItems}
                          onAddToCart={addToCart}
                          onUpdateQuantity={updateQuantity}
                          categoryIcons={categoryIcons}
                          hotCategories={hotCategories}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      )}

      {/* About View */}
      {!isPour && currentView === "about" && (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"16px 0 112px", animation:"fadeIn 0.3s ease-out", position:"relative", zIndex:1 }}>
          <AboutView lang={lang} th={t} aboutImage={aboutImage} />
        </main>
      )}

      {/* Admin Panel View */}
      {!isPour && currentView === "admin" && isAuthenticated && (
        <main style={{ width: "100%", minHeight: "100vh", animation:"fadeIn 0.3s ease-out", position:"relative", zIndex:1 }}>
          <AdminDashboard
            lang={lang}
            onClose={() => {
              setCurrentView("menu");
              const u = new URL(window.location.href);
              u.searchParams.delete("admin");
              window.history.pushState({}, "", u.toString());
            }}
            onLogout={async () => {
              try {
                await fetch(`${API_URL}/api/auth/logout`, {
                  method: "POST",
                  credentials: "include"
                });
              } catch (e) {
                console.error("Logout failed:", e);
              }
              setIsAdmin(false);
              setIsAuthenticated(false);
              setCurrentView("menu");
              const u = new URL(window.location.href);
              u.searchParams.delete("admin");
              window.history.pushState({}, "", u.toString());
            }}
            onSaveSuccess={refreshMenuData}
            waiterCalls={waiterCalls}
            setWaiterCalls={setWaiterCalls}
            bannerSettings={bannerSettings}
            setBannerSettings={setBannerSettings}
            customMenuEnabled={customMenuEnabled}
            setCustomMenuEnabled={setCustomMenuEnabled}
            callWaiterEnabled={callWaiterEnabled}
            setCallWaiterEnabled={setCallWaiterEnabled}
            requestBillEnabled={requestBillEnabled}
            setRequestBillEnabled={setRequestBillEnabled}
            reviewFormEnabled={reviewFormEnabled}
            setReviewFormEnabled={setReviewFormEnabled}
            reviews={reviews}
            setReviews={setReviews}
            bgImage={bgImage}
            setBgImage={setBgImage}
            aboutImage={aboutImage}
            setAboutImage={setAboutImage}
            unavailableDishIds={unavailableDishIds}
            setUnavailableDishIds={setUnavailableDishIds}
            allItems={allItems}
            setAllItems={setAllItems}
            categoryOrder={categoryOrder}
            setCategoryOrder={setCategoryOrder}
            dishOrder={dishOrder}
            setDishOrder={setDishOrder}
            categoryLabels={categoryLabels}
            setCategoryLabels={setCategoryLabels}
            categoryIcons={categoryIcons}
            setCategoryIcons={setCategoryIcons}
            hotCategories={hotCategories}
            setHotCategories={setHotCategories}
            dbCategories={dbCategories}
            setDbCategories={setDbCategories}
          />
        </main>
      )}

      {!isPour && <SiteFooter lang={lang} visible={isFooterVisible} th={t} currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />}

      {/* Dish Detail Modal */}
      {selectedDish && (
        <DishModal
          item={selectedDish}
          lang={lang}
          onClose={() => setSelectedDish(null)}
          th={t}
          onAddToCart={addToCart}
          categoryIcons={categoryIcons}
          categoryLabels={categoryLabels}
          hotCategories={hotCategories}
        />
      )}

      {/* ── SERVICE REQUESTS FLOATING WIDGET ── */}
      {!isPour && (callWaiterEnabled || requestBillEnabled || reviewFormEnabled) && (
        <div style={{ position: "fixed", bottom: 90, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {floatingMenuOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6, animation: "fadeIn 0.2s ease-out" }}>
              {callWaiterEnabled && (
                <div className="floating-btn-wrap">
                  <span className="floating-label">{lang === "ka" ? "ოფიციანტის გამოძახება" : lang === "ru" ? "Вызвать официанта" : "Request Waiter"}</span>
                  <button onClick={handleCallWaiter} className="floating-btn">💁‍♂️</button>
                </div>
              )}
              {requestBillEnabled && (
                <div className="floating-btn-wrap">
                  <span className="floating-label">{lang === "ka" ? "ანგარიშის მოთხოვნა" : lang === "ru" ? "Попросить счет" : "Request Bill"}</span>
                  <button onClick={handleCallBill} className="floating-btn">🧾</button>
                </div>
              )}
              {reviewFormEnabled && (
                <div className="floating-btn-wrap">
                  <span className="floating-label">{lang === "ka" ? "შეფასების დატოვება" : lang === "ru" ? "Оставить отзыв" : "Write Review"}</span>
                  <button onClick={() => { setFeedbackModalOpen(true); setTempRating(0); setTempName(""); setTempComment(""); setFloatingMenuOpen(false); }} className="floating-btn">✍️</button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setFloatingMenuOpen(!floatingMenuOpen)} className="floating-btn" style={{ width: 56, height: 56, fontSize: 24, background: "linear-gradient(135deg, #b86520, #7a3a08)", border: `1px solid ${t.brandName}`, color: "#fff" }}>
            🛎️
          </button>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #b86520, #7a3a08)",
          border: "1px solid rgba(250, 190, 80, 0.4)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 10px rgba(245,158,11,0.2)",
          color: "#fff", padding: "12px 24px", borderRadius: 30, zIndex: 10000,
          fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif",
          animation: "fadeIn 0.2s ease-out", pointerEvents: "none",
          textAlign: "center", whiteSpace: "nowrap"
        }}>
          {toast}
        </div>
      )}

      {/* ── ADMIN AUTH MODAL FORM ── */}
      {authModalOpen && (
        <div onClick={() => setAuthModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: isDark ? "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" : "linear-gradient(160deg, #faf7f0 0%, #ede8de 100%)", border: `1px solid ${t.modalBorder}`, borderRadius: 24, padding: "28px 24px", boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }}>
            
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)", padding: 4, borderRadius: 12 }}>
              <button
                onClick={() => { setAuthTab("login"); setAuthError(""); }}
                style={{ flex: 1, background: authTab === "login" ? "linear-gradient(135deg, #b86520, #7a3a08)" : "none", border: "none", color: authTab === "login" ? "#fff" : t.bodyText, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold", transition: "all 0.2s" }}
              >
                შესვლა
              </button>
              <button
                onClick={() => { setAuthTab("register"); setAuthError(""); }}
                style={{ flex: 1, background: authTab === "register" ? "linear-gradient(135deg, #b86520, #7a3a08)" : "none", border: "none", color: authTab === "register" ? "#fff" : t.bodyText, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold", transition: "all 0.2s" }}
              >
                რეგისტრაცია
              </button>
            </div>

            <h3 style={{ margin: "0 0 8px", color: t.brandName, fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
              {authTab === "login" ? "ადმინისტრატორის ავტორიზაცია" : "ადმინისტრატორის რეგისტრაცია"}
            </h3>
            
            {authError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, padding: 10, color: "#f87171", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: t.tabInactiveClr, textTransform: "uppercase", fontWeight: "bold" }}>ელ-ფოსტა</label>
                <input
                  type="email"
                  required
                  placeholder="admin@staropub.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  style={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${t.modalBorder}`, borderRadius: 10, padding: 12, color: t.bodyText, outline: "none", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: t.tabInactiveClr, textTransform: "uppercase", fontWeight: "bold" }}>პაროლი</label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  style={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${t.modalBorder}`, borderRadius: 10, padding: 12, color: t.bodyText, outline: "none", fontSize: 13 }}
                />
              </div>

              {authTab === "login" && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: t.bodyText, margin: "4px 0" }}>
                  <input
                    type="checkbox"
                    checked={authRememberMe}
                    onChange={e => setAuthRememberMe(e.target.checked)}
                    style={{ accentColor: "#e8a030", width: 15, height: 15 }}
                  />
                  დამიმახსოვრე (30 დღე)
                </label>
              )}

              <button
                type="submit"
                style={{ background: "linear-gradient(135deg, #b86520, #7a3a08)", border: `1px solid ${t.brandName}`, borderRadius: 12, color: "#fff", padding: "12px 16px", cursor: "pointer", fontSize: 14, fontWeight: "bold", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(184,101,32,0.3)" }}
              >
                {authTab === "login" ? "შესვლა" : "რეგისტრაცია"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
              <span style={{ fontSize: 11, color: t.tabInactiveClr, textTransform: "uppercase" }}>ან</span>
              <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
            </div>

            {/* Social Logins */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => handleSocialLogin("google")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: isDark ? "#0f172a" : "#fff", border: "1px solid rgba(220,38,38,0.25)", color: isDark ? "#cbd5e1" : "#1e293b", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
              >
                <span style={{ color: "#ea4335", fontSize: 16 }}>🔴</span> Google-ით შესვლა
              </button>
            </div>
            
            <button
              onClick={() => { setAuthModalOpen(false); setAuthError(""); }}
              style={{ background: "none", border: "none", color: t.tabInactiveClr, display: "block", margin: "20px auto 0", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              გაუქმება
            </button>

          </div>
        </div>
      )}

      {/* ── REVIEW / FEEDBACK MODAL FORM ── */}
      {feedbackModalOpen && (
        <div onClick={() => setFeedbackModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: isDark ? "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" : "linear-gradient(160deg, #faf7f0 0%, #ede8de 100%)", border: `1px solid ${t.modalBorder}`, borderRadius: 20, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h3 style={{ margin: "0 0 16px", color: t.brandName, fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700 }}>
              {lang === "ka" ? "დატოვე შეფასება" : lang === "ru" ? "Оставить отзыв" : "Leave a Feedback"}
            </h3>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${t.brandSub}, transparent)`, marginBottom: 20 }} />
            
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: t.tabInactiveClr, fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
                {lang === "ka" ? "შეფასება" : lang === "ru" ? "Рейтинг" : "Rating"}
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setTempRating(star)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, padding: 0, color: star <= tempRating ? "#f59e0b" : "rgba(255,255,255,0.15)", transition: "color 0.15s" }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: t.tabInactiveClr, fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
                {lang === "ka" ? "სახელი (არასავალდებულო)" : lang === "ru" ? "Имя (необязательно)" : "Name (Optional)"}
              </label>
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder={lang === "ka" ? "სტუმარი" : lang === "ru" ? "Гость" : "Guest"}
                style={{ background: isDark ? "#0b0f19" : "#f0ebe0", border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: 10, color: t.brandName, outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: t.tabInactiveClr, fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
                {lang === "ka" ? "კომენტარი" : lang === "ru" ? "Комментарий" : "Comment"}
              </label>
              <textarea
                value={tempComment}
                onChange={e => setTempComment(e.target.value)}
                rows={4}
                placeholder={lang === "ka" ? "გაგვიზიარეთ თქვენი აზრი..." : lang === "ru" ? "Поделитесь вашим мнением..." : "Share your feedback..."}
                style={{ background: isDark ? "#0b0f19" : "#f0ebe0", border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: 10, color: t.brandName, outline: "none", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                style={{ background: "none", border: "none", color: t.tabInactiveClr, fontSize: 14, cursor: "pointer", fontWeight: 600 }}
              >
                {lang === "ka" ? "გაუქმება" : lang === "ru" ? "Отмена" : "Cancel"}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={tempRating === 0}
                style={{
                  background: tempRating === 0 ? "rgba(180,120,40,0.15)" : "linear-gradient(135deg, #b86520, #7a3a08)",
                  border: `1px solid ${t.brandName}`,
                  borderRadius: 12, color: tempRating === 0 ? "rgba(255,255,255,0.3)" : "#fff",
                  padding: "10px 22px", fontSize: 14, fontWeight: 700,
                  cursor: tempRating === 0 ? "default" : "pointer", transition: "all 0.2s"
                }}
              >
                {lang === "ka" ? "გაგზავნა" : lang === "ru" ? "Отправить" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE NAVIGATION DRAWER ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1200,
        visibility: mobileMenuOpen ? "visible" : "hidden",
        pointerEvents: mobileMenuOpen ? "auto" : "none",
        transition: "visibility 0.3s"
      }}>
        {/* Backdrop overlay */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            opacity: mobileMenuOpen ? 1 : 0,
            transition: "opacity 0.3s ease",
            backdropFilter: "blur(6px)"
          }}
        />
        {/* Drawer panel */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "280px", maxWidth: "85%",
          background: t.modalBg,
          borderLeft: t.modalBorder,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          padding: "24px",
          display: "flex", flexDirection: "column", gap: 24,
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backdropFilter: "blur(20px)"
        }}>
          {/* Drawer header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: t.brandName, fontWeight: "bold" }}>
              StaroPub
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: "none", border: "none", color: t.bodyText, fontSize: 20, cursor: "pointer" }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${t.brandSub}, transparent)` }} />

          {/* Primary Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              onClick={() => { setCurrentView("menu"); setActiveTab(null); setMobileMenuOpen(false); }}
              style={{ background: "none", border: "none", color: currentView === "menu" ? t.brandName : t.bodyText, fontSize: 16, fontWeight: "bold", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Georgia', serif" }}
            >
              🍽️ {lang === "ka" ? "მენიუ" : lang === "ru" ? "Меню" : "Menu"}
            </button>
            <button
              onClick={() => { setCurrentView("about"); setMobileMenuOpen(false); }}
              style={{ background: "none", border: "none", color: currentView === "about" ? t.brandName : t.bodyText, fontSize: 16, fontWeight: "bold", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Georgia', serif" }}
            >
              ℹ️ {lang === "ka" ? "ჩვენს შესახებ" : lang === "ru" ? "О нас" : "About Us"}
            </button>

          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />

          {/* Language Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 11, color: t.tabInactiveClr, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>
              {lang === "ka" ? "ენა" : lang === "ru" ? "Язык" : "Language"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8,
                    background: lang === code ? (isDark ? "rgba(245,158,11,0.15)" : "rgba(180,120,40,0.15)") : "rgba(0,0,0,0.03)",
                    border: `1.5px solid ${lang === code ? t.brandName : "rgba(180,120,40,0.15)"}`,
                    color: lang === code ? t.brandName : t.tabInactiveClr,
                    fontSize: 12, fontWeight: "bold", cursor: "pointer"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 11, color: t.tabInactiveClr, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>
              {lang === "ka" ? "თემა" : lang === "ru" ? "Тема" : "Theme"}
            </span>
            <button
              onClick={() => setIsDark(prev => !prev)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "10px", borderRadius: 8,
                background: "rgba(0,0,0,0.03)",
                border: `1.5px solid ${t.brandName}`,
                color: t.brandName, fontSize: 13, fontWeight: "bold", cursor: "pointer"
              }}
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* ── SHOPPING CART DRAWER ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1300,
        visibility: cartOpen ? "visible" : "hidden",
        pointerEvents: cartOpen ? "auto" : "none",
        transition: "visibility 0.3s"
      }}>
        {/* Backdrop overlay */}
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            opacity: cartOpen ? 1 : 0,
            transition: "opacity 0.3s ease",
            backdropFilter: "blur(6px)"
          }}
        />
        {/* Cart Drawer panel */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "380px", maxWidth: "90%",
          background: t.modalBg,
          borderLeft: t.modalBorder,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          padding: "24px 20px",
          display: "flex", flexDirection: "column",
          transform: cartOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backdropFilter: "blur(20px)",
          boxSizing: "border-box"
        }}>
          {/* Cart Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: 19, color: t.brandName, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}>
              🛒 {lang === "ka" ? "კალათა" : lang === "ru" ? "Корзина" : "Shopping Cart"}
            </span>
            <button
              onClick={() => setCartOpen(false)}
              style={{ background: "none", border: "none", color: t.bodyText, fontSize: 20, cursor: "pointer" }}
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${t.brandSub}, transparent)`, marginBottom: 20 }} />

          {/* Cart items list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
            {cartItems.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12, opacity: 0.5 }}>
                <span style={{ fontSize: 44 }}>🛒</span>
                <span style={{ fontSize: 13, fontFamily: "'Georgia', serif" }}>
                  {lang === "ka" ? "კალათა ცარიელია" : lang === "ru" ? "Корзина пуста" : "Your cart is empty"}
                </span>
              </div>
            ) : (
              cartItems.map((cItem) => {
                const title = cItem[`name_${lang}`] || cItem.name_ka || "";
                const imgPath = cItem.image ? (cItem.image.startsWith("http") || cItem.image.startsWith("data:") ? cItem.image : `Images/${cItem.image}`) : "";
                const fallbackIcon = categoryIcons[cItem.category] || INITIAL_CATEGORY_ICONS[cItem.category] || "🍽️";
                return (
                  <div key={cItem.id} style={{ display: "flex", gap: 10, background: "rgba(0,0,0,0.14)", border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: 10, position: "relative" }}>
                    {/* Item Image thumbnail */}
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: t.imgFallbackBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {imgPath ? (
                        <img src={imgPath} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 22 }}>{fallbackIcon}</span>
                      )}
                    </div>
                    {/* Item info */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold", color: t.modalName, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {title}
                      </span>
                      {cItem.size && (
                        <span style={{ fontSize: 10, color: t.brandSub, textTransform: "uppercase", fontWeight: 700 }}>
                          {cItem.size}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: "#e8a030", fontWeight: "bold" }}>
                        ₾{(cItem.price * cItem.quantity).toFixed(2)}
                      </span>
                    </div>
                    {/* Quantity controls & Delete */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                      <button
                        onClick={() => removeFromCart(cItem.id)}
                        style={{ background: "none", border: "none", color: "#e06060", cursor: "pointer", fontSize: 14, padding: 0 }}
                        title="Delete"
                      >
                        ✕
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 6px" }}>
                        <button
                          onClick={() => updateQuantity(cItem.id, -1)}
                          style={{ background: "none", border: "none", color: t.brandName, cursor: "pointer", fontSize: 13, fontWeight: "bold", padding: 0 }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: "bold", minWidth: 14, textAlign: "center" }}>
                          {cItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cItem.id, 1)}
                          style={{ background: "none", border: "none", color: t.brandName, cursor: "pointer", fontSize: 13, fontWeight: "bold", padding: 0 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 16 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: t.tabInactiveClr, fontWeight: "bold" }}>
                  {lang === "ka" ? "ჯამური ფასი:" : lang === "ru" ? "Итого:" : "Total Price:"}
                </span>
                <span style={{ fontSize: 22, color: "#e8a030", fontWeight: "bold" }}>
                  ₾{cartItems.reduce((acc, x) => acc + x.price * x.quantity, 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={clearCart}
                  style={{
                    flex: 1, background: "rgba(180,40,40,0.1)", border: "1px solid rgba(180,40,40,0.3)",
                    borderRadius: 12, color: "#e06060", padding: "12px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {lang === "ka" ? "გასუფთავება" : lang === "ru" ? "Очистить" : "Clear"}
                </button>
                <button
                  onClick={() => {
                    setCheckoutModalOpen(true);
                    setCartOpen(false);
                  }}
                  style={{
                    flex: 2, background: "linear-gradient(135deg, #b86520, #7a3a08)", border: `1px solid ${t.brandName}`,
                    borderRadius: 12, color: "#fff", padding: "12px", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(184,101,32,0.4)"
                  }}
                >
                  {lang === "ka" ? "შეკვეთა" : lang === "ru" ? "Оформить заказ" : "Order Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHECKOUT SUMMARY DIALOG ── */}
      {checkoutModalOpen && (
        <div onClick={() => setCheckoutModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: isDark ? "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" : "linear-gradient(160deg, #faf7f0 0%, #ede8de 100%)", border: `1px solid ${t.modalBorder}`, borderRadius: 20, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h3 style={{ margin: "0 0 12px", color: t.brandName, fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700 }}>
              {lang === "ka" ? "შეკვეთის დეტალები" : lang === "ru" ? "Детали заказа" : "Order Summary"}
            </h3>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${t.brandSub}, transparent)`, marginBottom: 16 }} />
            
            <p style={{ margin: "0 0 14px", fontSize: 13, color: t.modalDesc }}>
              {lang === "ka" ? `მაგიდა: #${tableNumber}` : lang === "ru" ? `Стол: #${tableNumber}` : `Table: #${tableNumber}`}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto", marginBottom: 20, background: "rgba(0,0,0,0.1)", borderRadius: 10, padding: 12 }}>
              {cartItems.map(item => {
                const title = item[`name_${lang}`] || item.name_ka || "";
                return (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "bold" }}>{title}</span>
                      {item.size && <span style={{ fontSize: 10, color: t.brandSub }}>{item.size}</span>}
                    </div>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {item.quantity} x ₾{item.price.toFixed(2)} = ₾{(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, fontWeight: "bold", fontSize: 16 }}>
              <span>{lang === "ka" ? "სულ გადასახდელი:" : lang === "ru" ? "Итого к оплате:" : "Grand Total:"}</span>
              <span style={{ color: "#e8a030", fontSize: 19 }}>
                ₾{cartItems.reduce((acc, x) => acc + x.price * x.quantity, 0).toFixed(2)}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => {
                  const orderStr = cartItems.map(item => {
                    const title = item[`name_${lang}`] || item.name_ka || "";
                    const sizeStr = item.size ? ` (${item.size})` : "";
                    return `- ${title}${sizeStr} x${item.quantity}: ₾${(item.quantity * item.price).toFixed(2)}`;
                  }).join("\n");
                  const totalStr = cartItems.reduce((acc, x) => acc + x.price * x.quantity, 0).toFixed(2);
                  const fullText = `StaroPub Order Summary\nTable: #${tableNumber}\n\nItems:\n${orderStr}\n\nGrand Total: ₾${totalStr}`;
                  
                  navigator.clipboard.writeText(fullText).then(() => {
                    showToast(lang === "ka" ? "შეკვეთა კოპირებულია!" : lang === "ru" ? "Заказ скопирован!" : "Order copied to clipboard!");
                  });
                }}
                style={{
                  background: "rgba(180,120,40,0.1)", border: "1px solid rgba(180,120,40,0.3)",
                  borderRadius: 12, color: t.brandName, padding: "10px 18px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                📋 {lang === "ka" ? "შეკვეთის კოპირება" : lang === "ru" ? "Скопировать заказ" : "Copy Order Text"}
              </button>
              <button
                onClick={() => {
                  const orderStr = cartItems.map(item => {
                    const title = item[`name_${lang}`] || item.name_ka || "";
                    const sizeStr = item.size ? ` (${item.size})` : "";
                    return `- ${title}${sizeStr} x${item.quantity}: ₾${(item.quantity * item.price).toFixed(2)}`;
                  }).join("\n");
                  const totalStr = cartItems.reduce((acc, x) => acc + x.price * x.quantity, 0).toFixed(2);
                  const fullText = `StaroPub Order\nTable: #${tableNumber}\n\n${orderStr}\n\nTotal: ₾${totalStr}`;
                  
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, "_blank");
                  clearCart();
                  setCheckoutModalOpen(false);
                }}
                style={{
                  background: "linear-gradient(135deg, #b86520, #7a3a08)", border: `1px solid ${t.brandName}`,
                  borderRadius: 12, color: "#fff", padding: "12px 20px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(184,101,32,0.4)"
                }}
              >
                💬 {lang === "ka" ? "გაგზავნა WhatsApp-ით" : lang === "ru" ? "Отправить в WhatsApp" : "Send via WhatsApp"}
              </button>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                style={{
                  background: "none", border: "none", color: t.tabInactiveClr, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", marginTop: 6
                }}
              >
                {lang === "ka" ? "დახურვა" : lang === "ru" ? "Закрыть" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
