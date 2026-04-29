import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO } from "@/lib/format";
import { isMonthEligible, monthRange } from "@/lib/recurring";

export type Category = { id: string; name: string };

export type RecurringTemplate = {
  id: string;
  name: string;
  amount: number | string;
  day_of_month: number;
  category_id: string;
  merchant: string | null;
  notes: string | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  archived_at: string | null;
};

export type CurrentMonthGenerated = {
  id: string;
  amount: number | string;
  recurring_template_id: string;
  recurrence_month: string;
};

export type CurrentMonthSkip = {
  recurring_template_id: string;
  recurrence_month: string;
};

export type PausePeriod = {
  recurring_template_id: string;
  starts_on: string;
  ends_on: string | null;
};

export type RecurringListItem = RecurringTemplate & {
  currentStatus: "Generated" | "Skipped" | "Paused" | "Missing";
  currentGeneratedExpenseId: string | null;
  currentAmountForTotal: number;
};

export type RecurringListData = {
  templates: RecurringListItem[];
  categories: Category[];
  currentMonth: string;
  monthlyTotal: number;
};

export type RecurringFormData = {
  template: RecurringTemplate | null;
  categories: Category[];
  currentMonth: string;
};

async function requireUser() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

function monthIsPaused(templateId: string, month: string, pauses: PausePeriod[]) {
  return pauses.some(
    (p) =>
      p.recurring_template_id === templateId &&
      p.starts_on <= month &&
      (!p.ends_on || p.ends_on >= month),
  );
}

export async function loadRecurringList(showArchived = false): Promise<RecurringListData> {
  const supabase = await requireUser();
  const currentMonth = `${currentMonthISO()}-01`;
  const range = monthRange(currentMonth);

  let templatesQuery = supabase
    .from("recurring_expense_templates")
    .select(
      "id, name, amount, day_of_month, category_id, merchant, notes, starts_on, ends_on, is_active, archived_at",
    )
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (!showArchived) templatesQuery = templatesQuery.is("archived_at", null);

  const [
    { data: templatesData },
    { data: categoriesData },
    { data: generatedData },
    { data: skipsData },
    { data: pausesData },
  ] = await Promise.all([
    templatesQuery,
    supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, amount, recurring_template_id, recurrence_month")
      .eq("source", "recurring")
      .gte("date", range.from)
      .lte("date", range.to),
    supabase
      .from("recurring_expense_skips")
      .select("recurring_template_id, recurrence_month")
      .eq("recurrence_month", currentMonth),
    supabase
      .from("recurring_expense_pause_periods")
      .select("recurring_template_id, starts_on, ends_on")
      .lte("starts_on", currentMonth)
      .or(`ends_on.is.null,ends_on.gte.${currentMonth}`),
  ]);

  const generated = (generatedData ?? []) as CurrentMonthGenerated[];
  const skips = (skipsData ?? []) as CurrentMonthSkip[];
  const pauses = (pausesData ?? []) as PausePeriod[];

  const items = ((templatesData ?? []) as RecurringTemplate[]).map((t) => {
    const generatedExpense = generated.find((e) => e.recurring_template_id === t.id) ?? null;
    const skipped = skips.some((s) => s.recurring_template_id === t.id);
    const paused = monthIsPaused(t.id, currentMonth, pauses) || !t.is_active;
    const eligible = isMonthEligible({
      startsOn: t.starts_on,
      endsOn: t.ends_on,
      month: currentMonth,
    });

    let currentStatus: RecurringListItem["currentStatus"] = "Missing";
    if (generatedExpense) currentStatus = "Generated";
    else if (skipped) currentStatus = "Skipped";
    else if (paused) currentStatus = "Paused";

    const includeInTotal =
      t.archived_at === null &&
      eligible &&
      currentStatus !== "Skipped" &&
      currentStatus !== "Paused";

    return {
      ...t,
      currentStatus,
      currentGeneratedExpenseId: generatedExpense?.id ?? null,
      currentAmountForTotal: includeInTotal
        ? Number(generatedExpense?.amount ?? t.amount)
        : 0,
    };
  });

  return {
    templates: items,
    categories: categoriesData ?? [],
    currentMonth,
    monthlyTotal: items.reduce((sum, item) => sum + item.currentAmountForTotal, 0),
  };
}

export async function loadRecurringForm(id?: string): Promise<RecurringFormData> {
  const supabase = await requireUser();
  const [{ data: categories }, templateResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
    id
      ? supabase
          .from("recurring_expense_templates")
          .select(
            "id, name, amount, day_of_month, category_id, merchant, notes, starts_on, ends_on, is_active, archived_at",
          )
          .eq("id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (id && !templateResult.data) notFound();

  return {
    template: (templateResult.data as RecurringTemplate | null) ?? null,
    categories: categories ?? [],
    currentMonth: `${currentMonthISO()}-01`,
  };
}
