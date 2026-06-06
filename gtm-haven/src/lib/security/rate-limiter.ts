/**
 * Rate_Limiter  -  in-process rolling-window limiter with fail-closed behavior.
 *
 * Default budget: 10 requests / 60s per (callerKey, endpointId) (Req 6.1, 6.2).
 * Budgets are independent per caller and per endpoint (Req 6.5). When the
 * tracking store is unavailable the decision is fail-closed 429 with
 * Retry-After 60 (Req 6.7).
 *
 * The clock is injectable so window math is deterministic in tests.
 */

export interface RateDecision {
  allowed: boolean;
  retryAfterSeconds?: number;
  status?: 429;
}

export interface RateLimitOptions {
  max?: number;
  windowSeconds?: number;
  now?: () => number;
}

const DEFAULT_MAX = 10;
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * The tracking store maps a composite key to the timestamps (ms) of recent
 * requests within the window. Wrapped in an object so a test can replace it
 * with one that throws to exercise the fail-closed path.
 */
interface RateStore {
  get(key: string): number[] | undefined;
  set(key: string, value: number[]): void;
}

function createInProcessStore(): RateStore {
  const map = new Map<string, number[]>();
  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
  };
}

let activeStore: RateStore = createInProcessStore();

/**
 * Test seam: swap the store (e.g. one that throws) and restore afterwards.
 * Passing `null` installs a FRESH empty in-process store so tests do not leak
 * window state between runs.
 */
export function __setRateStore(store: RateStore | null): void {
  activeStore = store ?? createInProcessStore();
}

export function checkRateLimit(
  callerKey: string,
  endpointId: string,
  opts: RateLimitOptions = {},
): RateDecision {
  const max = opts.max ?? DEFAULT_MAX;
  const windowSeconds = opts.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
  const windowMs = windowSeconds * 1000;
  const now = (opts.now ?? Date.now)();
  const key = `${endpointId}::${callerKey}`;

  try {
    const existing = activeStore.get(key) ?? [];
    // Drop timestamps outside the rolling window.
    const recent = existing.filter((ts) => now - ts < windowMs);

    if (recent.length >= max) {
      const oldest = recent[0];
      const msUntilFree = windowMs - (now - oldest);
      const retryAfterSeconds = Math.min(
        windowSeconds,
        Math.max(1, Math.ceil(msUntilFree / 1000)),
      );
      // Do not record the rejected request.
      activeStore.set(key, recent);
      return { allowed: false, retryAfterSeconds, status: 429 };
    }

    recent.push(now);
    activeStore.set(key, recent);
    return { allowed: true };
  } catch {
    // Tracking backend unavailable → fail closed (Req 6.7).
    return { allowed: false, retryAfterSeconds: 60, status: 429 };
  }
}

/** Derive a caller key: authenticated user id when present, else source IP. */
export function callerKeyFrom(userId: string | null, req: Request): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");
  return `ip:${ip || "unknown"}`;
}
