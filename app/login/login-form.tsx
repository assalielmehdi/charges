"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowUpRight, Lock, Mail } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { signInWithPassword, type LoginState } from "./actions";

const initialState: LoginState = { ok: false, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <ArrowUpRight className="w-4 h-4" />}
    </PrimaryButton>
  );
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState(signInWithPassword, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.ok) {
      router.replace(next);
      router.refresh();
    }
  }, [state.ok, next, router]);

  return (
    <div className="space-y-4 mt-12">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormField
          name="email"
          type="email"
          icon={<Mail className="w-4 h-4" />}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          autoComplete="email"
          inputMode="email"
        />
        <FormField
          name="password"
          type="password"
          icon={<Lock className="w-4 h-4" />}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {state.message && !state.ok ? (
          <p className="text-[13px] text-rose-300/80 tracking-tight">
            {state.message}
          </p>
        ) : null}
        <SubmitButton />
      </form>
      <p className="text-[11px] text-stone-600 text-center pt-1 tracking-tight">
        Single-user · Allowlisted email only
      </p>
    </div>
  );
}
