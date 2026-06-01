import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clipboard,
  ClipboardCheck,
  Refrigerator,
  Tv,
  WashingMachine,
  Microwave,
  Wind,
  Zap,
  History,
} from "lucide-react";

const INITIAL_DATA = [
  {
    id: "fridge",
    label: "Samsung Fridge",
    icon: "fridge",
    color: "#00B4D8",
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
    id: "tv",
    label: "Samsung TV",
    icon: "tv",
    color: "#7B2FBE",
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
    id: "wm",
    label: "Samsung WM",
    icon: "washer",
    color: "#06D6A0",
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
    id: "microwave",
    label: "Samsung Microwave",
    icon: "microwave",
    color: "#FF6B35",
    items: [
      { model: "CE76JD-B1", qty: 2 },
      { model: "MC28A5147VK", qty: 4 },
      { model: "Ms23K3513AK", qty: 2 },
    ],
  },
  {
    id: "vacuum",
    label: "Samsung Vacuum",
    icon: "vacuum",
    color: "#F72585",
    items: [
      { model: "VC18M2120SB", qty: 4 },
      { model: "VCC4190S37", qty: 15 },
      { model: "VCC4540S36", qty: 3 },
    ],
  },
  {
    id: "ac",
    label: "Samsung A/C",
    icon: "ac",
    color: "#4CC9F0",
    items: [
      { model: "AR12TSHZRWKNRC+FRH14382", qty: 2 },
      { model: "AR18TSHZRWKNRC.14122", qty: 1 },
    ],
  },
];

const STORAGE_KEY = "samsung_stock_v1";
const STORAGE_VERSION = 2;
const HISTORY_RETENTION_DAYS = 7;

const MODEL_CATEGORY_MAP = (() => {
  const map = new Map();
  for (const cat of INITIAL_DATA) {
    for (const item of cat.items) {
      map.set(item.model, {
        categoryId: cat.id,
        categoryLabel: cat.label,
      });
    }
  }
  return map;
})();

function resolveCategoryForModel(model, entry) {
  if (entry?.categoryLabel && entry?.categoryId) {
    return {
      categoryId: entry.categoryId,
      categoryLabel: entry.categoryLabel,
    };
  }
  return (
    MODEL_CATEGORY_MAP.get(model) ?? {
      categoryId: "",
      categoryLabel: "Unknown",
    }
  );
}

function shortCategoryLabel(label) {
  return label.replace(/^Samsung\s+/i, "").trim() || label;
}

function sanitizeQty(value, fallback = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

/** Merge saved quantities into the current catalog without dropping user data on deploy. */
function mergeStockWithInitial(savedStock) {
  if (!Array.isArray(savedStock)) return INITIAL_DATA;

  return INITIAL_DATA.map((cat) => {
    const savedCat = savedStock.find((c) => c && c.id === cat.id);
    if (!savedCat || !Array.isArray(savedCat.items)) return cat;

    return {
      ...cat,
      items: cat.items.map((item) => {
        const savedItem = savedCat.items.find(
          (i) => i && typeof i.model === "string" && i.model === item.model
        );
        if (!savedItem) return item;
        return { ...item, qty: sanitizeQty(savedItem.qty, item.qty) };
      }),
    };
  });
}

function resolveHistoryChange(entry) {
  if (typeof entry.change === "number" && !Number.isNaN(entry.change) && entry.change !== 0) {
    return entry.change;
  }
  if (typeof entry.units === "number" && !Number.isNaN(entry.units) && entry.units !== 0) {
    const units = Math.abs(Math.floor(entry.units));
    return entry.direction === "-" ? -units : units;
  }
  if (entry.direction === "+" || entry.direction === "-") {
    return entry.direction === "+" ? 1 : -1;
  }
  return null;
}

function isValidHistoryEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.model === "string" &&
    entry.model.length > 0 &&
    resolveHistoryChange(entry) !== null
  );
}

