import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAllCompetitors } from "@/lib/integrations/competitor-resolver";
import type { ResolvedCompetitor } from "@/lib/integrations/competitor-resolver";
import type { CompanyKnowledgeDoc } from "@/lib/company-knowledge";
import { withGuards } from "@/lib/security/with-guards";
import { requireSession, requireOrgMembership } from "@/lib/security/auth-guard";
import { authErrorResponse } from "@/lib/security/error-responder";

const requestSchema = z.object({
  /** Supabase organization ID  -  when provided, reads + writes to Supabase */
  orgId: z.string().uuid().optional(),
  /**
   * Alternatively: inline competitors + context without a Supabase round-trip.
   * Used by the onboarding fire-and-forget path before the org is fully synced.
   */
  competitors: z.array(z.string()).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

type ResolveBody = z.infer<typeof requestSchema>;

/**
 * POST /api/competitors/resolve  -  Mutating_Endpoint.
 * Guards (via withGuards): payload-size, rate-limit, body validation, error
 * sanitization, audit. Auth is conditional on path:
 *  - org-scoped path → requireOrgMembership (Req 2.3, 2.4)
 *  - inline path → requireSession (Req 2.7)
 */
export const POST = withGuards<ResolveBody>(
  {
    endpointId: "competitors-resolve",
    rateLimit: true,
    auth: { kind: "none" },
    bodySchema: requestSchema,
    mutating: true,
  },
  async ({ body, correlationId }) => {
    let competitors: string[] = [];
    let context: CompanyKnowledgeDoc | null = null;
    const orgId: string | null = body.orgId ?? null;

    // ── Path A: resolve from Supabase org ──────────────────────────────────
    if (orgId) {
      const auth = await requireOrgMembership(orgId);
      if (!auth.ok) return authErrorResponse(auth.status, correlationId);

      const hasSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      if (!hasSupabase) {
        return NextResponse.json(
          { success: false, error: "Supabase service role key not configured." },
          { status: 503 },
        );
      }

      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();

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

      await supabase
        .from("organizations")
        .update({ competitor_resolution_status: "resolving" })
        .eq("id", orgId);
    }

    // ── Path B: inline mode (fire-and-forget from onboarding) ─────────────
    else if (body.competitors && body.context) {
      const auth = await requireSession();
      if (!auth.ok) return authErrorResponse(auth.status, correlationId);
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
  },
);
