import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Charges</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Personal expense tracker. Skeleton is up — milestones to follow.
      </p>
      <Button>Hello, MAD</Button>
    </main>
  );
}
