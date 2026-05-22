import React, { useRef, useState, useEffect, useCallback } from "react";
import Papa from "papaparse";

// ──────────────────────────────────────────────────────────────────────────────
// 👇 ჩასვი შენი Google Sheets CSV ბმული აქ
// ──────────────────────────────────────────────────────────────────────────────
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTb9meX1aqFVREVH0ybAXHfgXVUombtxAJV-Out0Uf3jo4XQJoK_TXlxG_twhKtL8Kog_QotnHC3Qp6/pub?output=csv";
// მაგალითად:
// "https://docs.google.com/spreadsheets/d/XXXXXX/export?format=csv&gid=0"
// ──────────────────────────────────────────────────────────────────────────────

// ─── Timing constants ─────────────────────────────────────────────────────────
const POUR_DURATION_MS  = 2000;   // Phase 1: beer pour animation
const SKELETON_DELAY_MS = 1500;   // Phase 2: skeleton hold after data arrives

// ─── Loading text (updated per spec) ─────────────────────────────────────────
const LOADING_TEXT = {
  ka: "მენიუ იტვირთება...",
  en: "The menu is loading...",
  ru: "Меню загружается...",
};

// ─── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  grill:     { ka: "🔥 გრილი",               en: "🔥 Grill",        ru: "🔥 Гриль" },
  khinkali:  { ka: "🥟 ხინკალი",             en: "🥟 Khinkali",     ru: "🥟 Хинкали" },
  hot_dishes:  { ka: "🍲 ცხელი კერძები",       en: "🍲 Hot Dishes",   ru: "🍲 Горячие блюда" },
    cold_dishes: { ka: "🥗 ცივი კერძები",     en: "🥗 Cold Dishes",  ru: "🥗 Холодные закуски" },
  soup:      { ka: "🍜 წვნიანი კერძები",     en: "🍜 Soups",        ru: "🍜 Супы" },
  salad:     { ka: "🥗 სალათები",            en: "🥗 Salads",       ru: "🥗 Салаты" },
  cheese:    { ka: "🧀 ყველი",               en: "🧀 Cheese",       ru: "🧀 Сыр" },
  bakery:    { ka: "🫓 ცომეული",             en: "🫓 Bakery",       ru: "🫓 Выпечка" },
  fish:      { ka: "🐟 თევზეული",            en: "🐟 Fish",         ru: "🐟 Рыба" },
  side:      { ka: "🍚 გარნირი",             en: "🍚 Side Dishes",  ru: "🍚 Гарниры" },
  beer:      { ka: "🍺 ლუდი",               en: "🍺 Beer",         ru: "🍺 Пиво" },
  hot_drink: { ka: "☕ ცხელი სასმელები",     en: "☕ Hot Drinks",   ru: "☕ Горячие напитки" },
  Alcohol:   { ka: "🥃 სპირტიანი სასმელები", en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  spirits:   { ka: "🥃 სპირტიანი სასმელები", en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  sauces:    { ka: "🫙 სოუსები",             en: "🫙 Sauces",       ru: "🫙 Соусы" },
  snacks:    { ka: "🍟 წასახემსებელი",       en: "🍟 Snacks",       ru: "🍟 Закуски" },
};

const CATEGORY_ICONS = {
  grill: "🔥", khinkali: "🥟", hot_dish: "🍲", soup: "🍜", salad: "🥗",
  cheese: "🧀", bakery: "🫓", fish: "🐟", side: "🍚", beer: "🍺",
  hot_drink: "☕", alcohol: "🥃", spirits: "🥃", sauces: "🫙", snacks: "🍟",
};

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

function formatPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return p;
  return `₾${n.toFixed(2)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — BEER POUR SCREEN (redesigned tap + stream)
// ══════════════════════════════════════════════════════════════════════════════
function MasterPourScreen({ lang = "ka" }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "radial-gradient(ellipse at 50% 30%, #1e0f02 0%, #0d0602 55%, #000 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <style>{`
        /* ── Beer fill (2s pour) ── */
        @keyframes masterFill {
          0%   { height: 0%; }
          12%  { height: 10%; }
          50%  { height: 56%; }
          80%  { height: 72%; }
          100% { height: 76%; }
        }
        .master-fill { animation: masterFill ${POUR_DURATION_MS}ms cubic-bezier(0.38,0,0.18,1) forwards; }

        /* ── Foam follows fill ── */
        @keyframes masterFoam {
          0%   { height: 0px;  bottom: 0%;  opacity: 0; }
          12%  { height: 5px;  bottom: 9%;  opacity: 0.9; }
          50%  { height: 20px; bottom: 55%; opacity: 1; }
          80%  { height: 30px; bottom: 71%; opacity: 1; }
          100% { height: 32px; bottom: 75%; opacity: 1; }
        }
        .master-foam { animation: masterFoam ${POUR_DURATION_MS}ms cubic-bezier(0.38,0,0.18,1) forwards; }

        /* ── Stream: width oscillates to mimic flowing liquid ── */
        @keyframes streamFlow {
          0%,100% { transform: scaleX(1);    }
          25%      { transform: scaleX(0.72); }
          50%      { transform: scaleX(1.08); }
          75%      { transform: scaleX(0.80); }
        }
        .stream-body { animation: streamFlow 0.52s ease-in-out infinite; transform-origin: center top; }

        /* ── Amber shimmer traveling down the stream ── */
        @keyframes streamShimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 300%; }
        }
        .stream-shimmer {
          background: linear-gradient(
            180deg,
            #fbbf24 0%,
            #f59e0b 18%,
            #d97706 36%,
            #fbbf24 50%,
            #d97706 68%,
            #b45309 85%,
            transparent 100%
          );
          background-size: 100% 300%;
          animation: streamShimmer 0.45s linear infinite;
        }

        /* ── Bubble rise ── */
        @keyframes bubbleRise {
          0%   { transform: translateY(0)     scale(1);   opacity: 0.8; }
          80%  { transform: translateY(-58px) scale(1.1); opacity: 0.3; }
          100% { transform: translateY(-68px) scale(0.7); opacity: 0; }
        }
        .b0 { animation: bubbleRise 2.0s 0.1s ease-in infinite; }
        .b1 { animation: bubbleRise 1.7s 0.8s ease-in infinite; }
        .b2 { animation: bubbleRise 2.3s 1.4s ease-in infinite; }
        .b3 { animation: bubbleRise 1.5s 0.4s ease-in infinite; }

        /* ── Foam surface bubbles ── */
        @keyframes foamBubble {
          0%,100% { transform: scale(1);   opacity: 0.9; }
          50%      { transform: scale(1.6); opacity: 0.35; }
        }
        .fb0 { animation: foamBubble 1.0s 0.00s ease-in-out infinite; }
        .fb1 { animation: foamBubble 1.0s 0.33s ease-in-out infinite; }
        .fb2 { animation: foamBubble 1.0s 0.66s ease-in-out infinite; }
        .fb3 { animation: foamBubble 1.0s 1.00s ease-in-out infinite; }

        /* ── Liquid sheen ── */
        @keyframes liquidSheen {
          0%,100% { opacity: 0.12; transform: translateX(-100%); }
          50%      { opacity: 0.30; transform: translateX(100%); }
        }
        .liquid-sheen { animation: liquidSheen 1.9s ease-in-out infinite; }

        /* ── Title reveal ── */
        @keyframes titleReveal {
          from { opacity: 0; letter-spacing: 6px; transform: translateY(6px); }
          to   { opacity: 1; letter-spacing: 3px; transform: translateY(0); }
        }
        .pour-title { animation: titleReveal 1.0s 0.25s ease-out both; }

        /* ── Loading glow ── */
        @keyframes loadGlow {
          0%,100% { opacity: 0.55; text-shadow: 0 0 8px rgba(200,150,50,0.25); }
          50%      { opacity: 1;   text-shadow: 0 0 22px rgba(200,150,50,0.75); }
        }
        .load-text { animation: loadGlow 1.8s ease-in-out infinite; }

        /* ── Sparkle ── */
        @keyframes twinkle {
          0%,100% { opacity: 0; transform: scale(0.3); }
          50%      { opacity: 1; transform: scale(1.3); }
        }
        .sp0 { animation: twinkle 1.9s 0.1s ease-in-out infinite; }
        .sp1 { animation: twinkle 1.9s 0.9s ease-in-out infinite; }
        .sp2 { animation: twinkle 1.9s 1.5s ease-in-out infinite; }

        /* ── Tap handle subtle pulse ── */
        @keyframes handlePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,160,60,0); }
          50%      { box-shadow: 0 0 12px 3px rgba(200,160,60,0.12); }
        }
        .tap-handle { animation: handlePulse 2.2s ease-in-out infinite; }
      `}</style>

      {/* Brand */}
      <div className="pour-title" style={{
        color: "#f0c060", fontSize: 28, fontWeight: 700,
        fontFamily: "'Georgia', serif", letterSpacing: "3px",
        marginBottom: 5,
        textShadow: "0 2px 28px rgba(240,180,60,0.55)",
      }}>
        StaroPub
      </div>
      <div className="pour-title" style={{
        color: "#7a5a30", fontSize: 11, letterSpacing: "4px",
        marginBottom: 36, fontFamily: "'Georgia', serif",
        animationDelay: "0.5s",
      }}>
        სტაროპაბი
      </div>

      {/* ─── REDESIGNED TAP + STREAM ─── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Tap handle — tall classic lever shape */}
        <div className="tap-handle" style={{
          width: 22, height: 56,
          background: "linear-gradient(160deg, #4b5563 0%, #374151 40%, #1f2937 70%, #374151 100%)",
          borderRadius: "10px 10px 4px 4px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.7), inset 1px 2px 4px rgba(255,255,255,0.18), inset -1px 0 3px rgba(0,0,0,0.4)",
          position: "relative",
        }}>
          {/* Grip ridges on the handle */}
          {[12, 22, 32].map((top, i) => (
            <div key={i} style={{
              position: "absolute", top, left: 3, right: 3, height: 2,
              background: "rgba(255,255,255,0.1)", borderRadius: 1,
            }} />
          ))}
          {/* Highlight stripe */}
          <div style={{
            position: "absolute", top: 4, left: 5, width: 4, bottom: 10,
            background: "linear-gradient(180deg, rgba(255,255,255,0.22), transparent)",
            borderRadius: 3,
          }} />
        </div>

        {/* Tap base collar */}
        <div style={{
          width: 48, height: 14,
          background: "linear-gradient(180deg, #6b7280 0%, #4b5563 50%, #374151 100%)",
          borderRadius: "4px 4px 6px 6px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,255,0.2)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 3, left: 8, width: 12, height: 3,
            background: "rgba(255,255,255,0.3)", borderRadius: 2,
          }} />
          {/* Nozzle tip */}
          <div style={{
            position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)",
            width: 16, height: 8,
            background: "linear-gradient(180deg, #4b5563, #2d2d2d)",
            borderRadius: "2px 2px 6px 6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }} />
        </div>

        {/* ── Flowing amber stream ── */}
        <div style={{ marginTop: 1, display: "flex", justifyContent: "center" }}>
          <div className="stream-body" style={{
            width: 11, height: 72,
            borderRadius: "2px 2px 5px 5px",
            overflow: "hidden",
          }}>
            <div className="stream-shimmer" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      {/* ─── Beer mug ─── */}
      <div style={{ position: "relative", width: 130, height: 185, marginTop: -2 }}>

        {/* Glass body */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 170,
          background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          borderRadius: "8px 8px 18px 18px",
          border: "2.5px solid rgba(255,255,255,0.16)",
          overflow: "hidden",
          boxShadow: "0 8px 44px rgba(0,0,0,0.75), inset 0 2px 0 rgba(255,255,255,0.1), inset -2px 0 10px rgba(0,0,0,0.2)",
        }}>

          {/* Beer fill column */}
          <div className="master-fill" style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(180deg, #d08820 0%, #b86510 35%, #9a5008 70%, #7a3c04 100%)",
            boxShadow: "inset 0 4px 14px rgba(255,180,30,0.2)",
          }}>
            <div className="liquid-sheen" style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,220,100,0.38), transparent)",
            }} />
            {/* Rising bubbles */}
            {[
              { left: "18%", size: 5, cls: "b0" },
              { left: "48%", size: 4, cls: "b1" },
              { left: "74%", size: 6, cls: "b2" },
              { left: "33%", size: 3, cls: "b3" },
            ].map(({ left, size, cls }, i) => (
              <div key={i} className={cls} style={{
                position: "absolute", bottom: 4, left,
                width: size, height: size,
                background: "rgba(255,210,80,0.7)", borderRadius: "50%",
              }} />
            ))}
            {/* Sparkle glints */}
            {[
              { top: "28%", left: "22%", cls: "sp0", size: 5 },
              { top: "54%", left: "65%", cls: "sp1", size: 4 },
              { top: "40%", left: "44%", cls: "sp2", size: 3 },
            ].map(({ top, left, cls, size }, i) => (
              <div key={i} className={cls} style={{
                position: "absolute", top, left,
                width: size, height: size,
                background: "rgba(255,230,100,0.9)", borderRadius: "50%",
                boxShadow: "0 0 5px rgba(255,220,80,0.8)",
              }} />
            ))}
          </div>

          {/* Foam head */}
          <div className="master-foam" style={{
            position: "absolute", left: -1, right: -1,
            background: "linear-gradient(180deg, #ffffff 0%, #f8f2e4 55%, #eeddb8 100%)",
            borderRadius: "6px 6px 0 0",
            boxShadow: "0 -2px 14px rgba(255,255,255,0.28)",
          }}>
            {[12, 30, 52, 74].map((left, i) => (
              <div key={i} className={`fb${i}`} style={{
                position: "absolute", bottom: 3, left,
                width: 7, height: 7,
                background: "rgba(255,255,255,0.95)", borderRadius: "50%",
                boxShadow: "0 0 4px rgba(255,255,255,0.6)",
              }} />
            ))}
            {[18, 56, 88].map((left, i) => (
              <div key={i} style={{
                position: "absolute", top: -3, left,
                width: 5, height: 8,
                background: "rgba(255,255,255,0.65)",
                borderRadius: "50% 50% 0 0",
              }} />
            ))}
          </div>

          {/* Glass highlight */}
          <div style={{
            position: "absolute", top: 0, left: 6, width: 8, bottom: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Handle */}
        <div style={{
          position: "absolute", right: 0, top: 28, height: 80, width: 22,
          border: "3px solid rgba(255,255,255,0.16)",
          borderLeft: "none",
          borderRadius: "0 14px 14px 0",
          boxShadow: "3px 0 10px rgba(0,0,0,0.3)",
        }} />

        {/* Base */}
        <div style={{
          position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
          width: 124, height: 8,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)",
          borderRadius: "0 0 12px 12px",
          border: "1.5px solid rgba(255,255,255,0.1)",
          borderTop: "none",
        }} />
      </div>

      {/* Loading text */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p className="load-text" style={{
          color: "#c8a050", fontSize: 14, fontWeight: 700,
          fontFamily: "'Georgia', serif", letterSpacing: "0.4px",
          margin: 0,
        }}>
          {LOADING_TEXT[lang] || LOADING_TEXT.ka}
        </p>
        <p style={{ color: "#3a2810", fontSize: 10, letterSpacing: "1.5px", marginTop: 8 }}>
          StaroPub · QR მენიუ
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — SKELETON GRID
// ══════════════════════════════════════════════════════════════════════════════
function SkeletonCard() {
  return (
    <div style={{
      background: "linear-gradient(145deg, #1e1209, #271508)",
      border: "1px solid rgba(100,60,20,0.3)",
      borderRadius: 12, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div className="sk-pulse" style={{ width: "100%", height: 160, background: "#2e1a0a" }} />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sk-pulse" style={{ height: 14, borderRadius: 6, width: "70%", background: "#3a2010" }} />
        <div className="sk-pulse" style={{ height: 10, borderRadius: 6, width: "90%", background: "#2e1a0a" }} />
        <div className="sk-pulse" style={{ height: 10, borderRadius: 6, width: "60%", background: "#2e1a0a" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div className="sk-pulse" style={{ height: 18, borderRadius: 6, width: "36%", background: "#3a2010" }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
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
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — ITEM CARD with slow shimmer (6–8s cycle)
// ══════════════════════════════════════════════════════════════════════════════
// ─── Price helpers ─────────────────────────────────────────────────────────────
// Parses a multi-line price string like "0.4ლ 9.20₾ \n 1ლ 18.9₾"
// Returns an array of { size, price } objects, or null for single prices.
function parseMultiPrice(raw) {
  if (!raw || typeof raw !== "string") return null;
  const lines = raw.split(/\\n|\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  return lines.map(line => {
    // Match an optional leading size token (e.g. "0.4ლ", "1ლ", "500მლ")
    // then a price portion (digits / ₾ / ლ scattered anywhere in the rest)
    const sizeMatch  = line.match(/^([\d.,]+\s*[ლმლმ][\w]*)/u);
    const size  = sizeMatch ? sizeMatch[1].trim() : "";
    const rest  = sizeMatch ? line.slice(sizeMatch[0].length).trim() : line;

    // Extract numeric price from whatever remains
    const numMatch = rest.match(/([\d.,]+)/);
    const num = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : NaN;
    const priceStr = isNaN(num) ? rest : `₾${num.toFixed(2)}`;

    return { size, price: priceStr };
  });
}

function PriceBlock({ item, modal = false }) {
  const multi = parseMultiPrice(item.price);

  if (multi) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: modal ? 10 : 5, width: "100%" }}>
        {multi.map(({ size, price }, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
          }}>
            <span style={{
              color: "#a08060", fontFamily: "'Georgia', serif",
              fontSize: modal ? 14 : 12, fontWeight: 600, letterSpacing: "0.3px",
            }}>
              {size}
            </span>
            <span style={{
              color: "#e8a030", fontFamily: "'Georgia', serif",
              fontSize: modal ? 22 : 15, fontWeight: 700,
            }}>
              {price}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Single price
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: modal ? "flex-start" : "flex-end" }}>
      <span style={{
        color: "#e8a030", fontFamily: "'Georgia', serif",
        fontSize: modal ? 28 : 17, fontWeight: 700,
      }}>
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

function ItemCard({ item, lang, onOpen }) {
  const name    = item[`name_${lang}`] || item.name_ka || "";
  const desc    = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc  = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🍽️";

  // Stable random negative delay — looks already-in-motion, never synchronized
  // useMemo pins the value so re-renders (e.g. lang switch) don't re-randomize
  const shimmerDelay = React.useMemo(
    () => `-${(Math.random() * 8).toFixed(2)}s`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id || item.name_ka]
  );

  return (
    <div
      onClick={() => onOpen && onOpen(item)}
      style={{
        background: "linear-gradient(145deg, #1e1209, #2a1a0a)",
        border: "1px solid rgba(180,120,40,0.2)",
        borderRadius: 12, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        position: "relative",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Image */}
      <div style={{
        width: "100%", height: 160,
        background: "linear-gradient(135deg, #2d1a08 0%, #3d2410 50%, #1a0e04 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {imgSrc && (
          <img src={imgSrc} alt={name} loading="lazy"
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        )}
        <div style={{
          display: imgSrc ? "none" : "flex", fontSize: 48, position: "absolute",
          flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span>{fallback}</span>
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))", height: 60,
        }} />
      </div>

      {/* Text */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px", color: "#f0c060", fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
          {name}
        </h3>
        {desc && (
          <p style={{ margin: "0 0 12px", color: "#a08060", fontSize: 12, lineHeight: 1.5, flex: 1 }}>
            {desc}
          </p>
        )}
        <PriceBlock item={item} />
      </div>

      {/* Diagonal glare — fast sweep, long pause, 5s cycle */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12,
        pointerEvents: "none", zIndex: 3, overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "-50%", left: "-50%",
          width: "55%", height: "200%",
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
function DishModal({ item, lang, onClose }) {
  const name     = item[`name_${lang}`] || item.name_ka || "";
  const desc     = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc   = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🍽️";
  const catObj   = CATEGORY_LABELS[item.category];
  const catLabel = catObj ? catObj[lang] : item.category || "";

  const PRICE_LABEL = { ka: "ფასი", en: "Price", ru: "Цена" };

  // Escape key + body scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
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

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:1000,
          background:"rgba(0,0,0,0.82)",
          backdropFilter:"blur(7px)", WebkitBackdropFilter:"blur(7px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"12px",
          animation:"modalBdIn 0.22s ease-out",
        }}
      >
        {/* Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:"100%", maxWidth:860,
            background:"linear-gradient(160deg,#18100a 0%,#110c06 100%)",
            border:"1px solid rgba(245,158,11,0.22)",
            borderRadius:20, overflow:"hidden",
            boxShadow:"0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(200,160,60,0.05)",
            position:"relative",
            animation:"modalCardIn 0.28s cubic-bezier(0.34,1.15,0.64,1)",
          }}
        >
          {/* Responsive grid */}
          <div
            className="modal-grid modal-scroll"
            style={{
              display:"grid",
              gridTemplateColumns:"1fr",
            }}
          >
            {/* LEFT — Image */}
            <div
              className="modal-img"
              style={{
                minHeight:220,
                background:"linear-gradient(135deg,#2d1a08,#3d2410,#1a0e04)",
                position:"relative", overflow:"hidden",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              {imgSrc && (
                <img
                  src={imgSrc} alt={name} loading="lazy"
                  onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                  style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}
                />
              )}
              <div style={{
                display: imgSrc ? "none" : "flex",
                fontSize:80, position:"absolute", inset:0,
                flexDirection:"column", alignItems:"center", justifyContent:"center",
              }}>
                <span>{fallback}</span>
              </div>
              {/* Bottom fade */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0, height:80,
                background:"linear-gradient(transparent,rgba(17,10,4,0.88))",
                pointerEvents:"none",
              }} />
              {/* Category pill */}
              {catLabel && (
                <div style={{
                  position:"absolute", top:14, left:14,
                  background:"rgba(0,0,0,0.62)",
                  border:"1px solid rgba(180,120,40,0.35)",
                  backdropFilter:"blur(8px)",
                  borderRadius:20, padding:"4px 13px",
                  color:"#c8a050", fontSize:11, fontWeight:600,
                }}>
                  {catLabel}
                </div>
              )}
            </div>

            {/* RIGHT — Content */}
            <div
              className="modal-right"
              style={{ padding:"28px 28px 30px", display:"flex", flexDirection:"column" }}
            >
              {/* Name — leave space for the X button */}
              <h2 style={{
                margin:"0 0 12px", color:"#ffffff",
                fontFamily:"'Georgia',serif",
                fontSize:"clamp(19px,3vw,27px)",
                fontWeight:700, lineHeight:1.25,
                paddingRight:44,
              }}>
                {name}
              </h2>

              {/* Amber divider */}
              <div style={{
                height:1,
                background:"linear-gradient(90deg,rgba(245,158,11,0.45),transparent)",
                marginBottom:16,
              }} />

              {/* Description */}
              {desc ? (
                <p style={{
                  margin:"0 0 22px", color:"#a1a1aa",
                  fontSize:14, lineHeight:1.75, flex:1,
                }}>
                  {desc}
                </p>
              ) : <div style={{ flex:1 }} />}

              {/* Price section */}
              <div style={{
                padding:"16px 18px",
                background:"rgba(255,255,255,0.025)",
                border:"1px solid rgba(180,120,40,0.22)",
                borderRadius:14, marginTop:"auto",
              }}>
                <div style={{
                  color:"#7a5a38", fontSize:10,
                  letterSpacing:"1.5px", textTransform:"uppercase",
                  marginBottom:10,
                }}>
                  {PRICE_LABEL[lang] || "ფასი"}
                </div>
                <PriceBlock item={item} modal={true} />
              </div>
            </div>
          </div>

          {/* Close button — absolute top-right */}
          <button
            onClick={onClose}
            className="modal-close"
            style={{
              position:"absolute", top:14, right:14, zIndex:10,
              width:36, height:36, borderRadius:10,
              background:"rgba(255,255,255,0.07)",
              border:"1px solid rgba(255,255,255,0.11)",
              color:"#909090",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:17, lineHeight:1,
              transition:"all 0.2s",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER
// ══════════════════════════════════════════════════════════════════════════════
function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", marginLeft: "auto" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(180,120,40,0.3)",
        borderRadius: 8, color: "#e0b050", padding: "6px 12px",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
      }}>
        🌐 {LANG_LABELS[lang]}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "linear-gradient(180deg, #1e1005, #140b03)",
          border: "1px solid rgba(180,120,40,0.35)", borderRadius: 10, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.7)", minWidth: 90, zIndex: 200,
        }}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }} style={{
              width: "100%", padding: "9px 14px",
              background: lang === code ? "rgba(184,101,32,0.25)" : "transparent",
              border: "none", borderBottom: "1px solid rgba(180,120,40,0.1)",
              color: lang === code ? "#f0c060" : "#9a7050",
              fontSize: 12, fontWeight: lang === code ? 700 : 500,
              cursor: "pointer", textAlign: "left", transition: "background 0.15s",
            }}
              onMouseEnter={e => { if (lang !== code) e.target.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (lang !== code) e.target.style.background = "transparent"; }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
function IconFacebook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function IconInstagram({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function SiteFooter({ lang, visible }) {
  const socialBtnStyle = {
    display: "inline-flex", alignItems: "center", gap: 6,
    color: "#c8903a", textDecoration: "none",
    padding: "5px 9px", borderRadius: 7,
    border: "1px solid rgba(180,120,40,0.2)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 11, fontWeight: 600, transition: "all 0.2s",
  };
  return (
    <footer style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
      background: "linear-gradient(0deg, rgba(8,4,1,0.99) 0%, rgba(12,6,1,0.97) 100%)",
      borderTop: "1px solid rgba(180,120,40,0.2)",
      padding: "10px 24px 12px",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      // Smooth hide/show driven by visible prop
      transform: visible ? "translateY(0)" : "translateY(100%)",
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "transform 0.32s ease-in-out, opacity 0.32s ease-in-out",
    }}>
      <style>{`
        .footer-grid { display:grid; grid-template-columns:1fr; gap:10px; max-width:1200px; margin:0 auto; text-align:center; align-items:center; }
        @media(min-width:640px) {
          .footer-grid { grid-template-columns:1fr 1fr 1fr; text-align:left; gap:0; }
          .footer-center { text-align:center!important; }
          .footer-right  { text-align:right!important; }
        }
        .social-link:hover { background:rgba(180,120,40,0.12)!important; color:#f0c060!important; border-color:rgba(200,140,40,0.5)!important; }
      `}</style>
      <div className="footer-grid">
        <div style={{ display:"flex", gap:8, justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
          <a href="https://www.facebook.com/StaroPub1" target="_blank" rel="noopener noreferrer" style={socialBtnStyle} className="social-link">
            <IconFacebook size={15} /> Facebook
          </a>
          <a href="https://www.instagram.com/staropub/" target="_blank" rel="noopener noreferrer" style={socialBtnStyle} className="social-link">
            <IconInstagram size={15} /> Instagram
          </a>
        </div>
        <div className="footer-center" style={{ textAlign:"center" }}>
          <div style={{ color:"#c8a050", fontSize:12, fontWeight:700, fontFamily:"'Georgia',serif", lineHeight:1.4 }}>
            {FOOTER_TEXT.tagline[lang]}
          </div>
          <div style={{ marginTop:3, color:"#4a3018", fontSize:9, letterSpacing:"1px" }}>
            StaroPub · სტაროპაბი · QR მენიუ
          </div>
        </div>
        <div className="footer-right" style={{ textAlign:"center" }}>
          <p style={{ color:"#4a3018", fontSize:10, lineHeight:1.5, margin:0 }}>
            {FOOTER_TEXT.copyright[lang]}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — fixed sequential state machine
// ══════════════════════════════════════════════════════════════════════════════
export default function StaroPub() {
  const [lang, setLang]           = useState("ka");
  const [allItems, setAllItems]   = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [error, setError]         = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");

  // ─── Smart footer scroll logic ───────────────────────────────────────────────
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const atBottom =
        window.innerHeight + currentY >= document.documentElement.scrollHeight - 10;
      const atTop = currentY <= 10;

      if (atBottom || atTop) {
        // Always show at page extremes
        setIsFooterVisible(true);
      } else if (currentY > lastScrollY.current) {
        // Scrolling down — hide footer
        setIsFooterVisible(false);
      } else {
        // Scrolling up — reveal footer
        setIsFooterVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // phases: "pour" → "skeleton" → "menu"
  const [phase, setPhase] = useState("pour");

  // Stores fetched rows until we're ready to display them
  const fetchedRows = useRef(null);
  const tabsRef     = useRef(null);

  // ─── Phase 1: Pour timer — always runs for exactly POUR_DURATION_MS ────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fetchedRows.current !== null) {
        // Data already arrived while pour was running → go straight to menu
        setAllItems(fetchedRows.current);
        if (fetchedRows.current.length > 0) {
          setActiveTab(fetchedRows.current[0].category);
        }
        setPhase("menu");
      } else {
        // Data not yet here → show skeleton while we wait
        setPhase("skeleton");
      }
    }, POUR_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!SPREADSHEET_URL || SPREADSHEET_URL === "YOUR_GOOGLE_SHEETS_CSV_URL_HERE") {
      setError("SPREADSHEET_URL არ არის დაყენებული.");
      fetchedRows.current = [];
      // If pour is already done, jump to menu to show the error
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
            // Pour already done — hold skeleton for SKELETON_DELAY_MS then reveal
            setTimeout(() => {
              setAllItems(rows);
              if (rows.length > 0) setActiveTab(rows[0].category);
              setPhase("menu");
            }, SKELETON_DELAY_MS);
            return "skeleton"; // stay in skeleton during the hold
          }
          // Still in "pour" phase — data will be consumed when pour timer fires
          return prev;
        });
      },
      error: (err) => {
        setError(`CSV შეცდომა: ${err.message}`);
        fetchedRows.current = [];
        setPhase(prev => {
          if (prev === "skeleton") {
            setTimeout(() => setPhase("menu"), 300);
          }
          return prev;
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────
  const categories = React.useMemo(() => {
    const seen = new Set();
    return allItems.reduce((acc, item) => {
      if (!seen.has(item.category)) { seen.add(item.category); acc.push(item.category); }
      return acc;
    }, []);
  }, [allItems]);

  const items = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      // Global search — ignore active category, scan entire menu
      return allItems.filter(it =>
        (it.name_ka || "").toLowerCase().includes(q) ||
        (it.name_en || "").toLowerCase().includes(q) ||
        (it.name_ru || "").toLowerCase().includes(q)
      );
    }
    // No query — standard category filter
    return allItems.filter(it => !activeTab || it.category === activeTab);
  }, [allItems, activeTab, searchQuery]);

  const NO_RESULTS_TEXT = { ka: "კერძი ვერ მოიძებნა", en: "No items found", ru: "Ничего не найдено" };
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a0e04 0%, #0d0602 60%, #000 100%)",
      fontFamily: "'Georgia', 'DejaVu Serif', serif",
      color: "#c8a878", position: "relative",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        /* Luxury soft wave — 2.5s diagonal sweep, 5.5s rest, 8s total loop */
        @keyframes diagGleam {
          0%   { transform: translateX(-180%) translateY(180%); opacity: 0; }
          6%   { opacity: 1; }
          31%  { transform: translateX(180%) translateY(-180%); opacity: 1; }
          37%  { opacity: 0; }
          100% { transform: translateX(180%) translateY(-180%); opacity: 0; }
        }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(180,120,40,0.3); border-radius:2px; }
        .tabs-row::-webkit-scrollbar { display:none; }
        @media(min-width:768px)  { .menu-grid { grid-template-columns:repeat(4,1fr)!important; } }
        @media(min-width:1024px) { .menu-grid { grid-template-columns:repeat(5,1fr)!important; } }
      `}</style>

      {/* Phase 1: Full-screen beer pour */}
      {isPour && <MasterPourScreen lang={lang} />}

      {/* Decorative bg orbs (phases 2 & 3) */}
      {!isPour && <>
        <div style={{ position:"fixed", top:-120, right:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(120,60,10,0.15),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:-100, left:-60, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(80,40,5,0.12),transparent 70%)", pointerEvents:"none" }} />
      </>}

      {/* Header (hidden during pour) */}
      {!isPour && (
        <header style={{
          position:"sticky", top:0, zIndex:100,
          background:"linear-gradient(180deg,rgba(15,8,2,0.98) 0%,rgba(10,5,1,0.95) 100%)",
          borderBottom:"1px solid rgba(180,120,40,0.25)",
          backdropFilter:"blur(12px)", padding:"0 16px",
        }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", height:64, gap:12 }}>
            <img src="Images/logo.jpg" alt="StaroPub Logo" loading="lazy"
              style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            />
            <div style={{ display:"none", width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#c87820,#7a4010)", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 2px 12px rgba(200,120,32,0.4)", border:"1px solid rgba(200,160,60,0.3)", flexShrink:0 }}>🍺</div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#f0c060", fontSize:18, fontWeight:700, letterSpacing:"0.5px", lineHeight:1.1 }}>StaroPub</div>
              <div style={{ color:"#8a6040", fontSize:10, letterSpacing:"1px" }}>სტაროპაბი</div>
            </div>
            <LangSwitcher lang={lang} setLang={setLang} />
          </div>

          {isMenu && categories.length > 0 && (
            <div style={{ maxWidth:1200, margin:"0 auto", padding:"8px 0 4px" }}>
              <div style={{ position:"relative" }}>
                {/* Magnifying glass icon */}
                <span style={{
                  position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                  color:"rgba(245,158,11,0.45)", fontSize:15, pointerEvents:"none",
                  lineHeight:1,
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDER[lang]}
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background:"#141210",
                    border:"1px solid rgba(245,158,11,0.20)",
                    borderRadius:12,
                    padding:"10px 14px 10px 40px",
                    color:"#f0c060",
                    fontSize:14,
                    fontFamily:"'Georgia','DejaVu Serif',serif",
                    outline:"none",
                    transition:"border-color 0.2s, box-shadow 0.2s",
                    caretColor:"#f59e0b",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "rgba(245,158,11,0.55)";
                    e.target.style.boxShadow   = "0 0 0 2px rgba(245,158,11,0.08)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(245,158,11,0.20)";
                    e.target.style.boxShadow   = "none";
                  }}
                />
                {/* Clear button — visible only when there's text */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", color:"rgba(245,158,11,0.5)",
                      cursor:"pointer", fontSize:14, lineHeight:1, padding:2,
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {isMenu && categories.length > 0 && (
            <div ref={tabsRef} className="tabs-row" style={{
              display:"flex", gap:4, overflowX:"auto", padding:"8px 0 10px",
              maxWidth:1200, margin:"0 auto", scrollbarWidth:"none",
            }}>
              {categories.map(cat => {
                const catObj = CATEGORY_LABELS[cat];
                const label  = catObj ? catObj[lang] : cat;
                const active = activeTab === cat;
                return (
                  <button key={cat} data-key={cat} onClick={() => scrollTab(cat)} style={{
                    whiteSpace:"nowrap", flexShrink:0,
                    background: active ? "linear-gradient(135deg,#b86520,#7a3a08)" : "rgba(255,255,255,0.04)",
                    border:`1px solid ${active ? "rgba(200,120,40,0.6)" : "rgba(180,120,40,0.15)"}`,
                    color: active ? "#fff" : "#8a6040",
                    borderRadius:20, padding:"7px 14px",
                    fontSize:12, fontWeight: active ? 700 : 500,
                    cursor:"pointer", transition:"all 0.25s",
                    boxShadow: active ? "0 2px 12px rgba(184,101,32,0.4)" : "none",
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </header>
      )}

      {/* Main content */}
      {!isPour && (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"16px 16px 112px" }}>

          {/* Phase 2: Skeleton */}
          {isSkeleton && <SkeletonGrid />}

          {/* Error state */}
          {isMenu && error && (
            <div style={{
              margin:"40px auto", maxWidth:480, padding:"20px 24px",
              background:"rgba(180,40,40,0.12)", border:"1px solid rgba(180,40,40,0.3)",
              borderRadius:12, color:"#e08080", fontSize:13, lineHeight:1.6,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Phase 3: Menu grid */}
          {isMenu && !error && (
            items.length === 0 ? (
              <div style={{
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                minHeight:260, gap:14,
                animation:"fadeIn 0.3s ease-out",
              }}>
                <span style={{ fontSize:48, opacity:0.35 }}>🔍</span>
                <p style={{
                  color:"rgba(180,120,40,0.6)",
                  fontFamily:"'Georgia','DejaVu Serif',serif",
                  fontSize:15, fontWeight:600, letterSpacing:"0.3px",
                  margin:0, textAlign:"center",
                }}>
                  {NO_RESULTS_TEXT[lang]}
                </p>
              </div>
            ) : (
              <div key={`${activeTab}-${searchQuery}`} className="menu-grid" style={{
                display:"grid", gridTemplateColumns:"repeat(2,1fr)",
                gap:12, animation:"fadeIn 0.4s ease-out",
              }}>
                {items.map((item) => (
                  <ItemCard
                    key={item.id || `${item.category}-${item.name_ka}`}
                    item={item} lang={lang}
                    onOpen={setSelectedDish}
                  />
                ))}
              </div>
            )
          )}
        </main>
      )}

      {!isPour && <SiteFooter lang={lang} visible={isFooterVisible} />}

      {/* ── Dish Detail Modal ── */}
      {selectedDish && (
        <DishModal
          item={selectedDish}
          lang={lang}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </div>
  );
}
