import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ScanLine } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, monthRangeFromISO, todayISO } from "@/lib/format";
import { DesktopSidebar } from "@/components/shell/desktop-sidebar";
import { MobileBottomBar } from "@/components/shell/mobile-bottom-bar";
import { LedgerView } from "./ledger-view";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

type ExpenseRow = {
  id: string;
  amount: number | string;
  date: string;
  merchant: string | null;
  notes: string | null;
  category_id: string;
  source: "manual" | "scan" | "recurring";
  recurring_template_id: string | null;
  recurrence_month: string | null;
};

function pickParam(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s.trim() || null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: { month?: string; category?: string };
}) {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthISO = pickParam(searchParams.month) ?? currentMonthISO();
  const range = monthRangeFromISO(monthISO);
  const activeCategoryId = pickParam(searchParams.category);
  const { error: recurringError } = await supabase.rpc(
    "ensure_recurring_expenses_for_month",
    { target_month: range.from },
  );

  const [{ data: catRows }, { data: expensesData, error }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, amount, date, merchant, notes, category_id, source, recurring_template_id, recurrence_month")
      .gte("date", range.from)
      .lte("date", range.to)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const expenses = (expensesData ?? []) as ExpenseRow[];
  const categories = catRows ?? [];

  const countsById: Record<string, number> = {};
  for (const e of expenses) {
    countsById[e.category_id] = (countsById[e.category_id] ?? 0) + 1;
  }

  return (
    <div className="md:grid md:grid-cols-[260px_1fr] md:h-screen">
      <DesktopSidebar
        categories={categories}
        countsById={countsById}
        totalCount={expenses.length}
        activeCategoryId={activeCategoryId}
        logoutAction={logout}
      />

      <main className="flex flex-col min-h-screen md:h-screen md:overflow-y-auto relative">
        <div className="hidden md:flex max-w-[760px] mx-auto w-full px-10 pt-10 items-center justify-between mb-8">
          <div>
            <div className="font-serif italic text-stone-100 text-[36px] leading-none tracking-tight">
              Ledger
            </div>
            <div className="text-stone-500 text-[13px] mt-1.5 tracking-tight">
              Daily spending, all in one place.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/expenses/scan"
              className="h-10 px-4 rounded-xl border border-white/10 text-stone-200 text-[13px] tracking-tight hover:border-white/25 transition flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" /> Scan
            </Link>
            <Link
              href={`/expenses/new?month=${monthISO}`}
              className="h-10 px-4 rounded-xl bg-stone-100 text-stone-950 text-[13px] font-medium tracking-tight active:scale-[0.98] transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add expense
            </Link>
          </div>
        </div>

        <div className="flex-1 pb-32 md:pb-24 md:max-w-[760px] md:mx-auto md:w-full md:px-10">
          {recurringError || error ? (
            <p className="px-6 md:px-0 text-sm text-rose-300/80">
              Failed to load: {(recurringError ?? error)?.message}
            </p>
          ) : (
            <LedgerView
              expenses={expenses}
              categories={categories}
              monthISO={monthISO}
              activeCategoryId={activeCategoryId}
              todayISO={todayISO()}
            />
          )}
        </div>
      </main>

      <MobileBottomBar active="ledger" />
    </div>
  );
}
