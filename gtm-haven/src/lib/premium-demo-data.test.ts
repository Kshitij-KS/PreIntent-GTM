import { describe, it, expect } from "vitest";
import { calculateROI } from "./premium-demo-data";

describe("calculateROI", () => {
  it("calculates ROI correctly for standard inputs (happy path)", () => {
    // expectedValue = 10000 * 0.2 = 2000
    // dailyValue = 2000 / 30 = 66.666...
    // advantageValue = 66.666... * 3 = 200
    // roi = (200 / 1000) * 100 = 20
    // paybackDeals = Math.ceil(1000 / 2000) = 1
    const result = calculateROI("Acme Corp", 10000, 20, 30);

    expect(result).toMatchObject({
      account: "Acme Corp",
      acv: 10000,
      winRate: 20,
      salesCycle: 30,
      timeAdvantage: 3,
      pipelineValue: 10000,
      expectedValue: 2000,
      preintentCost: 1000,
      roi: 20,
      paybackDeals: 1,
    });
  });

  it("calculates ROI correctly with a custom time advantage", () => {
    // expectedValue = 10000 * 0.2 = 2000
    // dailyValue = 2000 / 30 = 66.666...
    // advantageValue = 66.666... * 6 = 400
    // roi = (400 / 1000) * 100 = 40
    const result = calculateROI("Tech Global", 10000, 20, 30, 6);

    expect(result).toMatchObject({
      account: "Tech Global",
      timeAdvantage: 6,
      roi: 40,
    });
    // Expected value and daily value are same, so payback deals shouldn't change
    expect(result.paybackDeals).toBe(1);
  });

  it("handles zero win rate gracefully", () => {
    // expectedValue = 0
    // dailyValue = 0
    // advantageValue = 0
    // roi = 0
    // paybackDeals = Math.ceil(1000 / 0) = Infinity
    const result = calculateROI("Lost Cause", 10000, 0, 30);

    expect(result).toMatchObject({
      expectedValue: 0,
      roi: 0,
      paybackDeals: Infinity,
    });
  });

  it("handles zero ACV gracefully", () => {
    // expectedValue = 0
    // dailyValue = 0
    // advantageValue = 0
    // roi = 0
    // paybackDeals = Math.ceil(1000 / 0) = Infinity
    const result = calculateROI("Freebie", 0, 20, 30);

    expect(result).toMatchObject({
      expectedValue: 0,
      roi: 0,
      paybackDeals: Infinity,
    });
  });

  it("handles decimal results correctly without throwing errors", () => {
    // Edge case with non-integer division
    // expectedValue = 5000 * 0.15 = 750
    // dailyValue = 750 / 45 = 16.666...
    // advantageValue = 16.666... * 3 = 50
    // roi = (50 / 1000) * 100 = 5
    // paybackDeals = Math.ceil(1000 / 750) = 2
    const result = calculateROI("Decimals", 5000, 15, 45);

    expect(result.roi).toBeCloseTo(5);
    expect(result.paybackDeals).toBe(2);
  });
});
