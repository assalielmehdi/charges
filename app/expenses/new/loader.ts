import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/format";

export type NewExpenseData = {
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  defaultDate: string;
  todayISO: string;
};

export async function loadNewExpenseData(): Promise<NewExpenseData> {
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

  return {
    categories: cats,
    defaultCategoryId,
    defaultDate: today,
    todayISO: today,
  };
}
