"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  type CategoryActionState,
} from "./actions";

const initial: CategoryActionState = { ok: false, message: null };

type Category = { id: string; name: string };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-col gap-4">
      <AddCategoryForm />
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No categories yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddCategoryForm() {
  const [state, formAction] = useFormState(createCategory, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-1">
      <form ref={formRef} action={formAction} className="flex gap-2">
        <Input
          name="name"
          placeholder="New category"
          required
          maxLength={40}
          className="flex-1"
        />
        <AddSubmit />
      </form>
      {state.message && !state.ok ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
}

function AddSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add"}
    </Button>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const renameAction = renameCategory.bind(null, category.id);
  const deleteAction = deleteCategory.bind(null, category.id);
  const [renameState, renameFormAction] = useFormState(renameAction, initial);
  const [deleteState, deleteFormAction] = useFormState(deleteAction, initial);

  useEffect(() => {
    if (renameState.ok) setEditing(false);
  }, [renameState]);

  return (
    <li className="flex flex-col gap-1 p-3">
      {editing ? (
        <form action={renameFormAction} className="flex items-center gap-2">
          <Input
            name="name"
            defaultValue={category.name}
            required
            autoFocus
            maxLength={40}
            className="flex-1"
          />
          <RenameSubmit />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm">{category.name}</span>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Rename
            </Button>
            <form action={deleteFormAction}>
              <DeleteSubmit />
            </form>
          </div>
        </div>
      )}
      {renameState.message && !renameState.ok ? (
        <p className="text-xs text-destructive">{renameState.message}</p>
      ) : null}
      {deleteState.message && !deleteState.ok ? (
        <p className="text-xs text-destructive">{deleteState.message}</p>
      ) : null}
    </li>
  );
}

function RenameSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "…" : "Save"}
    </Button>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? "…" : "Delete"}
    </Button>
  );
}
