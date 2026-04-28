import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = createClient(cookies());
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${encodeURIComponent(error.message)}`
    );
  }

  // Defensive: confirm the just-authenticated email matches the allowlist.
  const allowed = process.env.APP_AUTHORIZED_EMAIL?.trim().toLowerCase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (allowed && user.email?.toLowerCase() !== allowed)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=not_allowed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
