/**
 * Premium Demo Data for PreIntent
 * Real companies, realistic timestamps, evidence panels, confidence intervals
 * Justifies $1,000/month pricing with compelling demo scenarios
 */

import type { AccountIntelligenceProfile, EngineSignal, Provenance } from "./domain";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

export const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#111820",
  border: "#18232f",
  border2: "#1e2d3e",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#243040",
  conv: "#9060ff",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
  blue: "#2070ff",
  white: "#ddeeff",
};

// ─── REAL COMPANY ACCOUNTS ──────────────────────────────────────────────────
// These are real, recognizable companies that prospects will know

export interface PremiumAccount {
  id: number;
  name: string;
  displayName: string;
  industry: string;
  employees: number;
  location: string;
  website: string;
  linkedinUrl: string;
  competitor: string;
  competitorUrl: string;
  voidScore: number;
  voidConfidence: number;
  complianceScore: number;
  complianceConfidence: number;
  painScore: number;
  painConfidence: number;
  convergence: number;
  overallConfidence: number;
  status: "ALERT" | "WATCH" | "MONITOR";
  contact: {
    title: string;
    name: string;
    linkedin: string;
  };
  stack: string[];
  funding?: string;
  recentNews?: string[];
  voidEvent: string;
  voidEvidence: EvidencePanel;
  complianceEvent: string;
  complianceEvidence: EvidencePanel;
  painEvent: string;
  painEvidence: EvidencePanel;
  audioSignal?: string;
  audioEvidence?: EvidencePanel;
  lastUpdated: string;
}

export interface EvidencePanel {
  title: string;
  type: "screenshot" | "transcript" | "document" | "comparison";
  before?: string;
  after?: string;
  highlight?: string;
  source: string;
  capturedAt: string;
  details: string[];
  imageUrl?: string;
}

// ─── REAL ACCOUNTS DATA ─────────────────────────────────────────────────────
export const PREMIUM_ACCOUNTS: PremiumAccount[] = [
  {
    id: 1,
    name: "Brex",
    displayName: "Brex",
    industry: "Financial Services",
    employees: 1200,
    location: "San Francisco, CA",
    website: "brex.com",
    linkedinUrl: "linkedin.com/company/brex",
    competitor: "Stripe",
    competitorUrl: "stripe.com",
    voidScore: 85,
    voidConfidence: 0.92,
    complianceScore: 12,
    complianceConfidence: 0.8,
    painScore: 78,
    painConfidence: 0.88,
    convergence: 89,
    overallConfidence: 0.9,
    status: "ALERT",
    contact: {
      title: "VP of Finance",
      name: "Sarah Chen",
      linkedin: "linkedin.com/in/mock",
    },
    stack: ["Salesforce", "Marketo", "AWS"],
    voidEvent: "Stripe Atlas SMB fast-track tier silently removed",
    voidEvidence: {
      title: "Pricing Page Change",
      type: "screenshot",
      source: "stripe.com/pricing",
      capturedAt: new Date().toISOString(),
      details: ["Tier removed"],
    },
    complianceEvent: "No compliance event",
    complianceEvidence: {
      title: "None",
      type: "document",
      source: "System",
      capturedAt: new Date().toISOString(),
      details: [],
    },
    painEvent: "Evaluating alternatives to HubSpot",
    painEvidence: {
      title: "Reddit Thread",
      type: "transcript",
      source: "r/saas",
      capturedAt: new Date().toISOString(),
      details: [],
    },
    lastUpdated: new Date().toISOString()
  }
];
// ─── TIME-BASED REALISM UTILITIES ─────────────────────────────────────────────

export function generateRealisticTimestamp(hoursAgo: number): string {
  const now = new Date("2025-05-30T14:30:00Z"); // Demo "now"
  const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  return date.toISOString();
}

