import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAllCompetitors } from "@/lib/integrations/competitor-resolver";
import type { ResolvedCompetitor } from "@/lib/integrations/competitor-resolver";
import type { CompanyKnowledgeDoc } from "@/lib/company-knowledge";

const requestSchema = z.object({
  /** Supabase organization ID — when provided, reads + writes to Supabase */
  orgId: z.string().uuid().optional(),
  /**
   * Alternatively: inline competitors + context without a Supabase round-trip.
   * Used by the onboarding fire-and-forget path before the org is fully synced.
   */
  competitors: z.array(z.string()).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());

    let competitors: string[] = [];
    let context: CompanyKnowledgeDoc | null = null;
    let orgId: string | null = body.orgId ?? null;

    // ── Path A: resolve from Supabase org ──────────────────────────────────
    if (orgId) {
      const hasSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      if (!hasSupabase) {
        return NextResponse.json(
          { success: false, error: "Supabase service role key not configured." },
          { status: 503 },
        );
      }

      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();

      // Auth check — only the org owner can trigger resolution
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
      }

      // Verify user belongs to this org
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !membership) {
        return NextResponse.json({ success: false, error: "Access denied to organization." }, { status: 403 });
      }

      // Load org knowledge doc
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("company_knowledge, resolved_competitors")
        .eq("id", orgId)
        .single();

      if (orgError || !org) {
        return NextResponse.json({ success: false, error: "Organization not found." }, { status: 404 });
      }

      context = org.company_knowledge as CompanyKnowledgeDoc;
      competitors = context?.scanConfig?.competitors ?? [];

      // Return cached results if already fully resolved and not stale (< 7 days)
      if (Array.isArray(org.resolved_competitors) && org.resolved_competitors.length > 0) {
        const cached = org.resolved_competitors as ResolvedCompetitor[];
        const oldestResolution = cached.reduce((oldest, c) => {
          const t = new Date(c.resolvedAt).getTime();
          return t < oldest ? t : oldest;
        }, Date.now());
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - oldestResolution < sevenDaysMs) {
          return NextResponse.json({ success: true, resolved: cached, fromCache: true });
        }
      }

      // Mark as resolving
      await supabase
        .from("organizations")
        .update({ competitor_resolution_status: "resolving" })
        .eq("id", orgId);
    }

    // ── Path B: inline mode (fire-and-forget from onboarding) ─────────────
    else if (body.competitors && body.context) {
      competitors = body.competitors;
      context = body.context as unknown as CompanyKnowledgeDoc;
    } else {
      return NextResponse.json(
        { success: false, error: "Provide either orgId or competitors+context." },
        { status: 400 },
      );
    }

    if (!context) {
      return NextResponse.json(
        { success: false, error: "No company knowledge document found." },
        { status: 422 },
      );
    }

    if (competitors.length === 0) {
      return NextResponse.json({ success: true, resolved: [], message: "No competitors to resolve." });
    }

    // ── Run resolution agent ───────────────────────────────────────────────
    const resolved = await resolveAllCompetitors(competitors, context, process.env);

    // ── Persist to Supabase if we have an orgId ────────────────────────────
    if (orgId) {
      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();

      const allResolved = resolved.every(
        (r) => r.status === "resolved" || r.status === "mock",
      );

      await supabase
        .from("organizations")
        .update({
          resolved_competitors: resolved,
          competitor_resolution_status: allResolved ? "resolved" : "failed",
        })
        .eq("id", orgId);
    }

    return NextResponse.json({ success: true, resolved });
  } catch (err) {
    console.error("[/api/competitors/resolve] Error:", err);
    const message = err instanceof Error ? err.message : "Resolution failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
