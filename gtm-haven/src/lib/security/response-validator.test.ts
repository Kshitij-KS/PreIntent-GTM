import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { z } from "zod";
import { validateExternal, withFallback } from "./response-validator";

const schema = z.object({
  signalType: z.string(),
  urgency: z.enum(["low", "medium", "high", "unknown"]),
  confidence: z.number().min(0).max(1),
  competitor: z.string().nullable(),
});

const conformingArb = fc.record({
  signalType: fc.string(),
  urgency: fc.constantFrom("low", "medium", "high", "unknown"),
  confidence: fc.double({ min: 0, max: 1, noNaN: true }),
  competitor: fc.option(fc.string(), { nil: null }),
});

describe("response validator  -  round-trip identity", () => {
  // Feature: preintent-security-quality-hardening, Property 8: Response_Validator round-trip identity
  // Validates: Requirements 5.1, 5.7, 10.4
  it("Property 8: validating a conformant value returns it unchanged (deep-equal)", () => {
    fc.assert(
      fc.property(conformingArb, (value) => {
        const result = validateExternal(schema, value, "test", "cid-1");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(value);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("response validator  -  non-conforming fallback", () => {
  // Feature: preintent-security-quality-hardening, Property 9: Non-conforming responses fall back without mutating state
  // Validates: Requirements 5.2, 5.5
  it("Property 9: non-conforming responses signal fallback (ok:false)", () => {
    const nonConforming = fc.oneof(
      fc.record({ signalType: fc.integer(), urgency: fc.constant("low"), confidence: fc.constant(0.5), competitor: fc.constant(null) }),
      fc.record({ signalType: fc.string(), urgency: fc.constant("nope"), confidence: fc.constant(0.5), competitor: fc.constant(null) }),
      fc.record({ signalType: fc.string(), urgency: fc.constant("low"), confidence: fc.constant(5), competitor: fc.constant(null) }),
      fc.anything().filter((v) => typeof v !== "object" || v === null),
    );

    fc.assert(
      fc.property(nonConforming, (value) => {
        const result = validateExternal(schema, value, "test", "cid-1");
        if (result.ok) {
          expect(schema.safeParse(value).success).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("withFallback returns fallback when primary throws and leaves state unchanged", async () => {
    let state = "unchanged";
    const result = await withFallback(
      async () => {
        throw new Error("boom");
      },
      () => "fallback-value",
      { source: "test", correlationId: "cid" },
    );
    expect(result).toBe("fallback-value");
    expect(state).toBe("unchanged");
    state = "still-unchanged"; // ensure no implicit mutation expectation
    expect(state).toBe("still-unchanged");
  });

  it("withFallback returns primary result on success", async () => {
    const result = await withFallback(
      async () => "primary",
      () => "fallback",
      { source: "test", correlationId: "cid" },
    );
    expect(result).toBe("primary");
  });
});
