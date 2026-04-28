"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom-sheet, desktop centered dialog.
 * Backdrop click + Escape close. Renders inline (no portal) — caller decides
 * where this lives in the tree.
 */
export function Sheet({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-end md:items-center md:justify-center z-30"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full md:w-[440px] bg-stone-900 border-t md:border md:rounded-3xl border-white/10",
          "rounded-t-3xl p-6 pb-8 md:max-h-[85vh] overflow-y-auto",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
