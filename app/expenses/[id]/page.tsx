import { loadExpenseDetail } from "./loader";
import { ExpenseDetailScreen } from "./expense-detail-screen";

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await loadExpenseDetail(params.id);
  return (
    <div className="min-h-screen flex flex-col">
      <ExpenseDetailScreen {...data} />
    </div>
  );
}
