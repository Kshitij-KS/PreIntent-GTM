import { describe, expect, it, vi } from "vitest";
import { completeCompanyOnboarding } from "./onboarding-completion";

describe("completeCompanyOnboarding", () => {
  it("does not mark onboarding complete when company intelligence persistence fails", async () => {
    const markComplete = vi.fn();

    await expect(
      completeCompanyOnboarding(
        { companyName: "Example" },
        {
          generateKnowledgeDoc: async () => ({ id: "doc-1" }),
          persistKnowledgeDoc: async () => {
            throw new Error("database write failed");
          },
          markComplete,
        },
      ),
    ).rejects.toThrow("database write failed");

    expect(markComplete).not.toHaveBeenCalled();
  });

  it("marks onboarding complete only after company intelligence is persisted", async () => {
    const steps: string[] = [];

    await completeCompanyOnboarding(
      { companyName: "Example" },
      {
        generateKnowledgeDoc: async () => {
          steps.push("generate");
          return { id: "doc-1" };
        },
        persistKnowledgeDoc: async () => {
          steps.push("persist");
        },
        markComplete: async () => {
          steps.push("complete");
        },
      },
    );

    expect(steps).toEqual(["generate", "persist", "complete"]);
  });
});
