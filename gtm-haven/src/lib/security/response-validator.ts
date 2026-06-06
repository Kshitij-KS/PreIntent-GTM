/**
 * Response_Validator — schema validation, timeouts, and fallbacks for external
 * and model responses. Downstream logic only ever sees validated data or the
 * defined fallback, never raw untrusted output (Req 5.1–5.7).
 */

import type { ZodType } from "zod";
import { logger } from "./logger";

const DEFAULT_TIMEOUT_MS = 10_000;
const TIMEOUT_CEILING_MS = 30_000;

/**
 * `fetch` with an enforced timeout capped at 30s (default 10s) via
 * `AbortSignal.timeout` (Req 5.6).
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const effective = Math.min(Math.max(1, timeoutMs), TIMEOUT_CEILING_MS);
  return fetch(input, { ...init, signal: AbortSignal.timeout(effective) });
}

export type ValidateExternalResult<T> = { ok: true; value: T } | { ok: false };

/**
 * Validate a parsed external/model response against `schema`. Blocks downstream
 * use until validation succeeds; on failure logs the failing component + reason
 * and signals the caller to apply a fallback (Req 5.1, 5.3, 5.4).
 *
 * Uses non-coercing schemas so a conformant value is returned unchanged
 * (round-trip identity, Req 5.7).
 */
export function validateExternal<T>(
  schema: ZodType<T>,
  parsed: unknown,
  source: string,
  correlationId: string,
): ValidateExternalResult<T> {
  const result = schema.safeParse(parsed);
  if (result.success) return { ok: true, value: result.data };
  const reason = result.error.issues
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  logger.warn(`response-validator:${source}`, correlationId, "external response failed validation", {
    source,
    reason,
  });
  return { ok: false };
}

/**
 * Run `primary`; if it throws (parse failure, timeout, network error) log the
 * failure and return `fallback()`. Downstream state is left unchanged by a
 * failed response (Req 5.2, 5.5, 5.6).
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T | Promise<T>,
  ctx: { source: string; correlationId: string },
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown_error";
    logger.warn(`response-validator:${ctx.source}`, ctx.correlationId, "external call failed; applying fallback", {
      source: ctx.source,
      reason,
    });
    return await fallback();
  }
}
