import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-8">
      <h1 className="font-serif italic text-stone-100 text-[48px] leading-[1.05] tracking-tight text-center">
        Sign-in
        <br />
        <span className="text-stone-500">failed.</span>
      </h1>
      <p className="text-stone-400 text-[14px] max-w-sm text-center leading-relaxed">
        {searchParams.reason ?? "Unknown error."}
      </p>
      <Link
        href="/login"
        className="text-stone-100 text-[13px] underline underline-offset-4 decoration-white/30 hover:decoration-white/60 tracking-tight"
      >
        Back to login
      </Link>
    </main>
  );
}
