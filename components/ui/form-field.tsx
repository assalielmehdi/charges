"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./section-label";

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "className"
>;

type Props = InputProps & {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Render a static value instead of an <input>. */
  readonlyDisplay?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
};

export const FormField = forwardRef<HTMLInputElement, Props>(
  function FormField(
    {
      label,
      icon,
      trailing,
      readonlyDisplay,
      containerClassName,
      inputClassName,
      ...inputProps
    },
    ref,
  ) {
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && <SectionLabel>{label}</SectionLabel>}
        <div className="flex items-center gap-3 border-b border-white/10 pb-2 focus-within:border-white/30 transition">
          {icon && <span className="text-stone-500 shrink-0">{icon}</span>}
          {readonlyDisplay !== undefined ? (
            <div className="text-[15px] text-stone-100 tracking-tight flex-1 min-w-0">
              {readonlyDisplay}
            </div>
          ) : (
            <input
              ref={ref}
              {...inputProps}
              className={cn(
                "bg-transparent flex-1 outline-none min-w-0",
                "text-[15px] text-stone-100 placeholder-stone-600 tracking-tight",
                inputClassName,
              )}
            />
          )}
          {trailing && <span className="shrink-0">{trailing}</span>}
        </div>
      </div>
    );
  },
);
