"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Wrapper used by intercepted-route modals.
 * On mobile (<md): full-screen takeover, no backdrop.
 * On desktop (md+): 440 × 720 centered card on a backdrop-blur veil.
 *
 * Closes via router.back() so the underlying URL pops back to /.
 * Children should fill the inner box (typically a `<div className="flex flex-col h-full">`).
 */
export function ModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-30",
        "md:bg-stone-950/70 md:backdrop-blur-md md:flex md:items-center md:justify-center md:p-8",
      )}
      onClick={() => router.back()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-[#0a0908] flex flex-col w-full h-full",
          "md:w-[440px] md:h-[720px] md:border md:border-white/10 md:rounded-3xl",
          "md:shadow-2xl md:shadow-black/60 md:overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
