import { ModalShell } from "@/components/shell/modal-shell";
import { loadExpenseDetail } from "@/app/expenses/[id]/loader";
import { ExpenseDetailScreen } from "@/app/expenses/[id]/expense-detail-screen";

export const dynamic = "force-dynamic";

export default async function InterceptedExpenseDetail({
  params,
}: {
  params: { id: string };
}) {
  const data = await loadExpenseDetail(params.id);
  return (
    <ModalShell>
      <ExpenseDetailScreen {...data} />
    </ModalShell>
  );
}
