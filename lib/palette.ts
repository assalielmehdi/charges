// Curated 12-hue category palette from DESIGN.md §4.
// Categories don't have a `color` column, so colors are derived deterministically
// from `category.id` via the FNV-1a hash below.

export const PALETTE = [
  "#E8B563", // warm gold      — Food
  "#FBBF24", // amber          — Shopping
  "#FB7185", // coral          — Health
  "#FCA5A5", // pink           — Utilities
  "#F59E0B", // amber-deep
  "#84E5C0", // mint           — Groceries
  "#34D399", // emerald
  "#06B6D4", // cyan
  "#A5B4FC", // indigo-soft    — Transport
  "#C4B5FD", // violet-soft    — Entertainment
  "#A78BFA", // violet
  "#94A3B8", // slate          — Other / fallback
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export function colorForCategoryId(id: string): PaletteColor {
  // FNV-1a 32-bit. Stable across runs, no external deps.
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return PALETTE[(h >>> 0) % PALETTE.length];
}
