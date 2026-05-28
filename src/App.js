import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown, ChevronUp, Clipboard, ClipboardCheck,
  Refrigerator, Tv, WashingMachine, Microwave, Wind, Zap
} from "lucide-react";

const INITIAL_DATA = [
  {
    id: "fridge", label: "Samsung Fridge", icon: "fridge", color: "#00B4D8",
    items: [
      { model: "RR20C20C2GS", qty: 4 },
      { model: "RR20C20C2RH", qty: 6 },
      { model: "RR20C2722CU", qty: 5 },
      { model: "RR20C2722CR", qty: 1 },
      { model: "RR20C2Z226R", qty: 4 },
      { model: "RR20C2Z226U", qty: 3 },
      { model: "RR20M282ZS8", qty: 3 },
      { model: "RR20T282Zu8", qty: 2 },
      { model: "RR20T282ZR8", qty: 2 },
      { model: "RR24A272ZCU", qty: 2 },
      { model: "RT28A3022GS", qty: 1 },
      { model: "RT28C3221CR", qty: 1 },
      { model: "RT28C3221CU", qty: 2 },
      { model: "RT30K3342S8", qty: 0 },
      { model: "RT40H28WNPIM", qty: 1 },
      { model: "RT40H30WNPIM", qty: 7 },
      { model: "RT37C4521S8", qty: 1 },
      { model: "RT38DG5A2BS8", qty: 4 },
      { model: "RS78", qty: 1 },
    ],
  },
  {
    id: "tv", label: "Samsung TV", icon: "tv", color: "#7B2FBE",
    items: [
      { model: "UA32N4010", qty: 2 },
      { model: "UA32H4570", qty: 1 },
      { model: "UA43U8500", qty: 4 },
      { model: "UA43F5550FU", qty: 4 },
      { model: "UA55U8500", qty: 1 },
      { model: "UA65U8500", qty: 2 },
      { model: "Qa55Q60D", qty: 1 },
      { model: "QA55Q60C", qty: 0 },
      { model: "QA75Q7FAARSHE", qty: 0 },
    ],
  },
  {
    id: "wm", label: "Samsung WM", icon: "washer", color: "#06D6A0",
    items: [
      { model: "WD90T634DBN", qty: 1 },
      { model: "WD11TP34DSX", qty: 1 },
      { model: "WW80TA046AX", qty: 2 },
      { model: "WW90DG5U24AX", qty: 5 },
      { model: "WW90DG6U24AX", qty: 5 },
      { model: "WW80T504DAN", qty: 1 },
      { model: "WW12DG5U24AX", qty: 4 },
      { model: "WW12DG6U24AX", qty: 0 },
    ],
  },
  {
    id: "microwave", label: "Samsung Microwave", icon: "microwave", color: "#FF6B35",
    items: [
      { model: "CE76JD-B1", qty: 2 },
      { model: "MC28A5147VK", qty: 4 },
      { model: "Ms23K3513AK", qty: 2 },
    ],
  },
  {
    id: "vacuum", label: "Samsung Vacuum", icon: "vacuum", color: "#F72585",
    items: [
      { model: "VC18M2120SB", qty: 4 },
      { model: "VCC4190S37", qty: 15 },
      { model: "VCC4540S36", qty: 3 },
    ],
  },
  {
    id: "ac", label: "Samsung A/C", icon: "ac", color: "#4CC9F0",
    items: [
      { model: "AR12TSHZRWKNRC+FRH14382", qty: 2 },
      { model: "AR18TSHZRWKNRC.14122", qty: 1 },
    ],
  },
];

const STORAGE_KEY = "samsung_stock_v1";

function CategoryIcon({ type, color }) {
  const props = { size: 20, color, strokeWidth: 2 };
  switch (type) {
    case "fridge": return <Refrigerator {...props} />;
    case "tv": return <Tv {...props} />;
    case "washer": return <WashingMachine {...props} />;
    case "microwave": return <Microwave {...props} />;
    case "vacuum": return <Zap {...props} />;
    case "ac": return <Wind {...props} />;
    default: return null;
  }
}

