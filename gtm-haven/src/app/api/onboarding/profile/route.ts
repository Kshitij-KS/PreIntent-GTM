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

      const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
      if (hasSupabase) {
        const { createSupabaseServerClient } = await import("@/lib/supabase");
        const supabase = await createSupabaseServerClient();
        
        // Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user has an org, if not create one, then save company knowledge
          const { data: orgMember } = await supabase.from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();
            
          let orgId = orgMember?.organization_id;
          
          if (!orgId) {
            const { data: newOrg } = await supabase.from('organizations')
              .insert({
                name: body.companyName,
                slug: body.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
                company_knowledge: doc
              })
              .select('id')
              .single();
              
            if (newOrg) {
              orgId = newOrg.id;
              await supabase.from('organization_members').insert({
                organization_id: orgId,
                user_id: user.id,
                role: 'owner'
              });
            }
          } else {
            await supabase.from('organizations')
              .update({ company_knowledge: doc })
              .eq('id', orgId);
          }
        }
      }
    } catch (e) {
      console.error("Error saving to supabase:", e);
      // non-fatal
    }

    return NextResponse.json({ success: true, doc });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid onboarding data";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
