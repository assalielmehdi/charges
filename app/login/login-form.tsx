"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { ok: false, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? "Sending…" : "Send magic link"}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(sendMagicLink, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-xs">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoFocus
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>
      {state.message ? (
        <p className={state.ok ? "text-sm" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
