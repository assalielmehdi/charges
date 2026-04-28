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
      .select("id, amount, date, category_id, merchant, notes, photo_path")
      .eq("id", params.id)
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
      .createSignedUrl(expense.photo_path, 600);
    photoUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit expense</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back
        </Link>
      </header>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth configuring next/image remote patterns
        <img
          src={photoUrl}
          alt="Receipt"
          className="max-h-72 w-full rounded-lg border border-border object-contain"
        />
      ) : null}
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
