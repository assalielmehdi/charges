"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { saveScanned, discardScan } from "../actions";
import type { ExpenseActionState } from "../../actions";
import {
  ExpenseFormFields,
  type ExpenseInitial,
} from "../../expense-form-fields";

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

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="flex-1">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function CancelButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="lg"
      disabled={pending}
      className="flex-1"
    >
      {pending ? "Discarding…" : "Cancel"}
    </Button>
  );
}

function matchCategory(hint: string | null, categories: Category[]): string | null {
  if (!hint) return null;
  const h = hint.trim().toLowerCase();
  if (!h) return null;
  const exact = categories.find((c) => c.name.toLowerCase() === h);
  if (exact) return exact.id;
  const contains = categories.find(
    (c) => h.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(h)
  );
  return contains?.id ?? null;
}

export function ReviewForm({
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
  const [stashed, setStashed] = useState<Stashed | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [saveState, saveAction] = useFormState(saveScanned, initialState);

  useEffect(() => {
    const raw = sessionStorage.getItem(`scan:${scanId}`);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Stashed;
      // Defensive: don't render a path that doesn't belong to this user.
      if (!parsed.photo_path?.startsWith(`${userId}/`)) {
        setHydrated(true);
        return;
      }
      setStashed(parsed);
    } catch {
      // Drop unparseable stash; we'll show the "missing scan" state.
    } finally {
      setHydrated(true);
    }
  }, [scanId, userId]);

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

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading scan…</p>;
  }

  if (!stashed) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">
          Scan data is missing — the page may have been refreshed across tabs.
        </p>
        <Link
          href="/expenses/scan"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Re-scan
        </Link>
      </div>
    );
  }

  const { extraction } = stashed;
  const matchedCategoryId = matchCategory(extraction.category_hint, categories);

  const initial: ExpenseInitial = {
    amount:
      extraction.amount != null ? extraction.amount.toFixed(2) : undefined,
    date: extraction.date ?? defaultDate,
    categoryId: matchedCategoryId ?? defaultCategoryId,
    merchant: extraction.merchant,
    notes: null,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Extracted by AI — please verify each field before saving.
      </div>

      {photoError ? (
        <p className="text-sm text-destructive">Photo: {photoError}</p>
      ) : photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth configuring next/image remote patterns
        <img
          src={photoUrl}
          alt="Receipt"
          className="max-h-72 w-full rounded-lg border border-border object-contain"
        />
      ) : (
        <div className="h-40 w-full animate-pulse rounded-lg border border-border bg-muted/30" />
      )}

      <form action={saveAction} className="flex flex-col gap-5">
        <input type="hidden" name="photo_path" value={stashed.photo_path} />
        <input
          type="hidden"
          name="extraction_raw"
          value={JSON.stringify(stashed.extraction_raw ?? null)}
        />

        <ExpenseFormFields categories={categories} initial={initial} />

        {saveState.message ? (
          <p
            className={
              saveState.ok ? "text-sm" : "text-sm text-destructive"
            }
          >
            {saveState.message}
          </p>
        ) : null}

        <div className="flex gap-2">
          <SaveButton />
        </div>
      </form>

      <form action={discardScan}>
        <input type="hidden" name="photo_path" value={stashed.photo_path} />
        <CancelButton />
      </form>
    </div>
  );
}
