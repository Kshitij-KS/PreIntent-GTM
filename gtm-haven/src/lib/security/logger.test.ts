import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  buildLogRecord,
  redactString,
  isSeverityEnabled,
  REDACTION_PLACEHOLDER,
  type Severity,
} from "./logger";

const SEVERITIES: Severity[] = ["debug", "info", "warn", "error"];

describe("logger redaction", () => {
  // Feature: preintent-security-quality-hardening, Property 4: Secret and PII values are redacted in logs
  // Validates: Requirements 3.6, 8.6
  it("Property 4: replaces secret values and PII with the fixed placeholder", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 40 }).filter((s) => !s.includes("@")),
        fc.string({ minLength: 1, maxLength: 20 }),
        (secretValue, surrounding) => {
          const env = { MY_API_KEY: secretValue } as Record<string, string | undefined>;
          const message = `${surrounding} ${secretValue} ${surrounding}`;
          const record = buildLogRecord("info", "src", "cid-1", message, { token: secretValue }, env);

          // The literal secret never appears in the emitted record.
          const serialized = JSON.stringify(record);
          expect(serialized.includes(secretValue)).toBe(false);
          expect(record.message.includes(REDACTION_PLACEHOLDER)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("redacts email PII", () => {
    const out = redactString("contact alice@example.com now", {});
    expect(out).not.toContain("alice@example.com");
    expect(out).toContain(REDACTION_PLACEHOLDER);
  });

  it("redacts values under secret-like keys regardless of content", () => {
    const record = buildLogRecord("info", "src", "cid", "msg", { SUPABASE_SERVICE_ROLE_KEY: "abc123" }, {});
    expect(record.meta?.SUPABASE_SERVICE_ROLE_KEY).toBe(REDACTION_PLACEHOLDER);
  });
});

describe("logger record structure", () => {
  // Feature: preintent-security-quality-hardening, Property 15: Log records are structurally complete
  // Validates: Requirements 8.3
  it("Property 15: every record has severity, source, correlationId, timestamp", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SEVERITIES),
        fc.string(),
        fc.string(),
        fc.string(),
        (severity, source, correlationId, message) => {
          const record = buildLogRecord(severity, source, correlationId, message, undefined, {});
          expect(SEVERITIES).toContain(record.severity);
          expect(record.source).toBe(source);
          expect(record.correlationId).toBe(correlationId);
          expect(typeof record.timestamp).toBe("string");
          expect(Number.isNaN(Date.parse(record.timestamp))).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: preintent-security-quality-hardening, Property 16: One correlation id per request
  // Validates: Requirements 8.4
  it("Property 16: all records built for a request carry the same correlation id", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.array(fc.string(), { minLength: 1, maxLength: 8 }), (cid, messages) => {
        const records = messages.map((m) => buildLogRecord("info", "src", cid, m, undefined, {}));
        expect(records.every((r) => r.correlationId === cid)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

describe("logger level suppression", () => {
  // Feature: preintent-security-quality-hardening, Property 17: Log level suppression
  // Validates: Requirements 8.7
  it("Property 17: a record is enabled iff its severity is at or above the configured level", () => {
    const order: Record<Severity, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    fc.assert(
      fc.property(fc.constantFrom(...SEVERITIES), fc.constantFrom(...SEVERITIES), (configured, severity) => {
        const expected = order[severity] >= order[configured];
        expect(isSeverityEnabled(severity, configured)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});
