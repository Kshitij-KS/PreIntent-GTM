import { describe, it, expect, afterEach } from "vitest";
import fc from "fast-check";
import { checkRateLimit, callerKeyFrom, __setRateStore } from "./rate-limiter";
import { createTestClock } from "./__tests__/test-clock";

afterEach(() => __setRateStore(null));

describe("rate limiter  -  window enforcement", () => {
  // Feature: preintent-security-quality-hardening, Property 10: Rate-limit window enforcement
  // Validates: Requirements 6.1, 6.2, 6.4
  it("Property 10: first 10 allowed, 11th rejected with Retry-After in 1..60", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (startMs) => {
        __setRateStore(null); // fresh in-process store per run
        const clock = createTestClock(startMs);
        const key = `caller-${startMs}`;
        const endpoint = `endpoint-${startMs}`;

        for (let i = 0; i < 10; i += 1) {
          const d = checkRateLimit(key, endpoint, { now: clock.now });
          expect(d.allowed).toBe(true);
        }
        const rejected = checkRateLimit(key, endpoint, { now: clock.now });
        expect(rejected.allowed).toBe(false);
        expect(rejected.status).toBe(429);
        expect(rejected.retryAfterSeconds).toBeGreaterThanOrEqual(1);
        expect(rejected.retryAfterSeconds).toBeLessThanOrEqual(60);
      }),
      { numRuns: 100 },
    );
  });

  it("allows again after the window elapses", () => {
    __setRateStore(null);
    const clock = createTestClock(0);
    for (let i = 0; i < 10; i += 1) checkRateLimit("c", "e", { now: clock.now });
    expect(checkRateLimit("c", "e", { now: clock.now }).allowed).toBe(false);
    clock.advance(60_001);
    expect(checkRateLimit("c", "e", { now: clock.now }).allowed).toBe(true);
  });

  it("fails closed with Retry-After 60 when the store throws", () => {
    __setRateStore({
      get() {
        throw new Error("backend down");
      },
      set() {
        throw new Error("backend down");
      },
    });
    const d = checkRateLimit("c", "e");
    expect(d.allowed).toBe(false);
    expect(d.retryAfterSeconds).toBe(60);
    expect(d.status).toBe(429);
  });
});

describe("rate limiter  -  budget independence", () => {
  // Feature: preintent-security-quality-hardening, Property 11: Rate-limit budgets are independent per caller and per endpoint
  // Validates: Requirements 6.3, 6.5
  it("Property 11: exhausting one (caller,endpoint) does not affect another", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })),
        fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })),
        ([callerA, endpointA], [callerB, endpointB]) => {
          fc.pre(callerA !== callerB || endpointA !== endpointB);
          __setRateStore(null);
          const clock = createTestClock(0);

          for (let i = 0; i < 10; i += 1) checkRateLimit(callerA, endpointA, { now: clock.now });
          expect(checkRateLimit(callerA, endpointA, { now: clock.now }).allowed).toBe(false);

          // The other (caller,endpoint) budget is untouched.
          expect(checkRateLimit(callerB, endpointB, { now: clock.now }).allowed).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("derives caller key from userId else source IP", () => {
    const reqWithIp = new Request("https://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(callerKeyFrom("user-1", reqWithIp)).toBe("user:user-1");
    expect(callerKeyFrom(null, reqWithIp)).toBe("ip:1.2.3.4");
  });
});
