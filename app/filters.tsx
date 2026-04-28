"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

type Current = {
  category: string | null;
  from: string;
  to: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function isoForMonth(year: number, month0: number) {
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  return {
    from: `${year}-${pad(month0 + 1)}-01`,
    to: `${year}-${pad(month0 + 1)}-${pad(lastDay)}`,
  };
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m - 1, d));
}

function rangeLabel(from: string, to: string): string {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const lastDay = new Date(fy, fm, 0).getDate();
  if (fy === ty && fm === tm && fd === 1 && td === lastDay) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric",
    }).format(new Date(fy, fm - 1, 1));
  }
  return `${shortDate(from)} – ${shortDate(to)}`;
}

export function Filters({
  categories,
  current,
}: {
  categories: Category[];
  current: Current;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const dateDialog = useRef<HTMLDialogElement>(null);
  const catDialog = useRef<HTMLDialogElement>(null);

  function apply(next: Partial<Current>) {
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.category) params.set("category", merged.category);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/?${qs}` : "/"));
  }

  function shiftMonth(delta: number) {
    const [y, m] = current.from.split("-").map(Number);
    const target = new Date(y, m - 1 + delta, 1);
    const range = isoForMonth(target.getFullYear(), target.getMonth());
    apply(range);
  }

  function applyDateForm(formData: FormData) {
    const from = String(formData.get("from") ?? "");
    const to = String(formData.get("to") ?? "");
    if (!from || !to) return;
    apply({ from, to });
    dateDialog.current?.close();
  }

  const activeCategoryName = current.category
    ? categories.find((c) => c.id === current.category)?.name ?? "All"
    : "All";
  const categoryActive = current.category !== null;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isPending && "opacity-60 transition-opacity"
      )}
    >
      <div className="flex items-center rounded-full border border-border">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-l-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => dateDialog.current?.showModal()}
          className="px-2 text-sm font-medium tabular-nums hover:bg-muted"
        >
          {rangeLabel(current.from, current.to)}
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-r-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        onClick={() => catDialog.current?.showModal()}
        className={cn(
          "ml-auto inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm",
          categoryActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:bg-muted"
        )}
      >
        {activeCategoryName}
        <span aria-hidden className="text-xs opacity-70">▾</span>
      </button>

      <dialog
        ref={dateDialog}
        className="fixed left-1/2 top-1/2 w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-4 shadow-lg backdrop:bg-black/40"
      >
        <form
          action={applyDateForm}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold">Custom range</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="filter-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="filter-from"
                name="from"
                type="date"
                defaultValue={current.from}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="filter-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="filter-to"
                name="to"
                type="date"
                defaultValue={current.to}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => dateDialog.current?.close()}
              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={catDialog}
        className="fixed left-1/2 top-1/2 w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-4 shadow-lg backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Category</h2>
            <button
              type="button"
              onClick={() => catDialog.current?.close()}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                apply({ category: null });
                catDialog.current?.close();
              }}
              aria-pressed={current.category === null}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                current.category === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              All
            </button>
            {categories.map((c) => {
              const selected = current.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    apply({ category: selected ? null : c.id });
                    catDialog.current?.close();
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <Link
            href="/categories"
            className="text-xs text-muted-foreground hover:underline"
          >
            Manage categories →
          </Link>
        </div>
      </dialog>
    </div>
  );
}
