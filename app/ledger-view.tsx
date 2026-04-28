"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { CategoryGlyph } from "@/components/ui/category-glyph";
import { DottedDivider } from "@/components/ui/dotted-divider";
import { HeroAmount } from "@/components/ui/hero-amount";
import { Pill } from "@/components/ui/pill";
import { SectionLabel } from "@/components/ui/section-label";
import {
  SparklineDayStrip,
  type DayTotal,
} from "@/components/ui/sparkline-day-strip";
import { cn } from "@/lib/utils";
import { colorForCategoryId } from "@/lib/palette";
import { formatAmountPlain } from "@/lib/format";

type Expense = {
  id: string;
  amount: number | string;
  date: string;
  merchant: string | null;
  notes: string | null;
  category_id: string;
  source: "manual" | "scan";
};

type Category = { id: string; name: string };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dayOfMonth(iso: string): number {
  return Number(iso.split("-")[2]);
}

export function LedgerView({
  expenses,
  categories,
  monthISO,
  selectedDay,
  activeCategoryId,
  todayISO,
}: {
  expenses: Expense[];
  categories: Category[];
  monthISO: string; // YYYY-MM
  selectedDay: number | null;
  activeCategoryId: string | null;
  todayISO: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [year, month] = monthISO.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const [todayY, todayM, todayD] = todayISO.split("-").map(Number);
  const isCurrentMonth = todayY === year && todayM === month;
  const todayDay = isCurrentMonth ? todayD : null;
  const canGoNext = !(year === todayY && month >= todayM);

  const dailyTotals: DayTotal[] = useMemo(() => {
    const arr: DayTotal[] = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      total: 0,
    }));
    for (const e of expenses) {
      const d = dayOfMonth(e.date);
      if (d >= 1 && d <= daysInMonth) arr[d - 1].total += Number(e.amount);
    }
    return arr;
  }, [expenses, daysInMonth]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (activeCategoryId && e.category_id !== activeCategoryId) return false;
      if (selectedDay && dayOfMonth(e.date) !== selectedDay) return false;
      return true;
    });
  }, [expenses, activeCategoryId, selectedDay]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const avg = filtered.length ? total / filtered.length : 0;

  const groupsByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function setQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/?${qs}` : "/", { scroll: false }));
  }

  function changeMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    const m = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
    setQuery({ month: m, day: null });
  }

  function selectDay(d: number | null) {
    setQuery({ day: d === null ? null : String(d) });
  }

  function setCategoryFilter(id: string | null) {
    setQuery({ category: id });
  }

  const findCat = (id: string) => categories.find((c) => c.id === id);
  const heroLabel = selectedDay ? `Total · day ${selectedDay}` : "Total this month";

  function dayLabel(iso: string): string {
    if (iso === todayISO) return "Today";
    const t = new Date(todayY, todayM - 1, todayD - 1);
    const yesterday = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    if (iso === yesterday) return "Yesterday";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d)
      .toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .toUpperCase();
  }

  return (
    <div className="pt-3 md:pt-0">
      <SparklineDayStrip
        dailyTotals={dailyTotals}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
        monthLabel={MONTH_NAMES[month - 1]}
        year={year}
        onPrevMonth={() => changeMonth(-1)}
        onNextMonth={() => changeMonth(1)}
        canGoNext={canGoNext}
        todayDay={todayDay}
      />

      <div className="mt-7 px-6 md:px-0">
        <div className="flex items-baseline justify-between">
          <SectionLabel>{heroLabel}</SectionLabel>
          {selectedDay !== null && (
            <button
              type="button"
              onClick={() => selectDay(null)}
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 tracking-tight"
            >
              <X className="w-3 h-3" /> Clear day
            </button>
          )}
        </div>
        <div className="mt-2">
          <HeroAmount value={total} size="lg" />
        </div>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-stone-500 tracking-tight flex-wrap">
          <span>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
          {filtered.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <span>avg {formatAmountPlain(avg)}</span>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter chips — sidebar handles this on desktop */}
      <div className="md:hidden mt-7 pl-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pr-6">
          <Pill
            active={activeCategoryId === null}
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Pill>
          {categories.map((c) => (
            <Pill
              key={c.id}
              active={activeCategoryId === c.id}
              onClick={() => setCategoryFilter(c.id)}
              color={colorForCategoryId(c.id)}
            >
              {c.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-8 px-6 md:px-0">
        {groupsByDate.map(([dateIso, items]) => (
          <div key={dateIso} className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>{dayLabel(dateIso)}</SectionLabel>
              <div className="text-[11px] text-stone-600 font-mono tabular-nums">
                {formatAmountPlain(items.reduce((s, e) => s + Number(e.amount), 0))}
              </div>
            </div>
            <DottedDivider />
            <div className="divide-y divide-white/[0.04]">
              {items.map((e) => {
                const c = findCat(e.category_id);
                return (
                  <Link
                    key={e.id}
                    href={`/expenses/${e.id}`}
                    className={cn(
                      "w-full flex items-center gap-3.5 py-3.5 group",
                      "hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition",
                    )}
                  >
                    <CategoryGlyph
                      color={colorForCategoryId(e.category_id)}
                      scanned={e.source === "scan"}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-stone-100 text-[14.5px] tracking-tight truncate">
                        {e.merchant ?? (
                          <span className="text-stone-500">No merchant</span>
                        )}
                      </div>
                      <div className="text-stone-500 text-[12px] tracking-tight truncate">
                        {c?.name ?? "—"}
                        {e.notes ? ` · ${e.notes}` : ""}
                      </div>
                    </div>
                    <div className="text-stone-100 text-[15px] font-mono tabular-nums shrink-0">
                      {formatAmountPlain(Number(e.amount))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {groupsByDate.length === 0 && (
          <div className="py-16 text-center text-stone-600 text-[13px]">
            No entries match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
