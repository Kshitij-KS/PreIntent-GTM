import { describe, expect, it } from "vitest";
import type { Signal } from "./domain";
import { getSeverity, scoreSignals } from "./scoring";

const baseSignal: Signal = {
  id: "sig_1",
  competitorId: "acme",
  type: "executive_change",
  title: "CTO departed",
  description: "Leadership disruption",
  eventTime: "2026-05-30T00:00:00.000Z",
  impactScore: 30,
  confidence: 1,
  entities: {},
  source: {
    id: "src_1",
    provider: "mock",
    label: "Mock source",
    url: "https://example.com/source",
    capturedAt: "2026-05-30T00:01:00.000Z",
    sourceQuality: 1,
  },
};

describe("scoreSignals", () => {
  it("scores with confidence, source quality, and category weighting", () => {
    const run = scoreSignals(
      "acme",
      [baseSignal],
      new Date("2026-05-30T08:00:00.000Z"),
    );

    expect(run.score).toBe(32);
    expect(run.severity).toBe("medium");
    expect(run.contributions[0]?.recencyDecay).toBe(0);
  });

  it("does not use absolute dates for future events", () => {
    const futureSignal = {
      ...baseSignal,
      eventTime: "2026-06-30T00:00:00.000Z",
    };

    const run = scoreSignals(
      "acme",
      [futureSignal],
      new Date("2026-05-30T08:00:00.000Z"),
    );

    expect(run.contributions[0]?.recencyDecay).toBe(0);
  });

  it("caps category contribution and total score", () => {
    const signals = Array.from({ length: 5 }, (_, index) => ({
      ...baseSignal,
      id: `sig_${index}`,
      impactScore: 40,
    }));

    const run = scoreSignals(
      "acme",
      signals,
      new Date("2026-05-30T08:00:00.000Z"),
    );

    expect(run.score).toBe(32);
  });
});

describe("getSeverity", () => {
  it.each([
    [80, "critical"],
    [55, "high"],
    [30, "medium"],
    [10, "low"],
  ] as const)("maps %i to %s", (score, severity) => {
    expect(getSeverity(score)).toBe(severity);
  });
});
