import { NextResponse } from "next/server";
import { generateCompanyKnowledgeDoc } from "@/lib/company-knowledge";
import type { CompanyKnowledgeDoc, CompanyOnboardingData } from "@/lib/company-knowledge";
import { completeCompanyOnboarding } from "@/lib/onboarding-completion";
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
    const data = body as CompanyOnboardingData;
    const doc = await completeCompanyOnboarding(data, {
      generateKnowledgeDoc: generateCompanyKnowledgeDoc,
      persistKnowledgeDoc: persistCompanyKnowledge,
      markComplete: async () => {
        const { markOnboardingComplete } = await import("@/lib/auth");
        await markOnboardingComplete();
      },
    });

    return NextResponse.json({ success: true, doc });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid onboarding data";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

async function persistCompanyKnowledge(
  body: CompanyOnboardingData,
  doc: CompanyKnowledgeDoc,
) {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!hasSupabase) return;

  const { createSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("Authentication required");
  }

  const { data: orgMember, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) throw memberError;

  let orgId = orgMember?.organization_id;
  if (!orgId) {
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({
        name: body.companyName,
        slug: `${body.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        owner_user_id: user.id,
        company_knowledge: doc,
      })
      .select("id")
      .single();

    if (organizationError) throw organizationError;
    orgId = organization.id;

    const { error: membershipError } = await supabase
      .from("organization_members")
      .insert({ organization_id: orgId, user_id: user.id, role: "owner" });

    if (membershipError) throw membershipError;
  } else {
    const { error: organizationError } = await supabase
      .from("organizations")
      .update({ company_knowledge: doc })
      .eq("id", orgId);

    if (organizationError) throw organizationError;
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ knowledge_organization_id: orgId })
    .eq("user_id", user.id)
    .select("user_id")
    .single();

  if (profileError) throw profileError;
}
