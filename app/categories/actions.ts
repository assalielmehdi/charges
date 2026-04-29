"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type CategoryActionState = { ok: boolean; message: string | null };

const PATHS_TO_REVALIDATE = ["/categories", "/", "/expenses/new"];

function revalidateAll() {
  for (const p of PATHS_TO_REVALIDATE) revalidatePath(p);
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Enter a name." };

  const supabase = createClient(cookies());

  const { data: top } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (top?.sort_order ?? 0) + 10;

  const { error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A category with that name already exists." };
    }
    return { ok: false, message: `Save failed: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, message: null };
}

export async function renameCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Enter a name." };

  const supabase = createClient(cookies());
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Name already in use." };
    }
    return { ok: false, message: `Rename failed: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, message: null };
}

export async function deleteCategory(
  id: string,
  _prev: CategoryActionState,
  _formData: FormData
): Promise<CategoryActionState> {
  void _prev;
  void _formData;
  const supabase = createClient(cookies());
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    // 23503 = foreign_key_violation — category is referenced by expenses.
    if (error.code === "23503") {
      const [{ count: expenseCount }, { count: recurringCount }] = await Promise.all([
        supabase
          .from("expenses")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id),
        supabase
          .from("recurring_expense_templates")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id),
      ]);
      const n = expenseCount ?? 0;
      const recurring = recurringCount ?? 0;
      return {
        ok: false,
        message:
          recurring > 0
            ? `${recurring} recurring ${recurring === 1 ? "template uses" : "templates use"} this category — reassign first.`
            : `${n} ${n === 1 ? "expense uses" : "expenses use"} this category — reassign first.`,
      };
    }
    return { ok: false, message: `Delete failed: ${error.message}` };
  }

  revalidateAll();
  return { ok: true, message: null };
}
