import { useState, useEffect, useCallback, useMemo } from "react";
import "./StockTracker.css";
import {
  ArrowLeft,
  ChevronDown,
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

// Nepal Standard Time is UTC+5:45
const NPT_TIMEZONE = "Asia/Kathmandu";
const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000; // 20700000 ms

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

function formatHistoryChange(change) {
  return change > 0 ? `+${change}` : `${change}`;
}

function getDayKey(date = new Date()) {
  // Use UTC methods on NPT-shifted date so the day boundary is Nepal midnight
  const npt = new Date(date.getTime() + NPT_OFFSET_MS);
  const y = npt.getUTCFullYear();
  const m = String(npt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(npt.getUTCDate()).padStart(2, "0");
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
  // Find Nepal midnight of today, then go back HISTORY_RETENTION_DAYS-1 days
  const nptNow = new Date(now.getTime() + NPT_OFFSET_MS);
  const nptStartOfToday = Date.UTC(
    nptNow.getUTCFullYear(),
    nptNow.getUTCMonth(),
    nptNow.getUTCDate()
  );
  const minDate = new Date(nptStartOfToday - (HISTORY_RETENTION_DAYS - 1) * 24 * 60 * 60 * 1000);
  return getDayKey(minDate);
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
        : dateFromTs.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: NPT_TIMEZONE,
          }),
    day:
      typeof entry.day === "string"
        ? entry.day
        : dateFromTs.toLocaleDateString("en-US", { weekday: "long", timeZone: NPT_TIMEZONE }),
    time:
      typeof entry.time === "string"
        ? entry.time
        : dateFromTs.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: NPT_TIMEZONE,
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
    date: now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: NPT_TIMEZONE,
    }),
    day: now.toLocaleDateString("en-US", { weekday: "long", timeZone: NPT_TIMEZONE }),
    time: now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: NPT_TIMEZONE,
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
  const [page, setPage] = useState("stock");
  const [openHistoryDays, setOpenHistoryDays] = useState([]);
  const [copied, setCopied] = useState(false);
  const [qtyFlash, setQtyFlash] = useState(null);

  const historyByDay = useMemo(() => groupHistoryByDay(history), [history]);

  useEffect(() => {
    setHistory((h) => {
      const pruned = pruneHistoryToLastWeek(h);
      return pruned.length === h.length ? h : pruned;
    });
  }, []);

  useEffect(() => {
    if (page !== "history") return;
    setHistory((h) => {
      const pruned = pruneHistoryToLastWeek(h);
      return pruned.length === h.length ? h : pruned;
    });
  }, [page]);

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
      setQtyFlash(`${catId}|${model}`);
      window.setTimeout(() => setQtyFlash(null), 400);

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

  const todayKey = getDayKey();

  const historyList = (
    <div className="history-card">
      {history.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          No changes yet.
          <br />
          Tap + or − on any model to log unit changes.
        </div>
      ) : (
        historyByDay.map((group) => {
          const isDayOpen = openHistoryDays.includes(group.dayKey);
          const isToday = group.dayKey === todayKey;
          return (
            <div key={group.dayKey} className="day-group">
              <button
                type="button"
                className={`day-toggle tap-btn ${isDayOpen ? "is-open" : ""}`}
                onClick={() => toggleHistoryDay(group.dayKey)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="day-label">
                    {formatDayDropdownLabel(group)}
                    {isToday && <span className="day-badge-today">Today</span>}
                  </div>
                  <div className="day-meta">
                    {group.entries.length} change
                    {group.entries.length === 1 ? "" : "s"}
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  color="#6a6a7a"
                  className="category-chevron"
                  style={{
                    transform: isDayOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)",
                  }}
                />
              </button>

              {isDayOpen && (
                <div className="day-entries">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="history-entry">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "6px 8px",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            className="cat-badge"
                            style={{
                              color: "#4CC9F0",
                              background: "rgba(76, 201, 240, 0.12)",
                              border: "1px solid rgba(76, 201, 240, 0.28)",
                            }}
                          >
                            {shortCategoryLabel(entry.categoryLabel)}
                          </span>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              fontFamily: "'SF Mono', ui-monospace, monospace",
                              color: "#E8E8F0",
                              wordBreak: "break-all",
                            }}
                          >
                            {entry.model}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#6a6a7a" }}>
                          {entry.time}
                        </div>
                      </div>
                      <span
                        className={`change-pill ${
                          entry.change > 0 ? "change-pill--up" : "change-pill--down"
                        }`}
                      >
                        {formatHistoryChange(entry.change)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  if (page === "history") {
    return (
      <div className="app-shell page-enter">
        <header className="app-header">
          <div className="header-back-row">
            <button
              type="button"
              className="icon-btn icon-btn--back tap-btn"
              onClick={() => setPage("stock")}
              aria-label="Back to stock tracker"
            >
              <ArrowLeft size={22} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="history-header-title">History Log</h1>
              <p className="history-header-sub">
                {history.length === 0
                  ? "Last 7 days"
                  : `${historyByDay.length} day${historyByDay.length === 1 ? "" : "s"} · ${history.length} change${history.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </header>
        <div className="content-pad">{historyList}</div>
      </div>
    );
  }

  return (
    <div className="app-shell page-enter">
      <header className="app-header">
        <div className="header-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-eyebrow">Samsung</div>
            <h1 className="brand-title">Stock Tracker</h1>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="icon-btn icon-btn--history tap-btn"
              onClick={() => setPage("history")}
              title="History log"
              aria-label="Open history log"
            >
              <History size={20} />
              {history.length > 0 && <span className="notify-dot" />}
            </button>
            <button
              type="button"
              className={`icon-btn icon-btn--copy tap-btn ${copied ? "is-copied" : ""}`}
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy summary"}
              aria-label={copied ? "Copied to clipboard" : "Copy summary to clipboard"}
            >
              {copied ? <ClipboardCheck size={20} /> : <Clipboard size={20} />}
            </button>
            <div className="total-pill">
              <div className="total-pill-value">{totalItems}</div>
              <div className="total-pill-label">TOTAL</div>
            </div>
          </div>
        </div>
      </header>

      <div className="categories-wrap">
        {stock.map((cat) => {
          const isOpen = openIds.includes(cat.id);
          const catTotal = cat.items.reduce((s, i) => s + i.qty, 0);
          return (
            <div
              key={cat.id}
              className={`category-card ${isOpen ? "is-open" : ""}`}
              style={{
                borderColor: isOpen ? `${cat.color}55` : undefined,
                boxShadow: isOpen ? `0 8px 32px ${cat.color}18` : undefined,
              }}
            >
              <button
                type="button"
                className="category-card-header tap-btn"
                onClick={() => toggleCategory(cat.id)}
              >
                <div
                  className="category-icon-wrap"
                  style={{
                    background: `${cat.color}20`,
                    border: `1px solid ${cat.color}50`,
                  }}
                >
                  <CategoryIcon type={cat.icon} color={cat.color} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="category-title">{cat.label}</div>
                  <div className="category-meta">{cat.items.length} models</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    className="category-count"
                    style={{
                      background: `${cat.color}22`,
                      border: `1px solid ${cat.color}55`,
                      color: cat.color,
                    }}
                  >
                    {catTotal}
                  </div>
                  <ChevronDown size={18} color="#6a6a7a" className="category-chevron" />
                </div>
              </button>

              {isOpen && (
                <div
                  className="items-panel"
                  style={{ borderTopColor: `${cat.color}33` }}
                >
                  {cat.items.map((item) => {
                    const itemFlash = qtyFlash === `${cat.id}|${item.model}`;
                    return (
                      <div key={item.model} className="stock-row">
                        <div
                          className={`model-code ${
                            item.qty === 0 ? "is-zero" : "has-stock"
                          }`}
                        >
                          {item.model}
                        </div>
                        <div className="qty-stepper">
                          <button
                            type="button"
                            className="qty-btn qty-btn--minus tap-btn"
                            onClick={() => adjust(cat.id, item.model, -1)}
                            disabled={item.qty === 0}
                            aria-label={`Decrease ${item.model}`}
                          >
                            −
                          </button>
                          <div
                            className={`qty-value ${itemFlash ? "is-pop" : ""}`}
                            style={{
                              color: item.qty === 0 ? "#404055" : cat.color,
                            }}
                          >
                            {item.qty}
                          </div>
                          <button
                            type="button"
                            className="qty-btn qty-btn--plus tap-btn"
                            onClick={() => adjust(cat.id, item.model, 1)}
                            aria-label={`Increase ${item.model}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
