import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Charges</h1>
        <p className="text-muted-foreground text-sm">Personal expense tracker.</p>
      </div>
      <LoginForm next={next} />
    </main>
  );
}
