import { NextResponse } from "next/server";

/**
 * Supabase Auth Callback Route
 * Handles email confirmation and OAuth redirects from Supabase.
 * Falls back gracefully when Supabase is not configured.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";

  if (code) {
    try {
      const { createSupabaseServerClient, isSupabaseConfigured } = await import(
        "@/lib/supabase"
      );

      if (isSupabaseConfigured()) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.exchangeCodeForSession(code);
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
