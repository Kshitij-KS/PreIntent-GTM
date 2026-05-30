import { z } from "zod";

/**
 * Undertow Domain Types
 * Source of truth: Project-GTM/Ideation and Architecture.md
 * This file defines ONLY the types needed for the MVP (three engines + convergence + Intel Brief).
 * Old GTM Haven competitor/Strategic Instability types have been removed.
 */

export const providerModeSchema = z.enum(["real", "mock", "disabled"]);
export type ProviderMode = z.infer<typeof providerModeSchema>;

// === Engines (exactly as defined in the architecture) ===
export const engineTypeSchema = z.enum(["void", "compliance", "pain"]);
export type EngineType = z.infer<typeof engineTypeSchema>;

// Sponsor tool attribution for every signal (Bright Data tools + others)
export type BrightDataTool =
  | "Scraping Browser"
  | "Web Unlocker"
  | "SERP API"
  | "Web Scraper API"
  | "MCP Server";

export interface Provenance {
  sponsor: "bright_data" | "ai_ml_api" | "featherless" | "speechmatics" | "cognee" | "triggerware" | "mock";
  tool?: BrightDataTool | "AI/ML API" | "Featherless (open model)" | "Speechmatics" | "Cognee (localStorage)" | "TriggerWare (viz)";
  url?: string; // source URL when applicable
  capturedAt: string;
  note?: string; // e.g. "semantic diff via Cognee"
}

// === Core Signal / Evidence per Engine ===
export interface EngineSignal {
  id: string;
  engine: EngineType;
  title: string; // short headline
  description: string; // human-readable evidence
  eventTime: string;
  subScore: number; // 0-100 for this engine
  confidence: number; // 0-1
  provenance: Provenance;
  rawEvidence?: Record<string, unknown>; // for debug / future real ingestion
}

// === Account Intelligence Profile (Cognee MVP = localStorage) ===
// Matches the exact example structure in the architecture doc
export interface AccountIntelligenceProfile {
  account: string; // e.g. "Acme Corp"
  industry: string;
  employees: number | string;
  crmStage: string; // e.g. "Not in pipeline"
  lastUpdated: string;

  void: {
    signals: EngineSignal[];
    subScore: number;
  };
  compliance: {
    signals: EngineSignal[];
    subScore: number;
  };
  pain: {
    signals: EngineSignal[];
    subScore: number;
  };

  convergenceScore: number; // 0-100 (weighted)
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  thresholdCrossedAt?: string; // when it first hit the action threshold
}

// === Convergence & Actions ===
export interface ConvergenceResult {
  profile: AccountIntelligenceProfile;
  weighting: { void: number; compliance: number; pain: number }; // default 33/33/33
  triggeredActions: ThresholdAction[];
}

export interface ThresholdAction {
  threshold: number;
  action: string; // e.g. "CRM lead created + AE Slack alert + Intel Brief generated"
  at: string;
}

// === The Intelligence Brief (primary deliverable, exact template) ===
export interface IntelBrief {
  id: string;
  account: string;
  convergenceScore: number;
  urgency: string; // HIGH — act within X days
  generatedAt: string;
  generatedBy: "ai_ml_api" | "mock";

  whyNow: Array<{
    engine: EngineType;
    subScore: number;
    narrative: string; // the 2-4 sentence "WHY NOW" paragraph for this engine
  }>;

  suggestedOpeningLine: string;

  accountContext: {
    industry: string;
    size: string;
    hq?: string;
    stackHints?: string[];
    keyContact?: string;
  };

  recommendedActions?: string[]; // optional next steps
}

// === Presenter / Demo Orchestration (exact 10-min script) ===
export interface DemoStep {
  id: string;
  label: string;
  title: string;
  talkTrack: string;
  nextClick: string;
  engine?: EngineType; // which engine this step reveals
}

export const demoSteps: DemoStep[] = [
  {
    id: "hook",
    label: "Hook",
    title: "Slack arrival: Acme Corp hits 87/100 convergence",
    talkTrack: "Three signals landed at once. No intent vendor has this yet.",
    nextClick: "Open the Void Scanner evidence.",
  },
  {
    id: "void",
    label: "Void Scanner",
    title: "Competitor X removed SMB pricing tier (semantic deletion via Cognee)",
    talkTrack: "Bright Data Scraping Browser captured the page. Cognee detected the tier count dropped from 4 → 3 — not just text change.",
    nextClick: "Drop the regulatory bulletin.",
    engine: "void",
  },
  {
    id: "compliance",
    label: "Compliance Radar",
    title: "PCI-DSS 4.0 enforcement in 87 days — Acme in scope, no acknowledgment",
    talkTrack: "SERP API + AI/ML API extracted scope. Web Scraper confirmed no compliance blog or hiring.",
    nextClick: "Surface the community pain signal.",
    engine: "compliance",
  },
  {
    id: "pain",
    label: "Pain Listener",
    title: "Head of Payments at Acme posted on r/fintech: actively evaluating alternatives",
    talkTrack: "Speechmatics transcribed the podcast two weeks earlier where the same person voiced frustration. Featherless classified urgency + company map via Cognee.",
    nextClick: "Watch convergence fire.",
    engine: "pain",
  },
  {
    id: "convergence",
    label: "Convergence",
    title: "Score crosses 85 — TriggerWare fires",
    talkTrack: "All three sub-scores feed the weighted composite. The moment it hits threshold, the workflow visualization runs.",
    nextClick: "Open the Intel Brief.",
  },
  {
    id: "brief",
    label: "Intel Brief",
    title: "Real AI/ML API generates the ready-to-send brief + suggested opener",
    talkTrack: "This is the unfair advantage: the AE receives a complete, evidence-backed message before making the first call.",
    nextClick: "End of story.",
  },
];

// === Integration Health (updated for new sponsor set) ===
export interface IntegrationStatus {
  id: string;
  name: string;
  provider:
    | "bright_data"
    | "ai_ml_api"
    | "featherless"
    | "speechmatics"
    | "cognee"
    | "triggerware";
  mode: ProviderMode;
  status: "healthy" | "degraded" | "disabled" | "not_configured" | "live";
  lastSyncAt: string | null;
  detail: string; // e.g. "Mocked — realistic signals with Bright Data Scraping Browser tags"
}

// === Lightweight action state for demo (visual only) ===
export interface ActionState {
  slackSent: boolean;
  hubspotCreated: boolean;
  briefGenerated: boolean;
  brief?: IntelBrief;
}

// === Utility Schemas (for API routes if needed) ===
export const accountNameSchema = z.object({
  name: z.string().trim().min(1, "Account name is required"),
});
