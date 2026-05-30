import { type EnvMap, isRealMode, normalizeMode } from "./env";

export interface SlackDeliveryResult {
  sent: boolean;
  mode: ReturnType<typeof normalizeMode>;
  detail: string;
}

export async function sendSlackAlert(
  text: string,
  env: EnvMap = process.env,
): Promise<SlackDeliveryResult> {
  const mode = normalizeMode(env.SLACK_MODE);
  const webhook = env.SLACK_WEBHOOK_URL?.trim();

  if (mode === "disabled") {
    return { sent: false, mode, detail: "Slack disabled by SLACK_MODE." };
  }

  if (!isRealMode(env, "SLACK_MODE", ["SLACK_WEBHOOK_URL"]) || !webhook) {
    return { sent: false, mode: "mock", detail: "Slack preview only (set SLACK_MODE=real + SLACK_WEBHOOK_URL)." };
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { sent: false, mode: "real", detail: `Slack webhook returned ${res.status}` };
    }

    return { sent: true, mode: "real", detail: "Message delivered to Slack." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, mode: "real", detail: `Slack delivery failed: ${message}` };
  }
}
