import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type CategoryRow = { id: string; name: string };

export type CategoriesData = {
  categories: CategoryRow[];
  expenseCounts: Record<string, number>;
};

export async function loadCategoriesData(): Promise<CategoriesData> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: countRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase.from("expenses").select("category_id").limit(10000),
  ]);

  const expenseCounts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    const id = (row as { category_id: string }).category_id;
    expenseCounts[id] = (expenseCounts[id] ?? 0) + 1;
  }

  return {
    categories: (categories ?? []) as CategoryRow[],
    expenseCounts,
  };
}
