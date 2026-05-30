import { NextResponse } from "next/server";
import { z } from "zod";
import { computeConvergenceScore, computeUrgency } from "@/lib/convergence";

/**
 * Score API
 * Computes convergence score from three engine sub-scores.
 */

const scoreRequestSchema = z.object({
  voidScore: z.number().min(0).max(100),
  complianceScore: z.number().min(0).max(100),
  painScore: z.number().min(0).max(100),
  account: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = scoreRequestSchema.parse(await request.json());
    const convergenceScore = computeConvergenceScore(
      body.voidScore,
      body.complianceScore,
      body.painScore,
    );
    const maxSingle = Math.max(body.voidScore, body.complianceScore, body.painScore);
    const urgency = computeUrgency(convergenceScore, maxSingle);

    return NextResponse.json({
      convergenceScore,
      urgency,
      threshold: convergenceScore >= 85 ? "TRIGGERED" : convergenceScore >= 65 ? "WATCH" : "MONITOR",
      breakdown: {
        void: body.voidScore,
        compliance: body.complianceScore,
        pain: body.painScore,
        weighting: "33/33/33",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid score request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({
    description: "POST { voidScore, complianceScore, painScore } to compute convergence",
    thresholds: { alert: 85, watch: 65, monitor: 0 },
    weighting: "equal 33/33/34",
  });
}
