import Link from "next/link";
import { FolderOpen, Home as HomeIcon, LogOut, Plus, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBar } from "@/components/ui/status-bar";
import { Brand } from "./brand";

/**
 * Mobile-only chrome around the ledger view: top brand row, scrollable
 * content area, floating Add + Scan FABs, and a bottom nav.
 * Hidden on md+ (the desktop sidebar takes over).
 */
export function MobileHomeShell({
  children,
  logoutAction,
}: {
  children: React.ReactNode;
  logoutAction: () => Promise<void> | void;
}) {
  return (
    <div className="md:hidden flex flex-col h-screen w-full">
      <StatusBar />
      <div className="px-6 pt-2 pb-3 flex items-center justify-between">
        <Brand size="sm" />
        <form action={logoutAction}>
          <IconButton type="submit" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </IconButton>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 pt-3">{children}</div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="px-6 pb-2 flex justify-end gap-3 pointer-events-none">
          <Link
            href="/expenses/new"
            className="pointer-events-auto h-14 px-6 rounded-2xl bg-stone-100 text-stone-950 flex items-center gap-2 shadow-2xl shadow-black/40 active:scale-95 transition"
          >
            <Plus className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[14px] font-medium tracking-tight">Add</span>
          </Link>
          <Link
            href="/expenses/scan"
            className="pointer-events-auto h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-center text-stone-100 active:scale-95 transition"
            aria-label="Scan receipt"
          >
            <ScanLine className="w-5 h-5" strokeWidth={1.8} />
          </Link>
        </div>
        <div className="border-t border-white/[0.06] bg-stone-950/80 backdrop-blur-xl">
          <div className="grid grid-cols-3 px-2 py-2">
            <NavTab
              href="/"
              icon={<HomeIcon className="w-[18px] h-[18px]" />}
              label="Ledger"
              active
            />
            <NavTab
              href="/expenses/scan"
              icon={<ScanLine className="w-[18px] h-[18px]" />}
              label="Scan"
            />
            <NavTab
              href="/categories"
              icon={<FolderOpen className="w-[18px] h-[18px]" />}
              label="Categories"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavTab({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
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
