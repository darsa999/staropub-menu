import React, { useRef, useState } from "react";

const MENU = {
  beer: {
    label: "🍺 ლუდის მენიუ",
    items: [
      { id: "b1", name: "ბიტბურგერი", desc: "ჩამოსასხმელი", price: 9.20, price2: 18.80, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/ლუდი.jpg" },
      { id: "b2", name: "ბენედიქტინერ ჰელი", desc: "ჩამოსასხმელი", price: 8.90, price2: 17.80, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/გაუფილტრავი ბენედიქტინერ ჰელი.jpg" },
      { id: "b3", name: "ბენედიქტინერ გაუფ.", desc: "ჩამოსასხმელი", price: 10.50, price2: 21.00, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/გაუფილტრავი ბენედიქტინერ ჰელი.jpg" },
      { id: "b4", name: "კილსნერ ურქველი", desc: "ჩამოსასხმელი", price: 9.70, price2: 19.40, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/ლუდი.jpg" },
      { id: "b5", name: "შოფერ-ჰოფერი", desc: "ჩამოსასხმელი", price: 8.60, price2: 17.20, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/გაუფილტრავი შოფერ-ჰოფერი.jpg" },
      { id: "b6", name: "საფირმო ლუდი", desc: "ჩამოსასხმელი", price: 6.90, price2: 13.90, unit1: "0.4 ლ", unit2: "1 ლ", img: "images/ლუდი.jpg" },
    ],
  },
  starters: {
    label: "🥗 წინასუფრობი",
    items: [
      { id: "s1", name: "ხახვის ბეჭდები", desc: "ოქროსფრად შემწვარი ხახვი ნაღები სოუსით", price: 12, img: "images/Gemini_Generated_Image_2whj4j2whj4j2whj.png" },
      { id: "s2", name: "ბრუსკეტა", desc: "შემწვარი პური პომიდვრით, ნიორით და ბაზილიკით", price: 10, img: "images/Gemini_Generated_Image_7rknuj7rknuj7rkn.png" },
      { id: "s3", name: "ნაჭდევი ხორცი", desc: "შებოლილი ხორცის ასორტი ქართული მწნილებით", price: 18, img: "images/Gemini_Generated_Image_y72zhy72zhy72zhy729.png" },
      { id: "s4", name: "ყველის ბრტყელი", desc: "4 სახეობის ქართული ყველი თაფლით და ნიგოზით", price: 16, img: "images/ყველის დაფა.png" },
    ],
  },
  mains: {
    label: "🍖 მთავარი კერძი",
    items: [
      { id: "m1", name: "პუბ ბურგერი", desc: "200გ საქონლის ხორცი, ბეკონი, ჩედარი, გემრიელი სოუსი", price: 22, img: "images/საფირმო ბურგერი ნუგეტები.jpg" },
      { id: "m2", name: "შებოლილი ნეკნები", desc: "BBQ სოუსში შემარინებული, 6 საათი მოხარშული", price: 28, img: "images/ლორის ნეკნები 1.jpg" },
      { id: "m3", name: "თევზის & ჩიფსი", desc: "ლუდის ცომში შემწვარი კოდი, ხრუმუნა კარტოფილი", price: 20, img: "images/თევზის დაფა.png" },
      { id: "m4", name: "ბანვარი ქათამი", desc: "ჰერბებში შემარინებული მთელი ფეხი, ბრინჯით", price: 18, img: "images/ქათმის მწვადი.jpg" },
    ],
  },
  snacks: {
    label: "🍟 სნეკები",
    items: [
      { id: "sn1", name: "ცხელი ჩიფსი", desc: "ნატურალური კარტოფილი, ზღვის მარილი, ნიორი", price: 8, img: "images/კარტოფილი ფრი.jpg" },
      { id: "sn2", name: "ქინძი-ყველის ფლატბრედი", desc: "ხრუმუნა თხელი პური, სულგუნი, ქინძი", price: 14, img: "images/საფირმო ხაჭაპური.jpg" },
      { id: "sn3", name: "ნეჭვი Wings", desc: "10 ცალი, ორი სოუსი — BBQ და ნიორ-ლიმნი", price: 16, img: "images/ქათმის ფრთები.jpg" },
    ],
  },
  hotdrinks: {
    label: "☕ ცხელი სასმელები",
    items: [
      { id: "hd1", name: "ესპრესო", desc: "კლასიკური ესპრესო — კონცენტრირებული და ძლიერი", price: 5.00, img: "images/espresso.png" },
      { id: "hd2", name: "ამერიკანო", desc: "ესპრესო გაწყლიანებული — რბილი და სასიამოვნო", price: 5.00, img: "images/americano.png" },
      { id: "hd3", name: "კაპუჩინო", desc: "ესპრესო ნაფოთქი რძით — ნაზი ქაფი", price: 7.00, img: "images/cappuccino.png" },
      { id: "hd4", name: "ლატე", desc: "ესპრესო ცხელ რძესთან — კრემისებური ტექსტურა", price: 7.00, img: "images/latte.png" },
      { id: "hd5", name: "თურქული ყავა", desc: "ტრადიციული მოხარშული ყავა — ნამდვილი გემო", price: 6.00, img: "images/turkish-coffee.png" },
      { id: "hd6", name: "ჩაი", desc: "სხვადასხვა სახეობის ჩაი — შავი, მწვანე, ბალახოვანი", price: 4.00, img: "images/tea.png" },
    ],
  },
  spirits: {
    label: "🥃 ძლიერი ალკოჰოლი",
    items: [
      { id: "sp1", name: "არაყი აბსოლუტი", desc: "შვედური პრემიუმ არაყი", price: 55.90, unit1: "0.5 ლ", img: "images/absolut.jpg" },
      { id: "sp2", name: "არაყი ფინლანდია", desc: "ფინური სუფთა არაყი", price: 55.90, unit1: "0.5 ლ", img: "images/finlandia.jpg" },
      { id: "sp3", name: "არაყი სტალიჩნაია", desc: "კლასიკური სლავური ტრადიცია", price: 44.90, unit1: "0.5 ლ", img: "images/stolichnaya.jpg" },
      { id: "sp4", name: "კონიაკი სარაჯიშვილი 5★", desc: "ქართული კონიაკი — 5 ვარსკვლავი", price: 49.90, unit1: "0.5 ლ", img: "images/sarajishvili.jpg" },
      { id: "sp5", name: "სოფლის ჭაჭა", desc: "ქართული სოფლის ჭაჭა", price: 9.90, price2: 19.90, unit1: "0.250 ლ", unit2: "0.5 ლ", img: "images/chacha.jpg" },
    ],
  },
};

const CATEGORY_KEYS = Object.keys(MENU);

function formatPrice(p) { return `₾${p.toFixed(2)}`; }

// Emoji fallback per category
function fallbackEmoji(item) {
  if (MENU.beer.items.find(i => i.id === item.id)) return "🍺";
  if (MENU.starters?.items?.find(i => i.id === item.id)) return "🥗";
  if (MENU.hotdrinks?.items?.find(i => i.id === item.id)) return "☕";
  if (MENU.spirits?.items?.find(i => i.id === item.id)) return "🥃";
  return "🍽️";
}

function PriceBlock({ item }) {
  // Dual price: show two rows (unit1/price + unit2/price2)
  if (item.price2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#7a5a38", fontSize: 11, minWidth: 48 }}>{item.unit1}</span>
          <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700 }}>{formatPrice(item.price)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#7a5a38", fontSize: 11, minWidth: 48 }}>{item.unit2}</span>
          <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700 }}>{formatPrice(item.price2)}</span>
        </div>
      </div>
    );
  }
  // Single price with optional unit label
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {item.unit1 && <span style={{ color: "#7a5a38", fontSize: 11 }}>{item.unit1}</span>}
      <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700 }}>{formatPrice(item.price)}</span>
    </div>
  );
}

