import type { AccountIntelligenceProfile, IntelBrief } from "../domain";
import { evaluateThresholdActions } from "../convergence";
import { sendSlackAlert } from "./slack";
import { type EnvMap, isRealMode, normalizeMode } from "./env";

export interface ThresholdDeliveryResult {
  fired: boolean;
  slack: Awaited<ReturnType<typeof sendSlackAlert>>;
  triggerware: { sent: boolean; detail: string };
  hubspot: { sent: boolean; detail: string };
  actions: ReturnType<typeof evaluateThresholdActions>;
}

export async function executeThresholdDelivery(
  profile: AccountIntelligenceProfile,
  brief?: IntelBrief,
  env: EnvMap = process.env,
): Promise<ThresholdDeliveryResult> {
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
  const fired = profile.convergenceScore >= 85;

  if (!fired) {
    return {
      fired: false,
      slack: { sent: false, mode: "mock", detail: "Threshold not crossed." },
      triggerware: { sent: false, detail: "Threshold not crossed." },
      hubspot: { sent: false, detail: "Threshold not crossed." },
      actions,
    };
  }

  const opener = brief?.suggestedOpeningLine
    ? `\nSuggested opener: ${brief.suggestedOpeningLine}`
    : "";

  const slackText = [
    `🌊 *PreIntent Alert*  -  ${profile.account}`,
    `Convergence: *${profile.convergenceScore}/100* · Urgency: *${profile.urgency}*`,
    `Void ${profile.void.subScore} · Compliance ${profile.compliance.subScore} · Pain ${profile.pain.subScore}`,
    opener,
  ]
    .filter(Boolean)
    .join("\n");

  const slack = await sendSlackAlert(slackText, env);

  const triggerware = await postWebhook(
    env.TRIGGERWARE_WEBHOOK_URL,
    isRealMode(env, "TRIGGERWARE_MODE", ["TRIGGERWARE_WEBHOOK_URL", "TRIGGERWARE_API_KEY"]),
    {
      event: "preintent.threshold_crossed",
      account: profile.account,
      convergenceScore: profile.convergenceScore,
      urgency: profile.urgency,
      profile,
      briefId: brief?.id,
    },
    "TriggerWare",
  );

  const hubspot = await postWebhook(
    env.HUBSPOT_WEBHOOK_URL,
    isRealMode(env, "HUBSPOT_MODE", ["HUBSPOT_WEBHOOK_URL", "HUBSPOT_API_KEY"]),
    {
      event: "preintent.crm_lead",
      companyName: profile.account,
      stage: profile.crmStage,
      convergenceScore: profile.convergenceScore,
      urgency: profile.urgency,
    },
    "HubSpot",
  );

  return { fired, slack, triggerware, hubspot, actions };
}

async function postWebhook(
  url: string | undefined,
  enabled: boolean,
  payload: Record<string, unknown>,
  label: string,
): Promise<{ sent: boolean; detail: string }> {
  if (!enabled || !url?.trim()) {
    return {
      sent: false,
      detail: `${label} preview only (set ${label.toUpperCase()}_MODE=real + webhook URL).`,
    };
  }

  try {
    const res = await fetch(url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { sent: false, detail: `${label} webhook returned ${res.status}` };
    }
    return { sent: true, detail: `${label} webhook delivered.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, detail: `${label} failed: ${message}` };
  }
}

export function getSlackMode(env: EnvMap = process.env) {
  return normalizeMode(env.SLACK_MODE);
}
