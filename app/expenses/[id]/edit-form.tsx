"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  deleteExpense,
  updateExpense,
  type ExpenseActionState,
} from "../actions";
import {
  ExpenseFormFields,
  type ExpenseInitial,
} from "../expense-form-fields";

const initialState: ExpenseActionState = { ok: false, message: null };

type Category = { id: string; name: string };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="flex-1">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

export function EditForm({
  id,
  categories,
  initial,
}: {
  id: string;
  categories: Category[];
  initial: ExpenseInitial;
}) {
  const update = updateExpense.bind(null, id);
  const remove = deleteExpense.bind(null, id);
  const [state, formAction] = useFormState(update, initialState);

  return (
    <div className="flex flex-col gap-6">
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
          <SaveButton />
        </div>
      </form>

      <form action={remove}>
        <DeleteButton />
      </form>
    </div>
  );
}
