import { cn } from "@/lib/utils";

const SIZES = {
  xl: "text-[80px] leading-[0.95]",
  lg: "text-[68px] leading-none",
  md: "text-[58px] leading-none",
  sm: "text-[42px] leading-none",
} as const;

export type HeroAmountSize = keyof typeof SIZES;

function splitDecimal(value: number | string): [string, string] {
  const n = typeof value === "string" ? Number(value) : value;
  const [whole, dec = "00"] = (Number.isFinite(n) ? n : 0)
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .split(".");
  return [whole, dec];
}

export function HeroAmount({
  value,
  size = "lg",
  currency = "MAD",
  className,
}: {
  value: number | string;
  size?: HeroAmountSize;
  currency?: string | null;
  className?: string;
}) {
  const [whole, dec] = splitDecimal(value);
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-serif italic text-stone-100 tracking-tight",
          SIZES[size],
        )}
      >
        {whole}
        <span className="text-stone-500">.{dec}</span>
      </span>
      {currency && (
        <span className="text-stone-500 text-[15px] tracking-[0.15em]">
          {currency}
        </span>
      )}
    </div>
  );
}
