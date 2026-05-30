import { NextResponse } from "next/server";
import { generateCompanyKnowledgeDoc } from "@/lib/company-knowledge";
import type { CompanyOnboardingData } from "@/lib/company-knowledge";
import { z } from "zod";

const onboardingSchema = z.object({
  companyName: z.string().min(1),
  website: z.string().optional(),
  industry: z.string().min(1),
  teamSize: z.string().min(1),
  hq: z.string().min(1),
  icpDescription: z.string().min(1),
  targetVerticals: z.array(z.string()),
  topCompetitors: z.array(z.string()),
  mainPainPoints: z.string(),
  crm: z.string().default("None"),
  existingTools: z.array(z.string()).default([]),
  gtmGoals: z.string().min(1),
  revenueTarget: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = onboardingSchema.parse(await request.json());
    const doc = await generateCompanyKnowledgeDoc(body as CompanyOnboardingData);

    // Also mark onboarding done via server action
    try {
      const { markOnboardingComplete } = await import("@/lib/auth");
      await markOnboardingComplete();
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, doc });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid onboarding data";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
