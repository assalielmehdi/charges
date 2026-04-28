import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/format";

const SIGNED_URL_TTL_SECONDS = 600;

export type ScanReviewData = {
  scanId: string;
  userId: string;
  signedUrlTtl: number;
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  defaultDate: string;
};

export async function loadScanReviewData(
  rawId: string | undefined,
): Promise<ScanReviewData> {
  const id = rawId?.trim();
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

  return {
    scanId: id,
    userId: user.id,
    signedUrlTtl: SIGNED_URL_TTL_SECONDS,
    categories: cats,
    defaultCategoryId,
    defaultDate: todayISO(),
  };
}
