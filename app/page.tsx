import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { currentMonthRange, formatAmount, formatDate } from "@/lib/format";
import { logout } from "./login/actions";
import { Filters } from "./filters";

export const dynamic = "force-dynamic";

type ExpenseRow = {
  id: string;
  amount: number | string;
  date: string;
  merchant: string | null;
  notes: string | null;
  categories: { name: string } | null;
};

function pickParam(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s.trim() || null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string; from?: string; to?: string };
}) {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthDefault = currentMonthRange();
  const category = pickParam(searchParams.category);
  const from = pickParam(searchParams.from) ?? monthDefault.from;
  const to = pickParam(searchParams.to) ?? monthDefault.to;

  const [{ data: categoryRows }, expensesRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    (() => {
      let q = supabase
        .from("expenses")
        .select("id, amount, date, merchant, notes, categories(name)")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (category) q = q.eq("category_id", category);
      return q;
    })(),
  ]);

  const { data, error } = expensesRes;
  const expenses = (data ?? []) as unknown as ExpenseRow[];
  const categories = categoryRows ?? [];

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Charges</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>

      <Link
        href="/expenses/new"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        + Add expense
      </Link>

      <Filters
        categories={categories}
        current={{ category, from, to }}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatAmount(total)}
        </span>
      </div>

      {error ? (
        <p className="text-sm text-destructive">Failed to load: {error.message}</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No expenses match these filters.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {expenses.map((e) => (
            <li key={e.id}>
              <Link
                href={`/expenses/${e.id}`}
                className="flex items-start justify-between gap-3 p-3 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(e.date)}</span>
                    {e.categories?.name ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {e.categories.name}
                      </span>
                    ) : null}
                  </div>
                  {e.merchant ? (
                    <p className="truncate text-sm font-medium">{e.merchant}</p>
                  ) : null}
                  {e.notes ? (
                    <p className="truncate text-xs text-muted-foreground">{e.notes}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatAmount(e.amount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
