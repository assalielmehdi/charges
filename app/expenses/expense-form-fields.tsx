"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export type ExpenseInitial = {
  amount?: string;
  date: string;
  categoryId: string;
  merchant?: string | null;
  notes?: string | null;
};

export function ExpenseFormFields({
  categories,
  initial,
}: {
  categories: Category[];
  initial: ExpenseInitial;
}) {
  const [categoryId, setCategoryId] = useState(initial.categoryId);

  return (
    <>
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount (MAD)</Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoFocus={!initial.amount}
          required
          placeholder="0.00"
          pattern="^\d+([.,]\d{1,2})?$"
          defaultValue={initial.amount ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={initial.date}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="merchant">Merchant</Label>
        <Input
          id="merchant"
          name="merchant"
          type="text"
          placeholder="Optional"
          defaultValue={initial.merchant ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Optional"
          defaultValue={initial.notes ?? ""}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </div>
    </>
  );
}
