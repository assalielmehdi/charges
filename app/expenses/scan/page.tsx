import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ScanCapture } from "./scan-capture";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Scan receipt</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back
        </Link>
      </header>
      <ScanCapture />
    </main>
  );
}
