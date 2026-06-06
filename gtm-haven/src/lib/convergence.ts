/**
 * Convergence Engine  -  pure weighted scoring (MVP)
 * Default 33/33/33 as specified in the architecture doc.
 * AI/ML API will later provide the per-engine sub-scores in production.
 */

import type { AccountIntelligenceProfile, ThresholdAction } from "./domain";

export const DEFAULT_WEIGHTS = { void: 1 / 3, compliance: 1 / 3, pain: 1 / 3 } as const;

export function computeConvergenceScore(
  voidSub: number,
  complianceSub: number,
  painSub: number,
  weights = DEFAULT_WEIGHTS,
): number {
  const score = Math.round(
    weights.void * voidSub + weights.compliance * complianceSub + weights.pain * painSub,
  );
  return Math.max(0, Math.min(100, score));
}

export function computeUrgency(convergenceScore: number, maxSingleEngine: number): AccountIntelligenceProfile["urgency"] {
  if (convergenceScore >= 95 || maxSingleEngine === 100) return "CRITICAL";
  if (convergenceScore >= 85) return "HIGH";
  if (convergenceScore >= 65) return "MEDIUM";
  return "LOW";
}

const THRESHOLD_ACTIONS = [
  { threshold: 50, action: "Account added to watchlist, monitoring frequency doubled" },
  { threshold: 65, action: "Account flagged in CRM with signal summary attached" },
  { threshold: 75, action: "CRM lead created with full signal breakdown" },
  { threshold: 85, action: "Immediate Slack alert to assigned AE + pre-written outreach draft" },
  { threshold: 95, action: "High-priority alert with executive CC + act today recommendation" },
] as const;

export function evaluateThresholdActions({
  convergenceScore,
  maxSingleEngineScore,
  at = new Date().toISOString(),
}: {
  convergenceScore: number;
  maxSingleEngineScore: number;
  at?: string;
}): ThresholdAction[] {
  if (maxSingleEngineScore === 100 && convergenceScore < 50) {
    return [
      {
        threshold: 100,
        action: "Immediate trigger because one engine reached 100/100",
        at,
      },
    ];
  }

  const actions: ThresholdAction[] = THRESHOLD_ACTIONS
    .filter(({ threshold }) => convergenceScore >= threshold)
    .map(({ threshold, action }) => ({ threshold, action, at }));

  if (maxSingleEngineScore === 100) {
    actions.push({
      threshold: 100,
      action: "Immediate trigger because one engine reached 100/100",
      at,
    });
  }

  return actions;
}
