import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { z } from "zod";
import { parseBody, parseParams, enforcePayloadSize } from "./input-validator";
import { MAX_PAYLOAD_BYTES } from "./schemas";

const schema = z.object({
  name: z.string().min(1),
  count: z.number().min(0).max(100),
});

function makeReq(contentLength: number | null): Request {
  const headers = new Headers();
  if (contentLength !== null) headers.set("content-length", String(contentLength));
  return new Request("https://example.com/api/x", { method: "POST", headers });
}

describe("input validator — invalid input rejection", () => {
  // Feature: preintent-security-quality-hardening, Property 2: Invalid input is rejected with no side effects
  // Validates: Requirements 1.1, 1.2, 1.3, 1.8, 2.6
  it("Property 2: non-conforming input always produces a failure result with field errors", () => {
    const invalidArb = fc.oneof(
      fc.record({ name: fc.constant(""), count: fc.integer({ min: 0, max: 100 }) }),
      fc.record({ name: fc.string(), count: fc.integer({ min: 101, max: 1000 }) }),
      fc.record({ count: fc.integer() }), // missing name
      fc.record({ name: fc.string() }), // missing count
      fc.anything().filter((v) => typeof v !== "object" || v === null),
    );

    fc.assert(
      fc.property(invalidArb, (input) => {
        const result = parseBody(schema, input);
        if (result.ok) {
          // If it parsed, it genuinely conformed — assert the oracle agrees.
          expect(schema.safeParse(input).success).toBe(true);
        } else {
          expect(result.errors.length).toBeGreaterThan(0);
          for (const e of result.errors) {
            expect(["missing", "malformed", "out_of_range"]).toContain(e.reason);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("categorizes a missing field as 'missing'", () => {
    const result = parseBody(schema, { count: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "name" && e.reason === "missing")).toBe(true);
    }
  });

  it("categorizes an out-of-range value as 'out_of_range'", () => {
    const result = parseBody(schema, { name: "x", count: 500 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "count" && e.reason === "out_of_range")).toBe(true);
    }
  });

  it("parseParams validates params against schema", () => {
    const paramSchema = z.object({ id: z.string().uuid() });
    expect(parseParams(paramSchema, { id: "not-a-uuid" }).ok).toBe(false);
    expect(parseParams(paramSchema, { id: "123e4567-e89b-12d3-a456-426614174000" }).ok).toBe(true);
  });
});

describe("payload size guard", () => {
  // Validates: Requirements 1.4
  it("allows requests at and below the limit, rejects above with 413", () => {
    expect(enforcePayloadSize(makeReq(MAX_PAYLOAD_BYTES)).ok).toBe(true);
    expect(enforcePayloadSize(makeReq(MAX_PAYLOAD_BYTES - 1)).ok).toBe(true);
    const over = enforcePayloadSize(makeReq(MAX_PAYLOAD_BYTES + 1));
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.status).toBe(413);
  });

  it("allows requests with no content-length header", () => {
    expect(enforcePayloadSize(makeReq(null)).ok).toBe(true);
  });
});
