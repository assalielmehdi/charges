import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[charges] categories query failed:", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Charges</h1>
      <p className="text-muted-foreground text-sm">{user.email}</p>
      <p className="text-muted-foreground text-center max-w-sm">
        {error
          ? `Connected, but query failed.`
          : `Connected. ${count ?? 0} categories seeded.`}
      </p>
      {error ? (
        <pre className="text-xs bg-muted p-3 rounded-md max-w-md whitespace-pre-wrap break-words">
          {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
        </pre>
      ) : null}
      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </main>
  );
}
