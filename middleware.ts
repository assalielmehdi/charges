import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/error"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const { supabaseResponse, user } = await updateSession(req);

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return supabaseResponse;
  }

  if (user) {
    return supabaseResponse;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") {
    url.searchParams.set("next", pathname + search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)).*)",
  ],
};
