export async function handleSignOutClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    document.cookie = "preintent_mock_session=; path=/; max-age=0";
    document.cookie = "preintent_onboarding_done=; path=/; max-age=0";
    localStorage.removeItem("preintent_accounts");
    localStorage.removeItem("preintent_company_kdoc");
  } catch { /* best-effort */ }
  window.location.href = "/sign-in";
}
