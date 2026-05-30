import type { Alert, CompetitorProfile, Recommendation } from "./domain";

export interface SlackAlertPayload {
  channel: string;
  text: string;
  blocks: Array<Record<string, unknown>>;
  idempotencyKey: string;
}

export interface HubSpotTaskPayload {
  subject: string;
  body: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  companyDomain: string;
  idempotencyKey: string;
}

export function buildSlackAlertPayload(
  alert: Alert,
  competitor: CompetitorProfile,
): SlackAlertPayload {
  return {
    channel: process.env.SLACK_ALERT_CHANNEL ?? "#gtm-intel",
    text: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    idempotencyKey: `slack:${alert.id}:${alert.status}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${competitor.name}: ${alert.title}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Score*\n${competitor.scoreRun.score}` },
          { type: "mrkdwn", text: `*Severity*\n${alert.severity}` },
          { type: "mrkdwn", text: `*Owner*\n${alert.owner}` },
          { type: "mrkdwn", text: `*Status*\n${alert.status}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: competitor.scoreRun.explanation,
        },
      },
    ],
  };
}

export function buildHubSpotTaskPayload(
  alert: Alert,
  competitor: CompetitorProfile,
  recommendation?: Recommendation,
): HubSpotTaskPayload {
  const priority =
    alert.severity === "critical" || alert.severity === "high"
      ? "HIGH"
      : "MEDIUM";

  return {
    subject: `Act on ${competitor.name} competitive signal`,
    companyDomain: competitor.domain,
    priority,
    idempotencyKey: `hubspot:${alert.id}:${competitor.id}`,
    body: [
      alert.title,
      competitor.scoreRun.explanation,
      recommendation
        ? `Recommended play: ${recommendation.title}. ${recommendation.brief}`
        : null,
      "Attach source evidence before outreach.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
