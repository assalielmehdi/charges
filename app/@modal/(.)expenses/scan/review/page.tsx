import { ModalShell } from "@/components/shell/modal-shell";
import { loadScanReviewData } from "@/app/expenses/scan/review/loader";
import { ScanReviewScreen } from "@/app/expenses/scan/review/scan-review-screen";

export const dynamic = "force-dynamic";

export default async function InterceptedScanReview({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const data = await loadScanReviewData(searchParams.id);
  return (
    <ModalShell>
      <ScanReviewScreen {...data} />
    </ModalShell>
  );
}
