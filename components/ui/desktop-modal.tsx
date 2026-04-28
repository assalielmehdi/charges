"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * 440 × 720 centered card on a backdrop-blur veil. Used by intercepting
 * routes for Add / Scan / Detail / Categories on desktop.
 */
export function DesktopModal({
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
      className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-30 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-[#0a0908] border border-white/10 rounded-3xl overflow-hidden",
          "shadow-2xl shadow-black/60 flex flex-col",
          className,
        )}
        style={{ width: "440px", height: "720px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
