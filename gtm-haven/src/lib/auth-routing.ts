export type AuthIntent = "signin" | "signup" | "auto";
export type SetupStatus = "incomplete" | "complete";

export interface UserSetupProfile {
  setup_status: SetupStatus;
  first_onboarding_routed_at?: string | null;
}

export function getPostAuthDestination({
  intent,
  profile,
}: {
  intent: AuthIntent;
  profile: UserSetupProfile;
}) {
  if (intent === "signin") return "/dashboard";
  if (intent === "signup") return "/onboarding";
  if (profile.setup_status === "complete") return "/dashboard";

  return profile.first_onboarding_routed_at ? "/dashboard" : "/onboarding";
}

export function getActiveSessionAuthDestination(profile: UserSetupProfile) {
  return profile.setup_status === "complete" ? "/dashboard" : "/onboarding";
}
