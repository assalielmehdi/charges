import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// PLAN.md: never call Anthropic without confirming the request comes from a
// real, allowlisted user. Middleware already redirects anonymous traffic, but
// API routes need their own gate since the matcher doesn't run for them.
export async function requireAuthorizedUser(): Promise<
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; status: number; message: string }
> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, message: "Not authenticated." };
  }

  const allowed = process.env.APP_AUTHORIZED_EMAIL?.trim().toLowerCase();
  if (!allowed) {
    return {
      ok: false,
      status: 500,
      message: "Server misconfigured: APP_AUTHORIZED_EMAIL not set.",
    };
  }

  if (user.email?.toLowerCase() !== allowed) {
    return { ok: false, status: 403, message: "Not authorized." };
  }

  return { ok: true, user, supabase };
}
