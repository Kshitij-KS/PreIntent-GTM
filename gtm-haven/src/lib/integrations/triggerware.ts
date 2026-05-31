import type { AccountIntelligenceProfile, ProviderMode, ThresholdAction } from "../domain";
import { evaluateThresholdActions } from "../convergence";

type EnvMap = Record<string, string | undefined>;

export interface TriggerWareWorkflowPreview {
  fired: boolean;
  mode: ProviderMode;
  actions: ThresholdAction[];
  steps: Array<{
    id: "threshold" | "crm" | "slack" | "brief";
    label: string;
    detail: string;
  }>;
  payloads: {
    crm?: {
      companyName: string;
      stage: string;
      convergenceScore: number;
      urgency: AccountIntelligenceProfile["urgency"];
    };
    slack?: {
      channel: string;
      text: string;
    };
    brief?: {
      account: string;
      requested: boolean;
    };
  };
}

function normalizeMode(value: string | undefined): ProviderMode {
  if (value === "real" || value === "disabled") return value;
  return "mock";
}

export function previewTriggerWareWorkflow(
  profile: AccountIntelligenceProfile,
  env: EnvMap = process.env,
): TriggerWareWorkflowPreview {
  const mode = normalizeMode(env.TRIGGERWARE_MODE);
  const maxSingleEngineScore = Math.max(
    profile.void.subScore,
    profile.compliance.subScore,
    profile.pain.subScore,
  );
  const actions = evaluateThresholdActions({
    convergenceScore: profile.convergenceScore,
    maxSingleEngineScore,
    at: profile.thresholdCrossedAt || new Date().toISOString(),
  });
  const fired = actions.some((action) => action.threshold >= 85);

  if (!fired || mode === "disabled") {
    return { fired: false, mode, actions, steps: [], payloads: {} };
  }

  return {
    fired: true,
    mode,
    actions,
    steps: [
      { id: "threshold", label: "Score ≥ 85", detail: "threshold crossed" },
      { id: "crm", label: "CRM Lead", detail: "created in HubSpot" },
      { id: "slack", label: "AE Alert", detail: "Slack + email" },
      { id: "brief", label: "Intel Brief", detail: "auto-generated" },
    ],
    payloads: {
      crm: {
        companyName: profile.account,
        stage: profile.crmStage,
        convergenceScore: profile.convergenceScore,
        urgency: profile.urgency,
      },
      slack: {
        channel: "#sales-alerts",
        text: `Preintent: ${profile.account} hit ${profile.convergenceScore}/100 convergence. ${profile.urgency} urgency.`,
      },
      brief: {
        account: profile.account,
        requested: true,
      },
    },
  };
}
