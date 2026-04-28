"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createExpense, type ExpenseActionState } from "../actions";
import {
  ExpenseFormFields,
  type ExpenseInitial,
} from "../expense-form-fields";

const initialState: ExpenseActionState = { ok: false, message: null };

type Category = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="flex-1">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function ExpenseForm({
  categories,
  defaultCategoryId,
  defaultDate,
}: {
  categories: Category[];
  defaultCategoryId: string;
  defaultDate: string;
}) {
  const [state, formAction] = useFormState(createExpense, initialState);
  const initial: ExpenseInitial = {
    date: defaultDate,
    categoryId: defaultCategoryId,
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ExpenseFormFields categories={categories} initial={initial} />

      {state.message ? (
        <p className={state.ok ? "text-sm" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Link
          href="/"
          className="flex-1 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
