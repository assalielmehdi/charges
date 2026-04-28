const plainFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmountPlain(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return plainFormatter.format(Number.isFinite(n) ? n : 0);
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonthISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export function monthRangeFromISO(monthISO: string): {
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  from: string;
  to: string;
} {
  const [y, m] = monthISO.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(y, m, 0).getDate();
  return {
    year: y,
    month: m,
    daysInMonth: lastDay,
    from: `${y}-${pad(m)}-01`,
    to: `${y}-${pad(m)}-${pad(lastDay)}`,
  };
}
