import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign-in failed</h1>
      <p className="text-muted-foreground text-sm max-w-sm text-center">
        {searchParams.reason ?? "Unknown error."}
      </p>
      <Link
        href="/login"
        className="text-sm underline underline-offset-4 hover:no-underline"
      >
        Back to login
      </Link>
    </main>
  );
}
