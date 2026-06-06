/**
 * Error_Responder — converts caught errors and validation failures into
 * sanitized, client-facing responses. Full diagnostics are logged server-side
 * by the Logger; the client only ever sees a generic message, an error
 * category, and the request's correlation id (Req 4.1, 4.2, 4.4, 4.5, 4.6, 8.1,
 * 8.2).
 */

import { NextResponse } from "next/server";
import type { ValidationFieldError } from "./input-validator";
import { CORRELATION_ID_HEADER } from "./correlation";

export interface SanitizedErrorBody {
  error: string;
  category: "validation" | "auth" | "rate_limit" | "payload" | "server";
  correlationId: string;
  fields?: ValidationFieldError[];
}

const GENERIC_MESSAGES: Record<SanitizedErrorBody["category"], string> = {
  validation: "One or more fields failed validation.",
  auth: "Authentication or authorization failed.",
  rate_limit: "Too many requests.",
  payload: "Request payload is too large.",
  server: "An internal error occurred.",
};

function withCorrelationHeader(res: NextResponse, correlationId: string): NextResponse {
  res.headers.set(CORRELATION_ID_HEADER, correlationId);
  return res;
}

/**
 * Sanitized response for an unhandled error. Never includes stack traces, raw
 * external messages, file paths, hostnames, IPs, DB identifiers, or secrets —
 * the input `error` is intentionally not read into the body.
 */
export function toErrorResponse(_error: unknown, correlationId: string): NextResponse {
  const body: SanitizedErrorBody = {
    error: GENERIC_MESSAGES.server,
    category: "server",
    correlationId,
  };
  return withCorrelationHeader(NextResponse.json(body, { status: 500 }), correlationId);
}

/** 400 response listing every failed field + reason category (Req 4.5). */
export function validationErrorResponse(
  errors: ValidationFieldError[],
  correlationId: string,
): NextResponse {
  const body: SanitizedErrorBody = {
    error: GENERIC_MESSAGES.validation,
    category: "validation",
    correlationId,
    fields: errors,
  };
  return withCorrelationHeader(NextResponse.json(body, { status: 400 }), correlationId);
}

/** 413 response for oversize payloads (Req 1.4). */
export function payloadTooLargeResponse(correlationId: string): NextResponse {
  const body: SanitizedErrorBody = {
    error: GENERIC_MESSAGES.payload,
    category: "payload",
    correlationId,
  };
  return withCorrelationHeader(NextResponse.json(body, { status: 413 }), correlationId);
}

/** 401/403/400 auth responses (Req 2.2, 2.4, 2.6). */
export function authErrorResponse(
  status: 400 | 401 | 403,
  correlationId: string,
): NextResponse {
  const body: SanitizedErrorBody = {
    error:
      status === 401
        ? "Authentication is required."
        : status === 403
          ? "Authorization was denied."
          : "Required identifier is missing or invalid.",
    category: status === 400 ? "validation" : "auth",
    correlationId,
  };
  return withCorrelationHeader(NextResponse.json(body, { status }), correlationId);
}

/** 429 rate-limit response with a Retry-After header (Req 6.1, 6.4, 6.7). */
export function rateLimitResponse(
  retryAfterSeconds: number,
  correlationId: string,
): NextResponse {
  const body: SanitizedErrorBody = {
    error: GENERIC_MESSAGES.rate_limit,
    category: "rate_limit",
    correlationId,
  };
  const res = NextResponse.json(body, { status: 429 });
  res.headers.set("Retry-After", String(retryAfterSeconds));
  return withCorrelationHeader(res, correlationId);
}
