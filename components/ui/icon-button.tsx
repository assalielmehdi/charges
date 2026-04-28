import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "filled" | "danger";

const VARIANTS: Record<Variant, string> = {
  ghost: "border border-white/10 text-stone-300 hover:border-white/20",
  filled: "bg-stone-100 text-stone-950",
  danger:
    "border border-white/10 text-rose-300/80 hover:border-rose-300/30",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  function IconButton({ className, variant = "ghost", children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition shrink-0",
          VARIANTS[variant],
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
