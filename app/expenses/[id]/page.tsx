import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: expense }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, amount, date, category_id, merchant, notes")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
  ]);

  if (!expense) notFound();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit expense</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back
        </Link>
      </header>
      <EditForm
        id={expense.id}
        categories={categories ?? []}
        initial={{
          amount: String(expense.amount),
          date: expense.date,
          categoryId: expense.category_id,
          merchant: expense.merchant,
          notes: expense.notes,
        }}
      />
    </main>
  );
}
