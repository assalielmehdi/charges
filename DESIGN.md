# Charges — Design System Reference

> **Codename:** Quiet Ledger
> Single source of truth for the visual layer. The companion file `charges-app.jsx` is the working prototype every spec here is taken from. When in doubt, the prototype wins.

---

## 1. Philosophy

A dark, warm-toned ledger. Minimal chrome. One signature: **hero amounts are always rendered in italic Instrument Serif against a system-sans body**, with decimals dropped to a secondary tone. This is the single most distinctive move; never replace it with a sans-serif amount.

Generous breathing room. Dotted dividers between day groups (ledger feel). One AI-extraction indicator (Sparkles in a tiny stone-950 circle). No accent colors except for category dots and a single semantic green for positive deltas.

---

## 2. Foundation

### Background
```
Page background:  radial-gradient(ellipse at top, #1c1917 0%, #0a0908 60%)
Solid fallback:   #0a0908
```

### Surface tokens
```
Card fill:           bg-white/[0.02]
Card border:         border-white/[0.06]
Strong divider:      border-white/10
Hover/active border: border-white/20
Strong border:       border-white/30  (focused inputs, active filter)
Sidebar/sheet bg:    #0a0908 (sidebar) · stone-900 (sheets/modals)
```

### Radii
```
rounded-lg   → small surfaces (8px)
rounded-xl   → chips, secondary buttons (12px)
rounded-2xl  → cards, primary buttons, color swatches (16px)
rounded-3xl  → modals, sheets, dropzones (24px)
rounded-full → pills, dots, icon buttons
```

---

## 3. Typography

### Fonts
```
Display (amounts):    Instrument Serif, italic
UI body:              Geist (weights 300, 400, 500, 600)
Tabular numbers:      Geist Mono
```

Load via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap
```

### Scale
| Role | Class | Notes |
|---|---|---|
| Hero amount XL | `text-[80px] leading-[0.95]` | Detail screen, Add amount |
| Hero amount LG | `text-[68px] leading-none` | Home month total |
| Hero amount MD | `text-[58px] leading-none` | Scan review |
| Hero amount SM | `text-[42px] leading-none` | Smaller contexts |
| Display heading | `text-[36-72px] leading-[0.95-1.05]` | "A quiet / ledger." pattern; second line in stone-500 |
| Body | `text-[14.5px] tracking-tight` | Default UI text |
| Body small | `text-[13px] tracking-tight` | Secondary UI |
| Caption | `text-[12px] tracking-tight` | Metadata |
| Section label | `text-[10px] tracking-[0.22em] uppercase` | EVERY section header |
| Mono number | `text-[11-15px] font-mono tabular-nums` | Ledger amounts |

### Text color hierarchy
```
stone-100  → primary text, active states, amounts
stone-200  → secondary / hover
stone-300  → tertiary
stone-400  → muted body, inactive nav
stone-500  → section labels, decimals, captions
stone-600  → deep muted, placeholders, hint text
stone-700  → barely there (faded futures, inactive bars)
```

### The decimal rule (signature detail)
Every amount in the app is split into whole and decimal, with the decimal in `text-stone-500`:
```jsx
<span className="font-serif italic text-stone-100">
  47<span className="text-stone-500">.00</span>
</span>
<span className="text-stone-500 text-[15px] tracking-[0.15em]">MAD</span>
```

---

## 4. Color palette

### Category palette (curated, 12 hues)
```
#E8B563   warm gold       (Food)
#FBBF24   amber           (Shopping)
#FB7185   coral           (Health)
#FCA5A5   pink            (Utilities)
#F59E0B   amber-deep
#84E5C0   mint            (Groceries)
#34D399   emerald
#06B6D4   cyan
#A5B4FC   indigo-soft     (Transport)
#C4B5FD   violet-soft     (Entertainment)
#A78BFA   violet
#94A3B8   slate           (Other)
```

Categories use the color as both a small dot and a 12% alpha background tint:
```jsx
backgroundColor: color + "12"  // tinted glyph background
```

### Semantic accents (sparingly)
```
Positive delta:   text-emerald-300/70    (e.g. "12% vs Mar")
Confidence dot:   bg-emerald-400/80
Danger button:    bg-rose-300/90 text-stone-950
Danger icon:      text-rose-300/80
```

---

## 5. Spacing rhythm

```
Tight section:    mt-3
Small section:    mt-4
Medium section:   mt-6
Large section:    mt-7
Major section:    mt-8 to mt-10

