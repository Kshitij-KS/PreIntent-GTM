import type {
  ScoreContribution,
  ScoreRun,
  Severity,
  Signal,
  SignalType,
} from "./domain";

const CATEGORY_CAPS: Record<SignalType, number> = {
  m_and_a: 36,
  executive_change: 32,
  negative_sentiment: 30,
  positive_milestone: 0,
  negative_space: 30,
  job_posting: 18,
  community_pain: 28,
  regulatory: 24,
};

const CATEGORY_WEIGHTS: Record<SignalType, number> = {
  m_and_a: 1.05,
  executive_change: 1.1,
  negative_sentiment: 1,
  positive_milestone: 0,
  negative_space: 1.15,
  job_posting: 0.75,
  community_pain: 1,
  regulatory: 0.85,
};

function daysBetween(asOf: Date, eventTime: Date) {
  const diff = asOf.getTime() - eventTime.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getSeverity(score: number): Severity {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 22) return "medium";
  return "low";
}

export function scoreSignals(
  competitorId: string,
  signals: Signal[],
  asOf = new Date(),
): ScoreRun {
  const cappedTotals = new Map<SignalType, number>();

  const contributions: ScoreContribution[] = signals
    .filter((signal) => signal.competitorId === competitorId)
    .map((signal) => {
      const ageInDays = daysBetween(asOf, new Date(signal.eventTime));
      const recencyDecay = Math.floor(ageInDays / 3);
      const recencyAdjusted = Math.max(0, signal.impactScore - recencyDecay);
      const confidenceAdjusted = recencyAdjusted * signal.confidence;
      const sourceQualityAdjusted =
        confidenceAdjusted * signal.source.sourceQuality;
      const weighted = sourceQualityAdjusted * CATEGORY_WEIGHTS[signal.type];
      const finalScore = Math.round(weighted);

      return {
        signalId: signal.id,
        type: signal.type,
        title: signal.title,
        rawImpact: signal.impactScore,
        recencyDecay,
        confidenceAdjusted: Math.round(confidenceAdjusted),
        sourceQualityAdjusted: Math.round(sourceQualityAdjusted),
        finalScore,
        eventTime: signal.eventTime,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );

  for (const contribution of contributions) {
    const current = cappedTotals.get(contribution.type) ?? 0;
    cappedTotals.set(
      contribution.type,
      Math.min(
        CATEGORY_CAPS[contribution.type],
        current + contribution.finalScore,
      ),
    );
  }

  const score = Math.min(
    100,
    Array.from(cappedTotals.values()).reduce(
      (total, value) => total + value,
      0,
    ),
  );
  const severity = getSeverity(score);
  const topDrivers = contributions
    .filter((contribution) => contribution.finalScore > 0)
    .slice(0, 3)
    .map((contribution) => contribution.title);

  return {
    id: `score_${competitorId}_${asOf.toISOString().slice(0, 10)}`,
    competitorId,
    score,
    severity,
    asOf: asOf.toISOString(),
    explanation:
      topDrivers.length > 0
        ? `Score is driven by ${topDrivers.join(", ")} with recency, confidence, and source-quality adjustments.`
        : "No material risk signals are active after recency, confidence, and source-quality adjustments.",
    contributions,
  };
}
