import { cn } from "@/lib/utils";

export function DottedDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full", className)}
      style={{
        background:
          "repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)",
      }}
    />
  );
}
