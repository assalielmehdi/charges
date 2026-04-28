"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ExpenseActionState } from "../actions";

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

function isOwnedPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}

export async function saveScanned(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const parsed = parseFields(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const photoPath = String(formData.get("photo_path") ?? "").trim();
  const extractionRawJson = String(formData.get("extraction_raw") ?? "").trim();
  if (!photoPath) {
    return { ok: false, message: "Missing photo reference. Re-scan the receipt." };
  }

  let extractionRaw: unknown = null;
  if (extractionRawJson) {
    try {
      extractionRaw = JSON.parse(extractionRawJson);
    } catch {
      // Non-fatal: drop unparseable raw payload but keep the row.
      extractionRaw = null;
    }
  }

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  if (!isOwnedPath(user.id, photoPath)) {
    return { ok: false, message: "Invalid photo reference." };
  }

  const { error } = await supabase.from("expenses").insert({
    amount: parsed.amount,
    date: parsed.date,
    category_id: parsed.categoryId,
    merchant: parsed.merchant,
    notes: parsed.notes,
    photo_path: photoPath,
    source: "scan",
    extraction_raw: extractionRaw,
  });

  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  revalidatePath("/");
  redirect("/");
}

export async function discardScan(formData: FormData): Promise<void> {
  const photoPath = String(formData.get("photo_path") ?? "").trim();

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && photoPath && isOwnedPath(user.id, photoPath)) {
    await supabase.storage.from("receipts").remove([photoPath]);
  }

  redirect("/");
}
