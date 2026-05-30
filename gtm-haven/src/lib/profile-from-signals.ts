import type { AccountIntelligenceProfile, EngineSignal, EngineType } from "./domain";
import { computeConvergenceScore, computeUrgency } from "./convergence";

export interface SweepAccountInput {
  account: string;
  industry: string;
  employees: number | string;
  crmStage?: string;
}

export function buildProfileFromSignals(
  input: SweepAccountInput,
  signals: EngineSignal[],
): AccountIntelligenceProfile {
  const byEngine: Record<EngineType, EngineSignal[]> = {
    void: [],
    compliance: [],
    pain: [],
  };

  for (const signal of signals) {
    byEngine[signal.engine].push(signal);
  }

  const maxSub = (engine: EngineType) =>
    byEngine[engine].reduce((max, signal) => Math.max(max, signal.subScore), 0);

  const voidSub = maxSub("void");
  const complianceSub = maxSub("compliance");
  const painSub = maxSub("pain");
  const convergenceScore = computeConvergenceScore(voidSub, complianceSub, painSub);
  const maxSingle = Math.max(voidSub, complianceSub, painSub);

  const profile: AccountIntelligenceProfile = {
    account: input.account,
    industry: input.industry,
    employees: input.employees,
    crmStage: input.crmStage || "Not in pipeline",
    lastUpdated: new Date().toISOString(),
    void: { signals: byEngine.void.slice(-5), subScore: voidSub },
    compliance: { signals: byEngine.compliance.slice(-5), subScore: complianceSub },
    pain: { signals: byEngine.pain.slice(-5), subScore: painSub },
    convergenceScore,
    urgency: computeUrgency(convergenceScore, maxSingle),
  };

  if (convergenceScore >= 85) {
    profile.thresholdCrossedAt = new Date().toISOString();
  }

  return profile;
}
