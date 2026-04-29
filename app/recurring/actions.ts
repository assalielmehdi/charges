"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO } from "@/lib/format";
import {
  isMonthEligible,
  normalizeMonthISO,
  previousMonth,
  SKIP_REASONS,
} from "@/lib/recurring";

export type RecurringActionState = { ok: boolean; message: string | null };

type ParsedTemplateFields = {
  name: string;
  amount: number;
  dayOfMonth: number;
  categoryId: string;
  merchant: string | null;
  notes: string | null;
  startsOn: string;
  endsOn: string | null;
};

const PATHS_TO_REVALIDATE = ["/", "/recurring", "/categories"];

function revalidateAll(id?: string) {
  for (const p of PATHS_TO_REVALIDATE) revalidatePath(p);
  if (id) revalidatePath(`/recurring/${id}`);
}

function parseTemplateFields(formData: FormData): ParsedTemplateFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim().replace(",", ".");
  const dayRaw = String(formData.get("day_of_month") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const startsOn = normalizeMonthISO(String(formData.get("starts_on") ?? ""));
  const endsRaw = String(formData.get("ends_on") ?? "").trim();
  const endsOn = endsRaw ? normalizeMonthISO(endsRaw) : null;

  const amount = Number(amountRaw);
  const dayOfMonth = Number(dayRaw);

  if (!name) return "Enter a name.";
  if (!amountRaw || !Number.isFinite(amount) || amount < 0) {
    return "Enter a valid amount.";
  }
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return "Pick a day from 1 to 31.";
  }
  if (!categoryId) return "Pick a category.";
  if (!startsOn) return "Pick a valid start month.";
  if (endsRaw && !endsOn) return "Pick a valid end month.";
  if (endsOn && endsOn < startsOn) return "End month must be after the start month.";

  return { name, amount, dayOfMonth, categoryId, merchant, notes, startsOn, endsOn };
}

async function ensureCurrentMonth() {
  const supabase = createClient(cookies());
  const targetMonth = `${currentMonthISO()}-01`;
  const { error } = await supabase.rpc("ensure_recurring_expenses_for_month", {
    target_month: targetMonth,
  });
  return error;
}

