import { NextResponse } from "next/server";
import { runLiveSweep, type LiveSweepResult } from "@/app/actions";
import { withGuards } from "@/lib/security/with-guards";
import {
  onboardingProfileBodySchema,
  type OnboardingProfileBody,
} from "@/lib/security/schemas";
import { logger } from "@/lib/security/logger";

/**
 * POST /api/onboarding/profile — Mutating_Endpoint.
 *
 * Rewritten for security + type-safety:
 *  - Auth (org membership for `orgId`), input validation (`orgId` +
 *    `seedAccounts`), and rate-limiting all run (via withGuards) BEFORE any
 *    service-role client is constructed (Req 2.5, 2.6, 6.5).
 *  - Calls the real `runLiveSweep(input: LiveSweepInput)` and consumes
 *    `LiveSweepResult` (`.success` / `.profile` / `.signals` / `.brief`) — no
 *    non-existent modules or `.data` shape, and no `any` typing (Req 9.3–9.5).
 */
interface SweepOutcome {
  account: string;
  convergenceScore: number;
  urgency: string;
}

interface SweepError {
  account: string;
  error: string;
}

export const POST = withGuards<OnboardingProfileBody>(
  {
    endpointId: "onboarding-profile",
    rateLimit: true,
    auth: { kind: "org", orgIdFrom: (body) => (body as { orgId?: unknown } | undefined)?.orgId },
    bodySchema: onboardingProfileBodySchema,
    mutating: true,
  },
  async ({ body, correlationId }) => {
    const { orgId, seedAccounts } = body;

    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = hasSupabase
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.SUPABASE_SERVICE_ROLE_KEY as string,
        )
      : null;

    const results: SweepOutcome[] = [];
    const errors: SweepError[] = [];

    // Run sweeps sequentially to avoid external rate limits.
    for (const account of seedAccounts) {
      try {
        const result: LiveSweepResult = await runLiveSweep({
          account: account.name,
          industry: "Unknown",
          employees: "unknown",
          competitor: "Unknown",
          competitorPricingUrl: account.website,
        });

        if (result.success) {
          results.push({
            account: account.name,
            convergenceScore: result.profile.convergenceScore,
            urgency: result.profile.urgency,
          });

          if (supabase) {
            await supabase.from("account_profiles").insert({
              org_id: orgId,
              account_name: account.name,
              website: account.website ?? null,
              convergence_score: result.profile.convergenceScore,
              urgency_level: result.profile.urgency,
              last_scanned: new Date().toISOString(),
              raw_data: result.profile,
            });

            if (result.signals.length > 0) {
              await supabase.from("engine_signals").insert(
                result.signals.map((signal) => ({
                  org_id: orgId,
                  account_name: account.name,
                  signal_type: signal.engine,
                  confidence: signal.confidence,
                  description: signal.description,
                  source_url: signal.provenance.url ?? null,
                  detected_at: new Date().toISOString(),
                })),
              );
            }

            await supabase.from("convergence_runs").insert({
              org_id: orgId,
              account_name: account.name,
              overall_score: result.profile.convergenceScore,
              pain_score: result.profile.pain.subScore,
              void_score: result.profile.void.subScore,
              compliance_score: result.profile.compliance.subScore,
              run_date: new Date().toISOString(),
            });

            if (result.brief) {
              await supabase.from("intel_briefs").insert({
                org_id: orgId,
                account_name: account.name,
                title: `Initial Intelligence Brief - ${account.name}`,
                content: result.brief,
                generated_at: new Date().toISOString(),
              });
            }
          }
        } else {
          errors.push({ account: account.name, error: result.error ?? "Sweep failed" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sweep failed";
        logger.error("onboarding-profile", correlationId, "account sweep failed", {
          account: account.name,
        });
        errors.push({ account: account.name, error: message });
      }
    }

    if (supabase) {
      await supabase
        .from("organizations")
        .update({ status: "resolved" })
        .eq("id", orgId);
    }

    return NextResponse.json({
      success: true,
      message: `Initial sweep completed for ${seedAccounts.length} accounts`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
