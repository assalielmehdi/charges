import { useState, useEffect, useMemo } from "react";
import {
  Plus, ArrowLeft, Camera, Upload, X, Settings, Receipt,
  ChevronLeft, ChevronRight, Trash2, Pencil, Check, Sparkles,
  Calendar, FileText, Store, ChevronDown, MoreHorizontal,
  GripVertical, LogOut, Home as HomeIcon, ScanLine, FolderOpen,
  ArrowUpRight, Mail, Loader, Search
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   CHARGES v2 — quiet ledger, properly responsive.

   Design system primitives:
   • Surface tokens     — bg #0a0908, card white/[0.02], border white/[0.06]
   • Typography         — Instrument Serif italic for amounts; Geist UI; Geist Mono ledger
   • Section labels     — 10px, tracking-[0.22em], uppercase, stone-500
   • Hero amounts       — italic serif, decimals in stone-500
   • Primary action     — stone-100 bg, stone-950 text
   • Form inputs        — bottom-border, focus:border-white/30
   • Color palette      — 12-tone curated (warm + cool, all muted)
   ════════════════════════════════════════════════════════════════ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
`;

// Curated palette used by ColorPicker; categories pull from this.
const PALETTE = [
  "#E8B563", "#FBBF24", "#FB7185", "#FCA5A5",
  "#F59E0B", "#84E5C0", "#34D399", "#06B6D4",
  "#A5B4FC", "#C4B5FD", "#A78BFA", "#94A3B8",
];

// ── Demo data ─────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "food",      name: "Food",          color: "#E8B563" },
  { id: "groceries", name: "Groceries",     color: "#84E5C0" },
  { id: "transport", name: "Transport",     color: "#A5B4FC" },
  { id: "utilities", name: "Utilities",     color: "#FCA5A5" },
  { id: "shopping",  name: "Shopping",      color: "#FBBF24" },
  { id: "health",    name: "Health",        color: "#FB7185" },
  { id: "leisure",   name: "Entertainment", color: "#C4B5FD" },
  { id: "other",     name: "Other",         color: "#94A3B8" },
];

const SAMPLE_EXPENSES = [
  { id: 1, amount: 47.00,  merchant: "Café Clock",        category: "food",      date: "2026-04-28", source: "manual", notes: "Lunch w/ Yasmine" },
  { id: 2, amount: 28.00,  merchant: "Careem",            category: "transport", date: "2026-04-28", source: "manual" },
  { id: 3, amount: 312.40, merchant: "Marjane",           category: "groceries", date: "2026-04-27", source: "scan", hasPhoto: true },
  { id: 4, amount: 15.00,  merchant: "Petit Taxi",        category: "transport", date: "2026-04-27", source: "manual" },
  { id: 5, amount: 89.50,  merchant: "Pizza Hut",         category: "food",      date: "2026-04-26", source: "scan", hasPhoto: true },
  { id: 6, amount: 459.00, merchant: "Inwi",              category: "utilities", date: "2026-04-25", source: "manual", notes: "Monthly internet" },
  { id: 7, amount: 132.00, merchant: "Carrefour Market",  category: "groceries", date: "2026-04-24", source: "scan", hasPhoto: true },
  { id: 8, amount: 220.00, merchant: "Zara",              category: "shopping",  date: "2026-04-22", source: "manual" },
  { id: 9, amount: 35.00,  merchant: "Paul",              category: "food",      date: "2026-04-22", source: "manual" },
  { id: 10, amount: 18.00, merchant: "Tramway",           category: "transport", date: "2026-04-21", source: "manual" },
  { id: 11, amount: 410.00, merchant: "Pharmacie Centrale",category: "health",   date: "2026-04-20", source: "scan", hasPhoto: true },
  { id: 12, amount: 64.00, merchant: "Cinéma Rialto",     category: "leisure",   date: "2026-04-19", source: "manual" },
  { id: 13, amount: 95.00, merchant: "Café France",       category: "food",      date: "2026-04-17", source: "manual" },
  { id: 14, amount: 42.00, merchant: "Jus d'Orange",      category: "food",      date: "2026-04-15", source: "manual" },
  { id: 15, amount: 280.00, merchant: "Décathlon",         category: "shopping",  date: "2026-04-12", source: "manual" },
  { id: 16, amount: 25.00, merchant: "Petit Taxi",        category: "transport", date: "2026-04-10", source: "manual" },
  { id: 17, amount: 175.00, merchant: "Acima",             category: "groceries", date: "2026-04-08", source: "scan", hasPhoto: true },
  { id: 18, amount: 60.00, merchant: "Starbucks",         category: "food",      date: "2026-04-05", source: "manual" },
  { id: 19, amount: 320.00, merchant: "Lydec",             category: "utilities", date: "2026-04-03", source: "manual", notes: "Electricity" },
  { id: 20, amount: 45.00, merchant: "Petit Taxi",        category: "transport", date: "2026-04-02", source: "manual" },
];

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TODAY = new Date("2026-04-28");
const dayOfMonth = (iso) => new Date(iso).getDate();

const dayLabel = (iso) => {
  const d = new Date(iso);
  const diff = Math.round((TODAY - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
};

const groupByDay = (items) => {
  const groups = {};
  items.forEach((e) => {
    const k = dayLabel(e.date);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });
  return groups;
};

/* ════════════════════════════════════════════════════════════════
   DESIGN SYSTEM PRIMITIVES — every screen pulls from these.
   ════════════════════════════════════════════════════════════════ */

const SectionLabel = ({ children, className = "" }) => (
  <div className={`text-[10px] tracking-[0.22em] text-stone-500 uppercase ${className}`}>{children}</div>
);

const HeroAmount = ({ value, size = "lg", currency = true }) => {
  const sizes = {
    xl: "text-[80px] leading-[0.95]",
    lg: "text-[68px] leading-none",
    md: "text-[58px] leading-none",
    sm: "text-[42px] leading-none",
  };
  const [whole, dec] = fmt(value).split(".");
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-serif italic text-stone-100 tracking-tight ${sizes[size]}`}>
        {whole}<span className="text-stone-500">.{dec}</span>
      </span>
      {currency && <span className="text-stone-500 text-[15px] tracking-[0.15em]">MAD</span>}
    </div>
  );
};

