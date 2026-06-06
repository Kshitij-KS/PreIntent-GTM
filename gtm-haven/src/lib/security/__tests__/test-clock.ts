/**
 * Shared test utility: a controllable clock for deterministic time-based tests.
 *
 * The security primitives that depend on wall-clock time (the rate limiter's
 * fixed-window math and the response validator's timeouts) accept an injectable
 * `now()` function. This helper provides a manually-advanced clock so those
 * tests are deterministic and require no real timers or network.
 *
 * Usage (rate limiter):
 *   const clock = createTestClock(0);
 *   checkRateLimit(key, endpoint, { now: clock.now });
 *   clock.advance(60_000); // move past the window
 *
 * Usage (vitest fake timers, when a primitive reads the global clock directly):
 *   const timers = useFakeClock(); // installs vi.useFakeTimers()
 *   ...
 *   timers.advance(10_000);
 *   timers.restore();
 */
import { vi } from "vitest";

/** A monotonic, manually-advanced clock exposing an injectable `now()`. */
export interface TestClock {
  /** Returns the current simulated time in milliseconds since the epoch. */
  now: () => number;
  /** Advance the clock by `ms` milliseconds (must be >= 0). Returns the new time. */
  advance: (ms: number) => number;
  /** Set the clock to an absolute time in milliseconds. Returns the new time. */
  set: (ms: number) => number;
  /** Reset the clock back to its initial start time. */
  reset: () => void;
}

/**
 * Create a controllable clock starting at `startMs` (default 0).
 *
 * The returned `now` is a stable bound reference safe to pass into primitives
 * (e.g. `checkRateLimit(key, id, { now: clock.now })`).
 */
export function createTestClock(startMs = 0): TestClock {
  let current = startMs;

  const now = (): number => current;

  const advance = (ms: number): number => {
    if (ms < 0) {
      throw new Error(`createTestClock.advance expects ms >= 0, received ${ms}`);
    }
    current += ms;
    return current;
  };

  const set = (ms: number): number => {
    current = ms;
    return current;
  };

  const reset = (): void => {
    current = startMs;
  };

  return { now, advance, set, reset };
}

/** Controls a vitest fake-timer session for primitives that read the global clock. */
export interface FakeClockSession {
  /** Advance fake time and run any due timers by `ms` milliseconds. */
  advance: (ms: number) => void;
  /** Current fake time in milliseconds since the epoch. */
  now: () => number;
  /** Restore real timers. Always call this in an `afterEach`/`finally`. */
  restore: () => void;
}

/**
 * Install vitest fake timers anchored at `startMs` (default 0) for tests that
 * exercise code reading the global clock (e.g. `Date.now()` / `AbortSignal.timeout`).
 */
export function useFakeClock(startMs = 0): FakeClockSession {
  vi.useFakeTimers();
  vi.setSystemTime(startMs);

  return {
    advance: (ms: number) => {
      vi.advanceTimersByTime(ms);
    },
    now: () => Date.now(),
    restore: () => {
      vi.useRealTimers();
    },
  };
}
