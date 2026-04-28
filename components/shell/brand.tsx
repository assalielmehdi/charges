import { cn } from "@/lib/utils";

export function Brand({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: { box: "w-7 h-7", glyph: "text-[14px]", label: "text-[15px]" },
    md: { box: "w-8 h-8", glyph: "text-[16px]", label: "text-[16px]" },
    lg: { box: "w-9 h-9", glyph: "text-[18px]", label: "text-[18px]" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          dimensions.box,
          "rounded-full bg-stone-100 flex items-center justify-center",
        )}
      >
        <span
          className={cn(
            "font-serif italic text-stone-950 leading-none pt-0.5",
            dimensions.glyph,
          )}
        >
          c
        </span>
      </div>
      <span className={cn("text-stone-100 tracking-tight", dimensions.label)}>
        Charges
      </span>
    </div>
  );
}