const PrimaryButton = ({ children, onClick, className = "", icon }) => (
  <button
    onClick={onClick}
    className={`bg-stone-100 text-stone-950 rounded-2xl py-3.5 px-5 font-medium text-[14.5px] tracking-tight active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${className}`}
  >
    {icon}{children}
  </button>
);

const SecondaryButton = ({ children, onClick, className = "", danger }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl py-3.5 px-5 text-[14.5px] tracking-tight transition border ${
      danger ? "bg-rose-300/90 text-stone-950 border-transparent font-medium" : "bg-transparent text-stone-200 border-white/10 hover:border-white/20"
    } ${className}`}
  >
    {children}
  </button>
);

const FormField = ({ label, icon, value, onChange, placeholder, readonly, type = "text" }) => (
  <div>
    {label && <SectionLabel className="mb-1.5">{label}</SectionLabel>}
    <div className="flex items-center gap-3 border-b border-white/10 pb-2 focus-within:border-white/30 transition">
      {icon && <span className="text-stone-500">{icon}</span>}
      {readonly ? (
        <div className="text-[15px] text-stone-100 tracking-tight flex-1">{value}</div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent flex-1 outline-none text-[15px] text-stone-100 placeholder-stone-600 tracking-tight"
        />
      )}
    </div>
  </div>
);

const Pill = ({ active, onClick, children, color, size = "md" }) => {
  const sizes = { sm: "px-3 py-1 text-[12px]", md: "px-3.5 py-1.5 text-[13px]" };
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full tracking-tight transition border whitespace-nowrap ${sizes[size]} ${
        active
          ? "bg-stone-100 text-stone-950 border-stone-100"
          : "bg-transparent text-stone-400 border-white/10 hover:border-white/20 hover:text-stone-200"
      }`}
    >
      {color && !active && (
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle" style={{ backgroundColor: color }} />
      )}
      {children}
    </button>
  );
};

const DottedDivider = () => (
  <div className="h-px w-full" style={{ background: "repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)" }} />
);

const CategoryDot = ({ color, size = 9 }) => (
  <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
);

const CategoryGlyph = ({ color, size = "md" }) => {
  const sizes = { sm: "w-7 h-7 rounded-lg", md: "w-9 h-9 rounded-xl", lg: "w-11 h-11 rounded-2xl" };
  return (
    <div className={`${sizes[size]} border border-white/10 flex items-center justify-center`} style={{ backgroundColor: color + "12" }}>
      <CategoryDot color={color} />
    </div>
  );
};

const StatusBar = () => (
  <div className="md:hidden flex justify-between items-center px-6 pt-3 pb-1 text-[13px] font-medium text-stone-200/90 tracking-tight">
    <span>9:41</span>
    <div className="flex gap-1 items-center">
      <span className="text-[10px]">●●●●</span>
    </div>
  </div>
);

const ScreenHeader = ({ left, label, right }) => (
  <div className="flex items-center justify-between px-6 pt-2 pb-2">
    {left || <div className="w-9 h-9" />}
    {label && <SectionLabel>{label}</SectionLabel>}
    {right || <div className="w-9 h-9" />}
  </div>
);

const IconButton = ({ icon, onClick, variant = "ghost", className = "" }) => {
  const variants = {
    ghost: "border border-white/10 text-stone-300 hover:border-white/20",
    filled: "bg-stone-100 text-stone-950",
    danger: "border border-white/10 text-rose-300/80 hover:border-rose-300/30",
  };
  return (
    <button onClick={onClick} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${variants[variant]} ${className}`}>
      {icon}
    </button>
  );
};

/* ════════════════════════════════════════════════════════════════
   SPARKLINE DAY STRIP
   Replaces the simple month nav. Each bar = one day's total spend.
   Tap a bar to filter; tap "Clear day" to return to month view.
   ════════════════════════════════════════════════════════════════ */

const SparklineDayStrip = ({ expenses, selectedDay, onSelectDay, monthOffset, onMonthChange, todayDay }) => {
  const daysInMonth = 30;

  const dailyTotals = useMemo(() => {
    const byDay = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0 }));
    expenses.forEach((e) => {
      const d = dayOfMonth(e.date);
      if (d >= 1 && d <= daysInMonth) byDay[d - 1].total += e.amount;
    });
    return byDay;
  }, [expenses]);

  const max = Math.max(...dailyTotals.map((d) => d.total), 1);
  const monthLabel =
    monthOffset === 0 ? "April" : monthOffset === -1 ? "March" : monthOffset === 1 ? "May" : "—";

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 md:px-0">
        <button
          onClick={() => onMonthChange(monthOffset - 1)}
          className="w-8 h-8 rounded-full hover:bg-white/[0.04] flex items-center justify-center text-stone-400 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 text-stone-200 hover:text-stone-100 transition group">
          <span className="text-[14px] tracking-tight">{monthLabel}</span>
          <span className="text-[14px] tracking-tight text-stone-500">2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300" />
        </button>
        <button
          onClick={() => onMonthChange(monthOffset + 1)}
          className="w-8 h-8 rounded-full hover:bg-white/[0.04] flex items-center justify-center text-stone-400 transition"
          disabled={monthOffset >= 0}
        >
          <ChevronRight className={`w-4 h-4 ${monthOffset >= 0 ? "opacity-30" : ""}`} />
        </button>
      </div>

      {/* Sparkline strip */}
      <div className="mt-4 px-6 md:px-0 overflow-x-auto scrollbar-none">
        <div className="flex items-end gap-[3px] md:gap-1 min-w-min" style={{ minHeight: "72px" }}>
          {dailyTotals.map(({ day, total }) => {
            const heightPct = total > 0 ? Math.max(8, (total / max) * 100) : 0;
            const isSelected = selectedDay === day;
            const isToday = monthOffset === 0 && day === todayDay;
            const isFuture = monthOffset === 0 && day > todayDay;

            return (
              <button
                key={day}
                onClick={() => !isFuture && onSelectDay(isSelected ? null : day)}
                disabled={isFuture}
                className={`flex-1 min-w-[18px] md:min-w-[22px] flex flex-col items-center gap-2 group ${isFuture ? "opacity-25 cursor-not-allowed" : ""}`}
              >
                <div className="h-12 w-full flex flex-col justify-end relative">
                  {total > 0 ? (
                    <div
                      className={`w-full rounded-[3px] transition-all duration-300 ${
                        isSelected
                          ? "bg-stone-100"
                          : isToday
                          ? "bg-stone-300 group-hover:bg-stone-200"
                          : "bg-stone-700 group-hover:bg-stone-500"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  ) : (
                    <div className={`w-1 h-1 mx-auto rounded-full ${isToday ? "bg-stone-400" : "bg-stone-800"}`} />
                  )}
                </div>
                <div className={`text-[10px] font-mono transition ${
                  isSelected ? "text-stone-100" :
                  isToday ? "text-stone-300" :
                  isFuture ? "text-stone-700" :
                  "text-stone-500"
                }`}>
                  {day}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   COLOR PICKER + SHEET (used by category edit)
   ════════════════════════════════════════════════════════════════ */

const ColorPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-6 gap-2">
    {PALETTE.map((c) => {
      const active = value === c;
      return (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`aspect-square rounded-2xl flex items-center justify-center transition border ${
            active ? "border-white/40 scale-95" : "border-white/[0.06] hover:border-white/15"
          }`}
          style={{ backgroundColor: c + (active ? "26" : "16") }}
        >
          {active ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: c }}>
              <Check className="w-3 h-3 text-stone-950" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c }} />
          )}
        </button>
      );
    })}
  </div>
);

