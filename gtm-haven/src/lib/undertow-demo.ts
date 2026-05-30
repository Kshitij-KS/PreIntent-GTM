/**
 * Undertow Demo Fixtures & Engine Simulators
 * Exact events and narrative from Ideation and Architecture.md "Demo Flow" and the Account Intelligence Profile example.
 * All signals carry explicit sponsor tool tags as required.
 */

import type {
  AccountIntelligenceProfile,
  EngineSignal,
  EngineType,
  IntelBrief,
  Provenance,
} from "./domain";
import { updateProfileWithSignal, getOrCreateProfile } from "./cognee";

// === Exact demo timing (deterministic for video / judging) ===
export const DEMO_NOW = new Date("2025-06-02T14:30:00.000Z");

// Helper to create provenance with sponsor tool badge
function makeProvenance(
  sponsor: Provenance["sponsor"],
  tool: Provenance["tool"],
  url: string,
  capturedAt: string,
  note?: string,
): Provenance {
  return { sponsor, tool, url, capturedAt, note };
}

// === Seed signals (exact from doc example + realistic extensions) ===

// VOID SCANNER — Competitor X (let's call the competitor "Zenith" for continuity with existing data feel, or "Competitor X" — use "Competitor X" in narrative, "Zenith" as the tracked name in UI if needed)
export const voidPricingRemoval: EngineSignal = {
  id: "void-zenith-smb-tier-2025-06-02",
  engine: "void",
  title: "Competitor X removed SMB pricing tier",
  description:
    "Pricing page previously listed four tiers (Free, SMB, Pro, Enterprise). Now only three — SMB tier and its $99/mo plan are gone. All existing SMB customers orphaned with no clear upgrade path.",
  eventTime: "2025-06-02T08:00:00.000Z",
  subScore: 84,
  confidence: 0.96,
  provenance: makeProvenance(
    "bright_data",
    "Scraping Browser",
    "https://competitorx.com/pricing",
    "2025-06-02T08:05:00.000Z",
    "Semantic diff via Cognee: tier count 4 → 3, specific plan name deleted",
  ),
  rawEvidence: {
    beforeTiers: ["Free", "SMB ($99/mo)", "Pro", "Enterprise"],
    afterTiers: ["Free", "Pro", "Enterprise"],
    removed: "SMB tier",
  },
};

// COMPLIANCE RADAR — PCI-DSS 4.0
export const compliancePciDss: EngineSignal = {
  id: "compliance-pci-dss-4-2025-05-28",
  engine: "compliance",
  title: "PCI-DSS 4.0 enforcement begins August 31 (87 days)",
  description:
    "New mandatory controls published. Acme processes card payments (confirmed via recent job postings for 'Payments Infrastructure'). No public compliance blog post, no compliance hiring detected — they are behind.",
  eventTime: "2025-05-28T10:00:00.000Z",
  subScore: 71,
  confidence: 0.89,
  provenance: makeProvenance(
    "bright_data",
    "SERP API",
    "https://www.pcisecuritystandards.org/pci-dss-4-0/",
    "2025-05-28T10:12:00.000Z",
    "AI/ML API extracted scope; Web Scraper cross-referenced firmographics + no acknowledgment signals",
  ),
  rawEvidence: {
    deadline: "2025-08-31",
    affectedIndustries: ["FinTech", "Payments", "E-commerce"],
    companySizeThreshold: "any merchant processing cards",
  },
};

// PAIN LISTENER — r/fintech post + Speechmatics
export const painRFintechPost: EngineSignal = {
  id: "pain-acme-rfintech-2025-06-01",
  engine: "pain",
  title: "Head of Payments Infrastructure at Acme actively evaluating alternatives",
  description:
    "\"Our [Competitor X] contract is up in 60 days and we're furious with the recent pricing changes and lack of SMB support. Anyone tried [Your Product] or alternatives?\" — 34 upvotes, multiple replies from practitioners.",
  eventTime: "2025-06-01T19:45:00.000Z",
  subScore: 91,
  confidence: 0.93,
  provenance: makeProvenance(
    "bright_data",
    "Scraping Browser",
    "https://www.reddit.com/r/fintech/comments/abc123",
    "2025-06-01T20:05:00.000Z",
    "Featherless classified: active evaluation, high urgency, senior author. Cognee mapped author history to Acme Corp (Head of Payments Infrastructure).",
  ),
  rawEvidence: {
    author: "u/paymentslead42",
    upvotes: 34,
    competitorMentioned: "Competitor X",
    signalType: "active evaluation",
  },
};

