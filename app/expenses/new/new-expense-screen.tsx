"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  Plus,
  Store,
} from "lucide-react";
import { CategoryDot } from "@/components/ui/category-dot";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { colorForCategoryId } from "@/lib/palette";
import { createExpense, type ExpenseActionState } from "../actions";

const initialState: ExpenseActionState = { ok: false, message: null };

type Category = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Save expense"}
    </PrimaryButton>
  );
}

function formatLongDate(iso: string, todayIso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const monthDay = local.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  if (iso === todayIso) return `Today, ${monthDay}`;
  return local.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function NewExpenseScreen({
  categories,
  defaultCategoryId,
  defaultDate,
  todayISO,
}: {
  categories: Category[];
  defaultCategoryId: string;
  defaultDate: string;
  todayISO: string;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(createExpense, initialState);

  useEffect(() => {
    if (state?.ok) {
      const target = state.redirectMonth ? `/?month=${state.redirectMonth}` : "/";
      window.location.assign(target);
    }
  }, [state]);

  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState(defaultDate);
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  return (
    <form
      action={formAction}
      className="flex flex-col flex-1 min-h-0 w-full"
    >
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="merchant" value={merchant} />
      <input type="hidden" name="notes" value={notes} />

      <ScreenHeader
        label="New expense"
        left={
          <IconButton
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
        }
      />

      <div className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto pb-4">
        <div className="mt-2">
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
              className="font-serif italic text-stone-100 text-[80px] leading-[0.95] tracking-tight bg-transparent outline-none w-full max-w-[260px] border-b border-transparent focus:border-white/20 transition"
            />
            <span className="text-stone-500 text-[15px] tracking-[0.15em]">
              MAD
            </span>
          </div>
        </div>

        {/* Date row — hidden native picker overlays the styled row */}
        <div className="relative mt-7 flex items-center gap-3 text-[13px] w-fit">
          <Calendar className="w-4 h-4 text-stone-500 pointer-events-none" />
          <span className="text-stone-100 tracking-tight pointer-events-none">
            {formatLongDate(date, todayISO)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500 pointer-events-none" />
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Date"
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

        <div className="mt-6 space-y-4">
          <FormField
            icon={<Store className="w-4 h-4" />}
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Merchant (optional)"
          />
          {showNotes ? (
            <FormField
              icon={<FileText className="w-4 h-4" />}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-[12px] text-stone-500 hover:text-stone-300 flex items-center gap-2 tracking-tight"
            >
              <Plus className="w-3 h-3" /> Add note
            </button>
          )}
        </div>

        <div className="flex-1" />
      </div>

      {state?.message && !state.ok ? (
        <p className="px-5 pb-2 text-[13px] text-rose-300/80 tracking-tight">
          {state.message}
        </p>
      ) : null}

      <div className="px-5 pb-5">
        <SubmitButton />
      </div>
    </form>
  );
}
