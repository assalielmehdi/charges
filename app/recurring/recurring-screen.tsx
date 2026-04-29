"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
} from "lucide-react";
import { CategoryDot } from "@/components/ui/category-dot";
import { HeroAmount } from "@/components/ui/hero-amount";
import { IconButton } from "@/components/ui/icon-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { colorForCategoryId } from "@/lib/palette";
import { formatAmountPlain } from "@/lib/format";
import {
  formatMonthName,
  formatMonthSummary,
  monthInputValue,
} from "@/lib/recurring";
import {
  archiveRecurringTemplate,
  pauseRecurringTemplate,
  resumeRecurringTemplate,
  type RecurringActionState,
} from "./actions";
import type { Category, RecurringListItem } from "./loader";

const initialState: RecurringActionState = { ok: false, message: null };

type SheetTarget =
  | { kind: "pause"; item: RecurringListItem }
  | { kind: "resume"; item: RecurringListItem }
  | { kind: "archive"; item: RecurringListItem }
  | null;

export function RecurringScreen({
  templates,
  categories,
  currentMonth,
  monthlyTotal,
}: {
  templates: RecurringListItem[];
  categories: Category[];
  currentMonth: string;
  monthlyTotal: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showArchived = searchParams.get("archived") === "1";
  const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);

  function toggleArchived() {
    router.push(showArchived ? "/recurring" : "/recurring?archived=1");
  }

  const findCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="flex flex-col min-h-screen md:max-w-[760px] md:mx-auto md:w-full md:px-10">
      <ScreenHeader
        label="Recurring"
        left={
          <IconButton type="button" onClick={() => router.push("/")} aria-label="Ledger">
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
        }
      />

      <div className="flex-1 px-6 md:px-0 pt-3 pb-28">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Monthly recurring total</SectionLabel>
            <div className="mt-2">
              <HeroAmount value={monthlyTotal} size="lg" />
            </div>
          </div>
          <Link
            href="/recurring/new"
            className="h-10 px-4 rounded-xl bg-stone-100 text-stone-950 text-[13px] font-medium tracking-tight active:scale-[0.98] transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <div className="text-stone-500 text-[12px] tracking-tight flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            {formatMonthName(currentMonth)}
          </div>
          <button
            type="button"
            onClick={toggleArchived}
            className={cn(
              "h-8 px-3 rounded-lg text-[12px] tracking-tight border transition",
              showArchived
                ? "border-white/25 text-stone-100"
                : "border-white/[0.08] text-stone-500 hover:text-stone-300",
            )}
          >
            Show archived
          </button>
        </div>

        <div className="mt-5 divide-y divide-white/[0.05]">
          {templates.map((item) => {
            const category = findCategory(item.category_id);
            return (
              <div key={item.id} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <CategoryDot color={colorForCategoryId(item.category_id)} size={10} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-stone-100 text-[15px] tracking-tight truncate">
                        {item.name}
                      </div>
                      <StatusBadge status={item.archived_at ? "Archived" : item.currentStatus} />
                    </div>
                    <div className="mt-1 text-stone-500 text-[12px] tracking-tight truncate">
                      {category?.name ?? "No category"} · day {item.day_of_month} ·{" "}
                      {formatMonthSummary(item.starts_on, item.ends_on)}
                    </div>
                    <div className="mt-1 text-stone-600 text-[11.5px] tracking-tight truncate">
                      {item.is_active ? "Active" : "Paused"}
                      {item.merchant ? ` · ${item.merchant}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-stone-100 text-[15px] font-mono tabular-nums">
                      {formatAmountPlain(item.amount)}
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <IconLink href={`/recurring/${item.id}`} label="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </IconLink>
                      {item.archived_at ? null : item.is_active ? (
                        <IconAction label="Pause" onClick={() => setSheetTarget({ kind: "pause", item })}>
                          <Pause className="w-3.5 h-3.5" />
                        </IconAction>
                      ) : (
                        <IconAction label="Resume" onClick={() => setSheetTarget({ kind: "resume", item })}>
                          <Play className="w-3.5 h-3.5" />
                        </IconAction>
                      )}
                      {!item.archived_at && (
                        <IconAction label="Archive" onClick={() => setSheetTarget({ kind: "archive", item })}>
                          <Archive className="w-3.5 h-3.5" />
                        </IconAction>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div className="py-16 text-center text-stone-600 text-[13px]">
            No recurring expenses yet.
          </div>
        )}
      </div>

      {sheetTarget?.kind === "pause" && (
        <PauseSheet
          item={sheetTarget.item}
          currentMonth={currentMonth}
          onClose={() => setSheetTarget(null)}
        />
      )}
      {sheetTarget?.kind === "resume" && (
        <ResumeSheet
          item={sheetTarget.item}
          currentMonth={currentMonth}
          onClose={() => setSheetTarget(null)}
        />
      )}
      {sheetTarget?.kind === "archive" && (
        <ArchiveSheet item={sheetTarget.item} onClose={() => setSheetTarget(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="shrink-0 rounded-full border border-white/[0.08] px-2 py-0.5 text-[10.5px] tracking-tight text-stone-400">
      {status}
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/[0.04] transition"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/[0.04] transition"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function SheetSubmitButton({ children, danger }: { children: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  if (danger) {
    return (
      <SecondaryButton type="submit" danger disabled={pending}>
        {pending ? "..." : children}
      </SecondaryButton>
    );
  }
  return (
    <PrimaryButton type="submit" disabled={pending}>
      {pending ? "..." : children}
    </PrimaryButton>
  );
}

function PauseSheet({
  item,
  currentMonth,
  onClose,
}: {
  item: RecurringListItem;
  currentMonth: string;
  onClose: () => void;
}) {
  const action = pauseRecurringTemplate.bind(null, item.id);
  const [state, formAction] = useFormState(action, initialState);
  const [effectiveMonth, setEffectiveMonth] = useState(monthInputValue(currentMonth));
  const [deleteCurrent, setDeleteCurrent] = useState(!!item.currentGeneratedExpenseId);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Sheet onClose={onClose}>
      <div className="font-serif italic text-stone-100 text-[26px] leading-tight">
        Pause recurring expense
      </div>
      <div className="text-stone-400 text-[13px] mt-2 leading-relaxed">
        Months inside the pause period will not generate later.
      </div>
      <form action={formAction} className="mt-5 space-y-5">
        <MonthField value={effectiveMonth} onChange={setEffectiveMonth} />
        <input type="hidden" name="effective_month" value={effectiveMonth} />
        {deleteCurrent ? (
          <input type="hidden" name="delete_current_month" value="on" />
        ) : null}
        {item.currentGeneratedExpenseId && effectiveMonth === monthInputValue(currentMonth) ? (
          <label className="flex items-start gap-3 text-[13px] tracking-tight text-stone-300">
            <input
              type="checkbox"
              checked={deleteCurrent}
              onChange={(e) => setDeleteCurrent(e.target.checked)}
              className="mt-0.5 accent-stone-100"
            />
            <span>Delete this month&apos;s generated expense</span>
          </label>
        ) : null}
        {state?.message && !state.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight">
            {state.message}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <SheetSubmitButton>Pause</SheetSubmitButton>
        </div>
      </form>
    </Sheet>
  );
}

function ResumeSheet({
  item,
  currentMonth,
  onClose,
}: {
  item: RecurringListItem;
  currentMonth: string;
  onClose: () => void;
}) {
  const action = resumeRecurringTemplate.bind(null, item.id);
  const [state, formAction] = useFormState(action, initialState);
  const [effectiveMonth, setEffectiveMonth] = useState(monthInputValue(currentMonth));
  const [createCurrent, setCreateCurrent] = useState(!item.currentGeneratedExpenseId);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Sheet onClose={onClose}>
      <div className="font-serif italic text-stone-100 text-[26px] leading-tight">
        Resume recurring expense
      </div>
      <div className="text-stone-400 text-[13px] mt-2 leading-relaxed">
        Generation starts again from the effective month.
      </div>
      <form action={formAction} className="mt-5 space-y-5">
        <MonthField value={effectiveMonth} onChange={setEffectiveMonth} />
        <input type="hidden" name="effective_month" value={effectiveMonth} />
        {createCurrent ? (
          <input type="hidden" name="create_current_month" value="on" />
        ) : null}
        {!item.currentGeneratedExpenseId && effectiveMonth === monthInputValue(currentMonth) ? (
          <label className="flex items-start gap-3 text-[13px] tracking-tight text-stone-300">
            <input
              type="checkbox"
              checked={createCurrent}
              onChange={(e) => setCreateCurrent(e.target.checked)}
              className="mt-0.5 accent-stone-100"
            />
            <span>Create for this month</span>
          </label>
        ) : null}
        {state?.message && !state.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight">
            {state.message}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <SheetSubmitButton>Resume</SheetSubmitButton>
        </div>
      </form>
    </Sheet>
  );
}

function ArchiveSheet({
  item,
  onClose,
}: {
  item: RecurringListItem;
  onClose: () => void;
}) {
  const action = archiveRecurringTemplate.bind(null, item.id);
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Sheet onClose={onClose}>
      <div className="font-serif italic text-stone-100 text-[26px] leading-tight">
        Archive {item.name}?
      </div>
      <div className="text-stone-400 text-[13px] mt-2 leading-relaxed">
        Existing generated expenses stay in the ledger, but this template will never generate again.
      </div>
      {state?.message && !state.ok ? (
        <p className="text-[13px] text-rose-300/80 tracking-tight mt-3">
          {state.message}
        </p>
      ) : null}
      <form action={formAction} className="mt-5 grid grid-cols-2 gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <SheetSubmitButton danger>Archive</SheetSubmitButton>
      </form>
    </Sheet>
  );
}

function MonthField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <SectionLabel className="mb-2">Effective month</SectionLabel>
      <div className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 flex items-center gap-2 text-stone-500">
        <CalendarDays className="w-3.5 h-3.5" />
        <input
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none text-stone-100 text-[13px] tracking-tight"
        />
      </div>
    </label>
  );
}
