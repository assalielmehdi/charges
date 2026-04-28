import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  color?: string;
  size?: "sm" | "md";
};

const SIZES = {
  sm: "px-3 py-1 text-[12px]",
  md: "px-3.5 py-1.5 text-[13px]",
};

export function Pill({
  active,
  color,
  size = "md",
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "shrink-0 rounded-full tracking-tight transition border whitespace-nowrap",
        SIZES[size],
        active
          ? "bg-stone-100 text-stone-950 border-stone-100"
          : "bg-transparent text-stone-400 border-white/10 hover:border-white/20 hover:text-stone-200",
        className,
      )}
    >
      {color && !active && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}
