import { NextResponse } from "next/server";
import { withGuards } from "@/lib/security/with-guards";
import { onboardingDataSchema, type OnboardingData } from "@/lib/security/schemas";
import { requireSession } from "@/lib/security/auth-guard";
import { authErrorResponse } from "@/lib/security/error-responder";
import { isSupabaseConfigured } from "@/lib/supabase";
import { generateCompanyKnowledgeDoc } from "@/lib/company-knowledge";

/**
 * POST /api/onboarding/profile — generates the Company Knowledge Document from
 * the onboarding wizard payload.
 *
 * Guards (via withGuards): payload-size (413), rate-limit (429), input
 * validation against `onboardingDataSchema` (400), sanitized errors, and an
 * audit event on completion.
 *
 * Auth: onboarding is already gated behind an authenticated session by the
 * proxy. When Supabase is configured (real mode) a valid session is required
 * (401 otherwise). When Supabase is not configured the mock-first, zero-cost
 * default is preserved and the request proceeds without a Supabase session.
 */
export const POST = withGuards<OnboardingData>(
  {
    endpointId: "onboarding-profile",
    rateLimit: true,
    auth: { kind: "none" },
    bodySchema: onboardingDataSchema,
    mutating: true,
  },
  async ({ body, correlationId }) => {
    if (isSupabaseConfigured()) {
      const auth = await requireSession();
      if (!auth.ok) return authErrorResponse(auth.status, correlationId);
    }

    const doc = await generateCompanyKnowledgeDoc(body);
    return NextResponse.json({ success: true, doc });
  },
);
