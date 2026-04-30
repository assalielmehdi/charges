import { ModalShell } from "@/components/shell/modal-shell";
import { loadNewExpenseData } from "@/app/expenses/new/loader";
import { NewExpenseScreen } from "@/app/expenses/new/new-expense-screen";

export const dynamic = "force-dynamic";

export default async function InterceptedNewExpense({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const data = await loadNewExpenseData(searchParams.month);
  return (
    <ModalShell>
      <NewExpenseScreen {...data} />
    </ModalShell>
  );
}
