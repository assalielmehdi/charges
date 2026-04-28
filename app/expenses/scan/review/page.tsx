import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/format";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 600;

export default async function ScanReviewPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id?.trim();
  if (!id) redirect("/expenses/scan");

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
        <h1 className="text-xl font-semibold tracking-tight">Review scan</h1>
        <Link
          href="/expenses/scan"
          className="text-sm text-muted-foreground hover:underline"
        >
          Re-scan
        </Link>
      </header>

      <ReviewForm
        scanId={id}
        userId={user.id}
        signedUrlTtl={SIGNED_URL_TTL_SECONDS}
        categories={cats}
        defaultCategoryId={defaultCategoryId}
        defaultDate={todayISO()}
      />
    </main>
  );
}
