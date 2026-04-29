export type RecurringSource = "manual" | "scan" | "recurring";

export const SKIP_REASONS = {
  deletedGeneratedExpense: "deleted_generated_expense",
  uncheckedCurrentMonth: "unchecked_current_month",
  pauseEffectiveMonth: "pause_effective_month",
  resumeUncheckedCurrentMonth: "resume_unchecked_current_month",
} as const;

export function normalizeMonthISO(value: string): string | null {
  const raw = value.trim();
  const month = raw.length === 7 ? `${raw}-01` : raw;
  if (!/^\d{4}-\d{2}-01$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber < 1 || monthNumber > 12 || year < 1900) return null;
  return month;
}

export function monthInputValue(monthDate: string | null): string {
  return monthDate ? monthDate.slice(0, 7) : "";
}

export function monthRange(monthDate: string): { from: string; to: string } {
  const [year, month] = monthDate.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function previousMonth(monthDate: string): string {
  const [year, month] = monthDate.slice(0, 7).split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function isMonthEligible({
  startsOn,
  endsOn,
  month,
}: {
  startsOn: string;
  endsOn: string | null;
  month: string;
}): boolean {
  return startsOn <= month && (!endsOn || endsOn >= month);
}

export function formatMonthSummary(startsOn: string, endsOn: string | null): string {
  const start = formatMonthName(startsOn);
  if (!endsOn) return `From ${start}`;
  return `${start} to ${formatMonthName(endsOn)}`;
}

export function formatMonthName(monthDate: string): string {
  const [year, month] = monthDate.slice(0, 7).split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