export async function createRecurringTemplate(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const parsed = parseTemplateFields(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const createThisMonth = formData.get("create_current_month") === "on";
  const currentMonth = `${currentMonthISO()}-01`;
  const eligibleNow = isMonthEligible({
    startsOn: parsed.startsOn,
    endsOn: parsed.endsOn,
    month: currentMonth,
  });

  const supabase = createClient(cookies());
  const { data, error } = await supabase
    .from("recurring_expense_templates")
    .insert({
      name: parsed.name,
      amount: parsed.amount,
      day_of_month: parsed.dayOfMonth,
      category_id: parsed.categoryId,
      merchant: parsed.merchant,
      notes: parsed.notes,
      starts_on: parsed.startsOn,
      ends_on: parsed.endsOn,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  if (data?.id && eligibleNow && !createThisMonth) {
    const { error: skipError } = await supabase
      .from("recurring_expense_skips")
      .insert({
        recurring_template_id: data.id,
        recurrence_month: currentMonth,
        reason: SKIP_REASONS.uncheckedCurrentMonth,
      });
    if (skipError) return { ok: false, message: `Skip failed: ${skipError.message}` };
  }

  if (eligibleNow && createThisMonth) {
    const rpcError = await ensureCurrentMonth();
    if (rpcError) return { ok: false, message: `Generation failed: ${rpcError.message}` };
  }

  revalidateAll(data?.id);
  return { ok: true, message: null };
}

export async function updateRecurringTemplate(
  id: string,
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const parsed = parseTemplateFields(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const supabase = createClient(cookies());
  const { error } = await supabase
    .from("recurring_expense_templates")
    .update({
      name: parsed.name,
      amount: parsed.amount,
      day_of_month: parsed.dayOfMonth,
      category_id: parsed.categoryId,
      merchant: parsed.merchant,
      notes: parsed.notes,
      starts_on: parsed.startsOn,
      ends_on: parsed.endsOn,
    })
    .eq("id", id);

  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  revalidateAll(id);
  return { ok: true, message: null };
}

export async function archiveRecurringTemplate(
  id: string,
  _prev: RecurringActionState,
  _formData: FormData,
): Promise<RecurringActionState> {
  void _prev;
  void _formData;
  const supabase = createClient(cookies());
  const { error } = await supabase
    .from("recurring_expense_templates")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { ok: false, message: `Archive failed: ${error.message}` };

  revalidateAll(id);
  return { ok: true, message: null };
}

export async function pauseRecurringTemplate(
  id: string,
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const effectiveMonth = normalizeMonthISO(String(formData.get("effective_month") ?? ""));
  if (!effectiveMonth) return { ok: false, message: "Pick a valid effective month." };

  const deleteCurrent = formData.get("delete_current_month") === "on";
  const currentMonth = `${currentMonthISO()}-01`;
  const supabase = createClient(cookies());

  const { error: pauseError } = await supabase
    .from("recurring_expense_pause_periods")
    .insert({ recurring_template_id: id, starts_on: effectiveMonth });
  if (pauseError) return { ok: false, message: `Pause failed: ${pauseError.message}` };

  const { error: updateError } = await supabase
    .from("recurring_expense_templates")
    .update({ is_active: false })
    .eq("id", id);
  if (updateError) return { ok: false, message: `Pause failed: ${updateError.message}` };

  if (deleteCurrent && effectiveMonth === currentMonth) {
    await supabase
      .from("recurring_expense_skips")
      .upsert({
        recurring_template_id: id,
        recurrence_month: currentMonth,
        reason: SKIP_REASONS.pauseEffectiveMonth,
      }, { onConflict: "recurring_template_id,recurrence_month" });
    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("recurring_template_id", id)
      .eq("recurrence_month", currentMonth)
      .eq("source", "recurring");
    if (deleteError) return { ok: false, message: `Current month delete failed: ${deleteError.message}` };
  }

  revalidateAll(id);
  return { ok: true, message: null };
}

export async function resumeRecurringTemplate(
  id: string,
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const effectiveMonth = normalizeMonthISO(String(formData.get("effective_month") ?? ""));
  if (!effectiveMonth) return { ok: false, message: "Pick a valid effective month." };

  const createThisMonth = formData.get("create_current_month") === "on";
  const currentMonth = `${currentMonthISO()}-01`;
  const supabase = createClient(cookies());

  const { error: deleteFuturePauseError } = await supabase
    .from("recurring_expense_pause_periods")
    .delete()
    .eq("recurring_template_id", id)
    .is("ends_on", null)
    .gte("starts_on", effectiveMonth);
  if (deleteFuturePauseError) {
    return { ok: false, message: `Resume failed: ${deleteFuturePauseError.message}` };
  }

  const { error: periodError } = await supabase
    .from("recurring_expense_pause_periods")
    .update({ ends_on: previousMonth(effectiveMonth) })
    .eq("recurring_template_id", id)
    .is("ends_on", null)
    .lt("starts_on", effectiveMonth);
  if (periodError) return { ok: false, message: `Resume failed: ${periodError.message}` };

  const { error: updateError } = await supabase
    .from("recurring_expense_templates")
    .update({ is_active: true })
    .eq("id", id);
  if (updateError) return { ok: false, message: `Resume failed: ${updateError.message}` };

  if (effectiveMonth === currentMonth && !createThisMonth) {
    const { error: skipError } = await supabase
      .from("recurring_expense_skips")
      .upsert({
        recurring_template_id: id,
        recurrence_month: currentMonth,
        reason: SKIP_REASONS.resumeUncheckedCurrentMonth,
      }, { onConflict: "recurring_template_id,recurrence_month" });
    if (skipError) return { ok: false, message: `Skip failed: ${skipError.message}` };
  }

  if (effectiveMonth === currentMonth && createThisMonth) {
    const rpcError = await ensureCurrentMonth();
    if (rpcError) return { ok: false, message: `Generation failed: ${rpcError.message}` };
  }

  revalidateAll(id);
  return { ok: true, message: null };
}