export function formatRelativeTime(isoString: string): string {
  const now = new Date("2025-05-30T14:30:00Z").getTime();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d`;
}

export function formatDetailedTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── CONVERT TO LEGACY FORMAT FOR COMPATIBILITY ─────────────────────────────────

export function convertToLegacyAccount(account: PremiumAccount) {
  return {
    id: account.id,
    name: account.name,
    industry: account.industry,
    employees: account.employees,
    location: account.location,
    competitor: account.competitor,
    voidScore: account.voidScore,
    complianceScore: account.complianceScore,
    painScore: account.painScore,
    convergence: account.convergence,
    status: account.status,
    contact: account.contact.title,
    stack: account.stack,
    voidEvent: account.voidEvent,
    complianceEvent: account.complianceEvent,
    painEvent: account.painEvent,
    audioSignal: account.audioSignal,
  };
}

// ─── CONFIDENCE BADGE HELPERS ─────────────────────────────────────────────────

export function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  description: string;
} {
  if (confidence >= 0.9) {
    return {
      label: "Very High",
      color: C.pain,
      description: "Multiple corroborating sources, high data freshness",
    };
  }
  if (confidence >= 0.8) {
    return {
      label: "High",
      color: "#60cc60",
      description: "Strong source reliability, good correlation",
    };
  }
  if (confidence >= 0.7) {
    return {
      label: "Medium",
      color: C.compliance,
      description: "Single strong source or multiple weaker sources",
    };
  }
  return {
    label: "Developing",
    color: C.muted,
    description: "Initial detection, awaiting corroboration",
  };
}

export function getConvergenceConfidence(overallConfidence: number): string {
  const interval = Math.round((1 - overallConfidence) * 100);
  const low = Math.max(0, 100 - interval);
  const high = 100;
  return `${low}-${high}`;
}

// ─── ROI CALCULATOR UTILITIES ─────────────────────────────────────────────────

export interface ROICalculation {
  account: string;
  acv: number;
  winRate: number;
  salesCycle: number;
  timeAdvantage: number;
  pipelineValue: number;
  expectedValue: number;
  preintentCost: number;
  roi: number;
  paybackDeals: number;
}

export function calculateROI(
  account: string,
  acv: number,
  winRate: number,
  salesCycle: number,
  timeAdvantage: number = 3 // days advantage
): ROICalculation {
  const preintentCost = 1000; // Monthly cost
  const pipelineValue = acv;
  const expectedValue = acv * (winRate / 100);
  const dailyValue = expectedValue / salesCycle;
  const advantageValue = dailyValue * timeAdvantage;
  const roi = (advantageValue / preintentCost) * 100;
  const paybackDeals = Math.ceil(preintentCost / expectedValue);

  return {
    account,
    acv,
    winRate,
    salesCycle,
    timeAdvantage,
    pipelineValue,
    expectedValue,
    preintentCost,
    roi,
    paybackDeals,
  };
}

// ─── COMPETITIVE COMPARISON DATA ──────────────────────────────────────────────

export interface CompetitiveComparison {
  account: string;
  signal: string;
  preintentDetected: string;
  competitorDetected: string;
  advantageDays: number;
  advantageHours: number;
  advantageValue: number;
}

export const COMPETITIVE_COMPARISONS: CompetitiveComparison[] = [
  {
    account: "Brex",
    signal: "Stripe Atlas SMB tier removal",
    preintentDetected: "2025-05-30T08:14:00Z",
    competitorDetected: "2025-06-02T14:30:00Z",
    advantageDays: 3,
    advantageHours: 6,
    advantageValue: 18750, // Assuming $50K ACV
  },
  {
    account: "Notion",
    signal: "HubSpot pricing change",
    preintentDetected: "2025-05-28T14:22:00Z",
    competitorDetected: "2025-05-30T09:00:00Z",
    advantageDays: 1,
    advantageHours: 19,
    advantageValue: 6250,
  },
  {
    account: "Vercel",
    signal: "Datadog trial terms change",
    preintentDetected: "2025-05-26T11:00:00Z",
    competitorDetected: "2025-05-28T16:00:00Z",
    advantageDays: 2,
    advantageHours: 5,
    advantageValue: 10417,
  },
];
