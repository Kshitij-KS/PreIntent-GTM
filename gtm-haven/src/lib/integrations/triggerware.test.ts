import { describe, expect, it } from "vitest";
import type { AccountIntelligenceProfile } from "../domain";
import { previewTriggerWareWorkflow } from "./triggerware";

const profile: AccountIntelligenceProfile = {
  account: "Acme FinTech",
  industry: "FinTech / Payments",
  employees: 340,
  crmStage: "Not in pipeline",
  lastUpdated: "2026-05-30T00:00:00.000Z",
  void: { signals: [], subScore: 84 },
  compliance: { signals: [], subScore: 71 },
  pain: { signals: [], subScore: 91 },
  convergenceScore: 87,
  urgency: "HIGH",
};

describe("previewTriggerWareWorkflow", () => {
  it("returns CRM, Slack, and brief payload previews when the alert threshold is crossed", () => {
    const workflow = previewTriggerWareWorkflow(profile, {
      TRIGGERWARE_MODE: "mock",
      SLACK_MODE: "mock",
      HUBSPOT_MODE: "mock",
    });

    expect(workflow.fired).toBe(true);
    expect(workflow.mode).toBe("mock");
    expect(workflow.steps.map((step) => step.id)).toEqual([
      "threshold",
      "crm",
      "slack",
      "brief",
    ]);
    expect(workflow.payloads.slack?.text).toContain("Acme FinTech");
    expect(workflow.payloads.crm?.companyName).toBe("Acme FinTech");
  });

  it("does not fire when convergence stays below 85", () => {
    const workflow = previewTriggerWareWorkflow(
      { ...profile, convergenceScore: 74, urgency: "MEDIUM" },
      { TRIGGERWARE_MODE: "mock" },
    );

    expect(workflow.fired).toBe(false);
    expect(workflow.steps).toEqual([]);
  });
});
