import type {
  Alert,
  CommandCenterData,
  CompetitorProfile,
  IntegrationStatus,
  Recommendation,
  Signal,
} from "./domain";
import { scoreSignals } from "./scoring";

const DEMO_AS_OF = new Date("2026-05-30T08:00:00.000Z");

export const demoSignals: Signal[] = [
  {
    id: "sig_acme_exec_cto",
    competitorId: "acme",
    type: "executive_change",
    title: "CTO departed unexpectedly",
    description:
      "Acme's CTO left after four years, creating product execution uncertainty.",
    eventTime: "2026-05-10T09:00:00.000Z",
    impactScore: 30,
    confidence: 0.92,
    entities: { executive: "CTO", tenureYears: 4 },
    source: {
      id: "src_acme_exec",
      provider: "mock",
      label: "Executive profile monitor",
      url: "https://example.com/acme-cto-departure",
      capturedAt: "2026-05-10T09:30:00.000Z",
      sourceQuality: 0.9,
    },
  },
  {
    id: "sig_acme_ma_beta",
    competitorId: "acme",
    type: "m_and_a",
    title: "Acquired Beta Technologies",
    description:
      "Acme moved into applied ML through an acquisition with integration risk.",
    eventTime: "2026-04-15T12:00:00.000Z",
    impactScore: 24,
    confidence: 0.86,
    entities: { acquiredCompany: "Beta Technologies", category: "ML" },
    source: {
      id: "src_acme_ma",
      provider: "bright_data",
      label: "Financial news scrape",
      url: "https://example.com/acme-acquires-beta",
      capturedAt: "2026-04-15T12:05:00.000Z",
      sourceQuality: 0.88,
    },
  },
  {
    id: "sig_acme_sentiment_pricing",
    competitorId: "acme",
    type: "negative_sentiment",
    title: "Pricing backlash in buyer communities",
    description:
      "Public complaints increased after Acme changed packaging and removed a mid-market tier.",
    eventTime: "2026-05-25T16:45:00.000Z",
    impactScore: 18,
    confidence: 0.9,
    entities: { community: "HN", complaintTheme: "pricing" },
    source: {
      id: "src_acme_sentiment",
      provider: "mock",
      label: "Community pain classifier",
      url: "https://example.com/acme-pricing-thread",
      capturedAt: "2026-05-25T17:00:00.000Z",
      sourceQuality: 0.82,
    },
  },
  {
    id: "sig_zenith_negative_space",
    competitorId: "zenith",
    type: "negative_space",
    title: "Pro pricing tier removed",
    description:
      "Zenith removed its Pro tier and now routes smaller teams to enterprise pricing.",
    eventTime: "2026-05-26T08:00:00.000Z",
    impactScore: 26,
    confidence: 0.94,
    entities: {
      removedItem: "Pro pricing tier",
      oldPrice: "$99/mo",
      newFloor: "$499/mo",
    },
    source: {
      id: "src_zenith_negative_space",
      provider: "bright_data",
      label: "Pricing page diff",
      url: "https://example.com/zenith-pricing-diff",
      capturedAt: "2026-05-26T08:10:00.000Z",
      sourceQuality: 0.95,
    },
  },
  {
    id: "sig_zenith_community_pain",
    competitorId: "zenith",
    type: "community_pain",
    title: "Renewal frustration surfaced",
    description:
      "A SaaS buyer described a 3x renewal increase and asked for replacement vendors.",
    eventTime: "2026-05-27T16:45:00.000Z",
    impactScore: 24,
    confidence: 0.88,
    entities: { subreddit: "r/SaaS", urgency: "renewal" },
    source: {
      id: "src_zenith_reddit",
      provider: "mock",
      label: "Community monitor",
      url: "https://reddit.com/r/SaaS/comments/12345/zenith_pricing",
      capturedAt: "2026-05-27T16:50:00.000Z",
      sourceQuality: 0.78,
    },
  },
  {
    id: "sig_initech_sales_departure",
    competitorId: "initech",
    type: "executive_change",
    title: "VP Sales joined a competitor",
    description: "Initech lost its VP Sales during a key expansion quarter.",
    eventTime: "2026-05-01T11:00:00.000Z",
    impactScore: 28,
    confidence: 0.86,
    entities: { role: "VP Sales", destination: "competitor" },
    source: {
      id: "src_initech_sales",
      provider: "mock",
      label: "Profile change monitor",
      url: "https://example.com/initech-vp-sales",
      capturedAt: "2026-05-01T11:15:00.000Z",
      sourceQuality: 0.84,
    },
  },
  {
    id: "sig_globex_ma",
    competitorId: "globex",
    type: "m_and_a",
    title: "Acquired by larger conglomerate",
    description:
      "Globex entered a transition window after being acquired by a much larger parent.",
    eventTime: "2026-05-28T09:00:00.000Z",
    impactScore: 22,
    confidence: 0.9,
    entities: { transactionType: "acquired" },
    source: {
      id: "src_globex_ma",
      provider: "bright_data",
      label: "Press release scrape",
      url: "https://example.com/globex-acquired",
      capturedAt: "2026-05-28T09:05:00.000Z",
      sourceQuality: 0.9,
    },
  },
];

