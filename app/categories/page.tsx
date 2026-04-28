import { CategoriesScreen } from "./categories-screen";
import { loadCategoriesData } from "./loader";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const data = await loadCategoriesData();
  return (
    <div className="min-h-screen flex flex-col">
      <CategoriesScreen {...data} />
    </div>
  );
}
