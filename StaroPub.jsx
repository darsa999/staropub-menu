import { useState, useEffect, useRef } from "react";

const MENU = {
  beer: {
    label: "🍺 ლუდის მენიუ",
    items: [
      { id: "b1", name: "Natakhtari Draft", desc: "ქართული ნატახტარი, ახალი ლუდი — სუფთა, სასიამოვნო გემო", price: 6, img: "/images/natakhtari.jpg" },
      { id: "b2", name: "Heineken", desc: "ჰოლანდიური ლაგერი, ხარისხიანი და ახალი", price: 8, img: "/images/heineken.jpg" },
      { id: "b3", name: "Guinness Stout", desc: "ირლანდიური შავი ლუდი — კრემისებური ქაფით", price: 10, img: "/images/guinness.jpg" },
      { id: "b4", name: "Weizen Wheat Beer", desc: "გერმანული ხორბლის ლუდი, ნათელი და ნაზი", price: 9, img: "/images/weizen.jpg" },
      { id: "b5", name: "IPA Craft", desc: "სახლის ხელოსნური IPA — სომხური სურის ნოტებით", price: 11, img: "/images/ipa.jpg" },
      { id: "b6", name: "Krusovice", desc: "ჩეხური პრემიუმ ლაგერი, ოქროსფერი ბროლი", price: 8, img: "/images/krusovice.jpg" },
    ],
  },
  starters: {
    label: "🥗 წინასუფრობი",
    items: [
      { id: "s1", name: "ხახვის ბეჭდები", desc: "ოქროსფრად შემწვარი ხახვი ნაღები სოუსით", price: 12, img: "/images/onion-rings.jpg" },
      { id: "s2", name: "ბრუსკეტა", desc: "შემწვარი პური პომიდვრით, ნიორით და ბაზილიკით", price: 10, img: "/images/bruschetta.jpg" },
      { id: "s3", name: "ნაჭდევი ხორცი", desc: "შებოლილი ხორცის ასორტი ქართული მწნილებით", price: 18, img: "/images/charcuterie.jpg" },
      { id: "s4", name: "ყველის ბრტყელი", desc: "4 სახეობის ქართული ყველი თაფლით და ნიგოზით", price: 16, img: "/images/cheese-board.jpg" },
    ],
  },
  mains: {
    label: "🍖 მთავარი კერძი",
    items: [
      { id: "m1", name: "პუბ ბურგერი", desc: "200გ საქონლის ხორცი, ბეკონი, ჩედარი, გემრიელი სოუსი", price: 22, img: "/images/pub-burger.jpg" },
      { id: "m2", name: "შებოლილი ნეკნები", desc: "BBQ სოუსში შემარინებული, 6 საათი მოხარშული", price: 28, img: "/images/ribs.jpg" },
      { id: "m3", name: "თევზის & ჩიფსი", desc: "ლუდის ცომში შემწვარი კოდი, ხრუმუნა კარტოფილი", price: 20, img: "/images/fish-chips.jpg" },
      { id: "m4", name: "ბანვარი ქათამი", desc: "ჰერბებში შემარინებული მთელი ფეხი, ბრინჯით", price: 18, img: "/images/roast-chicken.jpg" },
    ],
  },
  snacks: {
    label: "🍟 სნეკები",
    items: [
      { id: "sn1", name: "ცხელი ჩიფსი", desc: "ნატურალური კარტოფილი, ზღვის მარილი, ნიორი", price: 8, img: "/images/fries.jpg" },
      { id: "sn2", name: "ქინძი-ყველის ფლატბრედი", desc: "ხრუმუნა თხელი პური, სულგუნი, ქინძი", price: 14, img: "/images/flatbread.jpg" },
      { id: "sn3", name: "ნეჭვი Wings", desc: "10 ცალი, ორი სოუსი — BBQ და ნიორ-ლიმნი", price: 16, img: "/images/wings.jpg" },
    ],
  },
  drinks: {
    label: "🥤 სასმელები",
    items: [
      { id: "d1", name: "ლიმონათი", desc: "სახლის კოლა, პიტნა, შაქრის სიროფი", price: 6, img: "/images/lemonade.jpg" },
      { id: "d2", name: "კარგი ყავა", desc: "ესპრესო, ამერიკანო, ლატე — კავკასიური ნაზავი", price: 5, img: "/images/coffee.jpg" },
      { id: "d3", name: "ბუნებრივი წვენი", desc: "სეზონური ხილის პრესი, ყოველ დღე ახალი", price: 7, img: "/images/juice.jpg" },
    ],
  },
};

