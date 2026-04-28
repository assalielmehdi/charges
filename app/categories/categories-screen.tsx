"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { CategoryGlyph } from "@/components/ui/category-glyph";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SectionLabel } from "@/components/ui/section-label";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { Sheet } from "@/components/ui/sheet";
import { colorForCategoryId, PALETTE } from "@/lib/palette";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  type CategoryActionState,
} from "./actions";
import type { CategoryRow } from "./loader";

const initialState: CategoryActionState = { ok: false, message: null };
const NEW_CATEGORY_PREVIEW_COLOR = PALETTE[PALETTE.length - 1]; // slate

type EditTarget = CategoryRow | "new" | null;

export function CategoriesScreen({
  categories,
  expenseCounts,
}: {
  categories: CategoryRow[];
  expenseCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditTarget>(null);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <ScreenHeader
        left={
          <IconButton
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </IconButton>
        }
        label="Categories"
        right={
          <IconButton
            type="button"
            variant="filled"
            onClick={() => setEditing("new")}
            aria-label="Add category"
          >
            <Plus className="w-4 h-4" />
          </IconButton>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6">
        <h1 className="font-serif italic text-stone-100 text-[40px] leading-[1.05] tracking-tight">
          Tags to sort
          <br />
          <span className="text-stone-500">it all.</span>
        </h1>
        <p className="mt-3 text-stone-400 text-[13.5px] leading-relaxed">
          One category per expense. In-use categories can&rsquo;t be deleted.
        </p>

        <div className="mt-7 space-y-1">
          {categories.map((c) => {
            const count = expenseCounts[c.id] ?? 0;
            const inUse = count > 0;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] group"
              >
                <GripVertical className="w-4 h-4 text-stone-700 transition shrink-0" />
                <CategoryGlyph color={colorForCategoryId(c.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-stone-100 text-[14.5px] tracking-tight truncate">
                    {c.name}
                  </div>
                  <div className="text-stone-500 text-[11.5px] tracking-tight">
                    {count} {count === 1 ? "entry" : "entries"}
                    {!inUse && (
                      <span className="text-stone-600"> · safe to delete</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/[0.04] transition"
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="w-full py-3.5 rounded-2xl border border-dashed border-white/15 text-stone-300 text-[13.5px] tracking-tight hover:bg-white/[0.02] flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Add category
          </button>
        </div>
      </div>

      {editing === "new" && (
        <NewCategorySheet onClose={() => setEditing(null)} />
      )}
      {editing && editing !== "new" && (
        <EditCategorySheet
          category={editing}
          inUse={(expenseCounts[editing.id] ?? 0) > 0}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SaveButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending}>
      {pending ? "…" : children}
    </PrimaryButton>
  );
}

function DeleteCategoryButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full py-2 text-rose-300/70 text-[12.5px] tracking-tight hover:text-rose-300 disabled:opacity-50 disabled:hover:text-rose-300/70 flex items-center justify-center gap-2 transition"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {pending ? "Deleting…" : "Delete category"}
    </button>
  );
}

function NewCategorySheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [state, formAction] = useFormState(createCategory, initialState);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>New category</SectionLabel>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h2 className="font-serif italic text-stone-100 text-[36px] leading-[1.05] tracking-tight">
        Make it
        <br />
        <span className="text-stone-500">yours.</span>
      </h2>

      <form action={formAction} className="mt-7 space-y-6">
        <FormField
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coffee, Subscriptions"
          autoFocus
          required
          maxLength={40}
        />

        <CategoryPreview name={name || "Preview"} color={NEW_CATEGORY_PREVIEW_COLOR} />

        {state?.message && !state.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight">
            {state.message}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <SaveButton>Create</SaveButton>
        </div>
      </form>
    </Sheet>
  );
}

function EditCategorySheet({
  category,
  inUse,
  onClose,
}: {
  category: CategoryRow;
  inUse: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);

  const renameBound = renameCategory.bind(null, category.id);
  const removeBound = deleteCategory.bind(null, category.id);

  const [renameState, renameAction] = useFormState(renameBound, initialState);
  const [deleteState, deleteAction] = useFormState(removeBound, initialState);

  useEffect(() => {
    if (renameState?.ok || deleteState?.ok) onClose();
  }, [renameState, deleteState, onClose]);

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Edit category</SectionLabel>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h2 className="font-serif italic text-stone-100 text-[36px] leading-[1.05] tracking-tight truncate">
        {name || category.name}
      </h2>

      <form action={renameAction} className="mt-7 space-y-6">
        <FormField
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          autoFocus
          required
          maxLength={40}
        />

        <CategoryPreview name={name || category.name} color={colorForCategoryId(category.id)} />

        {renameState?.message && !renameState.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight">
            {renameState.message}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <SaveButton>Save</SaveButton>
        </div>
      </form>

      <form action={deleteAction} className="mt-3">
        <DeleteCategoryButton disabled={inUse} />
        {inUse ? (
          <div className="text-stone-600 text-[11px] tracking-tight text-center mt-1">
            In use — reassign expenses first
          </div>
        ) : null}
        {deleteState?.message && !deleteState.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight text-center mt-2">
            {deleteState.message}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}

function CategoryPreview({ name, color }: { name: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3">
      <CategoryGlyph color={color} />
      <div className="flex-1 min-w-0">
        <div className="text-stone-100 text-[14.5px] tracking-tight truncate">
          {name}
        </div>
        <div className="text-stone-500 text-[11.5px] tracking-tight">
          how it looks in the ledger
        </div>
      </div>
      <div className="font-mono text-[14px] text-stone-300 tabular-nums">
        0.00
      </div>
    </div>
  );
}