export default function App() {
  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return INITIAL_DATA.map((cat) => {
          const savedCat = parsed.find((c) => c.id === cat.id);
          if (!savedCat) return cat;
          return {
            ...cat,
            items: cat.items.map((item) => {
              const savedItem = savedCat.items.find((i) => i.model === item.model);
              return savedItem ? { ...item, qty: savedItem.qty } : item;
            }),
          };
        });
      }
    } catch (_) {}
    return INITIAL_DATA;
  });

  const [openIds, setOpenIds] = useState(["fridge"]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stock));
  }, [stock]);

  const adjust = useCallback((catId, model, delta) => {
    setStock((prev) =>
      prev.map((cat) =>
        cat.id !== catId ? cat : {
          ...cat,
          items: cat.items.map((item) =>
            item.model !== model ? item : { ...item, qty: Math.max(0, item.qty + delta) }
          ),
        }
      )
    );
  }, []);

  const toggleCategory = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCopy = () => {
    const lines = stock.map((cat) => {
      const header = cat.label.toUpperCase();
      const rows = cat.items.map((i) => `${i.model} = ${i.qty}`).join("\n");
      return `${header}\n${rows}`;
    });
    navigator.clipboard.writeText(lines.join("\n\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const totalItems = stock.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.qty, 0), 0
  );

  return (
    <div style={{
      fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: "#0A0A0F",
      minHeight: "100vh",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 100,
      color: "#F0F0F5",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D0D1A 0%, #12121F 100%)",
        borderBottom: "1px solid #1E1E2E",
        padding: "16px 18px 14px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#4CC9F0", textTransform: "uppercase", marginBottom: 2 }}>Samsung</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F5", letterSpacing: -0.5 }}>Stock Tracker</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #1A1A2E, #16213E)",
            border: "1px solid #2A2A4A", borderRadius: 14,
            padding: "8px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4CC9F0" }}>{totalItems}</div>
            <div style={{ fontSize: 9, color: "#888", fontWeight: 600, letterSpacing: 1 }}>TOTAL</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: "10px 10px 0" }}>
        {stock.map((cat) => {
          const isOpen = openIds.includes(cat.id);
          const catTotal = cat.items.reduce((s, i) => s + i.qty, 0);
          return (
            <div key={cat.id} style={{
              background: "#12121F",
              border: `1px solid ${isOpen ? cat.color + "44" : "#1E1E2E"}`,
              borderRadius: 16, marginBottom: 8, overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: "100%", background: "none", border: "none",
                  padding: "14px 16px", display: "flex", alignItems: "center",
                  gap: 10, cursor: "pointer", minHeight: 60,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: cat.color + "18", border: `1px solid ${cat.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <CategoryIcon type={cat.icon} color={cat.color} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F0F5" }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{cat.items.length} models</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    background: cat.color + "22", border: `1px solid ${cat.color}55`,
                    borderRadius: 8, padding: "4px 10px",
                    fontSize: 15, fontWeight: 800, color: cat.color,
                    minWidth: 34, textAlign: "center",
                  }}>{catTotal}</div>
                  {isOpen ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${cat.color}22`, padding: "2px 0 6px" }}>
                  {cat.items.map((item, idx) => (
                    <div key={item.model} style={{
                      display: "flex", alignItems: "center",
                      padding: "5px 12px", gap: 8,
                      background: idx % 2 === 0 ? "transparent" : "#0D0D1A55",
                    }}>
                      <div style={{
                        flex: 1, fontSize: 12, fontWeight: 600,
                        color: item.qty === 0 ? "#3A3A4A" : "#B8B8C8",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        wordBreak: "break-all", letterSpacing: 0.1,
                      }}>{item.model}</div>

                      <div style={{
                        display: "flex", alignItems: "center",
                        background: "#1A1A2E", borderRadius: 13,
                        border: "1px solid #2A2A4A", overflow: "hidden", flexShrink: 0,
                      }}>
                        <button
                          onClick={() => adjust(cat.id, item.model, -1)}
                          disabled={item.qty === 0}
                          style={{
                            width: 44, height: 44, background: "none", border: "none",
                            cursor: item.qty === 0 ? "default" : "pointer",
                            fontSize: 22, fontWeight: 700,
                            color: item.qty === 0 ? "#252535" : "#F72585",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >−</button>
                        <div style={{
                          width: 40, textAlign: "center",
                          fontSize: 17, fontWeight: 800,
                          color: item.qty === 0 ? "#303040" : cat.color,
                          borderLeft: "1px solid #2A2A4A", borderRight: "1px solid #2A2A4A",
                          lineHeight: "44px",
                        }}>{item.qty}</div>
                        <button
                          onClick={() => adjust(cat.id, item.model, 1)}
                          style={{
                            width: 44, height: 44, background: "none", border: "none",
                            cursor: "pointer", fontSize: 22, fontWeight: 700,
                            color: "#06D6A0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        padding: "10px 14px 16px",
        background: "linear-gradient(to top, #0A0A0F 75%, transparent)",
        zIndex: 100,
      }}>
        <button
          onClick={handleCopy}
          style={{
            width: "100%", height: 54, borderRadius: 16, border: "none",
            background: copied
              ? "linear-gradient(135deg, #06D6A0, #00B4D8)"
              : "linear-gradient(135deg, #4CC9F0, #7B2FBE)",
            color: "#fff", fontSize: 15, fontWeight: 800,
            letterSpacing: 0.4, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            boxShadow: copied ? "0 4px 20px #06D6A055" : "0 4px 20px #4CC9F055",
            transition: "all 0.3s ease",
          }}
        >
          {copied ? <ClipboardCheck size={20} /> : <Clipboard size={20} />}
          {copied ? "Copied to Clipboard!" : "Copy Summary"}
        </button>
      </div>
    </div>
  );
}
