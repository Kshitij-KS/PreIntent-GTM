/**
 * Smoke test for the property-test infrastructure (task 1.1).
 *
 * Confirms that:
 *  - this file under `src/lib/security/**` is picked up by the vitest include glob,
 *  - `fast-check` resolves and runs property checks, and
 *  - the shared controllable clock behaves deterministically.
 *
 * This is intentionally minimal; the real property tests live alongside the
 * primitives they validate.
 */
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { createTestClock } from "./test-clock";

describe("property-test infrastructure", () => {
  it("runs fast-check property checks (numRuns: 100)", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 },
    );
  });

  describe("createTestClock", () => {
    it("starts at the provided time and advances deterministically", () => {
      const clock = createTestClock(1_000);
      expect(clock.now()).toBe(1_000);
      expect(clock.advance(500)).toBe(1_500);
      expect(clock.now()).toBe(1_500);
    });

    it("supports absolute set and reset to the start time", () => {
      const clock = createTestClock(10);
      clock.set(9_999);
      expect(clock.now()).toBe(9_999);
      clock.reset();
      expect(clock.now()).toBe(10);
    });

    it("rejects negative advances", () => {
      const clock = createTestClock(0);
      expect(() => clock.advance(-1)).toThrow();
    });
  });
});
