import { cn } from "@/lib/utils";

export function CategoryDot({
  color,
  size = 9,
  className,
}: {
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block rounded-full shrink-0", className)}
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}
