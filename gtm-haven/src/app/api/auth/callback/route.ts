import { NextResponse } from "next/server";
import {
  getPostAuthDestination,
  type AuthIntent,
} from "@/lib/auth-routing";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  ensureUserSetupProfile,
  markFirstOnboardingRoute,
} from "@/lib/user-profile";

function getAuthIntent(value: string | null): AuthIntent {
  return value === "signin" || value === "signup" ? value : "auto";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const intent = getAuthIntent(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=auth", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) throw error ?? new Error("Authentication failed");

    const profile = await ensureUserSetupProfile(supabase, data.user.id);
    const destination = getPostAuthDestination({ intent, profile });

    if (destination === "/onboarding") {
      await markFirstOnboardingRoute(supabase, data.user.id);
    }

    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  } catch (error) {
    console.error("Supabase auth callback error:", error);
    return NextResponse.redirect(new URL("/sign-in?error=auth", request.url));
  }
}
