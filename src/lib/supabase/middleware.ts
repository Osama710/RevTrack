import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Refreshes the auth cookie and gates every route except login, signup, the auth callback and the cron endpoint. */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // The cron endpoint has no user session. It authenticates itself with CRON_SECRET.
  if (path.startsWith("/api/cron")) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list: CookieToSet[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Validates the token with Supabase Auth (getSession would only read the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = path === "/login" || path === "/signup";
  const isPublic = isAuthPage || path.startsWith("/auth");

  if (!user && !isPublic) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
