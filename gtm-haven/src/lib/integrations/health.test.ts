import { describe, expect, it } from "vitest";
import { getIntegrationStatuses } from "./health";

describe("getIntegrationStatuses", () => {
  it("reports mock integrations as healthy without API keys", () => {
    const statuses = getIntegrationStatuses({
      BRIGHT_DATA_MODE: "mock",
      AI_ML_MODE: "mock",
      FEATHERLESS_MODE: "mock",
      SPEECHMATICS_MODE: "mock",
      COGNEE_MODE: "mock",
      TRIGGERWARE_MODE: "mock",
    });

    expect(statuses.length).toBeGreaterThanOrEqual(6);
    expect(statuses.every((status) => status.status === "healthy")).toBe(true);
  });

  it("reports real integrations without keys as not configured", () => {
    const statuses = getIntegrationStatuses({
      BRIGHT_DATA_MODE: "real",
      AI_ML_MODE: "real",
      FEATHERLESS_MODE: "real",
      SPEECHMATICS_MODE: "real",
      COGNEE_MODE: "mock",
      TRIGGERWARE_MODE: "real",
    });

    expect(statuses.find((status) => status.id === "bright_data")?.status).toBe(
      "not_configured",
    );
    expect(statuses.find((status) => status.id === "ai_ml_api")?.status).toBe(
      "not_configured",
    );
    expect(statuses.find((status) => status.id === "cognee")?.status).toBe(
      "healthy",
    );
  });

  it("marks disabled integrations as disabled", () => {
    const statuses = getIntegrationStatuses({
      BRIGHT_DATA_MODE: "disabled",
      AI_ML_MODE: "disabled",
    });

    expect(statuses.find((status) => status.id === "bright_data")?.status).toBe(
      "disabled",
    );
    expect(statuses.find((status) => status.id === "ai_ml_api")?.status).toBe(
      "disabled",
    );
  });
});