const Sheet = ({ children, onClose }) => (
  <div className="absolute md:fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center md:justify-center z-30" onClick={onClose}>
    <div
      className="w-full md:w-[440px] bg-stone-900 border-t md:border md:rounded-3xl border-white/10 rounded-t-3xl p-6 pb-8 md:max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const CategoryEditSheet = ({ category, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || PALETTE[0]);
  const isNew = !category;

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>{isNew ? "New category" : "Edit category"}</SectionLabel>
        <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <h2 className="font-serif italic text-stone-100 text-[36px] leading-[1.05] tracking-tight">
        {isNew ? <>Make it<br/><span className="text-stone-500">yours.</span></> : (name || category.name)}
      </h2>

      <div className="mt-7 space-y-6">
        <FormField label="Name" value={name} onChange={setName} placeholder="e.g. Coffee, Subscriptions" />

        <div>
          <SectionLabel className="mb-3">Color</SectionLabel>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3">
          <CategoryGlyph color={color} />
          <div className="flex-1">
            <div className="text-stone-100 text-[14.5px] tracking-tight">{name || "Preview"}</div>
            <div className="text-stone-500 text-[11.5px] tracking-tight">how it looks in the ledger</div>
          </div>
          <div className="font-mono text-[14px] text-stone-300">0.00</div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={() => onSave({ name: name || "Untitled", color })}>{isNew ? "Create" : "Save"}</PrimaryButton>
      </div>

      {!isNew && onDelete && (
        <button onClick={onDelete} className="w-full mt-3 py-2 text-rose-300/70 text-[12.5px] tracking-tight hover:text-rose-300 flex items-center justify-center gap-2">
          <Trash2 className="w-3.5 h-3.5" /> Delete category
        </button>
      )}
    </Sheet>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCREEN: LOGIN
   ════════════════════════════════════════════════════════════════ */

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="flex flex-col h-full px-7 pb-10 pt-12 md:pt-20 md:max-w-md md:mx-auto">
      <div className="flex-1 flex flex-col justify-end">
        <SectionLabel className="mb-3">Charges</SectionLabel>
        <h1 className="font-serif italic text-[64px] md:text-[72px] leading-[0.95] text-stone-100 tracking-tight">
          A quiet<br/>ledger.
        </h1>
        <p className="mt-5 text-stone-400 text-[15px] leading-relaxed max-w-[320px]">
          Sign in with the email on your allowlist. We'll send you a magic link.
        </p>
      </div>

      <div className="space-y-4 mt-12">
        {!sent ? (
          <>
            <FormField icon={<Mail className="w-4 h-4" />} value={email} onChange={setEmail} placeholder="you@example.com" />
            <PrimaryButton className="w-full" onClick={() => email && setSent(true)} icon={<ArrowUpRight className="w-4 h-4" />}>
              Send magic link
            </PrimaryButton>
          </>
        ) : (
          <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-4 h-4 text-stone-300" />
              <div className="text-stone-100 text-[14px] tracking-tight">Check your inbox</div>
            </div>
            <div className="text-stone-500 text-[13px] leading-relaxed">
              We sent a link to <span className="text-stone-300">{email}</span>. It expires in 10 minutes.
            </div>
            <button onClick={onLogin} className="mt-4 text-[13px] text-stone-100 underline underline-offset-4 decoration-white/30">
              Continue to app (demo)
            </button>
          </div>
        )}
        <p className="text-[11px] text-stone-600 text-center pt-1">Single-user · Allowlisted email only</p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   LEDGER VIEW — body of home screen, used in both mobile + desktop.
   ════════════════════════════════════════════════════════════════ */

const LedgerView = ({ expenses, categories, activeCategory, setActiveCategory, selectedDay, setSelectedDay, monthOffset, setMonthOffset, onOpen, isDesktop }) => {
  const findCat = (id) => categories.find((c) => c.id === id) || categories[categories.length - 1];

  let filtered = expenses;
  if (activeCategory !== "all") filtered = filtered.filter((e) => e.category === activeCategory);
  if (selectedDay) filtered = filtered.filter((e) => dayOfMonth(e.date) === selectedDay);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const groups = groupByDay(filtered);

  const heroLabel = selectedDay ? `Total · day ${selectedDay}` : "Total this month";

  return (
    <div>
      <SparklineDayStrip
        expenses={expenses}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        monthOffset={monthOffset}
        onMonthChange={setMonthOffset}
        todayDay={28}
      />

      <div className={`mt-7 ${isDesktop ? "" : "px-6"}`}>
        <div className="flex items-baseline justify-between">
          <SectionLabel>{heroLabel}</SectionLabel>
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 tracking-tight">
              <X className="w-3 h-3" /> Clear day
            </button>
          )}
        </div>
        <div className="mt-2"><HeroAmount value={total} size="lg" /></div>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-stone-500 tracking-tight flex-wrap">
          <span>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
          {filtered.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <span>avg {fmt(avg)}</span>
            </>
          )}
          {!selectedDay && (
            <>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <span className="flex items-center gap-1 text-emerald-300/70">
                <ArrowUpRight className="w-3 h-3 rotate-90" /> 12% vs Mar
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter chips (sidebar handles this on desktop) */}
      {!isDesktop && (
        <div className="mt-7 pl-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pr-6">
            <Pill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All</Pill>
            {categories.map((c) => (
              <Pill key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} color={c.color}>
                {c.name}
              </Pill>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-8 ${isDesktop ? "" : "px-6"}`}>
        {Object.entries(groups).map(([day, items]) => (
          <div key={day} className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>{day}</SectionLabel>
              <div className="text-[11px] text-stone-600 font-mono tabular-nums">
                {fmt(items.reduce((s, e) => s + e.amount, 0))}
              </div>
            </div>
            <DottedDivider />
            <div className="divide-y divide-white/[0.04]">
              {items.map((e) => {
                const c = findCat(e.category);
                return (
                  <button key={e.id} onClick={() => onOpen(e)} className="w-full flex items-center gap-3.5 py-3.5 group hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition">
                    <div className="relative shrink-0">
                      <CategoryGlyph color={c.color} />
                      {e.source === "scan" && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-950 border border-white/10 flex items-center justify-center">
                          <Sparkles className="w-2 h-2 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-stone-100 text-[14.5px] tracking-tight truncate">{e.merchant}</div>
                      <div className="text-stone-500 text-[12px] tracking-tight truncate">{c.name}{e.notes ? ` · ${e.notes}` : ""}</div>
                    </div>
                    <div className="text-stone-100 text-[15px] font-mono tabular-nums shrink-0">{fmt(e.amount)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-stone-600 text-[13px]">No entries match this filter.</div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ADD EXPENSE
   ════════════════════════════════════════════════════════════════ */

const AddExpenseScreen = ({ onClose, onSave, categories, isDesktop }) => {
  const [amount, setAmount] = useState("0");
  const [selectedCat, setSelectedCat] = useState("food");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const press = (k) => {
    if (k === "del") return setAmount(amount.length > 1 ? amount.slice(0, -1) : "0");
    if (k === "." && amount.includes(".")) return;
    if (amount === "0" && k !== ".") return setAmount(k);
    setAmount(amount + k);
  };

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <ScreenHeader
        label="New expense"
        right={<IconButton icon={<X className="w-4 h-4" />} onClick={onClose} />}
      />

      <div className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto pb-4">
        <div className="mt-2">
          <SectionLabel>Amount</SectionLabel>
          <div className="mt-1 flex items-baseline gap-2">
            {isDesktop ? (
              <input
                value={amount}
                onChange={(e) => /^[0-9.]*$/.test(e.target.value) && setAmount(e.target.value || "0")}
                className="font-serif italic text-stone-100 text-[80px] leading-[0.95] tracking-tight bg-transparent outline-none w-full max-w-[260px]"
              />
            ) : (
              <span className="font-serif italic text-stone-100 text-[80px] leading-[0.95] tracking-tight">
                {amount.includes(".") ? amount.split(".")[0] : amount}
                {amount.includes(".") && <span className="text-stone-500">.{amount.split(".")[1] || ""}</span>}
              </span>
            )}
            <span className="text-stone-500 text-[15px] tracking-[0.15em]">MAD</span>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3 text-[13px]">
          <Calendar className="w-4 h-4 text-stone-500" />
          <button className="text-stone-100 tracking-tight">Today, 28 Apr</button>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
        </div>

        <div className="mt-6">
          <SectionLabel className="mb-3">Category</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-[13px] tracking-tight border transition flex items-center gap-2 ${
                  selectedCat === c.id ? "bg-white/[0.06] border-white/30 text-stone-100" : "border-white/[0.08] text-stone-400 hover:border-white/15"
                }`}
              >
                <CategoryDot color={c.color} size={6} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <FormField icon={<Store className="w-4 h-4" />} value={merchant} onChange={setMerchant} placeholder="Merchant (optional)" />
          {showNotes ? (
            <FormField icon={<FileText className="w-4 h-4" />} value={notes} onChange={setNotes} placeholder="Note" />
          ) : (
            <button onClick={() => setShowNotes(true)} className="text-[12px] text-stone-500 hover:text-stone-300 flex items-center gap-2">
              <Plus className="w-3 h-3" /> Add note
            </button>
          )}
        </div>

        <div className="flex-1" />
      </div>

      {!isDesktop && (
        <div className="px-5 pb-3 grid grid-cols-3 gap-1.5">
          {["1","2","3","4","5","6","7","8","9",".","0","del"].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-12 rounded-xl text-stone-100 text-[20px] font-light tracking-tight hover:bg-white/[0.04] active:bg-white/[0.08] transition flex items-center justify-center"
            >
              {k === "del" ? <ArrowLeft className="w-4 h-4 text-stone-400" /> : k}
            </button>
          ))}
        </div>
      )}
      <div className="px-5 pb-5">
        <PrimaryButton className="w-full" onClick={onSave}>Save expense</PrimaryButton>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCAN — capture, loading, review
   ════════════════════════════════════════════════════════════════ */

const ScanCaptureScreen = ({ onClose, onCaptured }) => (
  <div className="flex flex-col h-full">
    <StatusBar />
    <ScreenHeader label="Scan receipt" right={<IconButton icon={<X className="w-4 h-4" />} onClick={onClose} />} />

    <div className="flex-1 px-6 flex flex-col">
      <div className="mt-6">
        <h2 className="font-serif italic text-stone-100 text-[42px] leading-[1.05] tracking-tight">
          Snap it.<br/><span className="text-stone-500">We'll read it.</span>
        </h2>
        <p className="mt-3 text-stone-400 text-[14px] leading-relaxed max-w-[320px]">
          We'll extract amount, merchant and date. You confirm before anything is saved.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button onClick={onCaptured} className="aspect-[4/5] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-950 flex items-center justify-center"><Camera className="w-5 h-5" /></div>
          <div className="text-stone-100 text-[13px] tracking-tight">Take photo</div>
          <div className="text-stone-500 text-[11px]">Camera</div>
        </button>
        <button onClick={onCaptured} className="aspect-[4/5] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] transition">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 text-stone-100 flex items-center justify-center"><Upload className="w-5 h-5" /></div>
          <div className="text-stone-100 text-[13px] tracking-tight">Upload</div>
          <div className="text-stone-500 text-[11px]">From library</div>
        </button>
      </div>

      <div className="mt-8 border border-white/[0.06] rounded-2xl p-4 flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-stone-300" />
        </div>
        <div>
          <div className="text-[13px] text-stone-100 tracking-tight">Reviewed before saved</div>
          <div className="text-[12px] text-stone-500 leading-relaxed mt-0.5">
            AI suggests fields. Nothing is logged until you confirm.
          </div>
        </div>
      </div>
      <div className="flex-1" />
    </div>
  </div>
);

const ReceiptMockup = () => (
  <div className="w-44 h-56 rounded-2xl bg-gradient-to-b from-stone-200 to-stone-300 shadow-2xl shadow-black/40 overflow-hidden relative">
    <div className="absolute inset-x-0 top-0 h-6 bg-stone-100" />
    <div className="absolute inset-x-3 top-8 space-y-1.5">
      <div className="h-1.5 bg-stone-400/60 rounded w-3/4" />
      <div className="h-1.5 bg-stone-400/60 rounded w-1/2" />
      <div className="h-1.5 bg-stone-400/60 rounded w-2/3" />
      <div className="h-1.5 bg-stone-400/60 rounded w-1/3" />
      <div className="h-3" />
      <div className="h-1.5 bg-stone-400/60 rounded w-5/6" />
      <div className="h-1.5 bg-stone-400/60 rounded w-3/4" />
      <div className="h-3" />
      <div className="h-2 bg-stone-700/70 rounded w-1/2" />
    </div>
  </div>
);

const ScanLoadingScreen = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-10">
          <ReceiptMockup />
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-1 bg-stone-100/90 shadow-[0_0_20px_4px_rgba(255,255,255,0.4)]"
              style={{ animation: "scanLine 1.6s ease-in-out infinite" }} />
          </div>
        </div>
        <SectionLabel className="mb-2">Reading receipt</SectionLabel>
        <div className="font-serif italic text-stone-100 text-[24px]">Just a moment…</div>
        <div className="mt-1 text-[12px] text-stone-500 flex items-center gap-2">
          <Loader className="w-3 h-3 animate-spin" /> Extracting amount, date, merchant
        </div>
      </div>
      <style>{`@keyframes scanLine { 0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; } }`}</style>
    </div>
  );
};