// Bonus: Speechmatics audio signal (mocked transcript with badge)
export const painPodcastTranscript: EngineSignal = {
  id: "pain-acme-podcast-2025-05-20",
  engine: "pain",
  title: "Same executive voiced frustration on industry podcast two weeks earlier",
  description:
    "Podcast: 'Payments Unfiltered' Ep 47 — 'We're looking at our vendor relationships very carefully this year, especially after the recent changes at [Competitor X].' (Speaker: Head of Payments Infrastructure, Acme Corp)",
  eventTime: "2025-05-20T11:00:00.000Z",
  subScore: 67,
  confidence: 0.81,
  provenance: makeProvenance(
    "speechmatics",
    "Speechmatics",
    "https://example.com/payments-unfiltered-ep47",
    "2025-05-20T11:30:00.000Z",
    "Audio transcribed and speaker attributed via public bio + voiceprint match",
  ),
  rawEvidence: {
    podcast: "Payments Unfiltered",
    episode: 47,
    speakerTitle: "Head of Payments Infrastructure",
    company: "Acme Corp (self-identified at 14:22)",
  },
};

// === Simulator: "arrive" a signal and update the persistent profile ===
export function arriveSignal(
  account: string,
  signal: EngineSignal,
  engine: EngineType,
): AccountIntelligenceProfile {
  // For demo determinism, we drive the sub-score from the signal itself on first arrival.
  // Subsequent arrivals can average or take max — here we just set to the signal's subScore for the narrative beats.
  const profile = updateProfileWithSignal(account, engine, signal, signal.subScore);
  return profile;
}

// === Initial seed for the demo (starts low, builds through the 6 steps) ===
export function getAcmeSeedProfile(): AccountIntelligenceProfile {
  const existing = getOrCreateProfile("Acme Corp");
  // If already has signals from previous demo run, keep it (persistence is a feature).
  // For a clean demo start, the presenter can call resetDemoProfile() if needed.
  if (existing.void.signals.length > 0 || existing.compliance.signals.length > 0) {
    return existing;
  }
  return existing; // empty seed is fine — stepper will populate
}

export function resetDemoProfile(account = "Acme Corp") {
  // Clear just this account for a fresh demo run
  if (typeof window !== "undefined") {
    const all = JSON.parse(localStorage.getItem("undertow:cognee:profiles:v1") || "{}");
    delete all[account];
    localStorage.setItem("undertow:cognee:profiles:v1", JSON.stringify(all));
  }
  return getOrCreateProfile(account);
}

// === Intel Brief (mock version for Phase 1; real AI/ML version in Phase 2) ===
export function generateMockIntelBrief(profile: AccountIntelligenceProfile): IntelBrief {
  const now = new Date().toISOString();
  return {
    id: `brief-${profile.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    account: profile.account,
    convergenceScore: profile.convergenceScore,
    urgency: profile.urgency === "CRITICAL" ? "CRITICAL — act today" : `${profile.urgency} — act within 5 days`,
    generatedAt: now,
    generatedBy: "mock",

    whyNow: [
      {
        engine: "void",
        subScore: profile.void.subScore,
        narrative: `Competitor X removed their SMB pricing tier on Jun 2. ${profile.account} is a confirmed Competitor X SMB customer (G2 review, Mar 2025). They have no upgrade path and no competitive lock-in. Window: ~30 days before they start formal evaluation.`,
      },
      {
        engine: "compliance",
        subScore: profile.compliance.subScore,
        narrative: `PCI-DSS 4.0 enforcement begins Aug 31 (87 days). ${profile.account} processes card payments (confirmed via job postings). No compliance blog post, no compliance hiring detected — they are behind. Your product covers 4 of the 6 new mandatory controls.`,
      },
      {
        engine: "pain",
        subScore: profile.pain.subScore,
        narrative: `Head of Payments Infrastructure at ${profile.account} posted on r/fintech Jun 1: "evaluating alternatives to [Competitor X], anyone tried [Your Product]?" Post has 34 upvotes. They are actively shopping now.`,
      },
    ],

    suggestedOpeningLine:
      `Hi [Name] — I noticed [Competitor X] made some changes to their plans recently, and with PCI-DSS 4.0 coming in August, I thought the timing might be worth a conversation. We've helped three payments companies your size get compliant without replacing their whole stack...`,

    accountContext: {
      industry: profile.industry,
      size: typeof profile.employees === "number" ? `${profile.employees} employees` : profile.employees,
      hq: "Austin, TX",
      stackHints: ["AWS", "Stripe", "Postgres"],
      keyContact: "Head of Payments Infrastructure",
    },

    recommendedActions: [
      "Create HubSpot lead with full signal breakdown",
      "Send personalized Slack alert to assigned AE with brief attached",
      "Add task: 'Call within 48h — 87/100 convergence, active evaluation signal'",
    ],
  };
}