Card padding:     p-4 (compact) · p-5 · p-6 (large)
Button padding:   py-3.5 px-5 (standard)
Sheet padding:    p-6 pb-8
Screen padding:   px-6 (mobile) · px-10 (desktop main)
```

---

## 6. Component specs

### `<SectionLabel>` — the most-used primitive
```jsx
<div className="text-[10px] tracking-[0.22em] text-stone-500 uppercase">{children}</div>
```
Used **above every section** on every screen. Never make it bigger or change its tracking.

### `<HeroAmount>` — italic serif amount with split decimals
```jsx
<div className="flex items-baseline gap-2">
  <span className="font-serif italic text-stone-100 tracking-tight text-[68px] leading-none">
    {whole}<span className="text-stone-500">.{dec}</span>
  </span>
  <span className="text-stone-500 text-[15px] tracking-[0.15em]">MAD</span>
</div>
```
Sizes via prop: `xl` (80px) · `lg` (68px) · `md` (58px) · `sm` (42px).

### `<PrimaryButton>`
```
bg-stone-100 text-stone-950 rounded-2xl py-3.5 px-5
font-medium text-[14.5px] tracking-tight
active:scale-[0.98] transition-transform
```
Always solid stone-100 / stone-950. Never use any other color for primary.

### `<SecondaryButton>`
```
bg-transparent text-stone-200 border border-white/10 rounded-2xl py-3.5 px-5
text-[14.5px] tracking-tight
hover:border-white/20
```
Danger variant: `bg-rose-300/90 text-stone-950 border-transparent font-medium`.

### `<FormField>`
Bottom-border inputs (no boxes):
```
Container: flex items-center gap-3 border-b border-white/10 pb-2
           focus-within:border-white/30 transition
Input:     bg-transparent flex-1 outline-none
           text-[15px] text-stone-100 placeholder-stone-600 tracking-tight
Icon:      text-stone-500 (lucide, w-4 h-4)
Label:     SectionLabel above, mb-1.5
```

### `<Pill>` — category filter chip
```
Active:   bg-stone-100 text-stone-950 border-stone-100
          rounded-full px-3.5 py-1.5 text-[13px] tracking-tight
Inactive: bg-transparent text-stone-400 border border-white/10
          rounded-full px-3.5 py-1.5 text-[13px]
          (with optional 1.5px color dot, mr-2)
```

### `<CategoryDot>` and `<CategoryGlyph>`
Dot is just a colored circle (default 9px). Glyph is a tinted rounded square containing the dot:
```
sm: w-7 h-7 rounded-lg
md: w-9 h-9 rounded-xl    (default in lists)
lg: w-11 h-11 rounded-2xl
Container: border border-white/10, backgroundColor: color + "12"
```

### `<IconButton>`
36×36 (`w-9 h-9`) `rounded-full`. Variants:
```
ghost:  border border-white/10 text-stone-300 hover:border-white/20
filled: bg-stone-100 text-stone-950
danger: border border-white/10 text-rose-300/80 hover:border-rose-300/30
```

### `<DottedDivider>` — between day groups
```jsx
<div className="h-px w-full"
  style={{ background: "repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)" }} />
```

### `<Sheet>` — bottom sheet on mobile, centered dialog on desktop
```
Backdrop:  bg-stone-950/80 backdrop-blur-md, items-end md:items-center md:justify-center
Container: w-full md:w-[440px] bg-stone-900 rounded-t-3xl md:rounded-3xl
           border-t md:border border-white/10 p-6 pb-8