const ScanReviewScreen = ({ onClose, onSave, categories }) => {
  const [amount, setAmount] = useState("312.40");
  const [merchant, setMerchant] = useState("Marjane");
  const [selectedCat, setSelectedCat] = useState("groceries");

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <ScreenHeader
        left={<IconButton icon={<ArrowLeft className="w-4 h-4" />} onClick={onClose} />}
        label="Review extraction"
      />

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
        <div className="rounded-2xl overflow-hidden h-40 bg-gradient-to-b from-stone-200 to-stone-300 relative">
          <div className="absolute inset-x-0 top-0 h-4 bg-stone-100" />
          <div className="absolute inset-x-4 top-6 space-y-1">
            <div className="h-1 bg-stone-500/50 rounded w-1/2" />
            <div className="h-1 bg-stone-500/50 rounded w-2/3" />
            <div className="h-1 bg-stone-500/50 rounded w-1/3" />
            <div className="h-1 bg-stone-500/50 rounded w-3/4" />
            <div className="h-1 bg-stone-500/50 rounded w-2/5" />
            <div className="h-2" />
            <div className="h-1.5 bg-stone-700/70 rounded w-1/3" />
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-stone-950/70 text-[10px] tracking-tight text-stone-200 backdrop-blur-md flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Tap to expand
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] tracking-tight">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          <span className="text-stone-400">High confidence · Edit anything below before saving</span>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <SectionLabel className="mb-1">Amount</SectionLabel>
            <div className="flex items-baseline gap-2 group">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-serif italic text-stone-100 text-[58px] leading-none tracking-tight bg-transparent outline-none border-b border-transparent focus:border-white/20 max-w-[200px]"
              />
              <span className="text-stone-500 text-[14px] tracking-[0.15em]">MAD</span>
              <Pencil className="w-3.5 h-3.5 text-stone-600 ml-2 opacity-0 group-focus-within:opacity-100 transition" />
            </div>
          </div>

          <FormField label="Merchant" icon={<Store className="w-4 h-4" />} value={merchant} onChange={setMerchant} />
          <FormField label="Date" icon={<Calendar className="w-4 h-4" />} value="27 April 2026" readonly />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <SectionLabel>Category</SectionLabel>
              <div className="text-[10px] text-stone-600 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> suggested
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-[13px] tracking-tight border transition flex items-center gap-2 ${
                    selectedCat === c.id ? "bg-white/[0.06] border-white/30 text-stone-100" : "border-white/[0.08] text-stone-400"
                  }`}
                >
                  <CategoryDot color={c.color} size={6} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 space-y-2 border-t border-white/[0.04]">
        <PrimaryButton className="w-full" onClick={onSave} icon={<Check className="w-4 h-4" />}>Save expense</PrimaryButton>
        <button onClick={onClose} className="w-full py-3 text-stone-500 text-[13px] tracking-tight hover:text-stone-300">
          Cancel · removes uploaded photo
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   DETAIL SCREEN
   ════════════════════════════════════════════════════════════════ */

const DetailScreen = ({ expense, onClose, onDelete, categories }) => {
  const c = categories.find((x) => x.id === expense.category) || categories[categories.length - 1];
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <ScreenHeader
        left={<IconButton icon={<ArrowLeft className="w-4 h-4" />} onClick={onClose} />}
        right={
          <div className="flex gap-2">
            <IconButton icon={<Pencil className="w-4 h-4" />} />
            <IconButton icon={<Trash2 className="w-4 h-4" />} variant="danger" onClick={() => setConfirmDelete(true)} />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4">
        <SectionLabel>{dayLabel(expense.date)}</SectionLabel>
        <div className="mt-2"><HeroAmount value={expense.amount} size="xl" /></div>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10">
          <CategoryDot color={c.color} />
          <span className="text-[12.5px] text-stone-200 tracking-tight">{c.name}</span>
        </div>

        {expense.hasPhoto && (
          <div className="mt-6 rounded-2xl overflow-hidden h-48 bg-gradient-to-b from-stone-200 to-stone-300 relative border border-white/[0.04]">
            <div className="absolute inset-x-0 top-0 h-4 bg-stone-100" />
            <div className="absolute inset-x-4 top-6 space-y-1">
              <div className="h-1 bg-stone-500/50 rounded w-1/2" />
              <div className="h-1 bg-stone-500/50 rounded w-2/3" />
              <div className="h-1 bg-stone-500/50 rounded w-1/3" />
              <div className="h-1 bg-stone-500/50 rounded w-3/4" />
              <div className="h-1 bg-stone-500/50 rounded w-2/5" />
              <div className="h-2" />
              <div className="h-1.5 bg-stone-700/70 rounded w-1/3" />
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-stone-950/70 text-[10px] tracking-tight text-stone-200 backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Auto-extracted
            </div>
          </div>
        )}

        <div className="mt-7 space-y-4">
          <DetailRow label="Merchant" value={expense.merchant} icon={<Store className="w-3.5 h-3.5" />} />
          <DetailRow label="Date" value={new Date(expense.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} icon={<Calendar className="w-3.5 h-3.5" />} />
          {expense.notes && <DetailRow label="Note" value={expense.notes} icon={<FileText className="w-3.5 h-3.5" />} />}
          <DetailRow label="Source" value={expense.source === "scan" ? "Scanned receipt" : "Manual entry"} icon={expense.source === "scan" ? <Sparkles className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />} />
        </div>

        <div className="mt-10 mb-8">
          <DottedDivider />
          <SectionLabel className="mt-3">id · {String(expense.id).padStart(6, "0")}</SectionLabel>
        </div>
      </div>

      {confirmDelete && (
        <Sheet onClose={() => setConfirmDelete(false)}>
          <div className="font-serif italic text-stone-100 text-[26px] leading-tight">Delete this entry?</div>
          <div className="text-stone-400 text-[13px] mt-2 leading-relaxed">This is permanent. There's no version history.</div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <SecondaryButton onClick={() => setConfirmDelete(false)}>Cancel</SecondaryButton>
            <SecondaryButton onClick={onDelete} danger>Delete</SecondaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-1">
    <div className="w-5 h-5 rounded-md flex items-center justify-center text-stone-500 mt-0.5">{icon}</div>
    <div className="flex-1">
      <SectionLabel>{label}</SectionLabel>
      <div className="text-[14.5px] text-stone-100 tracking-tight mt-0.5">{value}</div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   CATEGORIES MANAGEMENT
   ════════════════════════════════════════════════════════════════ */

const CategoriesScreen = ({ categories, expenses, onClose, onSaveCategory, onDeleteCategory }) => {
  const [editing, setEditing] = useState(null);

  const counts = useMemo(() => {
    const c = {};
    expenses.forEach((e) => { c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [expenses]);

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <ScreenHeader
        left={<IconButton icon={<ArrowLeft className="w-4 h-4" />} onClick={onClose} />}
        label="Categories"
        right={<IconButton icon={<Plus className="w-4 h-4" />} variant="filled" onClick={() => setEditing("new")} />}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6">
        <h1 className="font-serif italic text-stone-100 text-[40px] leading-[1.05] tracking-tight">
          Tags to sort<br/><span className="text-stone-500">it all.</span>
        </h1>
        <p className="mt-3 text-stone-400 text-[13.5px] leading-relaxed">
          Drag to reorder. One category per expense. In-use categories can't be deleted.
        </p>

        <div className="mt-7 space-y-1">
          {categories.map((c) => {
            const inUse = (counts[c.id] || 0) > 0;
            return (
              <div key={c.id} className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] group">
                <GripVertical className="w-4 h-4 text-stone-700 group-hover:text-stone-500 transition shrink-0 cursor-grab" />
                <CategoryGlyph color={c.color} />
                <div className="flex-1 min-w-0">
                  <div className="text-stone-100 text-[14.5px] tracking-tight">{c.name}</div>
                  <div className="text-stone-500 text-[11.5px] tracking-tight">
                    {counts[c.id] || 0} {counts[c.id] === 1 ? "entry" : "entries"}
                    {!inUse && <span className="text-stone-600"> · safe to delete</span>}
                  </div>
                </div>
                <button onClick={() => setEditing(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/[0.04] transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <button onClick={() => setEditing("new")} className="w-full py-3.5 rounded-2xl border border-dashed border-white/15 text-stone-300 text-[13.5px] tracking-tight hover:bg-white/[0.02] flex items-center justify-center gap-2 transition">
            <Plus className="w-4 h-4" /> Add category
          </button>
        </div>
      </div>

      {editing && (
        <CategoryEditSheet
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            onSaveCategory(editing === "new" ? null : editing.id, data);
            setEditing(null);
          }}
          onDelete={editing !== "new" ? () => {
            onDeleteCategory(editing.id);
            setEditing(null);
          } : null}
        />
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MOBILE HOME — wraps LedgerView with mobile chrome
   ════════════════════════════════════════════════════════════════ */

const NavTab = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 py-2 rounded-xl transition ${active ? "text-stone-100" : "text-stone-500"}`}>
    {icon}
    <span className="text-[10px] tracking-[0.1em] uppercase">{label}</span>
  </button>
);

