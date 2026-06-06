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

  it("handles boundary values correctly", () => {
    // CRITICAL bounds
    expect(computeUrgency(95, 0)).toBe("CRITICAL"); // Exact boundary for CRITICAL
    expect(computeUrgency(94, 100)).toBe("CRITICAL"); // maxSingleEngine overrides

    // HIGH bounds
    expect(computeUrgency(94, 99)).toBe("HIGH"); // Upper bound for HIGH
    expect(computeUrgency(85, 0)).toBe("HIGH"); // Lower bound for HIGH

    // MEDIUM bounds
    expect(computeUrgency(84, 99)).toBe("MEDIUM"); // Upper bound for MEDIUM
    expect(computeUrgency(65, 0)).toBe("MEDIUM"); // Lower bound for MEDIUM

    // LOW bounds
    expect(computeUrgency(64, 99)).toBe("LOW"); // Upper bound for LOW
    expect(computeUrgency(0, 0)).toBe("LOW"); // Absolute minimum
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

import fc from "fast-check";

describe("convergence score range invariant", () => {
  // Feature: preintent-security-quality-hardening, Property 18: Convergence score range invariant
  // Validates: Requirements 10.5
  it("Property 18: score is always within 0..100 for any sub-score triple", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (voidSub, complianceSub, painSub) => {
          const score = computeConvergenceScore(voidSub, complianceSub, painSub);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 18: stays in range even for out-of-bounds inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        (a, b, c) => {
          const score = computeConvergenceScore(a, b, c);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });
});
