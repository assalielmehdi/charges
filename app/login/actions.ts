"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type LoginState = { ok: boolean; message: string | null };

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const allowed = process.env.APP_AUTHORIZED_EMAIL?.trim().toLowerCase();

  if (!allowed) {
    return { ok: false, message: "Server misconfigured: APP_AUTHORIZED_EMAIL not set." };
  }
  if (!email) {
    return { ok: false, message: "Enter your email." };
  }
  if (!password) {
    return { ok: false, message: "Enter your password." };
  }

  // Single-user app: refuse anything not on the allowlist before contacting Supabase.
  if (email !== allowed) {
    return { ok: false, message: "Invalid email or password." };
  }

  const supabase = createClient(cookies());
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: "Invalid email or password." };
  }
  return { ok: true, message: null };
}

export async function logout(): Promise<void> {
  const supabase = createClient(cookies());
  await supabase.auth.signOut();
  redirect("/login");
}
