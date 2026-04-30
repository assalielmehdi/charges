import { loadNewExpenseData } from "./loader";
import { NewExpenseScreen } from "./new-expense-screen";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const data = await loadNewExpenseData(searchParams.month);
  return (
    <div className="min-h-screen flex flex-col">
      <NewExpenseScreen {...data} />
    </div>
  );
}
