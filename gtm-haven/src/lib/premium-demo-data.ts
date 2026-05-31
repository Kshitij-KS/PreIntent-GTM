/**
 * Premium Demo Data for Preintent
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
    industry: "FinTech / Corporate Cards",
    employees: 1200,
    location: "San Francisco, CA",
    website: "brex.com",
    linkedinUrl: "linkedin.com/company/brex",
    competitor: "Stripe Atlas",
    competitorUrl: "stripe.com/atlas",
    voidScore: 87,
    voidConfidence: 0.94,
    complianceScore: 74,
    complianceConfidence: 0.88,
    painScore: 93,
    painConfidence: 0.96,
    convergence: 85,
    overallConfidence: 0.91,
    status: "ALERT",
    contact: {
      title: "VP of Treasury & Payments",
      name: "Sarah Chen",
      linkedin: "linkedin.com/in/sarahchen-brex",
    },
    stack: ["AWS", "Stripe", "Snowflake", "Salesforce"],
    funding: "Series D, $12.3B valuation",
    recentNews: [
      "Expanded SMB offerings in Q1 2025",
      "New compliance hire posted 3 days ago",
    ],
    voidEvent: "Stripe Atlas silently removed SMB onboarding fast-track — Brex uses this for subsidiary formation",
    voidEvidence: {
      title: "Stripe Atlas Pricing Page Diff",
      type: "comparison",
      before: "SMB Fast-Track ($500): Same-day entity formation, expedited EIN, priority support",
      after: "Standard ($500): 3-5 day processing, standard queue",
      highlight: "Removed: Same-day processing, expedited EIN, priority support",
      source: "stripe.com/atlas",
      capturedAt: "2025-05-30T08:14:00Z",
      details: [
        "Detected via Bright Data Scraping Browser at 08:14 UTC",
        "Semantic diff: 3 value props removed from pricing grid",
        "No migration path communicated to existing customers",
        "Affects 340+ Brex subsidiaries formed via Atlas since 2022",
      ],
    },
    complianceEvent: "PCI-DSS 4.0 mandatory enforcement in 89 days — Brex processes $2.1B in card volume monthly",
    complianceEvidence: {
      title: "PCI-DSS 4.0 Enforcement Bulletin",
      type: "document",
      source: "pcisecuritystandards.org",
      capturedAt: "2025-05-28T10:00:00Z",
      details: [
        "Deadline: August 31, 2025 at 23:59 UTC",
        "New requirements: MFA for all admin access, encrypted cardholder data at rest",
        "Brex status: Zero public compliance roadmap, no blog post, 1 compliance role open (posted 3 days ago)",
        "Preintent confidence: 74/100 — detected via job posting + lack of public comms",
      ],
    },
    painEvent: "Brex Head of Treasury posted on r/fintech: 'Evaluating alternatives to Stripe Atlas for our 12 subsidiaries. Atlas support has gone silent on expedited processing.' — 67 upvotes, 23 comments",
    painEvidence: {
      title: "Reddit r/fintech Post Analysis",
      type: "transcript",
      source: "reddit.com/r/fintech",
      capturedAt: "2025-05-29T19:45:00Z",
      details: [
        "Author: u/treasury_lead_sf (verified via post history, previous AMA confirms Brex employment)",
        "Engagement: 67 upvotes, 23 comments, 4 awards",
        "Key phrase: 'evaluating alternatives' — Featherless AI classified as ACTIVE_EVALUATION",
        "Comment thread includes mentions of Mercury, Firstbase, and Clerky as alternatives",
        "Brex contract renewal window: 45 days (mentioned in reply)",
      ],
    },
    audioSignal: "Payments Unfiltered Ep.127: Brex VP of Finance discusses 're-evaluating our entire entity management stack' at 34:22 mark",
    audioEvidence: {
      title: "Speechmatics Transcript Excerpt",
      type: "transcript",
      source: "paymentsunfiltered.fm/ep127",
      capturedAt: "2025-05-15T11:30:00Z",
      details: [
        "Speechmatics transcription confidence: 94%",
        "Speaker identified: Michael Torres, VP Finance at Brex (via LinkedIn bio match)",
        "Quote: 'We're looking at our entire entity management stack right now... Atlas was great when we were smaller but at 12 entities, the support model isn't scaling with us.'",
        "Episode downloads: 12K (measured via RSS analytics)",
      ],
    },
    lastUpdated: "2025-05-30T14:30:00Z",
  },
  {
    id: 2,
    name: "Notion",
    displayName: "Notion",
    industry: "B2B SaaS / Productivity",
    employees: 600,
    location: "San Francisco, CA",
    website: "notion.so",
    linkedinUrl: "linkedin.com/company/notion",
    competitor: "HubSpot",
    competitorUrl: "hubspot.com",
    voidScore: 52,
    voidConfidence: 0.78,
    complianceScore: 81,
    complianceConfidence: 0.91,
    painScore: 68,
    painConfidence: 0.82,
    convergence: 67,
    overallConfidence: 0.84,
    status: "WATCH",
    contact: {
      title: "Head of Revenue Operations",
      name: "Jordan Lee",
      linkedin: "linkedin.com/in/jordanlee-notion",
    },
    stack: ["AWS", "HubSpot", "Salesforce", "Segment"],
    funding: "Series C, $10B valuation",
    recentNews: [
      "Launched Notion AI enterprise features",
      "Hiring 5 RevOps roles in SF",
    ],
    voidEvent: "HubSpot removed 'unlimited contacts' from Marketing Hub Starter — Notion uses this tier for freemium conversion tracking",
    voidEvidence: {
      title: "HubSpot Pricing Change Detection",
      type: "comparison",
      before: "Starter: Unlimited contacts, 1,000 marketing contacts",
      after: "Starter: Up to 1,000 contacts total",
      highlight: "Removed: Unlimited contacts, expanded contact definitions",
      source: "hubspot.com/pricing/marketing",
      capturedAt: "2025-05-28T14:22:00Z",
      details: [
        "Detected via Bright Data Web Unlocker at 14:22 UTC",
        "Notion usage: Estimated 45K contacts in Starter tier",
        "Cost impact: $0 → $450/mo minimum upgrade to Professional",
        "HubSpot communications: No proactive notice to affected customers",
      ],
    },
    complianceEvent: "EU AI Act Article 52 requirements for AI disclosure — Notion AI features must comply by August 2025",
    complianceEvidence: {
      title: "EU AI Act Compliance Notice",
      type: "document",
      source: "eur-lex.europa.eu",
      capturedAt: "2025-05-25T09:00:00Z",
      details: [
        "Article 52: AI systems must disclose they are AI to users",
        "Notion AI features: Smart Edit, Q&A, Writer — all affected",
        "Notion status: Partial compliance (Q&A discloses, Smart Edit does not)",
        "Deadline: August 2, 2025 — 65 days remaining",
      ],
    },
    painEvent: "LinkedIn: Notion RevOps lead posted 'HubSpot contract renewal came in 2.5x. Evaluating alternatives for 200 seats.' — 34 likes, 8 comments from other RevOps leaders",
    painEvidence: {
      title: "LinkedIn Post Analysis",
      type: "transcript",
      source: "linkedin.com/posts/jordanlee-revops",
      capturedAt: "2025-05-27T16:30:00Z",
      details: [
        "Author: Jordan Lee, Head of RevOps at Notion (verified)",
        "Engagement: 34 likes, 8 comments, 2 reposts",
        "Comment mentions: 'Same here at [competitor]', 'Looking at Marketo + Salesforce combo'",
        "Featherless classification: ACTIVE_EVALUATION, ENTERPRISE_SCALE",
      ],
    },
    lastUpdated: "2025-05-28T10:00:00Z",
  },
  {
    id: 3,
    name: "Vercel",
    displayName: "Vercel",
    industry: "Developer Tools / Cloud",
    employees: 450,
    location: "San Francisco, CA",
    website: "vercel.com",
    linkedinUrl: "linkedin.com/company/vercel",
    competitor: "Datadog",
    competitorUrl: "datadoghq.com",
    voidScore: 45,
    voidConfidence: 0.75,
    complianceScore: 62,
    complianceConfidence: 0.79,
    painScore: 71,
    painConfidence: 0.85,
    convergence: 59,
    overallConfidence: 0.80,
    status: "WATCH",
    contact: {
      title: "VP of Engineering",
      name: "Alex Rivera",
      linkedin: "linkedin.com/in/arivera-vercel",
    },
    stack: ["AWS", "Datadog", "Vercel", "Turbo"],
    funding: "Series E, $2.5B valuation",
    recentNews: [
      "Shipped Turbopack stable",
      "SOC 2 Type II renewal in progress",
    ],
    voidEvent: "Datadog removed '15-day free trial' from APM — now 14-day only with credit card required upfront",
    voidEvidence: {
      title: "Datadog Trial Terms Change",
      type: "comparison",
      before: "14-day free trial, no credit card",
      after: "14-day free trial, credit card required",
      highlight: "Change: Credit card now required upfront",
      source: "datadoghq.com/free-trial",
      capturedAt: "2025-05-26T11:00:00Z",
      details: [
        "Detected via Bright Data Web Scraper API",
        "Vercel impact: New team onboarding friction for observability",
        "Trial abandonment expected to increase 23% per industry benchmarks",
      ],
    },
    complianceEvent: "SOC 2 Type II renewal window — Vercel's current report expires July 15, 2025",
    complianceEvidence: {
      title: "SOC 2 Compliance Tracking",
      type: "document",
      source: "vercel.com/security",
      capturedAt: "2025-05-24T08:00:00Z",
      details: [
        "Current report: SOC 2 Type II, expires July 15, 2025",
        "Status: Auditor engaged (Vanta), evidence collection phase",
        "Datadog requirement: Vercel requires observability vendor to be SOC 2 compliant",
        "Risk: If Datadog renewal delayed, SOC 2 scope could be affected",
      ],
    },
    painEvent: "Hacker News: 'Datadog bill just crossed $50K/mo for our team of 40. Looking at alternatives. Anyone using Grafana Cloud at scale?' — Top comment on front page post",
    painEvidence: {
      title: "Hacker News Thread Analysis",
      type: "transcript",
      source: "news.ycombinator.com/item?id=445xxxxx",
      capturedAt: "2025-05-25T14:20:00Z",
      details: [
        "Post author: devops_lead at high-growth startup (verified via comment history)",
        "Engagement: 487 upvotes, 234 comments, 6 hours on front page",
        "Top reply: 'Same here. Vercel's observability costs are killing us.' — 89 upvotes",
        "Featherless classification: FRUSTRATION → EVALUATION transition detected",
      ],
    },
    lastUpdated: "2025-05-26T09:00:00Z",
  },
  {
    id: 4,
    name: "Rippling",
    displayName: "Rippling",
    industry: "HR Tech / Workforce Management",
    employees: 2800,
    location: "San Francisco, CA",
    website: "rippling.com",
    linkedinUrl: "linkedin.com/company/rippling",
    competitor: "Gusto",
    competitorUrl: "gusto.com",
    voidScore: 68,
    voidConfidence: 0.86,
    complianceScore: 77,
    complianceConfidence: 0.89,
    painScore: 54,
    painConfidence: 0.74,
    convergence: 66,
    overallConfidence: 0.83,
    status: "WATCH",
    contact: {
      title: "VP of People Operations",
      name: "Priya Sharma",
      linkedin: "linkedin.com/in/psharma-rippling",
    },
    stack: ["AWS", "Gusto", "Workday", "Greenhouse"],
    funding: "Series C, $11.25B valuation",
    recentNews: [
      "IPO preparations rumored for 2026",
      "Expanded into IT asset management",
    ],
    voidEvent: "Gusto removed ' contractor payments' from Core plan — moved to Premium tier ($40/mo increase per contractor)",
    voidEvidence: {
      title: "Gusto Pricing Tier Restructure",
      type: "comparison",
      before: "Core ($40/mo): Includes contractor payments",
      after: "Core ($40/mo): Employees only; Contractor payments → Premium ($80/mo)",
      highlight: "Removed: Contractor payments from Core tier",
      source: "gusto.com/pricing",
      capturedAt: "2025-05-24T09:30:00Z",
      details: [
        "Detected via Bright Data Scraping Browser",
        "Rippling impact: 340 contractors currently on Gusto Core",
        "Cost increase: $0 → $13,600/mo if no action taken",
        "Switching cost window: 60 days before forced migration",
      ],
    },
    complianceEvent: "CCPA 2.0 amendments effective July 1, 2025 — Rippling handles employee data for 2,800 CA residents",
    complianceEvidence: {
      title: "CCPA 2.0 Compliance Update",
      type: "document",
      source: "cppa.ca.gov",
      capturedAt: "2025-05-22T10:00:00Z",
      details: [
        "Effective date: July 1, 2025 — 37 days remaining",
        "New requirements: Employee data subject to privacy rights, audit trails for data access",
        "Gusto status: CCPA 1.0 compliant, 2.0 readiness unknown",
        "Rippling risk: If Gusto not ready, Rippling faces compliance exposure",
      ],
    },
    painEvent: "LinkedIn: Rippling People Ops lead commented on Gusto pricing post: 'Same issue here with 340 contractors. Evaluating alternatives before July renewal.' — 12 likes",
    painEvidence: {
      title: "LinkedIn Comment Analysis",
      type: "transcript",
      source: "linkedin.com/comments/gusto-pricing",
      capturedAt: "2025-05-25T11:15:00Z",
      details: [
        "Author: Priya Sharma, VP People Ops at Rippling (verified)",
        "Context: Comment on industry analyst's Gusto pricing analysis post",
        "Signal strength: Medium — comment vs original post is lower urgency",
        "Featherless classification: EVALUATION_INTENT, HR_DECISION_MAKER",
      ],
    },
    lastUpdated: "2025-05-25T12:00:00Z",
  },
  {
    id: 5,
    name: "Mercury",
    displayName: "Mercury",
    industry: "FinTech / Banking",
    employees: 650,
    location: "San Francisco, CA",
    website: "mercury.com",
    linkedinUrl: "linkedin.com/company/mercury",
    competitor: "Carta",
    competitorUrl: "carta.com",
    voidScore: 42,
    voidConfidence: 0.73,
    complianceScore: 58,
    complianceConfidence: 0.76,
    painScore: 63,
    painConfidence: 0.81,
    convergence: 54,
    overallConfidence: 0.77,
    status: "MONITOR",
    contact: {
      title: "VP of Finance",
      name: "David Park",
      linkedin: "linkedin.com/in/dpark-mercury",
    },
    stack: ["AWS", "Carta", "QuickBooks", "Stripe"],
    funding: "Series C, $1.6B valuation",
    recentNews: [
      "Launched Mercury Treasury",
      "Expanded to consumer banking",
    ],
    voidEvent: "Carta removed '409A valuations included' from Launch tier — now requires separate $2K purchase",
    voidEvidence: {
      title: "Carta Pricing Change Detection",
      type: "comparison",
      before: "Launch ($2K/yr): Includes 409A valuations",
      after: "Launch ($2K/yr): 409A valuations sold separately ($2K each)",
      highlight: "Removed: Included 409A valuations",
      source: "carta.com/pricing",
      capturedAt: "2025-05-23T13:45:00Z",
      details: [
        "Detected via Bright Data Web Unlocker",
        "Mercury impact: Mercury Treasury customers use Carta for cap table",
        "Cost increase: $2K/yr → $4K/yr per customer needing 409A",
        "Mercury opportunity: Bundle 409A with Treasury product",
      ],
    },
    complianceEvent: "SEC Rule 10c-1 compliance — Mercury customers holding securities subject to new reporting",
    complianceEvidence: {
      title: "SEC Rule 10c-1 Analysis",
      type: "document",
      source: "sec.gov",
      capturedAt: "2025-05-20T14:00:00Z",
      details: [
        "Effective date: January 2026 — 8 months to comply",
        "Requirement: Securities lending reporting for beneficial owners",
        "Mercury Treasury: Some customers hold securities, potentially affected",
        "Carta role: Cap table accuracy required for compliance",
      ],
    },
    painEvent: "Twitter/X: Mercury founder Immad Akhund liked tweet criticizing Carta pricing transparency — engagement signal detected",
    painEvidence: {
      title: "Social Signal Detection",
      type: "transcript",
      source: "twitter.com",
      capturedAt: "2025-05-24T18:30:00Z",
      details: [
        "Signal type: Founder engagement with competitive criticism",
        "Engagement: Like on tweet from SaaS founder about Carta pricing",
        "Context: Mercury Treasury competes with Carta for startup banking",
        "Featherless classification: INDIRECT_SENTIMENT, FOUNDER_LEVEL",
        "Strength: Weak signal but founder-level attention noted",
      ],
    },
    lastUpdated: "2025-05-24T20:00:00Z",
  },
  {
    id: 6,
    name: "Linear",
    displayName: "Linear",
    industry: "Developer Tools / Project Management",
    employees: 85,
    location: "San Francisco, CA / Remote",
    website: "linear.app",
    linkedinUrl: "linkedin.com/company/linear",
    competitor: "GitHub Issues",
    competitorUrl: "github.com",
    voidScore: 38,
    voidConfidence: 0.71,
    complianceScore: 45,
    complianceConfidence: 0.72,
    painScore: 57,
    painConfidence: 0.78,
    convergence: 47,
    overallConfidence: 0.74,
    status: "MONITOR",
    contact: {
      title: "Head of Engineering",
      name: "Karri Saarinen",
      linkedin: "linkedin.com/in/karri",
    },
    stack: ["Vercel", "GitHub", "Linear", "Slack"],
    funding: "Series B, $400M valuation",
    recentNews: [
      "Launched Linear Asks",
      "Growing enterprise segment",
    ],
    voidEvent: "GitHub Projects added 'roadmap view' — feature parity with Linear's core differentiator",
    voidEvidence: {
      title: "GitHub Projects Roadmap Feature",
      type: "screenshot",
      source: "github.com/features/issues",
      capturedAt: "2025-05-22T10:00:00Z",
      details: [
        "GitHub announced roadmap visualization in Projects",
        "Previously: Linear's key differentiator over GitHub Issues",
        "Impact: Reduced switching incentive for GitHub-native teams",
        "Linear response: Unknown — monitoring for counter-positioning",
      ],
    },
    complianceEvent: "ISO 27001 certification — Linear pursuing enterprise deals, compliance table stakes",
    complianceEvidence: {
      title: "ISO 27001 Readiness",
      type: "document",
      source: "linear.app/security",
      capturedAt: "2025-05-20T09:00:00Z",
      details: [
        "Linear status: SOC 2 Type II complete, ISO 27001 in progress",
        "Enterprise requirement: ISO 27001 increasingly table stakes",
        "Timeline: Expected Q3 2025 certification",
        "Competitor status: GitHub (Microsoft) has full compliance suite",
      ],
    },
    painEvent: "r/startups: 'Linear is great but at 50+ engineers, the lack of enterprise SSO integrations is painful. GitHub Projects might be good enough now.' — 89 upvotes",
    painEvidence: {
      title: "Reddit r/startups Thread",
      type: "transcript",
      source: "reddit.com/r/startups",
      capturedAt: "2025-05-21T16:45:00Z",
      details: [
        "Post: 'Switching from Linear back to GitHub Projects'",
        "Engagement: 89 upvotes, 67 comments",
        "Key complaint: SSO/SAML gaps, enterprise feature gaps",
        "Featherless classification: CHURN_RISK, SCALE_THRESHOLD",
        "Author profile: Engineering manager at 60-person startup (via comment history)",
      ],
    },
    lastUpdated: "2025-05-22T12:00:00Z",
  },
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
