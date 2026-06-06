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

import fc from "fast-check";

describe("integration status — secret non-leak", () => {
  // Feature: preintent-security-quality-hardening, Property 3: Integration status never leaks secret values
  // Validates: Requirements 3.3, 3.4
  it("Property 3: status never contains a secret value; presence is a boolean", () => {
    const secretArb = fc.string({ minLength: 8, maxLength: 40 });
    fc.assert(
      fc.property(secretArb, secretArb, secretArb, (brightKey, aiKey, featherKey) => {
        const env: Record<string, string | undefined> = {
          BRIGHT_DATA_MODE: "real",
          BRIGHT_DATA_API_KEY: brightKey,
          AI_ML_MODE: "real",
          AI_ML_API_KEY: aiKey,
          FEATHERLESS_MODE: "real",
          FEATHERLESS_API_KEY: featherKey,
        };
        const statuses = getIntegrationStatuses(env);
        const serialized = JSON.stringify(statuses);

        // No secret value appears anywhere in the serialized status.
        for (const secret of [brightKey, aiKey, featherKey]) {
          if (secret.length >= 8) {
            expect(serialized.includes(secret)).toBe(false);
          }
        }
        // configured is a boolean on every status.
        for (const status of statuses) {
          expect(typeof status.configured).toBe("boolean");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("real-mode adapter missing its key reports not_configured (mock fallback)", () => {
    const statuses = getIntegrationStatuses({ BRIGHT_DATA_MODE: "real" });
    const bright = statuses.find((s) => s.id === "bright_data");
    expect(bright?.status).toBe("not_configured");
    expect(bright?.configured).toBe(false);
  });

  it("configured is true for keyed real-mode adapters", () => {
    const statuses = getIntegrationStatuses({ BRIGHT_DATA_MODE: "real", BRIGHT_DATA_API_KEY: "secret-value-123" });
    const bright = statuses.find((s) => s.id === "bright_data");
    expect(bright?.configured).toBe(true);
    expect(bright?.status).toBe("live");
  });
});
