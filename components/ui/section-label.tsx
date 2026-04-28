import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[10px] tracking-[0.22em] text-stone-500 uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}