function ItemCard({ item }) {
  return (
    <div
      className="item-card"
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
      <div style={{
        width: "100%", height: 160,
        background: "linear-gradient(135deg, #2d1a08 0%, #3d2410 50%, #1a0e04 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <img
          src={item.img}
          alt={item.name}
          loading="lazy"
          onError={e => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
        <div style={{
          display: "none", fontSize: 48, position: "absolute",
          flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span>{fallbackEmoji(item)}</span>
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))", height: 60,
        }} />
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          margin: "0 0 6px", color: "#f0c060",
          fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3,
        }}>{item.name}</h3>
        <p style={{
          margin: "0 0 12px", color: "#a08060",
          fontSize: 12, lineHeight: 1.5, flex: 1,
        }}>{item.desc}</p>
        <PriceBlock item={item} />
      </div>
    </div>
  );
}

export default function StaroPub() {
  const [activeTab, setActiveTab] = useState("beer");
  const tabsRef = useRef(null);

  const scrollTab = (key) => {
    setActiveTab(key);
    if (tabsRef.current) {
      const btn = tabsRef.current.querySelector(`[data-key="${key}"]`);
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const items = MENU[activeTab]?.items || [];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #1a0e04 0%, #0d0602 60%, #000 100%)",
      fontFamily: "'Georgia', 'DejaVu Serif', serif",
      color: "#c8a878",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.3); border-radius: 2px; }
        .tabs-row::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{
        position: "fixed", top: -120, right: -80, width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(120,60,10,0.15), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -100, left: -60, width: 320, height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(80,40,5,0.12), transparent 70%)",
        pointerEvents: "none",
      }} />

      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(180deg, rgba(15,8,2,0.98) 0%, rgba(10,5,1,0.95) 100%)",
        borderBottom: "1px solid rgba(180,120,40,0.25)",
        backdropFilter: "blur(12px)",
        padding: "0 16px",
      }}>
        <div style={{
          maxWidth: 520, margin: "0 auto",
          display: "flex", alignItems: "center",
          height: 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="images/logo.jpg"
              alt="StaroPub Logo"
              loading={"lazy"}

              style={{
                width: 40, height: 40, borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 2px 12px rgba(200,120,32,0.4)",
                border: "1px solid rgba(200,160,60,0.3)",
              }}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />

            <div>
              <div style={{ color: "#f0c060", fontSize: 18, fontWeight: 700, letterSpacing: "0.5px", lineHeight: 1.1 }}>StaroPub</div>
              <div style={{ color: "#8a6040", fontSize: 10, letterSpacing: "1px" }}>სტაროპაბი</div>
            </div>
          </div>
        </div>

        <div ref={tabsRef} className="tabs-row" style={{
          display: "flex", gap: 4, overflowX: "auto", padding: "8px 0 10px",
          maxWidth: 520, margin: "0 auto", scrollbarWidth: "none",
        }}>
          {CATEGORY_KEYS.map(key => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                data-key={key}
                onClick={() => scrollTab(key)}
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
                {MENU[key].label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "16px 12px 100px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
          animation: "fadeIn 0.3s ease-out",
        }}>
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      </main>

      <footer style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(0deg, rgba(10,5,1,0.98), rgba(10,5,1,0.9))",
        borderTop: "1px solid rgba(180,120,40,0.15)",
        padding: "10px 16px 14px",
        textAlign: "center", fontSize: 10, color: "#4a3020",
        backdropFilter: "blur(8px)",
      }}>
        StaroPub · სტაროპაბი · QR მენიუ
      </footer>
    </div>
  );
}
