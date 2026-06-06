/**
 * Correlation id generation and per-request propagation.
 *
 * A correlation id is a unique-per-request identifier shared by every log
 * record and the sanitized client error response, so a single request can be
 * traced end-to-end (Requirements 4.3, 8.4).
 */

export const CORRELATION_ID_HEADER = "x-correlation-id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Minimal shape of an incoming request we read the correlation header from. */
interface HeaderCarrier {
  headers: { get(name: string): string | null };
}

function uuidV4Fallback(): string {
  // RFC 4122 v4 shape using Math.random; only used when crypto.randomUUID
  // is unavailable (older runtimes). The test runtime uses crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Generate a new, unique, syntactically-valid UUID correlation id. */
export function newCorrelationId(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return uuidV4Fallback();
}

/** True when `value` is a syntactically valid UUID correlation id. */
export function isValidCorrelationId(value: unknown): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Reuse a valid inbound id, otherwise generate a fresh one. */
export function getCorrelationId(value: string | null | undefined): string {
  return isValidCorrelationId(value) ? (value as string) : newCorrelationId();
}

/** Resolve a correlation id for an incoming request. */
export function correlationIdFromRequest(req: HeaderCarrier | null | undefined): string {
  const inbound = req?.headers?.get(CORRELATION_ID_HEADER) ?? null;
  return getCorrelationId(inbound);
}

/** Build the response header map echoing the correlation id to the caller. */
export function correlationHeaders(correlationId: string): Record<string, string> {
  return { [CORRELATION_ID_HEADER]: correlationId };
}
