import type { IntegrationStatus, ProviderMode } from "../domain";

type EnvMap = Record<string, string | undefined>;

const PROVIDERS = [
  {
    id: "bright_data",
    name: "Bright Data",
    provider: "bright_data",
    modeKey: "BRIGHT_DATA_MODE",
    keyNames: ["BRIGHT_DATA_API_KEY"],
    mockDetail: "Mocked scraping responses with Scraping Browser, Web Unlocker, SERP API, Web Scraper API, and MCP tags.",
  },
  {
    id: "ai_ml_api",
    name: "AI/ML API",
    provider: "ai_ml_api",
    modeKey: "AI_ML_MODE",
    keyNames: ["AI_ML_API_KEY"],
    mockDetail: "Mock Intel Brief generation; real mode uses server-side API key.",
  },
  {
    id: "featherless",
    name: "Featherless AI",
    provider: "featherless",
    modeKey: "FEATHERLESS_MODE",
    keyNames: ["FEATHERLESS_API_KEY", "GROQ_API_KEY", "GEMINI_API_KEY"],
    mockDetail: "Mock pain signal classification with open-model style output.",
  },
  {
    id: "speechmatics",
    name: "Speechmatics",
    provider: "speechmatics",
    modeKey: "SPEECHMATICS_MODE",
    keyNames: ["SPEECHMATICS_API_KEY"],
    mockDetail: "Mock podcast and video transcripts with Speechmatics provenance.",
  },
  {
    id: "cognee",
    name: "Cognee",
    provider: "cognee",
    modeKey: "COGNEE_MODE",
    keyNames: [],
    mockDetail: "Browser localStorage Account Intelligence Profiles for the zero-cost MVP.",
  },
  {
    id: "triggerware",
    name: "TriggerWare",
    provider: "triggerware",
    modeKey: "TRIGGERWARE_MODE",
    keyNames: ["TRIGGERWARE_API_KEY", "TRIGGERWARE_WEBHOOK_URL"],
    mockDetail: "Mock workflow routing previews; real mode POSTs to TRIGGERWARE_WEBHOOK_URL on threshold.",
  },
  {
    id: "slack",
    name: "Slack",
    provider: "triggerware",
    modeKey: "SLACK_MODE",
    keyNames: ["SLACK_WEBHOOK_URL"],
    mockDetail: "Slack alert preview; real mode posts to incoming webhook when convergence ≥ 85.",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    provider: "triggerware",
    modeKey: "HUBSPOT_MODE",
    keyNames: ["HUBSPOT_WEBHOOK_URL", "HUBSPOT_API_KEY"],
    mockDetail: "CRM lead preview; real mode POSTs to HUBSPOT_WEBHOOK_URL on threshold.",
  },
] as const;

function normalizeMode(value: string | undefined): ProviderMode {
  if (value === "real" || value === "disabled") return value;
  return "mock";
}

function hasAnyKey(env: EnvMap, keyNames: readonly string[]) {
  return keyNames.some((key) => Boolean(env[key]?.trim()));
}

export function getIntegrationStatuses(env: EnvMap = process.env): IntegrationStatus[] {
  const now = new Date().toISOString();

  return PROVIDERS.map((providerConfig) => {
    const mode = normalizeMode(env[providerConfig.modeKey]);
    const hasKey = hasAnyKey(env, providerConfig.keyNames);
    // Presence-only boolean — never expose the secret value or any substring (Req 3.3).
    const configured = providerConfig.keyNames.length === 0 ? true : hasKey;

    if (mode === "disabled") {
      return {
        id: providerConfig.id,
        name: providerConfig.name,
        provider: providerConfig.provider,
        mode,
        status: "disabled",
        configured,
        lastSyncAt: null,
        detail: "Disabled by environment mode.",
      };
    }

    if (mode === "real" && providerConfig.keyNames.length > 0 && !hasKey) {
      // Real mode requested but key absent → not_configured + mock fallback (Req 3.4, 3.5).
      return {
        id: providerConfig.id,
        name: providerConfig.name,
        provider: providerConfig.provider,
        mode,
        status: "not_configured",
        configured: false,
        lastSyncAt: null,
        detail: `Set one of ${providerConfig.keyNames.join(", ")} to enable real mode.`,
      };
    }

    return {
      id: providerConfig.id,
      name: providerConfig.name,
      provider: providerConfig.provider,
      mode,
      status: mode === "real" ? "live" : "healthy",
      configured,
      lastSyncAt: mode === "real" ? now : null,
      detail: mode === "real" ? "Configured for server-side live calls." : providerConfig.mockDetail,
    };
  });
}
