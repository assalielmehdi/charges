"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { CategoryDot } from "@/components/ui/category-dot";
import { DottedDivider } from "@/components/ui/dotted-divider";
import { FormField } from "@/components/ui/form-field";
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
import type { ExpenseActionState } from "../actions";
import { deleteExpense, updateExpense } from "../actions";
import type { ExpenseDetail } from "./loader";

const initialState: ExpenseActionState = { ok: false, message: null };

type Category = { id: string; name: string };

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortDayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const t = new Date(ty, tm - 1, td);
  const diffDays = Math.round(
    (t.getTime() - local.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 1) return "Yesterday";
  return local
    .toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function formatAmountDate(iso: string, todayIso: string): string {
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

export function ExpenseDetailScreen({
  expense,
  photoUrl,
  categories,
  todayISO,
}: {
  expense: ExpenseDetail;
  photoUrl: string | null;
  categories: Category[];
  todayISO: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <EditView
        expense={expense}
        categories={categories}
        todayISO={todayISO}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <DetailView
        expense={expense}
        photoUrl={photoUrl}
        categories={categories}
        todayISO={todayISO}
        onBack={() => router.back()}
        onEdit={() => setEditing(true)}
        onDeleteRequest={() => setConfirmDelete(true)}
      />
      {confirmDelete && (
        <DeleteSheet
          expenseId={expense.id}
          onClose={() => setConfirmDelete(false)}
          onDeleted={() => {
            router.push("/");
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function DetailView({
  expense,
  photoUrl,
  categories,
  todayISO,
  onBack,
  onEdit,
  onDeleteRequest,
}: {
  expense: ExpenseDetail;
  photoUrl: string | null;
  categories: Category[];
  todayISO: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}) {
  const c =
    categories.find((x) => x.id === expense.category_id) ??
    categories[categories.length - 1];

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <ScreenHeader
        left={
          <IconButton type="button" onClick={onBack} aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
        }
        right={
          <div className="flex gap-2">
            <IconButton type="button" onClick={onEdit} aria-label="Edit">
              <Pencil className="w-4 h-4" />
            </IconButton>
            <IconButton
              type="button"
              variant="danger"
              onClick={onDeleteRequest}
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <SectionLabel>{shortDayLabel(expense.date, todayISO)}</SectionLabel>
        <div className="mt-2">
          <HeroAmount value={Number(expense.amount)} size="xl" />
        </div>

        {c && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10">
            <CategoryDot color={colorForCategoryId(c.id)} />
            <span className="text-[12.5px] text-stone-200 tracking-tight">
              {c.name}
            </span>
          </div>
        )}

        {photoUrl && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/[0.06] relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth configuring next/image remote patterns */}
            <img
              src={photoUrl}
              alt="Receipt"
              className="w-full max-h-[260px] object-contain bg-stone-950/40"
            />
            {expense.source === "scan" && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-stone-950/70 text-[10px] tracking-tight text-stone-200 backdrop-blur-md flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Auto-extracted
              </div>
            )}
          </div>
        )}

        <div className="mt-7 space-y-4">
          {expense.merchant && (
            <DetailRow
              label="Merchant"
              value={expense.merchant}
              icon={<Store className="w-3.5 h-3.5" />}
            />
          )}
          <DetailRow
            label="Date"
            value={formatLongDate(expense.date)}
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
          {expense.notes && (
            <DetailRow
              label="Note"
              value={expense.notes}
              icon={<FileText className="w-3.5 h-3.5" />}
            />
          )}
          <DetailRow
            label="Source"
            value={expense.source === "scan" ? "Scanned receipt" : "Manual entry"}
            icon={
              expense.source === "scan" ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )
            }
          />
          <DetailRow
            label="Amount"
            value={`${formatAmountPlain(Number(expense.amount))} MAD`}
            icon={<span className="text-[12px]">∑</span>}
          />
        </div>

        <div className="mt-10">
          <DottedDivider />
          <SectionLabel className="mt-3">
            id · {expense.id.slice(0, 8)}
          </SectionLabel>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-5 h-5 rounded-md flex items-center justify-center text-stone-500 mt-0.5 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <SectionLabel>{label}</SectionLabel>
        <div className="text-[14.5px] text-stone-100 tracking-tight mt-0.5 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Save changes"}
    </PrimaryButton>
  );
}

function EditView({
  expense,
  categories,
  todayISO,
  onCancel,
  onSaved,
}: {
  expense: ExpenseDetail;
  categories: Category[];
  todayISO: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const update = updateExpense.bind(null, expense.id);
  const [state, formAction] = useFormState(update, initialState);

  const initialAmount = Number(expense.amount).toFixed(2);
  const [amount, setAmount] = useState(initialAmount);
  const [date, setDate] = useState(expense.date);
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [showNotes, setShowNotes] = useState(!!expense.notes);

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  const [whole, dec] = amount.includes(".")
    ? amount.split(".")
    : [amount, null];

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
        label="Edit expense"
        left={
          <IconButton type="button" onClick={onCancel} aria-label="Cancel">
            <X className="w-4 h-4" />
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
              className="hidden md:block font-serif italic text-stone-100 text-[64px] leading-[0.95] tracking-tight bg-transparent outline-none w-full max-w-[260px]"
            />
            <span className="md:hidden font-serif italic text-stone-100 text-[64px] leading-[0.95] tracking-tight">
              {whole}
              {dec !== null && (
                <span className="text-stone-500">.{dec}</span>
              )}
            </span>
            <span className="text-stone-500 text-[15px] tracking-[0.15em]">
              MAD
            </span>
          </div>
        </div>

        <div className="relative mt-7 flex items-center gap-3 text-[13px] w-fit">
          <Calendar className="w-4 h-4 text-stone-500 pointer-events-none" />
          <span className="text-stone-100 tracking-tight pointer-events-none">
            {formatAmountDate(date, todayISO)}
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
        <SaveButton />
      </div>
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <SecondaryButton type="submit" danger disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </SecondaryButton>
  );
}

function DeleteSheet({
  expenseId,
  onClose,
  onDeleted,
}: {
  expenseId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const remove = deleteExpense.bind(null, expenseId);
  const [state, formAction] = useFormState(remove, initialState);

  useEffect(() => {
    if (state?.ok) onDeleted();
  }, [state, onDeleted]);

  return (
    <Sheet onClose={onClose}>
      <div className="font-serif italic text-stone-100 text-[26px] leading-tight">
        Delete this entry?
      </div>
      <div className="text-stone-400 text-[13px] mt-2 leading-relaxed">
        This is permanent. There&rsquo;s no version history.
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
        <DeleteButton />
      </form>
    </Sheet>
  );
}
