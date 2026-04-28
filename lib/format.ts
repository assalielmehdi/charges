const amountFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plainFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

export function formatAmount(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return amountFormatter.format(n);
}

export function formatAmountPlain(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return plainFormatter.format(Number.isFinite(n) ? n : 0);
}

export function formatDate(date: string): string {
  // `date` is a YYYY-MM-DD string from Postgres; build a local Date so the
  // weekday isn't shifted by the browser timezone.
  const [y, m, d] = date.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
  };
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
