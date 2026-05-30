import { z } from "zod";

export const providerModeSchema = z.enum(["real", "mock", "disabled"]);
export type ProviderMode = z.infer<typeof providerModeSchema>;

export const signalTypeSchema = z.enum([
  "m_and_a",
  "executive_change",
  "negative_sentiment",
  "positive_milestone",
  "negative_space",
  "job_posting",
  "community_pain",
  "regulatory",
]);
export type SignalType = z.infer<typeof signalTypeSchema>;

export const severitySchema = z.enum(["critical", "high", "medium", "low"]);
export type Severity = z.infer<typeof severitySchema>;

export const alertStatusSchema = z.enum([
  "new",
  "acknowledged",
  "actioned",
  "dismissed",
]);
export type AlertStatus = z.infer<typeof alertStatusSchema>;

export interface SignalSource {
  id: string;
  provider:
    | "bright_data"
    | "ai_ml_api"
    | "cognee"
    | "slack"
    | "hubspot"
    | "manual"
    | "mock";
  label: string;
  url: string;
  capturedAt: string;
  sourceQuality: number;
}

export interface Signal {
  id: string;
  competitorId: string;
  type: SignalType;
  title: string;
  description: string;
  eventTime: string;
  impactScore: number;
  confidence: number;
  entities: Record<string, string | number | boolean>;
  source: SignalSource;
}

export interface ScoreContribution {
  signalId: string;
  type: SignalType;
  title: string;
  rawImpact: number;
  recencyDecay: number;
  confidenceAdjusted: number;
  sourceQualityAdjusted: number;
  finalScore: number;
  eventTime: string;
}

export interface ScoreRun {
  id: string;
  competitorId: string;
  score: number;
  severity: Severity;
  asOf: string;
  explanation: string;
  contributions: ScoreContribution[];
}

export interface Recommendation {
  id: string;
  competitorId: string;
  title: string;
  brief: string;
  ownerRole:
    | "CRO"
    | "VP Sales"
    | "RevOps"
    | "Strategic AE"
    | "Product Marketing";
  confidence: number;
  action:
    | "monitor"
    | "message_accounts"
    | "create_crm_task"
    | "launch_competitive_play";
}

export interface Alert {
  id: string;
  competitorId: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  createdAt: string;
  owner: string;
  slackDelivery: "ready" | "sent" | "failed" | "disabled";
  hubspotSync: "ready" | "created" | "failed" | "disabled";
  sourceSignalIds: string[];
}

export interface IntegrationStatus {
  id: string;
  name: string;
  provider:
    | "bright_data"
    | "ai_ml_api"
    | "cognee"
    | "slack"
    | "hubspot"
    | "triggerware";
  mode: ProviderMode;
  status: "healthy" | "degraded" | "disabled" | "not_configured";
  lastSyncAt: string | null;
  detail: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  segment: string;
  monitoredSince: string;
  scoreRun: ScoreRun;
  signals: Signal[];
  recommendations: Recommendation[];
}

export interface PortfolioSummary {
  workspaceName: string;
  monitoredCompetitors: number;
  criticalAlerts: number;
  averageScore: number;
  openRevenueOpportunities: number;
  lastIngestionAt: string;
}

export interface CommandCenterData {
  summary: PortfolioSummary;
  competitors: CompetitorProfile[];
  alerts: Alert[];
  integrations: IntegrationStatus[];
}

export const scoreQuerySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
});

export const scoreResponseSchema = z.object({
  companyName: z.string(),
  domain: z.string(),
  instabilityScore: z.number(),
  severity: severitySchema,
  explanation: z.string(),
  events: z.array(
    z.object({
      id: z.string(),
      type: signalTypeSchema,
      title: z.string(),
      description: z.string(),
      date: z.string(),
      calculatedScore: z.number(),
      decayApplied: z.number(),
      confidence: z.number(),
      sourceUrl: z.string(),
    }),
  ),
});
