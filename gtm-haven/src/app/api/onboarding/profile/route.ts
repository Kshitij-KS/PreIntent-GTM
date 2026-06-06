import { NextResponse } from "next/server";
import { withGuards } from "@/lib/security/with-guards";
import { onboardingDataSchema, type OnboardingData } from "@/lib/security/schemas";
import { generateCompanyKnowledgeDoc } from "@/lib/company-knowledge";
import { markOnboardingComplete } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { logger } from "@/lib/security/logger";

/**
 * POST /api/onboarding/profile
 *
 * Generates the Company Knowledge Document from the onboarding wizard payload,
 * persists it to Supabase (when configured), marks onboarding as complete so the
 * user is never re-routed to onboarding on subsequent logins, and returns the doc.
 */
export const POST = withGuards<OnboardingData>(
  {
    endpointId: "onboarding-profile",
    rateLimit: true,
    auth: { kind: "session" },
    bodySchema: onboardingDataSchema,
    mutating: true,
  },
  async ({ body, correlationId, caller }) => {
    // 1. Generate the knowledge doc from the onboarding form data
    const doc = await generateCompanyKnowledgeDoc(body);

    // 2. Persist to Supabase so the doc survives across sessions/devices
    if (isSupabaseConfigured()) {
      try {
        const { createSupabaseServerClient } = await import("@/lib/supabase");
        const supabase = await createSupabaseServerClient();

        // Find or create the user's organization
        const userId = caller?.userId;
        if (userId) {
          const { data: orgMember } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (orgMember?.organization_id) {
            // Update existing org with the knowledge doc.
            // Also ensure owner_user_id is set (for legacy orgs created before this fix).
            await supabase
              .from("organizations")
              .update({ company_knowledge: doc, owner_user_id: userId })
              .eq("id", orgMember.organization_id);
          } else {
            // Create org + membership for first-time onboarding.
            // Must set owner_user_id = userId so RLS INSERT policy passes.
            const { data: newOrg } = await supabase
              .from("organizations")
              .insert({
                name: doc.companyName,
                company_knowledge: doc,
                owner_user_id: userId,
              })
              .select("id")
              .single();

            if (newOrg) {
              await supabase.from("organization_members").insert({
                organization_id: newOrg.id,
                user_id: userId,
                role: "owner",
              });
            }
          }
        }
      } catch (err) {
        // Non-fatal: the doc is still returned to the client for localStorage caching
        logger.warn("onboarding-profile", correlationId, "failed to persist knowledge doc to Supabase", {
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    // 3. Mark onboarding as complete (sets cookie + Supabase user_profiles.setup_status)
    try {
      await markOnboardingComplete();
    } catch (err) {
      logger.warn("onboarding-profile", correlationId, "failed to mark onboarding complete", {
        error: err instanceof Error ? err.message : "unknown",
      });
    }

    // 4. Return the doc so the frontend can cache it in localStorage immediately
    return NextResponse.json({ success: true, doc });
  },
);
