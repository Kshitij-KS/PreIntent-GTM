import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import {
  saveProfile,
  loadProfile,
  clearAllProfiles,
  COGNEE_STORAGE_KEY,
} from "./cognee";
import type { AccountIntelligenceProfile } from "./domain";

beforeEach(() => {
  clearAllProfiles();
  localStorage.clear();
});

// ─── Generators ────────────────────────────────────────────────────────────────

const engineSignalArb = fc.record({
  id: fc.string(),
  engine: fc.constantFrom("void" as const, "compliance" as const, "pain" as const),
  title: fc.string(),
  description: fc.string(),
  eventTime: fc.constant(new Date().toISOString()),
  subScore: fc.integer({ min: 0, max: 100 }),
  confidence: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }).map((x) => (Object.is(x, -0) ? 0 : x)),
  provenance: fc.record({
    sponsor: fc.constantFrom("bright_data" as const, "featherless" as const, "mock" as const),
    capturedAt: fc.constant(new Date().toISOString()),
  }),
});

const sectionArb = fc.record({
  signals: fc.array(engineSignalArb, { maxLength: 3 }),
  subScore: fc.integer({ min: 0, max: 100 }),
});

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const arbitraryProfile: fc.Arbitrary<AccountIntelligenceProfile> = fc.record({
  // Account is used as an object key in the store. JS-reserved property names
  // (__proto__, prototype, constructor) are excluded: they have special
  // object-key semantics and are not realistic account names. Loading such a
  // key is still handled safely (it is dropped, never crashes or pollutes).
  account: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => !DANGEROUS_KEYS.has(s)),
  industry: fc.string(),
  employees: fc.oneof(fc.integer({ min: 0, max: 100000 }), fc.string()),
  crmStage: fc.string(),
  lastUpdated: fc.constant(new Date().toISOString()),
  void: sectionArb,
  compliance: sectionArb,
  pain: sectionArb,
  convergenceScore: fc.integer({ min: 0, max: 100 }),
  urgency: fc.constantFrom("LOW" as const, "MEDIUM" as const, "HIGH" as const, "CRITICAL" as const),
});

describe("cognee round-trip", () => {
  // Feature: preintent-security-quality-hardening, Property 12: Cognee round-trip equivalence
  // Validates: Requirements 7.8, 10.3
  it("Property 12: writing a valid profile then reading it back is equivalent", () => {
    fc.assert(
      fc.property(arbitraryProfile, (profile) => {
        localStorage.clear();
        saveProfile(profile);
        const readBack = loadProfile(profile.account);
        expect(readBack).not.toBeNull();
        if (readBack) {
          // lastUpdated is write-stamped; compare all other schema fields.
          const normalize = (p: AccountIntelligenceProfile) => ({ ...p, lastUpdated: "" });
          expect(normalize(readBack)).toEqual(normalize(profile));
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("cognee load discards invalid data safely", () => {
  // Feature: preintent-security-quality-hardening, Property 13: Cognee load discards invalid data safely
  // Validates: Requirements 7.1, 7.2, 7.3, 7.4
  it("Property 13: invalid stored values yield an empty profile set without throwing", () => {
    const invalidStored = fc.oneof(
      fc.constant("}{ not json"),
      fc.constant("[]"),
      fc.constant('{"acme":{"missing":"fields"}}'),
      fc.constant('{"acme":123}'),
      fc.string(),
    );
    fc.assert(
      fc.property(invalidStored, (raw) => {
        localStorage.setItem(COGNEE_STORAGE_KEY, raw);
        // loadProfile triggers loadAll; must not throw and returns null for any key.
        expect(() => loadProfile("acme")).not.toThrow();
        expect(loadProfile("acme")).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it("discards a collection exceeding 10,000 records", () => {
    const oversized: Record<string, unknown> = {};
    for (let i = 0; i < 10_001; i += 1) oversized[`acct-${i}`] = { not: "valid" };
    localStorage.setItem(COGNEE_STORAGE_KEY, JSON.stringify(oversized));
    expect(loadProfile("acct-0")).toBeNull();
  });
});

describe("cognee write persists only conformant records", () => {
  // Feature: preintent-security-quality-hardening, Property 14: Cognee write persists only conformant records
  // Validates: Requirements 7.6
  it("Property 14: a non-conformant record is rejected without being persisted", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (account) => {
        localStorage.clear();
        // Cast a clearly non-conformant object through the public API.
        const bad = { account, industry: "x" } as unknown as AccountIntelligenceProfile;
        saveProfile(bad);
        expect(loadProfile(account)).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