function formatHistoryChange(change) {
  return change > 0 ? `+${change}` : `${change}`;
}

function getDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayKeyFromEntry(entry) {
  if (typeof entry.dayKey === "string" && entry.dayKey) return entry.dayKey;
  const ts =
    typeof entry.timestamp === "number" && !Number.isNaN(entry.timestamp)
      ? entry.timestamp
      : Date.now();
  return getDayKey(new Date(ts));
}

/** Oldest dayKey still kept (today + previous 6 days = 7 calendar days). */
function getMinRetainedDayKey(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (HISTORY_RETENTION_DAYS - 1));
  return getDayKey(d);
}

function pruneHistoryToLastWeek(entries, now = new Date()) {
  const minKey = getMinRetainedDayKey(now);
  return entries
    .filter((e) => getDayKeyFromEntry(e) >= minKey)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function groupHistoryByDay(entries) {
  const byDay = new Map();

  for (const entry of entries) {
    const dayKey = getDayKeyFromEntry(entry);
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        dayKey,
        date: entry.date,
        day: entry.day,
        entries: [],
      });
    }
    byDay.get(dayKey).entries.push(entry);
  }

  return Array.from(byDay.values())
    .map((group) => ({
      ...group,
      entries: group.entries.sort((a, b) => b.timestamp - a.timestamp),
    }))
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}

function formatDayDropdownLabel(group) {
  const shortDate = group.date.replace(/,?\s*\d{4}$/, "").trim();
  return `${shortDate} (${group.day})`;
}

function normalizeHistoryEntry(entry) {
  const change = resolveHistoryChange(entry);
  if (!entry || change === null) return null;

  const timestamp =
    typeof entry.timestamp === "number" && !Number.isNaN(entry.timestamp)
      ? entry.timestamp
      : Date.now();

  const dateFromTs = new Date(timestamp);
  const category = resolveCategoryForModel(entry.model, entry);

  return {
    id:
      typeof entry.id === "string"
        ? entry.id
        : `${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    dayKey: getDayKey(dateFromTs),
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    date:
      typeof entry.date === "string"
        ? entry.date
        : dateFromTs.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
    day:
      typeof entry.day === "string"
        ? entry.day
        : dateFromTs.toLocaleDateString(undefined, { weekday: "long" }),
    time:
      typeof entry.time === "string"
        ? entry.time
        : dateFromTs.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }),
    model: entry.model,
    change,
  };
}

/** One row per model per calendar day; net units combined (e.g. +1,+1,+1 → +3). */
function aggregateHistoryByDayAndModel(entries) {
  const merged = new Map();

  for (const entry of entries) {
    if (!entry || !entry.change) continue;

    const dayKey = getDayKeyFromEntry(entry);
    const key = `${dayKey}|${entry.model}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...entry, dayKey });
      continue;
    }

    const combinedChange = existing.change + entry.change;
    if (combinedChange === 0) {
      merged.delete(key);
      continue;
    }

    const useIncoming = entry.timestamp >= existing.timestamp;
    const category = useIncoming
      ? {
          categoryId: entry.categoryId,
          categoryLabel: entry.categoryLabel,
        }
      : {
          categoryId: existing.categoryId,
          categoryLabel: existing.categoryLabel,
        };
    merged.set(key, {
      ...existing,
      ...category,
      dayKey,
      change: combinedChange,
      timestamp: Math.max(existing.timestamp, entry.timestamp),
      time: useIncoming ? entry.time : existing.time,
      date: useIncoming ? entry.date : existing.date,
      day: useIncoming ? entry.day : existing.day,
    });
  }

  return pruneHistoryToLastWeek(
    Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp)
  );
}

function parseHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map(normalizeHistoryEntry).filter(Boolean);
  return pruneHistoryToLastWeek(aggregateHistoryByDayAndModel(normalized));
}

