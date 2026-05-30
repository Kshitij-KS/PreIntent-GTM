/**
 * GTM Haven Auth Helpers
 *
 * Supports two modes:
 *  1. MOCK mode  — works with zero config; stores session in a cookie
 *  2. REAL mode  — Supabase (when NEXT_PUBLIC_SUPABASE_URL is configured)
 *
 * Server-side helpers use Next.js cookies(); client-side helpers use document.cookie.
 */

"use server";

import { cookies } from "next/headers";

const MOCK_SESSION_COOKIE = "undertow_mock_session";
const ONBOARDING_DONE_COOKIE = "undertow_onboarding_done";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  createdAt: string;
}

export interface SessionResult {
  user: MockUser | null;
  onboardingComplete: boolean;
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** Server-side: get the current session */
export async function getSession(): Promise<SessionResult> {
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    // Real Supabase path — delegate to supabase.ts
    try {
      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { user: null, onboardingComplete: false };

      const onboardingDone =
        cookieStore.get(ONBOARDING_DONE_COOKIE)?.value === "1";
      return {
        user: {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name ?? user.email ?? "User",
          company: user.user_metadata?.company,
          createdAt: user.created_at,
        },
        onboardingComplete: onboardingDone,
      };
    } catch {
      return { user: null, onboardingComplete: false };
    }
  }

  // Mock mode
  const raw = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return { user: null, onboardingComplete: false };

  try {
    const user = JSON.parse(raw) as MockUser;
    const onboardingDone =
      cookieStore.get(ONBOARDING_DONE_COOKIE)?.value === "1";
    return { user, onboardingComplete: onboardingDone };
  } catch {
    return { user: null, onboardingComplete: false };
  }
}

/** Server-side: sign in with email/password (mock) */
export async function mockSignIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: MockUser }> {
  // Mock: any valid-looking email + password >= 6 chars works
  if (!email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters.",
    };
  }

  const user: MockUser = {
    id: `mock-${email.split("@")[0]}-${Date.now()}`,
    email,
    name: email.split("@")[0].replace(/[._-]/g, " "),
    createdAt: new Date().toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });

  return { success: true, user };
}

/** Server-side: sign out */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
  cookieStore.delete(ONBOARDING_DONE_COOKIE);

  if (isSupabaseConfigured()) {
    try {
      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out from Supabase", e);
    }
  }
}

/** Server-side: mark onboarding as complete */
export async function markOnboardingComplete(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_DONE_COOKIE, "1", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
