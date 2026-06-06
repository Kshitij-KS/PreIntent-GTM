import { NextResponse } from "next/server";
import { withGuards } from "@/lib/security/with-guards";
import { onboardingDataSchema, type OnboardingData } from "@/lib/security/schemas";
import { generateCompanyKnowledgeDoc } from "@/lib/company-knowledge";

/**
 * POST /api/onboarding/profile  -  generates the Company Knowledge Document from
 * the onboarding wizard payload.
 *
 * Guards (via withGuards): payload-size (413), auth (401  -  mock or Supabase
 * session), rate-limit (429), input validation against `onboardingDataSchema`
 * (400), sanitized errors, and an audit event on completion.
 */
export const POST = withGuards<OnboardingData>(
  {
    endpointId: "onboarding-profile",
    rateLimit: true,
    auth: { kind: "session" },
    bodySchema: onboardingDataSchema,
    mutating: true,
  },
  async ({ body }) => {
    const doc = await generateCompanyKnowledgeDoc(body);
    return NextResponse.json({ success: true, doc });
  },
);
