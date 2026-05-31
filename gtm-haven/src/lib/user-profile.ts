import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSetupProfile } from "@/lib/auth-routing";

const DEFAULT_PROFILE: UserSetupProfile = {
  setup_status: "incomplete",
  first_onboarding_routed_at: null,
};

export async function getUserSetupProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSetupProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("setup_status, first_onboarding_routed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_PROFILE;

  return {
    setup_status: data.setup_status === "complete" ? "complete" : "incomplete",
    first_onboarding_routed_at: data.first_onboarding_routed_at,
  };
}

export async function ensureUserSetupProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSetupProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true })
    .select("setup_status, first_onboarding_routed_at")
    .maybeSingle();

  if (error) throw error;
  if (data) {
    return {
      setup_status: data.setup_status === "complete" ? "complete" : "incomplete",
      first_onboarding_routed_at: data.first_onboarding_routed_at,
    };
  }

  return getUserSetupProfile(supabase, userId);
}

export async function markFirstOnboardingRoute(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error } = await supabase
    .from("user_profiles")
    .update({ first_onboarding_routed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("first_onboarding_routed_at", null);

  if (error) throw error;
}
