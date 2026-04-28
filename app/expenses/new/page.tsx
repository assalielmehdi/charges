import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/format";
import { ExpenseForm } from "./expense-form";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">New expense</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back
        </Link>
      </header>
      <ExpenseForm
        categories={cats}
        defaultCategoryId={defaultCategoryId}
        defaultDate={todayISO()}
      />
    </main>
  );
}