```
Used for: category edit, delete confirmation, any modal interaction.

### `<DesktopModal>` — full-screen overlay for Add/Scan/Detail/Categories on desktop
```
Backdrop:  fixed inset-0 bg-stone-950/70 backdrop-blur-md p-8
Card:      440 × 720, bg-[#0a0908] border border-white/10 rounded-3xl
           shadow-2xl shadow-black/60
```
The same screen components render inside; the only difference is chrome.

### `<SparklineDayStrip>` — month spending visualizer
Replaces a traditional month picker. One bar per day, height = (day total / month max) × 100%, min 8% if there's any spend, else a 1×1 dot.

Bar states:
```
Selected:   bg-stone-100
Today:      bg-stone-300 (hover: bg-stone-200)
Has spend:  bg-stone-700 (hover: bg-stone-500)
No spend:   1px dot in stone-800 (today: stone-400)
Future:     opacity-25, disabled
```
Bar shape: `rounded-[3px]` · width fills column (min 18-22px) · column gap 3-4px.

Number below in `font-mono text-[10px]`, color follows the bar's intensity.

Above the strip: month nav (`<ChevronLeft/right>` 8×8 ghost buttons + month name + year in stone-500 + ChevronDown).

### `<ColorPicker>` — 6-column grid of palette swatches
Each swatch:
```
Container: aspect-square rounded-2xl border border-white/[0.06] (active: border-white/40 scale-95)
           backgroundColor: color + "16" (active: + "26")
Inner:     w-3.5 h-3.5 circle (inactive) → w-5 h-5 circle with Check icon (active)
```

---

## 7. Layout

### Mobile shell (`<md`)
```
[StatusBar]                            ← 9:41 indicator, hidden on md+
[Top header: brand · settings]         ← 7×7 stone-100 logo, "Charges" label
[Scrollable content, pb-32]            ← LedgerView body
[Floating Add + Scan buttons]          ← bottom right, h-14
[Bottom nav]                           ← Ledger / Scan / Categories tabs
```
The home screen's bottom region is `position: absolute` with the FAB row floating above the tab bar.

### Desktop shell (`md+`)
```
┌──────────┬──────────────────────────────┐
│ 260px    │  max-w-[760px] mx-auto       │
│ sidebar  │  px-10 pt-10 pb-24           │
│          │                              │
│ Brand    │  ┌─ "Ledger" + actions       │
│          │  │  serif italic 36px        │
│ Nav      │  │  stone-500 subtitle       │
│ ─────    │  │  Scan / Add buttons       │
│ Filters  │  │                           │
│   All    │  ├─ <SparklineDayStrip>     │
│ ● Food   │  ├─ <HeroAmount lg>         │
│ ● Groc   │  ├─ <Ledger groups>         │
│ ...      │  └─                          │
│ Manage   │                              │
│          │                              │
│ Settings │                              │
│ Sign out │                              │
└──────────┴──────────────────────────────┘
```
Add / Scan / Detail / Categories open as **440 × 720 centered modals** over a backdrop-blur veil. Don't try to inline them into the main column.

### Breakpoint
Single breakpoint: `md` (Tailwind default 768px). Below: mobile shell. At/above: desktop shell.

---

## 8. Screens

### Login
- Two-line italic display: "A quiet / ledger." (`text-[64px] md:text-[72px]`).
- Stone-400 explanatory paragraph (max-w-[320px]).
- FormField with Mail icon → PrimaryButton "Send magic link" with `<ArrowUpRight>`.
- After send: bordered card showing "Check your inbox" with the email in stone-300.
- Footer caption: "Single-user · Allowlisted email only" in stone-600 11px.

### Home / Ledger
- Brand row (mobile only).
- `<SparklineDayStrip>` with month nav.
- "TOTAL THIS MONTH" SectionLabel + `<HeroAmount lg>`.
- Stats line: "{n} entries · avg X.XX · ↗ 12% vs Mar".
- Category filter chips (mobile only — sidebar handles this on desktop).
- Day groups: `<SectionLabel>` for day name + mono total on right, `<DottedDivider>`, then expense rows separated by `divide-white/[0.04]`.
- Each row: CategoryGlyph (with Sparkles badge if scanned) · merchant + category meta · mono amount.

### Add expense
- ScreenHeader with "NEW EXPENSE" label and X close button.
- "AMOUNT" label + 80px italic serif input.
- Date row: Calendar icon + "Today, 28 Apr" + ChevronDown.
- "CATEGORY" pills (full names, with color dots).
- FormField rows for merchant, optional notes (collapsed behind "+ Add note").
- 3-column numpad at bottom (mobile only).
- PrimaryButton "Save expense" (full width).

### Scan capture
- "SCAN RECEIPT" label.
- Display: "Snap it. / We'll read it." (second line stone-500).
- Two dropzones, aspect-[4/5] rounded-3xl border-dashed: Take photo (filled stone-100 icon block) and Upload (bordered icon block).
- Disclaimer card with Sparkles icon: "Reviewed before saved".

### Scan loading
- Receipt mockup (180×220 stone-200/300 gradient with text bars).
- Animated 1px scan line traveling vertically (`@keyframes scanLine`, 1.6s ease-in-out infinite).
- "READING RECEIPT" label + "Just a moment…" italic 24px + spinner row.

### Scan review
- Receipt thumbnail (40-row tall card) with "Tap to expand" pill.
- Confidence row: 1.5×1.5 emerald-400/80 dot + "High confidence · Edit anything below".
- Editable amount (inline, focus shows pencil icon).
- FormField: Merchant, Date (readonly).
- Suggested category pills with little Sparkles "suggested" hint.
- Sticky bottom: PrimaryButton "Save expense" + "Cancel · removes uploaded photo" link.

### Detail
- ScreenHeader with back, edit, delete (danger).
- Day label + `<HeroAmount xl>`.
- Category badge: pill with dot.
- Receipt thumbnail (if scanned) with "Auto-extracted" pill.
- DetailRows: Merchant, Date, Note, Source — each with small icon + SectionLabel + value.
- Footer: dotted divider + `id · 000001`.
- Delete confirmation in `<Sheet>`: italic 26px question + stone-400 explanation + Cancel/Delete.

### Categories
- Display heading: "Tags to sort / it all."
- Stone-400 explanatory paragraph.
- Rows: GripVertical handle (stone-700, hover stone-500) + CategoryGlyph + name/count + Pencil edit button.
- Bottom: dashed dropzone "+ Add category".
- Edit/new opens `<CategoryEditSheet>` with FormField name + ColorPicker + live preview row + Cancel/Save + Delete link (when editing).

---

## 9. Distinctive details (do not change)

1. **Italic serif amounts** with stone-500 decimals + stone-500 currency code.
2. **10px / 0.22em uppercase section labels** above every section.
3. **Dotted dividers** between day groups (not solid lines).
4. **Sparkles badge** in a stone-950 circle on the corner of CategoryGlyph for scanned items.
5. **Sparkline day strip** instead of a calendar grid or month picker.
6. **rounded-2xl primary buttons** (not rounded-full).
7. **Bottom-border inputs** (not bordered boxes).
8. **stone-100 (almost white) primary action color**, not blue/brand color.
9. **Moroccan merchants in MAD** in sample data (Marjane, Inwi, Petit Taxi, Lydec).
10. **Display headings split across two lines** with the second line in stone-500.

---

## 10. Anti-patterns to avoid

- ❌ Sans-serif amounts. Always italic serif.
- ❌ Bold weight on amounts (the italic IS the emphasis).
- ❌ Solid card borders (always white/[0.06] or weaker).
- ❌ Drop shadows on cards. Only on the FAB and floating modals.
- ❌ Large rounded corners on small chips (use rounded-xl, not rounded-3xl).
- ❌ Bright accent colors. The whole UI is stone + 12-hue category palette + one emerald.
- ❌ Filled backgrounds on form inputs. Bottom-border only.
- ❌ Status bar / bottom nav showing on desktop. They auto-hide via `md:hidden`.
- ❌ Trying to inline modals into the main column on desktop. Always centered overlay.
