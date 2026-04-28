import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
};

export const PrimaryButton = forwardRef<HTMLButtonElement, Props>(
  function PrimaryButton({ children, className, icon, ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "bg-stone-100 text-stone-950 rounded-2xl py-3.5 px-5",
          "font-medium text-[14.5px] tracking-tight",
          "active:scale-[0.98] transition-transform",
          "flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:active:scale-100",
          className,
        )}
      >
        {icon}
        {children}
      </button>
    );
  },
);
