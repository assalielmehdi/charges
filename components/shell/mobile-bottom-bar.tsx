"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { FolderOpen, Home as HomeIcon, Plus, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating action menu above an Expenses / Categories bottom nav.
 * Fixed to viewport bottom on mobile only. Pages that use it should add
 * `pb-32` to their scroll container so content isn't hidden behind it.
 */
export function MobileBottomBar({ active }: { active?: "ledger" | "categories" }) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
      <div className="px-6 pb-2 flex justify-end pointer-events-none">
        <div className="relative pointer-events-auto">
          {isActionsOpen && (
            <div
              className="absolute bottom-[calc(100%+10px)] right-0 min-w-40 overflow-hidden rounded-2xl border border-white/10 bg-stone-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
              role="menu"
            >
              <ActionLink href="/expenses/new" onClick={() => setIsActionsOpen(false)}>
                <Plus className="w-4 h-4" strokeWidth={2.2} />
                <span>Add</span>
              </ActionLink>
              <div className="h-px bg-white/[0.06]" />
              <ActionLink href="/expenses/scan" onClick={() => setIsActionsOpen(false)}>
                <ScanLine className="w-4 h-4" strokeWidth={1.8} />
                <span>Scan</span>
              </ActionLink>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsActionsOpen((open) => !open)}
            className="h-14 w-14 rounded-2xl bg-stone-100 text-stone-950 flex items-center justify-center shadow-2xl shadow-black/40 active:scale-95 transition"
            aria-label={isActionsOpen ? "Close actions" : "Open actions"}
            aria-expanded={isActionsOpen}
            aria-haspopup="menu"
          >
            <Plus
              className={cn(
                "w-6 h-6 transition-transform",
                isActionsOpen && "rotate-45",
              )}
              strokeWidth={2.2}
            />
          </button>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-stone-950/80 backdrop-blur-xl">
        <div className="grid grid-cols-2 px-2 py-2">
          <NavTab
            href="/"
            icon={<HomeIcon className="w-[18px] h-[18px]" />}
            label="Expenses"
            active={active === "ledger"}
          />
          <NavTab
            href="/categories"
            icon={<FolderOpen className="w-[18px] h-[18px]" />}
            label="Categories"
            active={active === "categories"}
          />
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex h-12 items-center gap-3 px-4 text-[13px] font-medium tracking-tight text-stone-100 transition hover:bg-white/[0.06]"
      role="menuitem"
    >
      {children}
    </Link>
  );
}

function NavTab({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 py-2 rounded-xl transition",
        active ? "text-stone-100" : "text-stone-500",
      )}
    >
      {icon}
      <span className="text-[10px] tracking-[0.1em] uppercase">{label}</span>
    </Link>
  );
}
