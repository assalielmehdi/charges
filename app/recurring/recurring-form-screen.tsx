"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Hash,
  Repeat,
  Store,
  Tag,
} from "lucide-react";
import { CategoryDot } from "@/components/ui/category-dot";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { colorForCategoryId } from "@/lib/palette";
import { monthInputValue, isMonthEligible } from "@/lib/recurring";
import {
  createRecurringTemplate,
  updateRecurringTemplate,
  type RecurringActionState,
} from "./actions";
import type { Category, RecurringTemplate } from "./loader";

const initialState: RecurringActionState = { ok: false, message: null };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : editing ? "Save recurring expense" : "Create recurring expense"}
    </PrimaryButton>
  );
}

export function RecurringFormScreen({
  template,
  categories,
  currentMonth,
}: {
  template: RecurringTemplate | null;
  categories: Category[];
  currentMonth: string;
}) {
  const router = useRouter();
  const editing = !!template;
  const action = template
    ? updateRecurringTemplate.bind(null, template.id)
    : createRecurringTemplate;
  const [state, formAction] = useFormState(action, initialState);

  const defaultCategoryId = template?.category_id ?? categories[0]?.id ?? "";
  const [name, setName] = useState(template?.name ?? "");
  const [amount, setAmount] = useState(
    template ? Number(template.amount).toFixed(2) : "0",
  );
  const [dayOfMonth, setDayOfMonth] = useState(String(template?.day_of_month ?? 1));
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [merchant, setMerchant] = useState(template?.merchant ?? "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [startsOn, setStartsOn] = useState(
    monthInputValue(template?.starts_on ?? currentMonth),
  );
  const [endsOn, setEndsOn] = useState(monthInputValue(template?.ends_on ?? null));
  const [createCurrentMonth, setCreateCurrentMonth] = useState(true);

  useEffect(() => {
    if (state?.ok) {
      router.push("/recurring");
      router.refresh();
    }
  }, [state, router]);

  const currentEligible = useMemo(() => {
    if (editing) return false;
    const start = startsOn ? `${startsOn}-01` : "";
    const end = endsOn ? `${endsOn}-01` : null;
    if (!start) return false;
    return isMonthEligible({ startsOn: start, endsOn: end, month: currentMonth });
  }, [currentMonth, editing, endsOn, startsOn]);

  return (
    <form action={formAction} className="flex flex-col flex-1 min-h-0 w-full">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="day_of_month" value={dayOfMonth} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="merchant" value={merchant} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="starts_on" value={startsOn} />
      <input type="hidden" name="ends_on" value={endsOn} />
      {currentEligible && createCurrentMonth ? (
        <input type="hidden" name="create_current_month" value="on" />
      ) : null}

      <ScreenHeader
        label={editing ? "Edit recurring" : "New recurring"}
        left={
          <IconButton type="button" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-5">
        <div className="flex items-center gap-2 text-stone-500 text-[12px] tracking-tight">
          <Repeat className="w-4 h-4" />
          Monthly template
        </div>

        <div className="mt-5">
          <SectionLabel>Amount</SectionLabel>
          <div className="mt-1 flex items-baseline gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (/^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v || "0");
              }}
              aria-label="Amount"
              className="font-serif italic text-stone-100 text-[64px] leading-[0.95] tracking-tight bg-transparent outline-none w-full max-w-[260px] border-b border-transparent focus:border-white/20 transition"
            />
            <span className="text-stone-500 text-[15px] tracking-[0.15em]">
              MAD
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <FormField
            icon={<Tag className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            autoFocus
            required
          />
          <FormField
            icon={<Store className="w-4 h-4" />}
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Merchant (optional)"
          />
          <FormField
            icon={<FileText className="w-4 h-4" />}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (optional)"
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <LabeledInput
            label="Day"
            icon={<Hash className="w-3.5 h-3.5" />}
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={setDayOfMonth}
          />
          <LabeledInput
            label="Starts"
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            type="month"
            value={startsOn}
            onChange={setStartsOn}
          />
          <LabeledInput
            label="Ends"
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            type="month"
            value={endsOn}
            onChange={setEndsOn}
          />
        </div>

        <div className="mt-6">
          <SectionLabel className="mb-3">Category</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-[13px] tracking-tight border transition flex items-center gap-2",
                    active
                      ? "bg-white/[0.06] border-white/30 text-stone-100"
                      : "border-white/[0.08] text-stone-400 hover:border-white/15",
                  )}
                >
                  <CategoryDot color={colorForCategoryId(c.id)} size={6} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {currentEligible ? (
          <label className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.08] p-4 text-[13px] tracking-tight text-stone-300">
            <input
              type="checkbox"
              checked={createCurrentMonth}
              onChange={(e) => setCreateCurrentMonth(e.target.checked)}
              className="mt-0.5 accent-stone-100"
            />
            <span>
              <span className="block text-stone-100">Create for this month</span>
              <span className="text-stone-500">
                Unchecking this skips the current month for this template.
              </span>
            </span>
          </label>
        ) : null}
      </div>

      {state?.message && !state.ok ? (
        <p className="px-5 pb-2 text-[13px] text-rose-300/80 tracking-tight">
          {state.message}
        </p>
      ) : null}

      <div className="px-5 pb-5">
        <SubmitButton editing={editing} />
      </div>
    </form>
  );
}

function LabeledInput({
  label,
  icon,
  type,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="min-w-0">
      <SectionLabel className="mb-2">{label}</SectionLabel>
      <div className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 flex items-center gap-2 text-stone-500">
        {icon}
        <input
          type={type}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none text-stone-100 text-[13px] tracking-tight"
        />
      </div>
    </label>
  );
}
