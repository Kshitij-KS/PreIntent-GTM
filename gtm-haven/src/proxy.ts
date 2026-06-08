import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getActiveSessionAuthDestination } from "@/lib/auth-routing";
import { getUserSetupProfile } from "@/lib/user-profile";
import { jwtVerify } from "jose";

const MOCK_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "preintent_mock_secret_12345",
);

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Fallback if env vars are missing
    return await handleMissingEnvFallback(request);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do NOT use getSession in middleware. Always use getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthenticated = !!user;

  // Protect dashboard and onboarding routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const profile = user ? await getUserSetupProfile(supabase, user.id) : null;

  // Redirect signed-in users away from sign-in page
  if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(
      new URL(getActiveSessionAuthDestination(profile!), request.url),
    );
  }

  if (
    isAuthenticated &&
    profile?.setup_status === "complete" &&
    pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

// Fallback logic for when Supabase is not configured (mock mode)
async function handleMissingEnvFallback(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mockSession = request.cookies.get("preintent_mock_session")?.value;
  let isAuthenticated = false;

  if (mockSession) {
    try {
      await jwtVerify(mockSession, MOCK_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const onboardingDone =
    request.cookies.get("preintent_onboarding_done")?.value === "1";

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
    if (onboardingDone) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  if (isAuthenticated && onboardingDone && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

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
