import { describe, expect, it } from "vitest";
import {
  computeConvergenceScore,
  computeUrgency,
  evaluateThresholdActions,
} from "./convergence";

describe("computeConvergenceScore", () => {
  it("uses the default 33/33/33 engine weighting", () => {
    expect(computeConvergenceScore(84, 71, 91)).toBe(82);
  });

  it("clamps invalid weighted scores to the 0-100 range", () => {
    expect(computeConvergenceScore(200, 200, 200)).toBe(100);
    expect(computeConvergenceScore(-20, -20, -20)).toBe(0);
  });
});

describe("computeUrgency", () => {
  it("marks accounts as critical when any single engine reaches 100", () => {
    expect(computeUrgency(70, 100)).toBe("CRITICAL");
  });

  it("maps convergence bands to urgency tiers", () => {
    expect(computeUrgency(95, 95)).toBe("CRITICAL");
    expect(computeUrgency(85, 91)).toBe("HIGH");
    expect(computeUrgency(65, 84)).toBe("MEDIUM");
    expect(computeUrgency(49, 84)).toBe("LOW");
  });
});

describe("evaluateThresholdActions", () => {
  it("returns all threshold actions crossed by a high-convergence account", () => {
    const actions = evaluateThresholdActions({
      convergenceScore: 87,
      maxSingleEngineScore: 91,
      at: "2026-05-30T00:00:00.000Z",
    });

    expect(actions.map((action) => action.threshold)).toEqual([50, 65, 75, 85]);
    expect(actions.at(-1)?.action).toContain("Slack alert");
  });

  it("returns an immediate trigger when any single engine reaches 100", () => {
    const actions = evaluateThresholdActions({
      convergenceScore: 40,
      maxSingleEngineScore: 100,
      at: "2026-05-30T00:00:00.000Z",
    });

    expect(actions).toEqual([
      {
        threshold: 100,
        action: "Immediate trigger because one engine reached 100/100",
        at: "2026-05-30T00:00:00.000Z",
      },
    ]);
  });
});
