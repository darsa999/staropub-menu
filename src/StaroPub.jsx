import React, { useRef, useState, useEffect, useCallback } from "react";
import Papa from "papaparse";

// ──────────────────────────────────────────────────────────────────────────────
// 👇 ჩასვი შენი Google Sheets CSV ბმული აქ
// ──────────────────────────────────────────────────────────────────────────────
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTb9meX1aqFVREVH0ybAXHfgXVUombtxAJV-Out0Uf3jo4XQJoK_TXlxG_twhKtL8Kog_QotnHC3Qp6/pub?output=csv";
// მაგალითად:
// "https://docs.google.com/spreadsheets/d/XXXXXX/export?format=csv&gid=0"
// ──────────────────────────────────────────────────────────────────────────────

// ─── კატეგორიების თარგმანი ───────────────────────────────────────────────────
const CATEGORY_LABELS = {
  grill:     { ka: "🔥 გრილი",              en: "🔥 Grill",        ru: "🔥 Гриль" },
  khinkali:  { ka: "🥟 ხინკალი",            en: "🥟 Khinkali",     ru: "🥟 Хинкали" },
  hot_dish:  { ka: "🍲 ცხელი კერძები",      en: "🍲 Hot Dishes",   ru: "🍲 Горячие блюда" },
  soup:      { ka: "🍜 წვნიანი კერძები",    en: "🍜 Soups",        ru: "🍜 Супы" },
  salad:     { ka: "🥗 სალათები",           en: "🥗 Salads",       ru: "🥗 Салаты" },
  cheese:    { ka: "🧀 ყველი",              en: "🧀 Cheese",       ru: "🧀 Сыр" },
  bakery:    { ka: "🫓 ცომეული",            en: "🫓 Bakery",       ru: "🫓 Выпечка" },
  fish:      { ka: "🐟 თევზეული",           en: "🐟 Fish",         ru: "🐟 Рыба" },
  side:      { ka: "🍚 გარნირი",            en: "🍚 Side Dishes",  ru: "🍚 Гарниры" },
  beer:      { ka: "🍺 ლუდი",              en: "🍺 Beer",         ru: "🍺 Пиво" },
  hot_drink: { ka: "☕ ცხელი სასმელები",    en: "☕ Hot Drinks",   ru: "☕ Горячие напитки" },
  alcohol:   { ka: "🥃 სპირტიანი სასმელები",en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  spirits:   { ka: "🥃 სპირტიანი სასმელები",en: "🥃 Spirits",      ru: "🥃 Крепкие напитки" },
  sauces:    { ka: "🫙 სოუსები",            en: "🫙 Sauces",       ru: "🫙 Соусы" },
  snacks:    { ka: "🍟 წასახემსებელი",      en: "🍟 Snacks",       ru: "🍟 Закуски" },
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

// ─── SVG: Facebook ────────────────────────────────────────────────────────────
function IconFacebook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

// ─── SVG: Instagram ───────────────────────────────────────────────────────────
function IconInstagram({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function SiteFooter({ lang }) {
  const socialBtnStyle = {
    display: "inline-flex", alignItems: "center", gap: 6,
    color: "#c8903a", textDecoration: "none",
    padding: "5px 9px", borderRadius: 7,
    border: "1px solid rgba(180,120,40,0.2)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 11, fontWeight: 600,
    transition: "all 0.2s",
  };

  return (
    <footer style={{
      position: "sticky", bottom: 0, zIndex: 50,
      background: "linear-gradient(0deg, rgba(8,4,1,0.99) 0%, rgba(12,6,1,0.97) 100%)",
      borderTop: "1px solid rgba(180,120,40,0.2)",
      padding: "10px 24px 12px",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
          align-items: center;
        }
        @media (min-width: 640px) {
          .footer-grid { grid-template-columns: 1fr 1fr 1fr; text-align: left; gap: 0; }
          .footer-center { text-align: center !important; }
          .footer-right  { text-align: right !important; }
        }
        .social-link:hover { background: rgba(180,120,40,0.12) !important; color: #f0c060 !important; border-color: rgba(200,140,40,0.5) !important; }
      `}</style>

      <div className="footer-grid">
        {/* მარცხენა — სოციალური ქსელები */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="https://www.facebook.com/StaroPub1"
            target="_blank"
            rel="noopener noreferrer"
            style={socialBtnStyle}
            className="social-link"
          >
            <IconFacebook size={15} /> Facebook
          </a>
          <a
            href="https://www.instagram.com/staropub/"
            target="_blank"
            rel="noopener noreferrer"
            style={socialBtnStyle}
            className="social-link"
          >
            <IconInstagram size={15} /> Instagram
          </a>
        </div>

        {/* ცენტრი — სლოგანი */}
        <div className="footer-center" style={{ textAlign: "center" }}>
          <div style={{ color: "#c8a050", fontSize: 12, fontWeight: 700, fontFamily: "'Georgia',serif", lineHeight: 1.4 }}>
            {FOOTER_TEXT.tagline[lang]}
          </div>
          <div style={{ marginTop: 3, color: "#4a3018", fontSize: 9, letterSpacing: "1px" }}>
            StaroPub · სტაროპაბი · QR მენიუ
          </div>
        </div>

        {/* მარჯვენა — copyright მხოლოდ */}
        <div className="footer-right" style={{ textAlign: "center" }}>
          <p style={{ color: "#4a3018", fontSize: 10, lineHeight: 1.5, margin: 0 }}>
            {FOOTER_TEXT.copyright[lang]}
          </p>
        </div>
      </div>
    </footer>
  );
}

const CATEGORY_ICONS = {
  grill: "🔥", khinkali: "🥟", hot_dish: "🍲", soup: "🍜", salad: "🥗",
  cheese: "🧀", bakery: "🫓", fish: "🐟", side: "🍚", beer: "🍺",
  hot_drink: "☕", alcohol: "🥃", spirits: "🥃", sauces: "🫙", snacks: "🍟",
};

const LANG_LABELS = { ka: "ქარ", en: "ENG", ru: "РУС" };

// ─── ფასის ფორმატი ────────────────────────────────────────────────────────────
function formatPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return p; // შეინახე ორიგინალი თუ რიცხვი არ არის
  return `₾${n.toFixed(2)}`;
}

// ─── ბარათის ფასის ბლოკი ─────────────────────────────────────────────────────
function PriceBlock({ item }) {
  // Google Sheets-ის ფასი პირდაპირ გამოჩნდება
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      <span style={{
        color: "#e8a030", fontFamily: "'Georgia', serif",
        fontSize: 17, fontWeight: 700,
      }}>
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

// ─── პროდუქტის ბარათი ────────────────────────────────────────────────────────
function ItemCard({ item, lang }) {
  const name = item[`name_${lang}`] || item.name_ka || "";
  const desc = item[`desc_${lang}`] || item.desc_ka || "";
  const imgSrc = item.image ? `Images/${item.image}` : "";
  const fallback = CATEGORY_ICONS[item.category] || "🍽️";

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #1e1209, #2a1a0a)",
        border: "1px solid rgba(180,120,40,0.2)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
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
      {/* სურათი */}
      <div style={{
        width: "100%", height: 160,
        background: "linear-gradient(135deg, #2d1a08 0%, #3d2410 50%, #1a0e04 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        )}
        <div style={{
          display: imgSrc ? "none" : "flex",
          fontSize: 48, position: "absolute",
          flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span>{fallback}</span>
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))", height: 60,
        }} />
      </div>

      {/* ტექსტი */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          margin: "0 0 6px", color: "#f0c060",
          fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3,
        }}>{name}</h3>
        {desc && (
          <p style={{
            margin: "0 0 12px", color: "#a08060",
            fontSize: 12, lineHeight: 1.5, flex: 1,
          }}>{desc}</p>
        )}
        <PriceBlock item={item} />
      </div>
    </div>
  );
}

// ─── ენის გადამრთველი ─────────────────────────────────────────────────────────
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
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(180,120,40,0.3)",
          borderRadius: 8, color: "#e0b050",
          padding: "6px 12px", fontSize: 12, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          transition: "all 0.2s",
        }}
      >
        🌐 {LANG_LABELS[lang]}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "linear-gradient(180deg, #1e1005, #140b03)",
          border: "1px solid rgba(180,120,40,0.35)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
          minWidth: 90, zIndex: 200,
        }}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                width: "100%", padding: "9px 14px",
                background: lang === code ? "rgba(184,101,32,0.25)" : "transparent",
                border: "none",
                borderBottom: "1px solid rgba(180,120,40,0.1)",
                color: lang === code ? "#f0c060" : "#9a7050",
                fontSize: 12, fontWeight: lang === code ? 700 : 500,
                cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
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

// ─── Skeleton ბარათი ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "linear-gradient(145deg, #2c1a0a, #3a2210)",
      border: "1px solid rgba(180,120,40,0.25)",
      borderRadius: 12, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* სურათის ადგილი */}
      <div className="sk-pulse" style={{
        width: "100%", height: 160,
        background: "linear-gradient(135deg, #52300f, #623a12, #4e2d0c)",
      }} />
      {/* ტექსტის ადგილი */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* სახელი */}
        <div className="sk-pulse" style={{ height: 14, borderRadius: 6, width: "72%", background: "#5a3414" }} />
        {/* აღწერა — 2 ხაზი */}
        <div className="sk-pulse" style={{ height: 11, borderRadius: 6, width: "92%", background: "#4a2c10" }} />
        <div className="sk-pulse" style={{ height: 11, borderRadius: 6, width: "65%", background: "#4a2c10" }} />
        {/* ფასი */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div className="sk-pulse" style={{ height: 20, borderRadius: 6, width: "38%", background: "#5a3414" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Grid ────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <>
      <style>{`
        @keyframes skPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        .sk-pulse { animation: skPulse 1.0s ease-in-out infinite; }
        .skeleton-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        @media (min-width: 768px)  { .skeleton-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @media (min-width: 1024px) { .skeleton-grid { grid-template-columns: repeat(5,1fr) !important; } }
      `}</style>
      <div className="skeleton-grid">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  );
}

// ─── მთავარი კომპონენტი ───────────────────────────────────────────────────────
export default function StaroPub() {
  const [lang, setLang] = useState("ka");
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const tabsRef = useRef(null);

  // ─── Google Sheets CSV ჩატვირთვა ─────────────────────────────────────────
  useEffect(() => {
    if (!SPREADSHEET_URL || SPREADSHEET_URL === "YOUR_GOOGLE_SHEETS_CSV_URL_HERE") {
      setError("SPREADSHEET_URL არ არის დაყენებული. გთხოვ, StaroPub.jsx-ში ჩასვი შენი Google Sheets CSV ბმული.");
      setLoading(false);
      return;
    }

    Papa.parse(SPREADSHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.filter(r => r.id && r.category && r.name_ka);
        // 1000ms ხელოვნური დაყოვნება skeleton-ის ჩვენებისთვის
        setTimeout(() => {
          setAllItems(rows);
          if (rows.length > 0) {
            setActiveTab(rows[0].category);
          }
          setLoading(false);
        }, 1000);
      },
      error: (err) => {
        setError(`CSV ჩატვირთვის შეცდომა: ${err.message}`);
        setLoading(false);
      },
    });
  }, []);

  // ─── კატეგორიების სია (მხოლოდ ისეთები, რაც მონაცემებშია) ─────────────────
  const categories = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    allItems.forEach(item => {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        result.push(item.category);
      }
    });
    return result;
  }, [allItems]);

  // ─── ამ კატეგორიის ელემენტები ────────────────────────────────────────────
  const items = React.useMemo(
    () => allItems.filter(it => it.category === activeTab),
    [allItems, activeTab]
  );

  const scrollTab = useCallback((key) => {
    setActiveTab(key);
    if (tabsRef.current) {
      const btn = tabsRef.current.querySelector(`[data-key="${key}"]`);
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a0e04 0%, #0d0602 60%, #000 100%)",
      fontFamily: "'Georgia', 'DejaVu Serif', serif",
      color: "#c8a878",
      position: "relative",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.3); border-radius: 2px; }
        .tabs-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ─── დეკორატიული ფონი ─── */}
      <div style={{ position: "fixed", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,60,10,0.15), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,40,5,0.12), transparent 70%)", pointerEvents: "none" }} />

      {/* ─── Header ─── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(180deg, rgba(15,8,2,0.98) 0%, rgba(10,5,1,0.95) 100%)",
        borderBottom: "1px solid rgba(180,120,40,0.25)",
        backdropFilter: "blur(12px)",
        padding: "0 16px",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center",
          height: 64, gap: 12,
        }}>
          {/* ლოგო */}
          <img
            src="Images/logo.jpg"
            alt="StaroPub Logo"
            loading="lazy"
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 12px rgba(200,120,32,0.4)", border: "1px solid rgba(200,160,60,0.3)", flexShrink: 0 }}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
          <div style={{ display: "none", width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#c87820,#7a4010)", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 2px 12px rgba(200,120,32,0.4)", border: "1px solid rgba(200,160,60,0.3)", flexShrink: 0 }}>🍺</div>

          {/* სახელი */}
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f0c060", fontSize: 18, fontWeight: 700, letterSpacing: "0.5px", lineHeight: 1.1 }}>StaroPub</div>
            <div style={{ color: "#8a6040", fontSize: 10, letterSpacing: "1px" }}>სტაროპაბი</div>
          </div>

          {/* ენის გადამრთველი */}
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        {/* ─── ტაბები ─── */}
        {!loading && !error && categories.length > 0 && (
          <div ref={tabsRef} className="tabs-row" style={{
            display: "flex", gap: 4, overflowX: "auto", padding: "8px 0 10px",
            maxWidth: 1200, margin: "0 auto", scrollbarWidth: "none",
          }}>
            {categories.map(cat => {
              const catObj = CATEGORY_LABELS[cat];
              const label = catObj ? catObj[lang] : cat;
              const active = activeTab === cat;
              return (
                <button
                  key={cat}
                  data-key={cat}
                  onClick={() => scrollTab(cat)}
                  style={{
                    whiteSpace: "nowrap", flexShrink: 0,
                    background: active ? "linear-gradient(135deg,#b86520,#7a3a08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "rgba(200,120,40,0.6)" : "rgba(180,120,40,0.15)"}`,
                    color: active ? "#fff" : "#8a6040",
                    borderRadius: 20, padding: "7px 14px",
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: "pointer", transition: "all 0.25s",
                    boxShadow: active ? "0 2px 12px rgba(184,101,32,0.4)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ─── მთავარი კონტენტი ─── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 40px" }}>
        {loading && <SkeletonGrid />}

        {error && (
          <div style={{
            margin: "40px auto", maxWidth: 480, padding: "20px 24px",
            background: "rgba(180,40,40,0.12)", border: "1px solid rgba(180,40,40,0.3)",
            borderRadius: 12, color: "#e08080", fontSize: 13, lineHeight: 1.6,
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <div
            key={activeTab}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              animation: "fadeIn 0.3s ease-out",
            }}
            className="menu-grid"
          >
            <style>{`
              @media (min-width: 768px)  { .menu-grid { grid-template-columns: repeat(4, 1fr) !important; } }
              @media (min-width: 1024px) { .menu-grid { grid-template-columns: repeat(5, 1fr) !important; } }
            `}</style>
            {items.map(item => (
              <ItemCard key={item.id || `${item.category}-${item.name_ka}`} item={item} lang={lang} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
