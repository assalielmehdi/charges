"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayTotal = { day: number; total: number };

export function SparklineDayStrip({
  dailyTotals,
  selectedDay,
  onSelectDay,
  monthLabel,
  year,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  /** day-of-month if the visible month contains today, else null */
  todayDay,
}: {
  dailyTotals: DayTotal[];
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  monthLabel: string;
  year: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canGoNext: boolean;
  todayDay: number | null;
}) {
  const max = Math.max(1, ...dailyTotals.map((d) => d.total));

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 md:px-0">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full hover:bg-white/[0.04] flex items-center justify-center text-stone-400 transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-stone-200">
          <span className="text-[14px] tracking-tight">{monthLabel}</span>
          <span className="text-[14px] tracking-tight text-stone-500">
            {year}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-full hover:bg-white/[0.04] flex items-center justify-center text-stone-400 transition disabled:hover:bg-transparent"
          aria-label="Next month"
        >
          <ChevronRight
            className={cn("w-4 h-4", !canGoNext && "opacity-30")}
          />
        </button>
      </div>

      {/* Sparkline */}
      <div className="mt-4 px-6 md:px-0 overflow-x-auto scrollbar-none">
        <div
          className="flex items-end gap-[3px] md:gap-1 min-w-min"
          style={{ minHeight: "72px" }}
        >
          {dailyTotals.map(({ day, total }) => {
            const heightPct = total > 0 ? Math.max(8, (total / max) * 100) : 0;
            const isSelected = selectedDay === day;
            const isToday = todayDay === day;
            const isFuture = todayDay !== null && day > todayDay;

            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  !isFuture && onSelectDay(isSelected ? null : day)
                }
                disabled={isFuture}
                className={cn(
                  "flex-1 min-w-[18px] md:min-w-[22px] flex flex-col items-center gap-2 group",
                  isFuture && "opacity-25 cursor-not-allowed",
                )}
              >
                <div className="h-12 w-full flex flex-col justify-end relative">
                  {total > 0 ? (
                    <div
                      className={cn(
                        "w-full rounded-[3px] transition-all duration-300",
                        isSelected
                          ? "bg-stone-100"
                          : isToday
                            ? "bg-stone-300 group-hover:bg-stone-200"
                            : "bg-stone-700 group-hover:bg-stone-500",
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-1 h-1 mx-auto rounded-full",
                        isToday ? "bg-stone-400" : "bg-stone-800",
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "text-[10px] font-mono transition tabular-nums",
                    isSelected
                      ? "text-stone-100"
                      : isToday
                        ? "text-stone-300"
                        : isFuture
                          ? "text-stone-700"
                          : "text-stone-500",
                  )}
                >
                  {day}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
