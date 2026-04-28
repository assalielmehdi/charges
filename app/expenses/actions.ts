"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ExpenseActionState = { ok: boolean; message: string | null };

type ParsedFields = {
  amount: number;
  date: string;
  categoryId: string;
  merchant: string | null;
  notes: string | null;
};

function parseFields(formData: FormData): ParsedFields | string {
  const amountRaw = String(formData.get("amount") ?? "")
    .trim()
    .replace(",", ".");
  const date = String(formData.get("date") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const amount = Number(amountRaw);
  if (!amountRaw || !Number.isFinite(amount) || amount < 0) {
    return "Enter a valid amount.";
  }
  if (!date) return "Pick a date.";
  if (!categoryId) return "Pick a category.";

  return { amount, date, categoryId, merchant, notes };
}

export async function createExpense(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const parsed = parseFields(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const supabase = createClient(cookies());
  const { error } = await supabase.from("expenses").insert({
    amount: parsed.amount,
    date: parsed.date,
    category_id: parsed.categoryId,
    merchant: parsed.merchant,
    notes: parsed.notes,
    source: "manual",
  });

  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  revalidatePath("/");
  redirect("/");
}

export async function updateExpense(
  id: string,
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const parsed = parseFields(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const supabase = createClient(cookies());
  const { error } = await supabase
    .from("expenses")
    .update({
      amount: parsed.amount,
      date: parsed.date,
      category_id: parsed.categoryId,
      merchant: parsed.merchant,
      notes: parsed.notes,
    })
    .eq("id", id);

  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  revalidatePath("/");
  redirect("/");
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient(cookies());
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) {
    // Surface as a thrown error — caller is the edit page form, so we want
    // it to fail loudly rather than silently navigate away.
    throw new Error(`Delete failed: ${error.message}`);
  }
  revalidatePath("/");
  redirect("/");
}
