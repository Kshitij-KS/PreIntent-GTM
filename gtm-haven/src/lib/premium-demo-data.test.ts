import { describe, expect, it } from "vitest";
import { getConfidenceLevel, C } from "./premium-demo-data";

describe("getConfidenceLevel", () => {
  it('returns "Very High" for confidence >= 0.9', () => {
    const expected = {
      label: "Very High",
      color: C.pain,
      description: "Multiple corroborating sources, high data freshness",
    };
    expect(getConfidenceLevel(0.9)).toEqual(expected);
    expect(getConfidenceLevel(0.95)).toEqual(expected);
    expect(getConfidenceLevel(1.0)).toEqual(expected);
  });

  it('returns "High" for 0.8 <= confidence < 0.9', () => {
    const expected = {
      label: "High",
      color: "#60cc60",
      description: "Strong source reliability, good correlation",
    };
    expect(getConfidenceLevel(0.8)).toEqual(expected);
    expect(getConfidenceLevel(0.899)).toEqual(expected);
  });

  it('returns "Medium" for 0.7 <= confidence < 0.8', () => {
    const expected = {
      label: "Medium",
      color: C.compliance,
      description: "Single strong source or multiple weaker sources",
    };
    expect(getConfidenceLevel(0.7)).toEqual(expected);
    expect(getConfidenceLevel(0.799)).toEqual(expected);
  });

  it('returns "Developing" for confidence < 0.7', () => {
    const expected = {
      label: "Developing",
      color: C.muted,
      description: "Initial detection, awaiting corroboration",
    };
    expect(getConfidenceLevel(0.699)).toEqual(expected);
    expect(getConfidenceLevel(0.5)).toEqual(expected);
    expect(getConfidenceLevel(0)).toEqual(expected);
  });
});
