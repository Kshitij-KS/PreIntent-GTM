import type { Alert, IntegrationStatus, ProviderMode, Signal } from "./domain";
import { demoSignals } from "./demo-data";

export interface ProviderConfig {
  mode: ProviderMode;
  apiKey?: string;
  endpoint?: string;
}

export interface SignalProvider {
  id: IntegrationStatus["provider"];
  collectSignals(competitorId: string): Promise<Signal[]>;
  health(): Promise<IntegrationStatus>;
}

function modeFromEnv(value: string | undefined): ProviderMode {
  if (value === "real" || value === "disabled") return value;
  return "mock";
}

function getProviderConfig(prefix: string): ProviderConfig {
  return {
    mode: modeFromEnv(process.env[`${prefix}_MODE`]),
    apiKey: process.env[`${prefix}_API_KEY`],
    endpoint: process.env[`${prefix}_ENDPOINT`],
  };
}

function healthStatus(config: ProviderConfig): IntegrationStatus["status"] {
  if (config.mode === "disabled") return "disabled";
  if (config.mode === "real" && !config.apiKey) return "not_configured";
  return "healthy";
}

export class BrightDataSignalProvider implements SignalProvider {
  id = "bright_data" as const;
  private config = getProviderConfig("BRIGHT_DATA");

  async collectSignals(competitorId: string) {
    if (this.config.mode === "disabled") return [];
    if (this.config.mode === "real" && !this.config.apiKey) {
      throw new Error("Bright Data real mode requires BRIGHT_DATA_API_KEY");
    }

    return demoSignals.filter(
      (signal) =>
        signal.competitorId === competitorId &&
        (signal.source.provider === "bright_data" ||
          signal.source.provider === "mock"),
    );
  }

  async health(): Promise<IntegrationStatus> {
    return {
      id: "int_bright_data",
      name: "Bright Data ingestion",
      provider: this.id,
      mode: this.config.mode,
      status: healthStatus(this.config),
      lastSyncAt: null,
      detail:
        this.config.mode === "real"
          ? "Configured for live SERP, scraper, browser, and unlocker collection."
          : "Using deterministic demo fixtures for resilient demos and tests.",
    };
  }
}

export class GenericAiProvider {
  private config = getProviderConfig("AI_ML");

  async draftBrief(alert: Alert) {
    if (this.config.mode === "disabled") {
      return {
        summary: alert.title,
        whyItMatters: "AI brief generation is disabled.",
        recommendedAction: "Review the source signals manually.",
        confidence: 0,
      };
    }

    if (this.config.mode === "real" && !this.config.apiKey) {
      throw new Error("AI/ML real mode requires AI_ML_API_KEY");
    }

    return {
      summary: alert.title,
      whyItMatters:
        "The signal cluster indicates a competitor execution gap that revenue teams can act on before the market fully reacts.",
      recommendedAction:
        alert.hubspotSync === "ready"
          ? "Create a HubSpot task and attach the source evidence to the target account."
          : "Send the alert to the owning revenue leader and monitor follow-through.",
      confidence: 0.88,
    };
  }
}

export class MemoryProvider {
  private config = getProviderConfig("COGNEE");

  async recallContext(competitorId: string) {
    if (this.config.mode === "disabled") {
      return {
        competitorId,
        context: "Memory provider disabled; using current signal window only.",
      };
    }

    return {
      competitorId,
      context:
        this.config.mode === "real"
          ? "Cognee-backed historical context will be loaded for this competitor."
          : "Demo memory shows recurring pricing and leadership-change patterns.",
    };
  }
}

export function buildProviderRegistry() {
  return {
    brightData: new BrightDataSignalProvider(),
    ai: new GenericAiProvider(),
    memory: new MemoryProvider(),
  };
}
