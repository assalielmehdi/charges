import { RecurringFormScreen } from "../recurring-form-screen";
import { loadRecurringForm } from "../loader";

export const dynamic = "force-dynamic";

export default async function EditRecurringPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await loadRecurringForm(params.id);
  return (
    <div className="min-h-screen flex flex-col">
      <RecurringFormScreen {...data} />
    </div>
  );
}