const MobileHome = (props) => (
  <div className="flex flex-col h-full">
    <StatusBar />
    <div className="px-6 pt-2 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
          <span className="font-serif italic text-stone-950 text-[14px] leading-none pt-0.5">c</span>
        </div>
        <span className="text-stone-100 text-[15px] tracking-tight">Charges</span>
      </div>
      <IconButton icon={<Settings className="w-4 h-4" />} onClick={props.onLogout} />
    </div>

    <div className="flex-1 overflow-y-auto pb-32 pt-3">
      <LedgerView {...props} isDesktop={false} />
    </div>

    <div className="absolute bottom-0 left-0 right-0">
      <div className="px-6 pb-2 flex justify-end gap-3 pointer-events-none">
        <button onClick={props.onAdd} className="pointer-events-auto h-14 px-6 rounded-2xl bg-stone-100 text-stone-950 flex items-center gap-2 shadow-2xl shadow-black/40 active:scale-95 transition">
          <Plus className="w-5 h-5" strokeWidth={2.2} />
          <span className="text-[14px] font-medium tracking-tight">Add</span>
        </button>
        <button onClick={props.onScan} className="pointer-events-auto h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-center text-stone-100 active:scale-95 transition">
          <ScanLine className="w-5 h-5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="border-t border-white/[0.06] bg-stone-950/80 backdrop-blur-xl">
        <div className="grid grid-cols-3 px-2 py-2">
          <NavTab icon={<HomeIcon className="w-[18px] h-[18px]" />} label="Ledger" active />
          <NavTab icon={<ScanLine className="w-[18px] h-[18px]" />} label="Scan" onClick={props.onScan} />
          <NavTab icon={<FolderOpen className="w-[18px] h-[18px]" />} label="Categories" onClick={props.onCategories} />
        </div>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   DESKTOP SHELL — sidebar + main + modals
   ════════════════════════════════════════════════════════════════ */

const DesktopSidebar = ({ categories, activeCategory, setActiveCategory, expenses, onScan, onManageCategories, onLogout }) => {
  const counts = useMemo(() => {
    const c = { all: expenses.length };
    expenses.forEach((e) => { c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [expenses]);

  const SidebarBtn = ({ icon, label, onClick, active }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] tracking-tight transition ${
      active ? "bg-white/[0.06] text-stone-100" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]"
    }`}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <aside className="border-r border-white/[0.06] flex flex-col h-screen bg-[#0a0908] sticky top-0">
      <div className="px-6 pt-7 pb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
          <span className="font-serif italic text-stone-950 text-[16px] leading-none pt-0.5">c</span>
        </div>
        <span className="text-stone-100 text-[16px] tracking-tight">Charges</span>
      </div>

      <div className="px-3 space-y-0.5">
        <SidebarBtn icon={<HomeIcon className="w-4 h-4" />} label="Ledger" active />
        <SidebarBtn icon={<ScanLine className="w-4 h-4" />} label="Scan receipt" onClick={onScan} />
      </div>

      <div className="px-6 mt-7 mb-3 flex items-center justify-between">
        <SectionLabel>Filter by category</SectionLabel>
      </div>

      <div className="px-3 space-y-0.5 flex-1 overflow-y-auto">
        <button
          onClick={() => setActiveCategory("all")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] tracking-tight transition ${
            activeCategory === "all" ? "bg-white/[0.06] text-stone-100" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-stone-300" />
          <span className="flex-1 text-left">All</span>
          <span className="text-[11px] font-mono text-stone-500">{counts.all}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] tracking-tight transition ${
              activeCategory === c.id ? "bg-white/[0.06] text-stone-100" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]"
            }`}
          >
            <CategoryDot color={c.color} size={8} />
            <span className="flex-1 text-left truncate">{c.name}</span>
            <span className="text-[11px] font-mono text-stone-500">{counts[c.id] || 0}</span>
          </button>
        ))}

        <button
          onClick={onManageCategories}
          className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] tracking-tight text-stone-500 hover:text-stone-300 transition"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Manage categories</span>
        </button>
      </div>

      <div className="border-t border-white/[0.06] p-3 space-y-0.5">
        <SidebarBtn icon={<Settings className="w-4 h-4" />} label="Settings" />
        <SidebarBtn icon={<LogOut className="w-4 h-4" />} label="Sign out" onClick={onLogout} />
      </div>
    </aside>
  );
};

