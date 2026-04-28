import { ModalShell } from "@/components/shell/modal-shell";
import { CategoriesScreen } from "@/app/categories/categories-screen";
import { loadCategoriesData } from "@/app/categories/loader";

export const dynamic = "force-dynamic";

export default async function InterceptedCategories() {
  const data = await loadCategoriesData();
  return (
    <ModalShell>
      <CategoriesScreen {...data} />
    </ModalShell>
  );
}