function createHistoryEntry(model, change, category, now = new Date()) {
  const signedChange =
    typeof change === "number" && !Number.isNaN(change) ? change : 0;
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.getTime(),
    dayKey: getDayKey(now),
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    date: now.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    day: now.toLocaleDateString(undefined, { weekday: "long" }),
    time: now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
    model,
    change: signedChange,
  };
}

function appendHistoryChange(history, model, change, category) {
  if (!change) return history;

  const now = new Date();
  const dayKey = getDayKey(now);
  const existingIndex = history.findIndex(
    (e) => e.model === model && getDayKeyFromEntry(e) === dayKey
  );

  if (existingIndex === -1) {
    return pruneHistoryToLastWeek(
      [createHistoryEntry(model, change, category, now), ...history],
      now
    );
  }

  const existing = history[existingIndex];
  const combinedChange = existing.change + change;

  if (combinedChange === 0) {
    return pruneHistoryToLastWeek(
      history.filter((_, i) => i !== existingIndex),
      now
    );
  }

  const fresh = createHistoryEntry(model, combinedChange, category, now);
  const updated = {
    ...existing,
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    change: combinedChange,
    timestamp: fresh.timestamp,
    time: fresh.time,
    dayKey,
  };

  const rest = history.filter((_, i) => i !== existingIndex);
  return pruneHistoryToLastWeek([updated, ...rest], now);
}

function loadPersistedState() {
  const fallback = { stock: INITIAL_DATA, history: [] };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || typeof raw !== "string") return fallback;

    const parsed = JSON.parse(raw);

    // Legacy v1: bare array of categories (pre-history format)
    if (Array.isArray(parsed)) {
      return {
        stock: mergeStockWithInitial(parsed),
        history: [],
      };
    }

    if (!parsed || typeof parsed !== "object") return fallback;

    const savedStock = Array.isArray(parsed.stock)
      ? parsed.stock
      : Array.isArray(parsed.categories)
        ? parsed.categories
        : null;

    return {
      stock: savedStock ? mergeStockWithInitial(savedStock) : INITIAL_DATA,
      history: parseHistory(parsed.history),
    };
  } catch {
    return fallback;
  }
}

function serializeStockForStorage(stock) {
  return stock.map((cat) => ({
    id: cat.id,
    items: cat.items.map((item) => ({
      model: item.model,
      qty: sanitizeQty(item.qty, 0),
    })),
  }));
}

function CategoryIcon({ type, color }) {
  const props = { size: 20, color, strokeWidth: 2 };
  switch (type) {
    case "fridge":
      return <Refrigerator {...props} />;
    case "tv":
      return <Tv {...props} />;
    case "washer":
      return <WashingMachine {...props} />;
    case "microwave":
      return <Microwave {...props} />;
    case "vacuum":
      return <Zap {...props} />;
    case "ac":
      return <Wind {...props} />;
    default:
      return null;
  }
}