const recommendations: Recommendation[] = [
  {
    id: "rec_acme_compete",
    competitorId: "acme",
    title: "Launch pricing-stability play",
    brief:
      "Prioritize open mid-market opportunities where Acme is shortlisted and lead with pricing predictability.",
    ownerRole: "VP Sales",
    confidence: 0.88,
    action: "launch_competitive_play",
  },
  {
    id: "rec_zenith_pipeline",
    competitorId: "zenith",
    title: "Create renewal rescue motion",
    brief:
      "Route Zenith renewal complaints into HubSpot with a talk track tied to the removed Pro tier.",
    ownerRole: "RevOps",
    confidence: 0.91,
    action: "create_crm_task",
  },
  {
    id: "rec_initech_monitor",
    competitorId: "initech",
    title: "Watch sales execution risk",
    brief:
      "Monitor sales leadership hiring and discounting language before changing competitive positioning.",
    ownerRole: "Product Marketing",
    confidence: 0.74,
    action: "monitor",
  },
];

const competitors = [
  {
    id: "acme",
    name: "Acme Corp",
    domain: "acme.com",
    segment: "Enterprise CRM",
  },
  {
    id: "zenith",
    name: "Zenith Tech",
    domain: "zenith.example",
    segment: "Customer Success",
  },
  {
    id: "initech",
    name: "Initech",
    domain: "initech.com",
    segment: "Workflow Automation",
  },
  {
    id: "globex",
    name: "Globex",
    domain: "globex.com",
    segment: "Data Platform",
  },
];

export function getDemoCommandCenterData(): CommandCenterData {
  const competitorProfiles: CompetitorProfile[] = competitors.map(
    (competitor) => {
      const signals = demoSignals.filter(
        (signal) => signal.competitorId === competitor.id,
      );
      return {
        ...competitor,
        monitoredSince: "2026-04-01T00:00:00.000Z",
        scoreRun: scoreSignals(competitor.id, signals, DEMO_AS_OF),
        signals,
        recommendations: recommendations.filter(
          (item) => item.competitorId === competitor.id,
        ),
      };
    },
  );

  const alerts: Alert[] = [
    {
      id: "alert_zenith_pricing",
      competitorId: "zenith",
      title: "Zenith pricing retreat is creating displacement demand",
      severity: "critical",
      status: "new",
      createdAt: "2026-05-27T17:05:00.000Z",
      owner: "RevOps",
      slackDelivery: "ready",
      hubspotSync: "ready",
      sourceSignalIds: [
        "sig_zenith_negative_space",
        "sig_zenith_community_pain",
      ],
    },
    {
      id: "alert_acme_exec_pricing",
      competitorId: "acme",
      title: "Acme instability increased after CTO exit and pricing backlash",
      severity: "high",
      status: "acknowledged",
      createdAt: "2026-05-25T17:15:00.000Z",
      owner: "VP Sales",
      slackDelivery: "sent",
      hubspotSync: "created",
      sourceSignalIds: ["sig_acme_exec_cto", "sig_acme_sentiment_pricing"],
    },
  ];

  const integrations: IntegrationStatus[] = [
    {
      id: "int_bright_data",
      name: "Bright Data ingestion",
      provider: "bright_data",
      mode: "mock",
      status: "healthy",
      lastSyncAt: "2026-05-30T07:45:00.000Z",
      detail:
        "SERP, scraper, and page-diff adapters are using deterministic demo fixtures.",
    },
    {
      id: "int_ai",
      name: "Generic AI/ML API",
      provider: "ai_ml_api",
      mode: "mock",
      status: "healthy",
      lastSyncAt: "2026-05-30T07:48:00.000Z",
      detail:
        "Structured briefs are generated from mock-safe extraction contracts.",
    },
    {
      id: "int_slack",
      name: "Slack alerts",
      provider: "slack",
      mode: "mock",
      status: "healthy",
      lastSyncAt: "2026-05-30T07:50:00.000Z",
      detail: "Alert payloads are ready for OAuth-backed channel delivery.",
    },
    {
      id: "int_hubspot",
      name: "HubSpot CRM",
      provider: "hubspot",
      mode: "mock",
      status: "healthy",
      lastSyncAt: "2026-05-30T07:51:00.000Z",
      detail:
        "Task and note payloads are idempotent and ready for private app tokens.",
    },
    {
      id: "int_triggerware",
      name: "TriggerWare workflows",
      provider: "triggerware",
      mode: "disabled",
      status: "disabled",
      lastSyncAt: null,
      detail:
        "Deferred until Slack and HubSpot production credentials are connected.",
    },
  ];

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "critical" && alert.status !== "dismissed",
  ).length;
  const averageScore = Math.round(
    competitorProfiles.reduce(
      (total, competitor) => total + competitor.scoreRun.score,
      0,
    ) / competitorProfiles.length,
  );

  return {
    summary: {
      workspaceName: "Demo Revenue Command",
      monitoredCompetitors: competitorProfiles.length,
      criticalAlerts,
      averageScore,
      openRevenueOpportunities: 14,
      lastIngestionAt: "2026-05-30T07:51:00.000Z",
    },
    competitors: competitorProfiles,
    alerts,
    integrations,
  };
}

export function findDemoCompetitor(name: string) {
  const data = getDemoCommandCenterData();
  const normalizedName = name.trim().toLowerCase();
  return data.competitors.find(
    (competitor) =>
      competitor.name.toLowerCase() === normalizedName ||
      competitor.domain.toLowerCase() === normalizedName ||
      competitor.id === normalizedName,
  );
}
