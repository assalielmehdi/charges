"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Calendar,
  Check,
  Pencil,
  Sparkles,
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
import { createClient } from "@/utils/supabase/client";
import type { ExpenseActionState } from "../../actions";
import { discardScan, saveScanned } from "../actions";

const initialState: ExpenseActionState = { ok: false, message: null };

type Category = { id: string; name: string };

type Stashed = {
  photo_path: string;
  extraction: {
    amount: number | null;
    date: string | null;
    merchant: string | null;
    category_hint: string | null;
  };
  extraction_raw: unknown;
};

function matchCategory(
  hint: string | null,
  categories: Category[],
): string | null {
  if (!hint) return null;
  const h = hint.trim().toLowerCase();
  if (!h) return null;
  const exact = categories.find((c) => c.name.toLowerCase() === h);
  if (exact) return exact.id;
  const contains = categories.find(
    (c) => h.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(h),
  );
  return contains?.id ?? null;
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton
      type="submit"
      disabled={pending}
      className="w-full"
      icon={!pending ? <Check className="w-4 h-4" /> : undefined}
    >
      {pending ? "Saving…" : "Save expense"}
    </PrimaryButton>
  );
}

export function ScanReviewScreen({
  scanId,
  userId,
  signedUrlTtl,
  categories,
  defaultCategoryId,
  defaultDate,
}: {
  scanId: string;
  userId: string;
  signedUrlTtl: number;
  categories: Category[];
  defaultCategoryId: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [stashed, setStashed] = useState<Stashed | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [saveState, saveAction] = useFormState(saveScanned, initialState);
  const [discardState, discardAction] = useFormState(discardScan, initialState);

  const [amount, setAmount] = useState("0.00");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [date, setDate] = useState(defaultDate);
  const [isSuggested, setIsSuggested] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan:${scanId}`);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Stashed;
      if (!parsed.photo_path?.startsWith(`${userId}/`)) {
        setHydrated(true);
        return;
      }
      setStashed(parsed);

      if (parsed.extraction.amount != null) {
        setAmount(parsed.extraction.amount.toFixed(2));
      }
      if (parsed.extraction.merchant) setMerchant(parsed.extraction.merchant);
      if (parsed.extraction.date) setDate(parsed.extraction.date);
      const matched = matchCategory(parsed.extraction.category_hint, categories);
      if (matched) {
        setCategoryId(matched);
        setIsSuggested(true);
      }
    } catch {
      // drop unparseable stash
    } finally {
      setHydrated(true);
    }
  }, [scanId, userId, categories]);

  useEffect(() => {
    if (!stashed) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("receipts")
      .createSignedUrl(stashed.photo_path, signedUrlTtl)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setPhotoError(error?.message ?? "Could not load photo.");
          return;
        }
        setPhotoUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [stashed, signedUrlTtl]);

  useEffect(() => {
    if (saveState?.ok || discardState?.ok) {
      sessionStorage.removeItem(`scan:${scanId}`);
      const target = saveState?.redirectMonth
        ? `/?month=${saveState.redirectMonth}`
        : "/";
      router.replace(target);
    }
  }, [saveState, discardState, router, scanId]);

  if (!hydrated) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <ScreenHeader
          label="Review extraction"
          left={
            <IconButton type="button" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </IconButton>
          }
        />
        <div className="flex-1 flex items-center justify-center text-stone-500 text-[13px]">
          Loading scan…
        </div>
      </div>
    );
  }

  if (!stashed) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <ScreenHeader
          label="Review extraction"
          left={
            <IconButton type="button" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </IconButton>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="text-rose-300/80 text-[14px] tracking-tight text-center">
            Scan data is missing — the page may have been refreshed.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/expenses/scan")}
            className="text-stone-100 underline underline-offset-4 decoration-white/30 text-[13px]"
          >
            Re-scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stub form referenced by the Cancel button via form="discard-scan". */}
      <form id="discard-scan" action={discardAction} className="hidden">
        <input type="hidden" name="photo_path" value={stashed.photo_path} />
      </form>

      <form
        action={saveAction}
        className="flex flex-col flex-1 min-h-0 w-full"
      >
        <input type="hidden" name="photo_path" value={stashed.photo_path} />
        <input
          type="hidden"
          name="extraction_raw"
          value={JSON.stringify(stashed.extraction_raw ?? null)}
        />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="merchant" value={merchant} />

        <ScreenHeader
          label="Review extraction"
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

        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
          {photoError ? (
            <p className="text-[13px] text-rose-300/80 tracking-tight">
              Photo: {photoError}
            </p>
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth configuring next/image remote patterns
            <img
              src={photoUrl}
              alt="Receipt"
              className="rounded-2xl border border-white/[0.06] w-full max-h-[260px] object-contain bg-stone-950/40"
            />
          ) : (
            <div className="h-40 w-full animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          )}

          <div className="mt-4 flex items-center gap-2 text-[11px] tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <span className="text-stone-400">
              High confidence · Edit anything below before saving
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <SectionLabel className="mb-1">Amount</SectionLabel>
              <div className="flex items-baseline gap-2 group">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v);
                  }}
                  className="font-serif italic text-stone-100 text-[58px] leading-none tracking-tight bg-transparent outline-none border-b border-transparent focus:border-white/20 max-w-[220px]"
                />
                <span className="text-stone-500 text-[14px] tracking-[0.15em]">
                  MAD
                </span>
                <Pencil className="w-3.5 h-3.5 text-stone-600 ml-2 opacity-0 group-focus-within:opacity-100 transition" />
              </div>
            </div>

            <FormField
              label="Merchant"
              icon={<Store className="w-4 h-4" />}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant"
            />
            <FormField
              label="Date"
              icon={<Calendar className="w-4 h-4" />}
              readonlyDisplay={formatLongDate(date)}
            />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <SectionLabel>Category</SectionLabel>
                {isSuggested && (
                  <div className="text-[10px] text-stone-600 flex items-center gap-1 tracking-tight">
                    <Sparkles className="w-2.5 h-2.5" /> suggested
                  </div>
                )}
              </div>
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

            {saveState?.message && !saveState.ok ? (
              <p className="text-[13px] text-rose-300/80 tracking-tight">
                {saveState.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-2 border-t border-white/[0.04]">
          <SaveButton />
          <button
            type="submit"
            form="discard-scan"
            className="w-full py-3 text-stone-500 text-[13px] tracking-tight hover:text-stone-300 transition"
          >
            Cancel · removes uploaded photo
          </button>
        </div>
      </form>
    </>
  );
}