export default function StockTracker() {
  const [persisted] = useState(() => loadPersistedState());
  const [stock, setStock] = useState(persisted.stock);
  const [history, setHistory] = useState(persisted.history);
  const [openIds, setOpenIds] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openHistoryDays, setOpenHistoryDays] = useState([]);
  const [copied, setCopied] = useState(false);

  const historyByDay = useMemo(() => groupHistoryByDay(history), [history]);

  useEffect(() => {
    setHistory((h) => {
      const pruned = pruneHistoryToLastWeek(h);
      return pruned.length === h.length ? h : pruned;
    });
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    setHistory((h) => {
      const pruned = pruneHistoryToLastWeek(h);
      return pruned.length === h.length ? h : pruned;
    });
  }, [historyOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          stock: serializeStockForStorage(stock),
          history,
        })
      );
    } catch {
      // Quota exceeded or private mode — in-memory state still works this session
    }
  }, [stock, history]);

  const adjust = useCallback((catId, model, delta) => {
    if (delta === 0) return;

    setStock((prev) => {
      const cat = prev.find((c) => c.id === catId);
      const item = cat?.items.find((i) => i.model === model);
      if (!item) return prev;

      const newQty = Math.max(0, item.qty + delta);
      if (newQty === item.qty) return prev;

      const change = newQty - item.qty;
      const category = {
        categoryId: cat.id,
        categoryLabel: cat.label,
      };
      setHistory((h) => appendHistoryChange(h, model, change, category));

      return prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.model !== model ? i : { ...i, qty: newQty }
              ),
            }
      );
    });
  }, []);

  const toggleCategory = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleHistoryDay = (dayKey) => {
    setOpenHistoryDays((prev) =>
      prev.includes(dayKey) ? prev.filter((x) => x !== dayKey) : [...prev, dayKey]
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
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  return (
    <div
      style={{
        fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
        background: "#0A0A0F",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        color: "#F0F0F5",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0D0D1A 0%, #12121F 100%)",
          borderBottom: "1px solid #1E1E2E",
          padding: "16px 18px 14px",
          paddingTop: "max(16px, env(safe-area-inset-top))",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#4CC9F0",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Samsung
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#F0F0F5",
                letterSpacing: -0.5,
              }}
            >
              Stock Tracker
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              title={historyOpen ? "Hide history" : "History log"}
              aria-label={historyOpen ? "Hide history log" : "Show history log"}
              aria-expanded={historyOpen}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: historyOpen ? "1px solid #4CC9F066" : "1px solid #2A2A4A",
                background: historyOpen
                  ? "linear-gradient(135deg, #4CC9F022, #7B2FBE22)"
                  : "linear-gradient(135deg, #1A1A2E, #16213E)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4CC9F0",
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              <History size={20} />
              {history.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#06D6A0",
                    border: "2px solid #12121F",
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy summary"}
              aria-label={copied ? "Copied to clipboard" : "Copy summary to clipboard"}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: copied ? "1px solid #06D6A066" : "1px solid #2A2A4A",
                background: copied
                  ? "linear-gradient(135deg, #06D6A022, #00B4D822)"
                  : "linear-gradient(135deg, #1A1A2E, #16213E)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: copied ? "#06D6A0" : "#4CC9F0",
                transition: "all 0.25s ease",
              }}
            >
              {copied ? <ClipboardCheck size={20} /> : <Clipboard size={20} />}
            </button>

            <div
              style={{
                background: "linear-gradient(135deg, #1A1A2E, #16213E)",
                border: "1px solid #2A2A4A",
                borderRadius: 14,
                padding: "8px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: "#4CC9F0" }}>
                {totalItems}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#888",
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                TOTAL
              </div>
            </div>
          </div>
        </div>

        {historyOpen && (
          <div
            style={{
              marginTop: 12,
              background: "#12121F",
              border: "1px solid #4CC9F044",
              borderRadius: 14,
              overflow: "hidden",
              maxHeight: "min(50vh, 360px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #1E1E2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F0F5" }}>
                History Log
              </span>
              <span style={{ fontSize: 11, color: "#555" }}>
                {history.length === 0
                  ? "Last 7 days"
                  : `${historyByDay.length} day${historyByDay.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <div
              style={{
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                flex: 1,
              }}
            >
              {history.length === 0 ? (
                <div
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#555",
                  }}
                >
                  Tap + or − on any model to log unit changes.
                </div>
              ) : (
                historyByDay.map((group) => {
                  const isDayOpen = openHistoryDays.includes(group.dayKey);
                  return (
                    <div
                      key={group.dayKey}
                      style={{ borderBottom: "1px solid #1A1A2E" }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleHistoryDay(group.dayKey)}
                        style={{
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: "11px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#F0F0F5",
                            }}
                          >
                            {formatDayDropdownLabel(group)}
                          </div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                            {group.entries.length} change
                            {group.entries.length === 1 ? "" : "s"}
                          </div>
                        </div>
                        {isDayOpen ? (
                          <ChevronUp size={16} color="#555" />
                        ) : (
                          <ChevronDown size={16} color="#555" />
                        )}
                      </button>

                      {isDayOpen &&
                        group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "8px 14px 10px 18px",
                              borderTop: "1px solid #161622",
                              background: "#0D0D1455",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                  gap: "6px 8px",
                                  marginBottom: 3,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: 0.6,
                                    textTransform: "uppercase",
                                    color: "#4CC9F0",
                                    background: "#4CC9F014",
                                    border: "1px solid #4CC9F033",
                                    borderRadius: 6,
                                    padding: "2px 7px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {shortCategoryLabel(entry.categoryLabel)}
                                </span>
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    fontFamily:
                                      "'SF Mono', 'Fira Code', monospace",
                                    color: "#E0E0EA",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {entry.model}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#666" }}>
                                {entry.time}
                              </div>
                            </div>
                            <div
                              style={{
                                flexShrink: 0,
                                fontSize: 18,
                                fontWeight: 800,
                                fontFamily: "'SF Mono', 'Fira Code', monospace",
                                color: entry.change > 0 ? "#06D6A0" : "#F72585",
                                minWidth: 36,
                                textAlign: "right",
                              }}
                            >
                              {formatHistoryChange(entry.change)}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div style={{ padding: "10px 10px 0" }}>
        {stock.map((cat) => {
          const isOpen = openIds.includes(cat.id);
          const catTotal = cat.items.reduce((s, i) => s + i.qty, 0);
          return (
            <div
              key={cat.id}
              style={{
                background: "#12121F",
                border: `1px solid ${isOpen ? cat.color + "44" : "#1E1E2E"}`,
                borderRadius: 16,
                marginBottom: 8,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  minHeight: 60,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: cat.color + "18",
                    border: `1px solid ${cat.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CategoryIcon type={cat.icon} color={cat.color} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#F0F0F5",
                    }}
                  >
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                    {cat.items.length} models
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      background: cat.color + "22",
                      border: `1px solid ${cat.color}55`,
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 15,
                      fontWeight: 800,
                      color: cat.color,
                      minWidth: 34,
                      textAlign: "center",
                    }}
                  >
                    {catTotal}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} color="#555" />
                  ) : (
                    <ChevronDown size={16} color="#555" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div
                  style={{
                    borderTop: `1px solid ${cat.color}22`,
                    padding: "2px 0 6px",
                  }}
                >
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.model}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 12px",
                        gap: 8,
                        background: idx % 2 === 0 ? "transparent" : "#0D0D1A55",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          fontSize: 17,
                          fontWeight: 700,
                          lineHeight: 1.25,
                          color: item.qty === 0 ? "#4A4A5A" : "#E8E8F0",
                          fontFamily: "'SF Mono', 'Fira Code', monospace",
                          wordBreak: "break-all",
                          letterSpacing: 0.2,
                        }}
                      >
                        {item.model}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#1A1A2E",
                          borderRadius: 13,
                          border: "1px solid #2A2A4A",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => adjust(cat.id, item.model, -1)}
                          disabled={item.qty === 0}
                          style={{
                            width: 44,
                            height: 44,
                            background: "none",
                            border: "none",
                            cursor: item.qty === 0 ? "default" : "pointer",
                            fontSize: 22,
                            fontWeight: 700,
                            color: item.qty === 0 ? "#252535" : "#F72585",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <div
                          style={{
                            width: 40,
                            textAlign: "center",
                            fontSize: 17,
                            fontWeight: 800,
                            color: item.qty === 0 ? "#303040" : cat.color,
                            borderLeft: "1px solid #2A2A4A",
                            borderRight: "1px solid #2A2A4A",
                            lineHeight: "44px",
                          }}
                        >
                          {item.qty}
                        </div>
                        <button
                          type="button"
                          onClick={() => adjust(cat.id, item.model, 1)}
                          style={{
                            width: 44,
                            height: 44,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#06D6A0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
