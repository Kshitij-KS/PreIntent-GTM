import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  toErrorResponse,
  validationErrorResponse,
  type SanitizedErrorBody,
} from "./error-responder";
import type { ValidationFieldError } from "./input-validator";

describe("error responder — sanitization", () => {
  // Feature: preintent-security-quality-hardening, Property 5: Client error responses are sanitized
  // Validates: Requirements 4.1, 4.2, 8.2
  it("Property 5: sanitized body never contains sensitive tokens from the error", async () => {
    const sensitive = fc.oneof(
      fc.constant("at Object.<anonymous> (/srv/app/secret.ts:42:13)"),
      fc.constant("ECONNREFUSED 10.0.0.5:5432"),
      fc.constant("password=hunter2supersecret"),
      fc.constant("/var/www/internal/secret/path"),
      fc.constant("table organization_members violates constraint"),
      fc.string({ minLength: 12, maxLength: 60 }).map((s) => `internal-detail-${s}`),
    );

    await fc.assert(
      fc.asyncProperty(sensitive, fc.uuid(), async (msg, cid) => {
        const res = toErrorResponse(new Error(msg), cid);
        expect(res.status).toBe(500);
        const body = (await res.json()) as SanitizedErrorBody;
        // The raw error message is never echoed.
        expect(JSON.stringify(body).includes(msg)).toBe(false);
        expect(body.correlationId).toBe(cid);
        expect(body.category).toBe("server");
      }),
      { numRuns: 100 },
    );
  });

  // Feature: preintent-security-quality-hardening, Property 6: Correlation id is echoed to the caller
  // Validates: Requirements 4.4
  it("Property 6: correlation id is echoed in body and header", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (cid) => {
        const res = toErrorResponse(new Error("x"), cid);
        const body = (await res.json()) as SanitizedErrorBody;
        expect(body.correlationId).toBe(cid);
        expect(res.headers.get("x-correlation-id")).toBe(cid);
      }),
      { numRuns: 100 },
    );
  });
});

describe("validation error rendering", () => {
  // Feature: preintent-security-quality-hardening, Property 7: Validation error rendering is complete and internal-detail-free
  // Validates: Requirements 4.5
  it("Property 7: names every failed field with a reason category", async () => {
    const fieldErrorArb: fc.Arbitrary<ValidationFieldError> = fc.record({
      field: fc.string({ minLength: 1, maxLength: 20 }),
      reason: fc.constantFrom("missing", "malformed", "out_of_range"),
    });

    await fc.assert(
      fc.asyncProperty(fc.array(fieldErrorArb, { minLength: 1, maxLength: 10 }), fc.uuid(), async (errors, cid) => {
        const res = validationErrorResponse(errors, cid);
        expect(res.status).toBe(400);
        const body = (await res.json()) as SanitizedErrorBody;
        expect(body.category).toBe("validation");
        expect(body.fields).toHaveLength(errors.length);
        for (let i = 0; i < errors.length; i += 1) {
          expect(body.fields?.[i].field).toBe(errors[i].field);
          expect(["missing", "malformed", "out_of_range"]).toContain(body.fields?.[i].reason);
        }
      }),
      { numRuns: 100 },
    );
  });
});
