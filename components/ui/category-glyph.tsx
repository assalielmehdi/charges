import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDot } from "./category-dot";

const SIZES = {
  sm: "w-7 h-7 rounded-lg",
  md: "w-9 h-9 rounded-xl",
  lg: "w-11 h-11 rounded-2xl",
} as const;

export function CategoryGlyph({
  color,
  size = "md",
  scanned,
  className,
}: {
  color: string;
  size?: keyof typeof SIZES;
  /** When true, draws the Sparkles badge in a stone-950 circle on the corner. */
  scanned?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          SIZES[size],
          "border border-white/10 flex items-center justify-center",
        )}
        style={{ backgroundColor: color + "12" }}
      >
        <CategoryDot color={color} />
      </div>
      {scanned && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-950 border border-white/10 flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-stone-300" />
        </div>
      )}
    </div>
  );
}
