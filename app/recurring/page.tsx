import { RecurringScreen } from "./recurring-screen";
import { loadRecurringList } from "./loader";
import { MobileBottomBar } from "@/components/shell/mobile-bottom-bar";

export const dynamic = "force-dynamic";

function pickParam(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s.trim() || null;
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: { archived?: string };
}) {
  const data = await loadRecurringList(pickParam(searchParams.archived) === "1");
  return (
    <>
      <RecurringScreen {...data} />
      <MobileBottomBar active="recurring" />
    </>
  );
}
