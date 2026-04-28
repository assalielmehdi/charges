import { loadScanReviewData } from "./loader";
import { ScanReviewScreen } from "./scan-review-screen";

export const dynamic = "force-dynamic";

export default async function ScanReviewPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const data = await loadScanReviewData(searchParams.id);
  return (
    <div className="min-h-screen flex flex-col">
      <ScanReviewScreen {...data} />
    </div>
  );
}
