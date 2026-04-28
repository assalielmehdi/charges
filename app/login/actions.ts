"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type LoginState = { ok: boolean; message: string | null };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/");
  const allowed = process.env.APP_AUTHORIZED_EMAIL?.trim().toLowerCase();

  if (!allowed) {
    return { ok: false, message: "Server misconfigured: APP_AUTHORIZED_EMAIL not set." };
  }
  if (!email) {
    return { ok: false, message: "Enter your email." };
  }

  // Single-user app: refuse anything not on the allowlist before contacting Supabase.
  if (email !== allowed) {
    return {
      ok: true,
      message: "If that email is allowed, a magic link is on its way.",
    };
  }

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const base = `${proto}://${host}`;
  const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(
    next.startsWith("/") ? next : "/"
  )}`;

  const supabase = createClient(cookies());
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { ok: false, message: `Auth error: ${error.message}` };
  }
  return {
    ok: true,
    message: "Magic link sent. Check your inbox.",
  };
}

export async function logout(): Promise<void> {
  const supabase = createClient(cookies());
  await supabase.auth.signOut();
  redirect("/login");
}
