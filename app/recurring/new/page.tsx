import { RecurringFormScreen } from "../recurring-form-screen";
import { loadRecurringForm } from "../loader";

export const dynamic = "force-dynamic";

export default async function NewRecurringPage() {
  const data = await loadRecurringForm();
  return (
    <div className="min-h-screen flex flex-col">
      <RecurringFormScreen {...data} />
    </div>
  );
}
