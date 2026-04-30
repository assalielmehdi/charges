import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, monthRangeFromISO, todayISO } from "@/lib/format";

export type NewExpenseData = {
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  defaultDate: string;
  todayISO: string;
};

function normalizeMonthParam(month: string | undefined): string | null {
  const value = month?.trim();
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [, rawMonth] = value.split("-").map(Number);
  if (rawMonth < 1 || rawMonth > 12) return null;
  return value;
}

function defaultDateForMonth(month: string | null, today: string): string {
  if (!month || month === currentMonthISO()) return today;
  return monthRangeFromISO(month).from;
}

export async function loadNewExpenseData(month?: string): Promise<NewExpenseData> {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: lastExpense }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("category_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const cats = categories ?? [];
  const fallback =
    cats.find((c) => c.name === "Other")?.id ?? cats[0]?.id ?? "";
  const defaultCategoryId = lastExpense?.category_id ?? fallback;
  const today = todayISO();
  const targetMonth = normalizeMonthParam(month);

  return {
    categories: cats,
    defaultCategoryId,
    defaultDate: defaultDateForMonth(targetMonth, today),
    todayISO: today,
  };
}
