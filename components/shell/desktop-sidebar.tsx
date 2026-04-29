"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  FolderOpen,
  Home as HomeIcon,
  LogOut,
  Repeat,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { colorForCategoryId } from "@/lib/palette";
import { CategoryDot } from "@/components/ui/category-dot";
import { SectionLabel } from "@/components/ui/section-label";
import { Brand } from "./brand";

type Category = { id: string; name: string };
type CountsById = Record<string, number>;

export function DesktopSidebar({
  categories,
  countsById,
  totalCount,
  activeCategoryId,
  logoutAction,
}: {
  categories: Category[];
  countsById: CountsById;
  totalCount: number;
  activeCategoryId: string | null;
  logoutAction: () => Promise<void> | void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setCategory(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("category", id);
    else params.delete("category");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/?${qs}` : "/"));
  }

  return (
    <aside className="hidden md:flex border-r border-white/[0.06] flex-col h-screen bg-[#0a0908] sticky top-0 w-[260px] shrink-0">
      <div className="px-6 pt-7 pb-6">
        <Brand size="md" />
      </div>

      <div className="px-3 space-y-0.5">
        <SidebarLink
          href="/"
          icon={<HomeIcon className="w-4 h-4" />}
          label="Ledger"
          active
        />
        <SidebarLink
          href="/expenses/scan"
          icon={<ScanLine className="w-4 h-4" />}
          label="Scan receipt"
        />
        <SidebarLink
          href="/recurring"
          icon={<Repeat className="w-4 h-4" />}
          label="Recurring"
        />
      </div>

      <div className="px-6 mt-7 mb-3">
        <SectionLabel>Filter by category</SectionLabel>
      </div>

      <div
        className={cn(
          "px-3 space-y-0.5 flex-1 overflow-y-auto scrollbar-none",
          isPending && "opacity-60 transition-opacity",
        )}
      >
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] tracking-tight transition",
            activeCategoryId === null
              ? "bg-white/[0.06] text-stone-100"
              : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]",
          )}
        >
          <div className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />
          <span className="flex-1 text-left">All</span>
          <span className="text-[11px] font-mono text-stone-500 tabular-nums">
            {totalCount}
          </span>
        </button>
        {categories.map((c) => {
          const active = activeCategoryId === c.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] tracking-tight transition",
                active
                  ? "bg-white/[0.06] text-stone-100"
                  : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]",
              )}
            >
              <CategoryDot color={colorForCategoryId(c.id)} size={8} />
              <span className="flex-1 text-left truncate">{c.name}</span>
              <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                {countsById[c.id] ?? 0}
              </span>
            </button>
          );
        })}

        <Link
          href="/categories"
          className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] tracking-tight text-stone-500 hover:text-stone-300 transition"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Manage categories</span>
        </Link>
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] tracking-tight text-stone-400 hover:text-stone-100 hover:bg-white/[0.03] transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function SidebarLink({
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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] tracking-tight transition",
        active
          ? "bg-white/[0.06] text-stone-100"
          : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