const DesktopModal = ({ children, onClose, width = "440px" }) => (
  <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-30 flex items-center justify-center p-8" onClick={onClose}>
    <div
      className="bg-[#0a0908] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col"
      style={{ width, height: "720px" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   APP ROOT
   ════════════════════════════════════════════════════════════════ */

export default function App() {
  const [screen, setScreen] = useState("login");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [transition, setTransition] = useState(false);

  const go = (s, e) => {
    setTransition(true);
    setTimeout(() => {
      setScreen(s);
      if (e) setSelectedExpense(e);
      setTransition(false);
    }, 120);
  };

  const handleSaveCategory = (id, data) => {
    if (id === null) {
      setCategories([...categories, { id: `cat_${Date.now()}`, ...data }]);
    } else {
      setCategories(categories.map((c) => (c.id === id ? { ...c, ...data } : c)));
    }
  };
  const handleDeleteCategory = (id) => setCategories(categories.filter((c) => c.id !== id));

  const ledgerProps = {
    expenses: SAMPLE_EXPENSES,
    categories,
    activeCategory, setActiveCategory,
    selectedDay, setSelectedDay,
    monthOffset, setMonthOffset,
    onOpen: (e) => go("detail", e),
  };

  /* ── Mobile renderer ─────────────────────────────────────── */
  const renderMobile = () => {
    switch (screen) {
      case "login": return <LoginScreen onLogin={() => go("home")} />;
      case "home":
        return <MobileHome
          {...ledgerProps}
          onAdd={() => go("add")}
          onScan={() => go("scan-capture")}
          onCategories={() => go("categories")}
          onLogout={() => go("login")}
        />;
      case "add": return <AddExpenseScreen categories={categories} onClose={() => go("home")} onSave={() => go("home")} />;
      case "scan-capture": return <ScanCaptureScreen onClose={() => go("home")} onCaptured={() => go("scan-loading")} />;
      case "scan-loading": return <ScanLoadingScreen onDone={() => go("scan-review")} />;
      case "scan-review": return <ScanReviewScreen categories={categories} onClose={() => go("home")} onSave={() => go("home")} />;
      case "detail": return <DetailScreen categories={categories} expense={selectedExpense} onClose={() => go("home")} onDelete={() => go("home")} />;
      case "categories":
        return <CategoriesScreen
          categories={categories}
          expenses={SAMPLE_EXPENSES}
          onClose={() => go("home")}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
        />;
      default: return null;
    }
  };

  /* ── Desktop renderer ────────────────────────────────────── */
  const renderDesktop = () => {
    if (screen === "login") return <LoginScreen onLogin={() => go("home")} />;

    const isModal = ["add", "scan-capture", "scan-loading", "scan-review", "detail", "categories"].includes(screen);

    return (
      <div className="grid h-screen" style={{ gridTemplateColumns: "260px 1fr" }}>
        <DesktopSidebar
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          expenses={SAMPLE_EXPENSES}
          onScan={() => go("scan-capture")}
          onManageCategories={() => go("categories")}
          onLogout={() => go("login")}
        />

        <main className="overflow-y-auto">
          <div className="max-w-[760px] mx-auto px-10 pt-10 pb-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="font-serif italic text-stone-100 text-[36px] leading-none tracking-tight">Ledger</div>
                <div className="text-stone-500 text-[13px] mt-1.5 tracking-tight">Daily spending, all in one place.</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => go("scan-capture")} className="h-10 px-4 rounded-xl border border-white/10 text-stone-200 text-[13px] tracking-tight hover:border-white/25 transition flex items-center gap-2">
                  <ScanLine className="w-4 h-4" /> Scan
                </button>
                <button onClick={() => go("add")} className="h-10 px-4 rounded-xl bg-stone-100 text-stone-950 text-[13px] font-medium tracking-tight active:scale-[0.98] transition flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add expense
                </button>
              </div>
            </div>

            <LedgerView {...ledgerProps} isDesktop />
          </div>
        </main>

        {isModal && (
          <DesktopModal onClose={() => go("home")}>
            {screen === "add" && <AddExpenseScreen categories={categories} isDesktop onClose={() => go("home")} onSave={() => go("home")} />}
            {screen === "scan-capture" && <ScanCaptureScreen onClose={() => go("home")} onCaptured={() => go("scan-loading")} />}
            {screen === "scan-loading" && <ScanLoadingScreen onDone={() => go("scan-review")} />}
            {screen === "scan-review" && <ScanReviewScreen categories={categories} onClose={() => go("home")} onSave={() => go("home")} />}
            {screen === "detail" && selectedExpense && <DetailScreen categories={categories} expense={selectedExpense} onClose={() => go("home")} onDelete={() => go("home")} />}
            {screen === "categories" && <CategoriesScreen
              categories={categories}
              expenses={SAMPLE_EXPENSES}
              onClose={() => go("home")}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
            />}
          </DesktopModal>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "radial-gradient(ellipse at top, #1c1917 0%, #0a0908 60%)", fontFamily: "'Geist', system-ui, sans-serif" }}
    >
      <style>{FONTS}</style>
      <style>{`
        .font-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .font-mono  { font-family: 'Geist Mono', ui-monospace, monospace; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
        .h-13 { height: 3.25rem; }
      `}</style>

      <div className="md:hidden h-screen w-full flex items-center justify-center">
        <div className={`relative w-full h-screen overflow-hidden bg-[#0a0908] transition-all duration-150 ${transition ? "opacity-0" : "opacity-100"}`}>
          {renderMobile()}
        </div>
      </div>

      <div className={`hidden md:block transition-opacity duration-150 ${transition ? "opacity-0" : "opacity-100"}`}>
        {renderDesktop()}
      </div>
    </div>
  );
}
