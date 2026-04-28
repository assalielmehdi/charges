import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  danger?: boolean;
};

export const SecondaryButton = forwardRef<HTMLButtonElement, Props>(
  function SecondaryButton({ children, className, danger, ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "rounded-2xl py-3.5 px-5 text-[14.5px] tracking-tight transition border",
          "flex items-center justify-center gap-2",
          danger
            ? "bg-rose-300/90 text-stone-950 border-transparent font-medium"
            : "bg-transparent text-stone-200 border-white/10 hover:border-white/20",
          "disabled:opacity-50",
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
