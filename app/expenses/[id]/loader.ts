import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/format";

const SIGNED_URL_TTL_SECONDS = 600;

export type ExpenseDetail = {
  id: string;
  amount: number | string;
  date: string;
  category_id: string;
  merchant: string | null;
  notes: string | null;
  photo_path: string | null;
  source: "scan" | "manual";
};

export type ExpenseDetailData = {
  expense: ExpenseDetail;
  photoUrl: string | null;
  categories: { id: string; name: string }[];
  todayISO: string;
};

export async function loadExpenseDetail(id: string): Promise<ExpenseDetailData> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: expense }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, amount, date, category_id, merchant, notes, photo_path, source",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
  ]);

  if (!expense) notFound();

  let photoUrl: string | null = null;
  if (expense.photo_path) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(expense.photo_path, SIGNED_URL_TTL_SECONDS);
    photoUrl = signed?.signedUrl ?? null;
  }

  return {
    expense: expense as ExpenseDetail,
    photoUrl,
    categories: categories ?? [],
    todayISO: todayISO(),
  };
}
