import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MOCK_SESSION_COOKIE = "undertow_mock_session";
const ONBOARDING_DONE_COOKIE = "undertow_onboarding_done";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/sign-in"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if authenticated (mock mode: cookie present)
  const mockSession = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
  // Also support Supabase (check for supabase auth cookie prefix)
  const supabaseSession = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token") &&
        c.value,
    );

  const isAuthenticated = Boolean(mockSession || supabaseSession);
  const onboardingDone =
    request.cookies.get(ONBOARDING_DONE_COOKIE)?.value === "1";

  // Protect dashboard and onboarding routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated and onboarding not done, redirect to onboarding
  // (except if already on onboarding or auth routes)
  if (
    isAuthenticated &&
    !onboardingDone &&
    pathname.startsWith("/dashboard")
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Redirect signed-in users away from sign-in page
  if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
    if (onboardingDone) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes (handled server-side)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
