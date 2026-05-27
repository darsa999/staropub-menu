import React, { useRef, useState, useEffect, useCallback } from "react";
import Papa from "papaparse";

// ──────────────────────────────────────────────────────────────────────────────
// 👇 ჩასვი შენი Google Sheets CSV ბმული აქ
// ──────────────────────────────────────────────────────────────────────────────
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTb9meX1aqFVREVH0ybAXHfgXVUombtxAJV-Out0Uf3jo4XQJoK_TXlxG_twhKtL8Kog_QotnHC3Qp6/pub?output=csv";

// ─── Timing constants ─────────────────────────────────────────────────────────
const POUR_DURATION_MS  = 2000;
const SKELETON_DELAY_MS = 1500;

// ─── Loading text ─────────────────────────────────────────────────────────────
const LOADING_TEXT = {
  ka: "მენიუ იტვირთება...",
  en: "The menu is loading...",
  ru: "Меню загружается...",
};

// ─── "Daily Special" badge label ─────────────────────────────────────────────
const DAILY_SPECIAL_LABEL = { ka: "✦ დღის შეთავაზება", en: "✦ Daily Special", ru: "✦ Блюдо дня" };

// ─── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  grill:      { ka: "🔥 გრილი",               en: "🔥 Grill",        ru: "🔥 Гриль" },
  khinkali:   { ka: "🥟 ხინკალი",             en: "🥟 Khinkali",     ru: "🥟 Хинкали" },
  hot_dishes: { ka: "🍲 ცხელი კერძები",       en: "🍲 Hot Dishes",   ru: "🍲 Горячие блюда" },
  cold_dishes:{ ka: "🥗 ცივი კერძები",        en: "🥗 Cold Dishes",  ru: "🥗 Холодные закуски" },
  soup:       { ka: "🍜 წვნიანი კერძები",     en: "🍜 Soups",        ru: "🍜 Супы" },
  salad:      { ka: "🥗 სალათები",            en: "🥗 Salads",       ru: "🥗 Салаты" },
  cheese:     { ka: "🧀 ყველი",               en: "🧀 Cheese",       ru: "🧀 Сыр" },
  bakery:     { ka: "🫓 ცომეული",             en: "🫓 Bakery",       ru: "🫓 Выпечка" },
  fish:       { ka: "🐟 თევზეული",            en: "🐟 Fish",         ru: "🐟 Рыба" },
  side:       { ka: "🍚 გარნირი",             en: "🍚 Side Dishes",  ru: "🍚 Гарниры" },
  beer:       { ka: "🍺 ლუდი",               en: "🍺 Beer",         ru: "🍺 Пиво" },
  hot_drink:  { ka: "☕ ცხელი სასმელები",     en: "☕ Hot Drinks",   ru: "☕ Горячие напитки" },
  Alcohol:    { ka: "🥃 სპირტიანი სასმელები", en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  spirits:    { ka: "🥃 სპირტიანი სასმელები", en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  sauces:     { ka: "🫙 სოუსები",             en: "🫙 Sauces",       ru: "🫙 Соусы" },
  snacks:     { ka: "🍟 წასახემსებელი",       en: "🍟 Snacks",       ru: "🍟 Закуски" },
};

const CATEGORY_ICONS = {
  grill: "🔥", khinkali: "🥟", hot_dish: "🍲", soup: "🍜", salad: "🥗",
  cheese: "🧀", bakery: "🫓", fish: "🐟", side: "🍚", beer: "🍺",
  hot_drink: "☕", alcohol: "🥃", spirits: "🥃", sauces: "🫙", snacks: "🍟",
};

// ─── Categories that get the hot-steam effect ─────────────────────────────────
const HOT_CATEGORIES = new Set(["grill", "hot_dishes", "hot_dish", "soup", "khinkali"]);

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
    appBg:          "radial-gradient(ellipse at top, #1a0e04 0%, #0d0602 60%, #000 100%)",
    headerBg:       "linear-gradient(180deg,rgba(15,8,2,0.98) 0%,rgba(10,5,1,0.95) 100%)",
    headerBorder:   "1px solid rgba(180,120,40,0.25)",
    cardBg:         "linear-gradient(145deg, #1e1209, #2a1a0a)",
    cardBorder:     "1px solid rgba(180,120,40,0.2)",
    cardName:       "#f0c060",
    cardDesc:       "#a08060",
    tabInactiveBg:  "rgba(255,255,255,0.04)",
    tabInactiveBdr: "rgba(180,120,40,0.15)",
    tabInactiveClr: "#8a6040",
    searchBg:       "#141210",
    searchBorder:   "rgba(245,158,11,0.20)",
    searchColor:    "#f0c060",
    searchPlaceholder: "rgba(200,150,60,0.45)",
    imgFallbackBg:  "linear-gradient(135deg, #2d1a08 0%, #3d2410 50%, #1a0e04 100%)",
    modalBg:        "linear-gradient(160deg,#18100a 0%,#110c06 100%)",
    modalBorder:    "rgba(245,158,11,0.22)",
    modalName:      "#ffffff",
    modalDesc:      "#a1a1aa",
    modalPriceBg:   "rgba(255,255,255,0.025)",
    modalPriceBdr:  "rgba(180,120,40,0.22)",
    modalPriceLbl:  "#7a5a38",
    footerBg:       "linear-gradient(0deg, rgba(8,4,1,0.99) 0%, rgba(12,6,1,0.97) 100%)",
    footerBorder:   "rgba(180,120,40,0.2)",
    bodyText:       "#c8a878",
    brandName:      "#f0c060",
    brandSub:       "#8a6040",
    noResultsColor: "rgba(180,120,40,0.6)",
    carouselFrame:  "linear-gradient(145deg, #1a0d04, #261508, #1a0d04)",
    carouselBorder: "rgba(200,140,40,0.22)",
    carouselChip:   "rgba(184,101,32,0.18)",
    carouselChipBdr:"rgba(200,130,40,0.25)",
    carouselChipClr:"#c89040",
    carouselDesc:   "#9a7858",
  },
  light: {
    appBg:          "linear-gradient(180deg, #fcfbf7 0%, #f5f0e8 100%)",
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
    bodyText:       "#3d2e1a",
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
  // Light mode preloader uses a warm cream background
  const pourBg = isDark
    ? "radial-gradient(ellipse at 50% 30%, #1e0f02 0%, #0d0602 55%, #000 100%)"
    : "radial-gradient(ellipse at 50% 30%, #fdf9f2 0%, #f5eed8 55%, #ede0be 100%)";
  const titleColor    = isDark ? "#f0c060" : "#b86010";
  const subtitleColor = isDark ? "#7a5a30" : "#a07840";
  const loadTextColor = isDark ? "#c8a050" : "#8a6020";
  const taglineColor  = isDark ? "#3a2810" : "#c8a060";

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

      <div className="pour-title" style={{ color: titleColor, fontSize: 28, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "3px", marginBottom: 5, textShadow: isDark ? "0 2px 28px rgba(240,180,60,0.55)" : "none" }}>
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
// PHASE 2 — SKELETON GRID
// ══════════════════════════════════════════════════════════════════════════════
function SkeletonCard({ isDark }) {
  return (
    <div style={{
      background: isDark ? "linear-gradient(145deg, #1e1209, #271508)" : "linear-gradient(145deg, #ede8de, #e4ddd0)",
      border: isDark ? "1px solid rgba(100,60,20,0.3)" : "1px solid rgba(160,110,40,0.2)",
      borderRadius: 12, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div className="sk-pulse" style={{ width: "100%", height: 160, background: isDark ? "#2e1a0a" : "#d8cfbe" }} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sk-pulse" style={{ height: 14, borderRadius: 6, width: "70%", background: isDark ? "#3a2010" : "#ccc3b0" }} />
        <div className="sk-pulse" style={{ height: 10, borderRadius: 6, width: "90%", background: isDark ? "#2e1a0a" : "#d8cfbe" }} />
        <div className="sk-pulse" style={{ height: 10, borderRadius: 6, width: "60%", background: isDark ? "#2e1a0a" : "#d8cfbe" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div className="sk-pulse" style={{ height: 18, borderRadius: 6, width: "36%", background: isDark ? "#3a2010" : "#ccc3b0" }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ isDark }) {
  return (
    <>
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .sk-pulse { animation: skPulse 1.1s ease-in-out infinite; }
        .skeleton-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media(min-width:768px)  { .skeleton-grid { grid-template-columns:repeat(4,1fr)!important; } }
        @media(min-width:1024px) { .skeleton-grid { grid-template-columns:repeat(5,1fr)!important; } }
      `}</style>
      <div className="skeleton-grid">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRICE BLOCK
// ══════════════════════════════════════════════════════════════════════════════
function parseMultiPrice(raw) {
  if (!raw || typeof raw !== "string") return null;
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
function ItemCard({ item, lang, onOpen, th }) {
  const t = th || THEME.light;
  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🍽️";
  const isHot    = HOT_CATEGORIES.has(item.category);

  const shimmerDelay = React.useMemo(
    () => `-${(Math.random() * 8).toFixed(2)}s`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id || item.name_ka]
  );

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
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px", color: t.cardName, fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3, transition: "color 0.3s" }}>{name}</h3>
        {desc && <p style={{ margin: "0 0 12px", color: t.cardDesc, fontSize: 12, lineHeight: 1.5, flex: 1, transition: "color 0.3s" }}>{desc}</p>}
        <PriceBlock item={item} th={t} />
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
// DAILY SPECIALS CAROUSEL
// ══════════════════════════════════════════════════════════════════════════════
function DailySpecialsCarousel({ items, lang, onSelectDish, th }) {
  const t = th || THEME.light;
  const [current, setCurrent]       = useState(0);
  const [displayed, setDisplayed]   = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection]   = useState(1);
  const autoRef    = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const total = items.length;

  const goTo = useCallback((next, dir = 1) => {
    if (transitioning || next === current) return;
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      setDisplayed(next);
      setCurrent(next);
      setTransitioning(false);
    }, 380);
  }, [transitioning, current]);

  const next = useCallback(() => goTo((current + 1) % total, 1),  [current, total, goTo]);
  const prev = useCallback(() => goTo((current - 1 + total) % total, -1), [current, total, goTo]);

  useEffect(() => {
    if (total < 2) return;
    autoRef.current = setInterval(next, 4200);
    return () => clearInterval(autoRef.current);
  }, [next, total]);

  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 4200);
  }, [next]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) { next(); } else { prev(); }
      resetAuto();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!items || total === 0) return null;

  const item     = items[displayed];
  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🔥";
  const isHot    = HOT_CATEGORIES.has(item.category);

  const slideStyle = {
    opacity: transitioning ? 0 : 1,
    transform: transitioning
      ? `translateX(${direction * 28}px) scale(0.97)`
      : "translateX(0) scale(1)",
    transition: "opacity 0.38s cubic-bezier(0.4,0,0.2,1), transform 0.38s cubic-bezier(0.4,0,0.2,1)",
  };

  // Theme-aware glow color
  const glowColor1 = t === THEME.dark ? "rgba(184,101,32,0.22)" : "rgba(184,101,32,0.14)";
  const glowColor2 = t === THEME.dark ? "rgba(232,160,48,0.32)" : "rgba(200,130,30,0.22)";

  return (
    <div style={{ margin: "20px 0 24px", position: "relative" }}>
      <style>{`
        @keyframes carouselGlow {
          0%,100% { box-shadow: 0 0 28px ${glowColor1}, 0 0 0 1px ${t.carouselBorder}; }
          50%      { box-shadow: 0 0 44px ${glowColor2}, 0 0 0 1px ${t.carouselBorder}; }
        }
        @keyframes badgePulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.78; }
        }
        .carousel-arrow:hover { background: rgba(200,120,40,0.35) !important; }
        .carousel-dot-btn:hover { background: rgba(200,140,40,0.7) !important; }
      `}</style>

      {/* Badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          background: "linear-gradient(90deg, #b86520 0%, #e8a030 60%, #b86520 100%)",
          color: "#fff",
          fontSize: 11, fontWeight: 800, letterSpacing: "2px",
          textTransform: "uppercase", padding: "5px 14px",
          borderRadius: 20, fontFamily: "'Georgia', serif",
          animation: "badgePulse 2.8s ease-in-out infinite",
          boxShadow: "0 2px 12px rgba(184,101,32,0.5)",
          flexShrink: 0,
        }}>
          {DAILY_SPECIAL_LABEL[lang]}
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(184,101,32,0.4), transparent)" }} />
      </div>

      {/* Carousel frame */}
      <div
        style={{
          borderRadius: 18, overflow: "hidden",
          background: t.carouselFrame,
          border: `1px solid ${t.carouselBorder}`,
          animation: "carouselGlow 4s ease-in-out infinite",
          position: "relative",
          userSelect: "none", WebkitUserSelect: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={slideStyle}>
          <div style={{ display: "flex", flexDirection: "row", minHeight: 200 }} className="carousel-inner">
            <style>{`
              @media (max-width: 640px) {
                .carousel-inner { flex-direction: column !important; }
                .carousel-img-wrap { width: 100% !important; height: 220px !important; }
                .carousel-text-wrap { padding: 18px 18px 22px !important; }
              }
            `}</style>

            {/* Image side */}
            <div className="carousel-img-wrap" style={{ width: "45%", minWidth: 180, position: "relative", overflow: "hidden", background: t.imgFallbackBg, flexShrink: 0 }}>
              {imgSrc && (
                <img key={imgSrc} src={imgSrc} alt={name} loading="lazy"
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transition: "transform 0.6s ease" }}
                  onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; }}
                  onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}
                />
              )}
              <div style={{ display: imgSrc ? "none" : "flex", fontSize: 72, position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                <span>{fallback}</span>
              </div>
              {/* Steam on hot items */}
              {isHot && <HotSteamOverlay />}
              {/* Cinematic right-bleed overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, " + (t === THEME.dark ? "rgba(22,11,3,0.85)" : "rgba(242,237,227,0.85)") + ")", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(0,0,0,0.45))", pointerEvents: "none" }} />
            </div>

            {/* Text side */}
            <div className="carousel-text-wrap" style={{ flex: 1, padding: "28px 28px 26px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
              {/* category chip */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: t.carouselChip,
                border: `1px solid ${t.carouselChipBdr}`,
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10, color: t.carouselChipClr,
                letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700,
                width: "fit-content",
              }}>
                🔥 {lang === "ka" ? "გრილი" : lang === "ru" ? "Гриль" : "Grill"}
              </div>
              <h2 style={{ margin: 0, color: t.cardName, fontFamily: "'Georgia', serif", fontSize: "clamp(17px,3vw,26px)", fontWeight: 700, lineHeight: 1.25, letterSpacing: "0.2px", transition: "color 0.3s" }}>
                {name}
              </h2>
              {desc && <p style={{ margin: 0, color: t.carouselDesc, fontSize: "clamp(11px,1.5vw,13px)", lineHeight: 1.6, maxWidth: 320 }}>{desc}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 700 }}>
                  {formatPrice(item.price)}
                </span>
                <button
                  onClick={() => onSelectDish(item)}
                  style={{
                    background: "linear-gradient(135deg, #b86520, #7a3a08)",
                    border: "1px solid rgba(200,130,40,0.5)",
                    borderRadius: 24, color: "#fff",
                    padding: "8px 20px", fontSize: 12, fontWeight: 700,
                    letterSpacing: "0.5px", cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "'Georgia', serif",
                    boxShadow: "0 4px 14px rgba(184,101,32,0.4)", flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; e.target.style.boxShadow = "0 6px 20px rgba(232,160,48,0.5)"; }}
                  onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 14px rgba(184,101,32,0.4)"; }}
                >
                  {lang === "ka" ? "დეტალები" : lang === "ru" ? "Подробнее" : "View Details"}
                </button>
              </div>
              <div style={{ color: t.tabInactiveClr, fontSize: 10, letterSpacing: "1px", marginTop: 2 }}>
                {current + 1} / {total}
              </div>
            </div>
          </div>
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button className="carousel-arrow" onClick={() => { prev(); resetAuto(); }} aria-label="Previous"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: `1px solid ${t.carouselBorder}`, borderRadius: "50%", width: 36, height: 36, color: "#c89040", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10, backdropFilter: "blur(6px)" }}>‹</button>
            <button className="carousel-arrow" onClick={() => { next(); resetAuto(); }} aria-label="Next"
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: `1px solid ${t.carouselBorder}`, borderRadius: "50%", width: 36, height: 36, color: "#c89040", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10, backdropFilter: "blur(6px)" }}>›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {items.map((_, i) => (
            <button key={i} className="carousel-dot-btn"
              onClick={() => { goTo(i, i > current ? 1 : -1); resetAuto(); }}
              style={{
                width: i === current ? 22 : 7, height: 7, borderRadius: 4,
                border: "none", padding: 0, cursor: "pointer",
                background: i === current ? "linear-gradient(90deg, #b86520, #e8a030)" : (t === THEME.dark ? "rgba(180,120,40,0.25)" : "rgba(160,100,30,0.2)"),
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: i === current ? "0 0 8px rgba(232,160,48,0.5)" : "none",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DISH DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════════
function DishModal({ item, lang, onClose, th }) {
  const t = th || THEME.light;
  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🍽️";
  const catObj   = CATEGORY_LABELS[item.category];
  const catLabel = catObj ? catObj[lang] : item.category || "";
  const isHot    = HOT_CATEGORIES.has(item.category);
  const PRICE_LABEL = { ka: "ფასი", en: "Price", ru: "Цена" };

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
            <div className="modal-img" style={{ minHeight:220, background:"linear-gradient(135deg,#2d1a08,#3d2410,#1a0e04)", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(transparent,rgba(17,10,4,0.88))", pointerEvents:"none" }} />
              {catLabel && (
                <div style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.62)", border:"1px solid rgba(180,120,40,0.35)", backdropFilter:"blur(8px)", borderRadius:20, padding:"4px 13px", color:"#c8a050", fontSize:11, fontWeight:600 }}>
                  {catLabel}
                </div>
              )}
            </div>
            {/* Content */}
            <div className="modal-right" style={{ padding:"28px 28px 30px", display:"flex", flexDirection:"column" }}>
              <h2 style={{ margin:"0 0 12px", color: t.modalName, fontFamily:"'Georgia',serif", fontSize:"clamp(19px,3vw,27px)", fontWeight:700, lineHeight:1.25, paddingRight:44, transition:"color 0.3s" }}>{name}</h2>
              <div style={{ height:1, background:"linear-gradient(90deg,rgba(245,158,11,0.45),transparent)", marginBottom:16 }} />
              {desc ? <p style={{ margin:"0 0 22px", color: t.modalDesc, fontSize:14, lineHeight:1.75, flex:1, transition:"color 0.3s" }}>{desc}</p> : <div style={{ flex:1 }} />}
              <div style={{ padding:"16px 18px", background: t.modalPriceBg, border:`1px solid ${t.modalPriceBdr}`, borderRadius:14, marginTop:"auto" }}>
                <div style={{ color: t.modalPriceLbl, fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}>{PRICE_LABEL[lang] || "ფასი"}</div>
                <PriceBlock item={item} modal={true} th={t} />
              </div>
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
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: t === THEME.dark ? "linear-gradient(180deg, #1e1005, #140b03)" : "linear-gradient(180deg, #faf6ec, #f0e8d4)", border: "1px solid rgba(180,120,40,0.35)", borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", minWidth: 90, zIndex: 200 }}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }} style={{ width: "100%", padding: "9px 14px", background: lang === code ? "rgba(184,101,32,0.25)" : "transparent", border: "none", borderBottom: "1px solid rgba(180,120,40,0.1)", color: lang === code ? "#e0a030" : t.tabInactiveClr, fontSize: 12, fontWeight: lang === code ? 700 : 500, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
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

function AboutView({ lang, th }) {
  const t      = th || THEME.light;
  const isDark = t === THEME.dark;
  const currentHour = new Date().getHours();
  const isMatchDay  = false;
  const isOpen      = isMatchDay || (currentHour >= 10 && currentHour < 23);
  const cardBg     = isDark ? "linear-gradient(145deg, #1e1209, #2a1a0a)" : "linear-gradient(145deg, #f4f1eb, #ede8de)";
  const cardBorder = isDark ? "rgba(180,120,40,0.2)" : "rgba(160,100,30,0.18)";
  const labelColor = isDark ? "#8a6040" : "#9a7040";
  const valueColor = isDark ? "#f0c060" : "#1c1510";
  const socialBtnStyle = { display:"inline-flex", alignItems:"center", gap:6, color:"#c8903a", textDecoration:"none", padding:"7px 14px", borderRadius:8, border:"1px solid rgba(180,120,40,0.25)", background: isDark ? "rgba(180,120,40,0.07)" : "rgba(180,120,40,0.08)", fontSize:13, fontWeight:600, transition:"all 0.2s" };

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"0 16px 120px" }}>
      <div style={{ width:"100%", height:220, borderRadius:"0 0 20px 20px", overflow:"hidden", background:"linear-gradient(135deg,#2d1a08,#3d2410,#1a0e04)", position:"relative", marginBottom:24 }}>
        <img src="Images/staropub.webp" alt="StaroPub" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72) 100%)" }} />
        <div style={{ position:"absolute", bottom:20, left:20 }}>
          <div style={{ color:"#f0c060", fontSize:26, fontWeight:700, fontFamily:"'Georgia',serif", letterSpacing:"0.5px", textShadow:"0 2px 16px rgba(0,0,0,0.7)" }}>StaroPub</div>
          <div style={{ color:"rgba(240,192,96,0.65)", fontSize:11, letterSpacing:"2px" }}>სტაროპაბი</div>
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
            <p style={{ color:isDark?"#7a5a38":"#9a7040", fontSize:11, lineHeight:1.55, margin:"8px 0 0" }}>{ABOUT_TEXT.matchDay[lang]}</p>
          </div>
          <AboutBeerMug isOpen={isOpen} />
        </div>
      </div>
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:"20px 22px", marginBottom:16, display:"flex", flexDirection:"column", gap:16 }}>
        {[
          { icon:"📍", label:ABOUT_TEXT.location[lang], value:<span style={{color:valueColor,fontSize:14,fontWeight:600}}>ილია ვეკუას 20</span> },
          { icon:"📞", label:ABOUT_TEXT.phone[lang],    value:<a href="tel:595931119" style={{color:"#e8a030",fontSize:16,fontWeight:700,fontFamily:"'Georgia',serif",textDecoration:"none"}}>595 93 11 19</a> },
          { icon:"✉️", label:ABOUT_TEXT.email[lang],    value:<a href="mailto:staropub25@gmail.com" style={{color:"#e8a030",fontSize:13,fontWeight:600,textDecoration:"none",wordBreak:"break-all"}}>staropub25@gmail.com</a> },
        ].map((row, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <div style={{ height:1, background:isDark?"rgba(180,120,40,0.1)":"rgba(160,100,30,0.1)" }} />}
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <span style={{ fontSize:20, lineHeight:1, marginTop:1, flexShrink:0 }}>{row.icon}</span>
              <div>
                <div style={{ color:labelColor, fontSize:10, letterSpacing:"1px", textTransform:"uppercase", marginBottom:3 }}>{row.label}</div>
                {row.value}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:"18px 22px", display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <a href="https://www.facebook.com/StaroPub1" target="_blank" rel="noopener noreferrer" style={socialBtnStyle} className="about-social-link"><IconFacebook size={16} /> Facebook</a>
        <a href="https://www.instagram.com/staropub/" target="_blank" rel="noopener noreferrer" style={socialBtnStyle} className="about-social-link"><IconInstagram size={16} /> Instagram</a>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
function SiteFooter({ lang, visible, th, currentView, setCurrentView }) {
  const t = th || THEME.light;
  return (
    <footer style={{ position:"fixed", left:0, right:0, bottom:0, zIndex:50, background:t.footerBg, borderTop:`1px solid ${t.footerBorder}`, padding:"10px 24px 12px", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", transform:visible?"translateY(0)":"translateY(100%)", opacity:visible?1:0, pointerEvents:visible?"auto":"none", transition:"transform 0.32s ease-in-out, opacity 0.32s ease-in-out, background 0.3s" }}>
      <style>{`
        .footer-grid { display:grid; grid-template-columns:1fr; gap:10px; max-width:1200px; margin:0 auto; text-align:center; align-items:center; }
        @media(min-width:640px) { .footer-grid { grid-template-columns:1fr 1fr 1fr; text-align:left; gap:0; } .footer-center { text-align:center!important; } .footer-right { text-align:right!important; } }
        .footer-nav-link { color:#8a6040; text-decoration:none; font-size:12px; font-weight:600; letter-spacing:0.3px; transition:color 0.2s; cursor:pointer; background:none; border:none; padding:0; font-family:'Georgia',serif; }
        .footer-nav-link:hover { color:#f0c060; }
        .footer-wolt-link { color:#8a6040; text-decoration:none; font-size:11px; font-weight:600; transition:color 0.2s; letter-spacing:0.3px; }
        .footer-wolt-link:hover { color:#009de0; }
      `}</style>
      <div className="footer-grid">
        <div style={{ display:"flex", flexDirection:"column", gap:5, justifyContent:"center", alignItems:"center" }}>
          <button className="footer-nav-link" onClick={() => setCurrentView(currentView === "menu" ? "about" : "menu")}>
            {currentView === "menu" ? ABOUT_TEXT.aboutUs[lang] : ABOUT_TEXT.backHome[lang]}
          </button>
          {currentView === "menu" && (
            <a href="https://wolt.com/ka/geo/tbilisi/restaurant/staropub1" target="_blank" rel="noopener noreferrer" className="footer-wolt-link">
              {ABOUT_TEXT.wolt[lang]}
            </a>
          )}
        </div>
        <div className="footer-center" style={{ textAlign:"center" }}>
          <div style={{ color:"#c8a050", fontSize:12, fontWeight:700, fontFamily:"'Georgia',serif", lineHeight:1.4 }}>{FOOTER_TEXT.tagline[lang]}</div>
          <div style={{ marginTop:3, color:"#4a3018", fontSize:9, letterSpacing:"1px" }}>StaroPub · სტაროპაბი · QR მენიუ</div>
        </div>
        <div className="footer-right" style={{ textAlign:"center" }}>
          <p style={{ color:"#4a3018", fontSize:10, lineHeight:1.5, margin:0 }}>{FOOTER_TEXT.copyright[lang]}</p>
        </div>
      </div>
    </footer>
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
  // ── DEFAULT THEME: LIGHT ──────────────────────────────────────────────────
  const [isDark, setIsDark]             = useState(false);
  const [currentView, setCurrentView]   = useState("menu");

  const t = isDark ? THEME.dark : THEME.light;

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

  // ─── Phase machine: "pour" → "skeleton" → "menu" ─────────────────────────
  const [phase, setPhase] = useState("pour");
  const fetchedRows = useRef(null);
  const tabsRef     = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fetchedRows.current !== null) {
        setAllItems(fetchedRows.current);
        if (fetchedRows.current.length > 0) setActiveTab(fetchedRows.current[0].category);
        setPhase("menu");
      } else {
        setPhase("skeleton");
      }
    }, POUR_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!SPREADSHEET_URL || SPREADSHEET_URL === "YOUR_GOOGLE_SHEETS_CSV_URL_HERE") {
      setError("SPREADSHEET_URL არ არის დაყენებული.");
      fetchedRows.current = [];
      setPhase(prev => prev === "skeleton" ? "menu" : prev);
      return;
    }
    Papa.parse(SPREADSHEET_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.filter(r => r.id && r.category && r.name_ka);
        fetchedRows.current = rows;
        setPhase(prev => {
          if (prev === "skeleton") {
            setTimeout(() => { setAllItems(rows); if (rows.length > 0) setActiveTab(rows[0].category); setPhase("menu"); }, SKELETON_DELAY_MS);
            return "skeleton";
          }
          return prev;
        });
      },
      error: (err) => {
        setError(`CSV შეცდომა: ${err.message}`);
        fetchedRows.current = [];
        setPhase(prev => { if (prev === "skeleton") setTimeout(() => setPhase("menu"), 300); return prev; });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const categories = React.useMemo(() => {
    const seen = new Set();
    return allItems.reduce((acc, item) => {
      if (!seen.has(item.category)) { seen.add(item.category); acc.push(item.category); }
      return acc;
    }, []);
  }, [allItems]);

  const items = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) return allItems.filter(it =>
      (it.name_ka || "").toLowerCase().includes(q) ||
      (it.name_en || "").toLowerCase().includes(q) ||
      (it.name_ru || "").toLowerCase().includes(q)
    );
    return allItems.filter(it => !activeTab || it.category === activeTab);
  }, [allItems, activeTab, searchQuery]);

  // ─── Daily Specials: grill items ─────────────────────────────────────────
  const grillSpecials = React.useMemo(
    () => allItems.filter(d => d.category === "grill" || d.category_ka === "გრილი"),
    [allItems]
  );

  const NO_RESULTS_TEXT   = { ka: "კერძი ვერ მოიძებნა", en: "No items found", ru: "Ничего не найдено" };
  const SEARCH_PLACEHOLDER = { ka: "მოძებნე კერძი...", en: "Search dish...", ru: "Найти блюдо..." };

  const scrollTab = useCallback((key) => {
    setActiveTab(key);
    if (tabsRef.current) {
      const btn = tabsRef.current.querySelector(`[data-key="${key}"]`);
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const isPour     = phase === "pour";
  const isSkeleton = phase === "skeleton";
  const isMenu     = phase === "menu";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('Images/staropub_main.jpg')",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
      fontFamily: "'Georgia','DejaVu Serif',serif",
      color: t.bodyText,
      position: "relative",
      transition: "color 0.35s",
    }}>
      {/* Theme overlay */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", background: isDark ? "rgba(8,4,1,0.88)" : "rgba(252,247,241,0.88)", transition:"background 0.4s" }} />

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
      `}</style>

      {/* Phase 1: Pour screen — passes isDark so light mode gets cream bg */}
      {isPour && <MasterPourScreen lang={lang} isDark={isDark} />}

      {/* Decorative orbs (dark only) */}
      {!isPour && isDark && <>
        <div style={{ position:"fixed", top:-120, right:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(120,60,10,0.15),transparent 70%)", pointerEvents:"none", zIndex:1 }} />
        <div style={{ position:"fixed", bottom:-100, left:-60, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(80,40,5,0.12),transparent 70%)", pointerEvents:"none", zIndex:1 }} />
      </>}

      {/* Header */}
      {!isPour && (
        <header style={{ position:"sticky", top:0, zIndex:100, background:t.headerBg, borderBottom:t.headerBorder, backdropFilter:"blur(12px)", padding:"0 16px", transition:"background 0.3s, border-color 0.3s" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", height:64, gap:12 }}>
            <img src="Images/logo.jpg" alt="StaroPub Logo" loading="lazy"
              style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            />
            <div style={{ display:"none", width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#c87820,#7a4010)", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}>🍺</div>
            <div style={{ flex:1 }}>
              <div style={{ color:t.brandName, fontSize:18, fontWeight:700, letterSpacing:"0.5px", lineHeight:1.1, transition:"color 0.3s" }}>StaroPub</div>
              <div style={{ color:t.brandSub, fontSize:10, letterSpacing:"1px", transition:"color 0.3s" }}>სტაროპაბი</div>
            </div>
            <button onClick={() => setIsDark(d => !d)} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)", border:"1px solid rgba(180,120,40,0.28)", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:16, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s", flexShrink:0 }}
              aria-label="Toggle theme">
              {isDark ? "☀️" : "🌙"}
            </button>
            <LangSwitcher lang={lang} setLang={setLang} th={t} />
          </div>

          {isMenu && categories.length > 0 && currentView === "menu" && (
            <div style={{ maxWidth:1200, margin:"0 auto", padding:"8px 0 4px" }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(245,158,11,0.45)", fontSize:15, pointerEvents:"none", lineHeight:1 }}>🔍</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDER[lang]}
                  style={{ width:"100%", boxSizing:"border-box", background:t.searchBg, border:`1px solid ${t.searchBorder}`, borderRadius:12, padding:"10px 14px 10px 40px", color:t.searchColor, fontSize:14, fontFamily:"'Georgia','DejaVu Serif',serif", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s, background 0.3s, color 0.3s", caretColor:"#f59e0b" }}
                  onFocus={e => { e.target.style.borderColor="rgba(245,158,11,0.55)"; e.target.style.boxShadow="0 0 0 2px rgba(245,158,11,0.08)"; }}
                  onBlur={e =>  { e.target.style.borderColor=t.searchBorder; e.target.style.boxShadow="none"; }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(245,158,11,0.5)", cursor:"pointer", fontSize:14, lineHeight:1, padding:2 }} aria-label="Clear search">✕</button>
                )}
              </div>
            </div>
          )}

          {isMenu && categories.length > 0 && currentView === "menu" && (
            <div ref={tabsRef} className="tabs-row" style={{ display:"flex", gap:4, overflowX:"auto", padding:"8px 0 10px", maxWidth:1200, margin:"0 auto", scrollbarWidth:"none" }}>
              {categories.map(cat => {
                const catObj = CATEGORY_LABELS[cat];
                const label  = catObj ? catObj[lang] : cat;
                const active = activeTab === cat;
                return (
                  <button key={cat} data-key={cat} onClick={() => scrollTab(cat)} style={{ whiteSpace:"nowrap", flexShrink:0, background:active?"linear-gradient(135deg,#b86520,#7a3a08)":t.tabInactiveBg, border:`1px solid ${active?"rgba(200,120,40,0.6)":t.tabInactiveBdr}`, color:active?"#fff":t.tabInactiveClr, borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:active?700:500, cursor:"pointer", transition:"all 0.25s", boxShadow:active?"0 2px 12px rgba(184,101,32,0.4)":"none" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </header>
      )}

      {/* Main — menu view */}
      {!isPour && currentView === "menu" && (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"16px 16px 112px", position:"relative", zIndex:1 }}>
          {isSkeleton && <SkeletonGrid isDark={isDark} />}

          {isMenu && error && (
            <div style={{ margin:"40px auto", maxWidth:480, padding:"20px 24px", background:"rgba(180,40,40,0.12)", border:"1px solid rgba(180,40,40,0.3)", borderRadius:12, color:"#e08080", fontSize:13, lineHeight:1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {isMenu && !error && (
            <>
              {/* ── Daily Specials Carousel (menu view only, grill items) ── */}
              {grillSpecials.length > 0 && !searchQuery && (
                <DailySpecialsCarousel
                  items={grillSpecials}
                  lang={lang}
                  onSelectDish={setSelectedDish}
                  th={t}
                />
              )}

              {/* ── Product grid ── */}
              {items.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260, gap:14, animation:"fadeIn 0.3s ease-out" }}>
                  <span style={{ fontSize:48, opacity:0.35 }}>🔍</span>
                  <p style={{ color:t.noResultsColor, fontFamily:"'Georgia','DejaVu Serif',serif", fontSize:15, fontWeight:600, letterSpacing:"0.3px", margin:0, textAlign:"center" }}>{NO_RESULTS_TEXT[lang]}</p>
                </div>
              ) : (
                <div key={`${activeTab}-${searchQuery}`} className="menu-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, animation:"fadeIn 0.4s ease-out" }}>
                  {items.map((item) => (
                    <ItemCard key={item.id || `${item.category}-${item.name_ka}`} item={item} lang={lang} onOpen={setSelectedDish} th={t} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* About view */}
      {!isPour && currentView === "about" && (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"16px 0 112px", animation:"fadeIn 0.3s ease-out", position:"relative", zIndex:1 }}>
          <AboutView lang={lang} th={t} />
        </main>
      )}

      {!isPour && <SiteFooter lang={lang} visible={isFooterVisible} th={t} currentView={currentView} setCurrentView={setCurrentView} />}

      {/* Dish Detail Modal */}
      {selectedDish && (
        <DishModal item={selectedDish} lang={lang} onClose={() => setSelectedDish(null)} th={t} />
      )}
    </div>
  );
}
