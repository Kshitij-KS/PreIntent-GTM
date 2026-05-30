import { NextRequest, NextResponse } from "next/server";
import { findDemoCompetitor } from "@/lib/demo-data";
import { scoreQuerySchema } from "@/lib/domain";

export async function GET(request: NextRequest) {
  const parsed = scoreQuerySchema.safeParse({
    name: request.nextUrl.searchParams.get("name"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Company name is required" },
      { status: 400 },
    );
  }

  const competitor = findDemoCompetitor(parsed.data.name);
  if (!competitor) {
    return NextResponse.json(
      { error: "Company not found in demo workspace" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    companyName: competitor.name,
    domain: competitor.domain,
    instabilityScore: competitor.scoreRun.score,
    severity: competitor.scoreRun.severity,
    explanation: competitor.scoreRun.explanation,
    events: competitor.scoreRun.contributions.map((contribution) => {
      const signal = competitor.signals.find(
        (item) => item.id === contribution.signalId,
      );
      return {
        id: contribution.signalId,
        type: contribution.type,
        title: contribution.title,
        description: signal?.description ?? contribution.title,
        date: contribution.eventTime,
        calculatedScore: contribution.finalScore,
        decayApplied: contribution.recencyDecay,
        confidence: signal?.confidence ?? 0,
        sourceUrl: signal?.source.url ?? "",
      };
    }),
  });
}
