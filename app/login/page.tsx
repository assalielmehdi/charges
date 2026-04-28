import { LoginForm } from "./login-form";
import { SectionLabel } from "@/components/ui/section-label";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/";
  return (
    <main className="flex flex-col min-h-screen px-7 pb-10 pt-12 md:pt-20 md:max-w-md md:mx-auto">
      <div className="flex-1 flex flex-col justify-end">
        <SectionLabel className="mb-3">Charges</SectionLabel>
        <h1 className="font-serif italic text-[64px] md:text-[72px] leading-[0.95] text-stone-100 tracking-tight">
          A quiet
          <br />
          ledger.
        </h1>
        <p className="mt-5 text-stone-400 text-[15px] leading-relaxed max-w-[320px]">
          Sign in with the email on your allowlist. We&rsquo;ll send you a
          magic link.
        </p>
      </div>

      <LoginForm next={next} />
    </main>
  );
}
