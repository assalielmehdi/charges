import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ModalShell } from "@/components/shell/modal-shell";
import { ScanCaptureScreen } from "@/app/expenses/scan/scan-capture-screen";

export const dynamic = "force-dynamic";

export default async function InterceptedScanPage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ModalShell>
      <ScanCaptureScreen />
    </ModalShell>
  );
}