const CATEGORY_KEYS = Object.keys(MENU);

function formatPrice(p) { return `₾${p.toFixed(2)}`; }

function ItemCard({ item, onAdd }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };
  return (
    <div className="item-card" style={{
      background: "linear-gradient(145deg, #1e1209, #2a1a0a)",
      border: "1px solid rgba(180,120,40,0.2)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.6)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{
        width: "100%", height: 160, background: "linear-gradient(135deg, #2d1a08 0%, #3d2410 50%, #1a0e04 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden"
      }}>
        <img
          src={item.img}
          alt={item.name}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
        <div style={{ display: "none", fontSize: 48, position: "absolute", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span>{MENU.beer.items.find(i => i.id === item.id) ? "🍺" : MENU.starters?.items?.find(i => i.id === item.id) ? "🥗" : "🍽️"}</span>
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))", height: 60
        }} />
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px", color: "#f0c060", fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ margin: "0 0 14px", color: "#a08060", fontSize: 12, lineHeight: 1.5, flex: 1 }}>{item.desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#e8a030", fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700 }}>{formatPrice(item.price)}</span>
          <button onClick={handleAdd} style={{
            background: added ? "linear-gradient(135deg,#4a8c3c,#2d6b25)" : "linear-gradient(135deg,#b86520,#8a4510)",
            color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s",
            display: "flex", alignItems: "center", gap: 5,
            boxShadow: added ? "0 2px 12px rgba(74,140,60,0.5)" : "0 2px 8px rgba(0,0,0,0.4)",
          }}>
            {added ? "✓ დამატებულია" : "+ კალათში"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartModal({ cart, onClose, onIncrease, onDecrease, onRemove, onOrder }) {
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const [ordered, setOrdered] = useState(false);
  const handleOrder = () => {
    setOrdered(true);
    setTimeout(() => { setOrdered(false); onOrder(); onClose(); }, 2200);
  };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(180deg, #1a0e04, #120900)",
        borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 520, maxHeight: "85vh",
        border: "1px solid rgba(180,120,40,0.3)",
        borderBottom: "none",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
        animation: "slideUp 0.3s ease-out",
      }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid rgba(180,120,40,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, color: "#f0c060", fontFamily: "'Georgia', serif", fontSize: 20 }}>🛒 შეკვეთის კალათი</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#a08060", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "10px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#6a4a30" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🍺</div>
              <p style={{ margin: 0, fontSize: 15 }}>კალათი ცარიელია</p>
            </div>
          ) : cart.map(it => (
            <div key={it.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e0b050", fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                <div style={{ color: "#7a5a38", fontSize: 12 }}>{formatPrice(it.price)} × {it.qty}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => onDecrease(it.id)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(180,120,40,0.3)", color: "#e0b050", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: "#f0c060", width: 24, textAlign: "center", fontWeight: 700 }}>{it.qty}</span>
                <button onClick={() => onIncrease(it.id)} style={{ background: "rgba(180,100,20,0.3)", border: "1px solid rgba(180,120,40,0.4)", color: "#e0b050", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              <div style={{ minWidth: 60, textAlign: "right" }}>
                <div style={{ color: "#e8a030", fontWeight: 700, fontSize: 14 }}>{formatPrice(it.price * it.qty)}</div>
                <button onClick={() => onRemove(it.id)} style={{ background: "none", border: "none", color: "#6a3030", cursor: "pointer", fontSize: 11, padding: 0, marginTop: 2 }}>წაშლა</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: "16px 20px 28px", borderTop: "1px solid rgba(180,120,40,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "#a08060", fontSize: 15 }}>სულ:</span>
              <span style={{ color: "#f0c060", fontSize: 20, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{formatPrice(total)}</span>
            </div>
            <button onClick={handleOrder} disabled={ordered} style={{
              width: "100%", padding: "16px",
              background: ordered ? "linear-gradient(135deg,#2d6b25,#1a4a15)" : "linear-gradient(135deg,#b86520,#8a4510,#b86520)",
              backgroundSize: ordered ? undefined : "200% 100%",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 700, cursor: ordered ? "default" : "pointer",
              fontFamily: "'Georgia', serif",
              boxShadow: "0 4px 20px rgba(184,101,32,0.5)",
              transition: "all 0.3s",
              letterSpacing: "0.5px",
            }}>
              {ordered ? "✅ შეკვეთა გაგზავნილია! გმადლობთ!" : "შეკვეთის გაფორმება"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaroPub() {
  const [activeTab, setActiveTab] = useState("beer");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const tabsRef = useRef(null);

  const totalItems = cart.reduce((s, it) => s + it.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setToast(`"${item.name}" კალათში დაემატა`);
    setTimeout(() => setToast(null), 2000);
  };
  const increase = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decrease = (id) => setCart(prev => {
    const it = prev.find(i => i.id === id);
    if (it.qty <= 1) return prev.filter(i => i.id !== id);
    return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
  });
  const remove = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

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
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.3); border-radius: 2px; }
        .tabs-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Decorative bg circles */}
      <div style={{ position: "fixed", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,60,10,0.15), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,40,5,0.12), transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(180deg, rgba(15,8,2,0.98) 0%, rgba(10,5,1,0.95) 100%)",
        borderBottom: "1px solid rgba(180,120,40,0.25)",
        backdropFilter: "blur(12px)",
        padding: "0 16px",
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg,#c87820,#7a4010)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 2px 12px rgba(200,120,32,0.4)",
              border: "1px solid rgba(200,160,60,0.3)",
            }}>🍺</div>
            <div>
              <div style={{ color: "#f0c060", fontSize: 18, fontWeight: 700, letterSpacing: "0.5px", lineHeight: 1.1 }}>StaroPub</div>
              <div style={{ color: "#8a6040", fontSize: 10, letterSpacing: "1px" }}>სტაროპაბი</div>
            </div>
          </div>
          <button onClick={() => setCartOpen(true)} style={{
            background: totalItems > 0 ? "linear-gradient(135deg,#b86520,#8a4510)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${totalItems > 0 ? "rgba(200,120,40,0.6)" : "rgba(180,120,40,0.2)"}`,
            borderRadius: 12, color: "#f0c060", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            fontSize: 14, fontWeight: 600, transition: "all 0.3s",
            boxShadow: totalItems > 0 ? "0 2px 16px rgba(184,101,32,0.4)" : "none",
          }}>
            <span style={{ fontSize: 16, animation: totalItems > 0 ? "pulse 1.5s infinite" : "none" }}>🛒</span>
            <span>{totalItems > 0 ? `${totalItems} ნივთი` : "კალათი"}</span>
          </button>
        </div>

        {/* Tabs */}
        <div ref={tabsRef} className="tabs-row" style={{
          display: "flex", gap: 4, overflowX: "auto", padding: "8px 0 10px",
          maxWidth: 520, margin: "0 auto", scrollbarWidth: "none",
        }}>
          {CATEGORY_KEYS.map(key => {
            const active = activeTab === key;
            return (
              <button key={key} data-key={key} onClick={() => scrollTab(key)} style={{
                whiteSpace: "nowrap", flexShrink: 0,
                background: active ? "linear-gradient(135deg,#b86520,#7a3a08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "rgba(200,120,40,0.6)" : "rgba(180,120,40,0.15)"}`,
                color: active ? "#fff" : "#8a6040",
                borderRadius: 20, padding: "7px 14px",
                fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.25s",
                boxShadow: active ? "0 2px 12px rgba(184,101,32,0.4)" : "none",
              }}>
                {MENU[key].label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "16px 12px 100px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: activeTab === "beer" ? "repeat(2,1fr)" : "repeat(2,1fr)",
          gap: 12,
          animation: "fadeIn 0.3s ease-out",
        }}>
          {items.map(item => <ItemCard key={item.id} item={item} onAdd={addToCart} />)}
        </div>
      </main>

      {/* Footer */}
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 12, zIndex: 500,
          background: "linear-gradient(135deg,#2d6b25,#1a4a15)",
          color: "#a0e890", padding: "10px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, maxWidth: 240,
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          border: "1px solid rgba(80,180,60,0.3)",
          animation: "toastIn 0.25s ease-out",
        }}>
          ✓ {toast}
        </div>
      )}

      {cartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setCartOpen(false)}
          onIncrease={increase}
          onDecrease={decrease}
          onRemove={remove}
          onOrder={clearCart}
        />
      )}
    </div>
  );
}
