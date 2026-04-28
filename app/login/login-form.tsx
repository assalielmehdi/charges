"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowUpRight, Mail } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { ok: false, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} className="w-full">
      {pending ? "Sending…" : "Send magic link"}
      {!pending && <ArrowUpRight className="w-4 h-4" />}
    </PrimaryButton>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(sendMagicLink, initialState);
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-4 mt-12">
      {state.ok ? (
        <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-4 h-4 text-stone-300" />
            <div className="text-stone-100 text-[14px] tracking-tight">
              Check your inbox
            </div>
          </div>
          <div className="text-stone-500 text-[13px] leading-relaxed">
            {email ? (
              <>
                We sent a link to{" "}
                <span className="text-stone-300">{email}</span>. It expires
                shortly.
              </>
            ) : (
              <>
                If that email is allowed, a magic link is on its way. It
                expires shortly.
              </>
            )}
          </div>
        </div>
      ) : (
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
          {state.message && !state.ok ? (
            <p className="text-[13px] text-rose-300/80 tracking-tight">
              {state.message}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      )}
      <p className="text-[11px] text-stone-600 text-center pt-1 tracking-tight">
        Single-user · Allowlisted email only
      </p>
    </div>
  );
}
