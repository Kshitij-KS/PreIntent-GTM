/**
 * withGuards — composition wrapper that sequences the cross-cutting concerns in
 * the correct order before any business logic runs:
 *
 *   1. payload-size (413)
 *   2. rate-limit (429)
 *   3. auth (401/403/400)
 *   4. input-validation (400)
 *   5. handler
 *
 * Any thrown error is caught and routed through the Error_Responder under a
 * single correlation id. Mutating endpoints emit one audit event on completion
 * (Req 1.2, 2.1, 2.2, 4.1, 4.3, 6.6, 8.1, 8.5).
 */

import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { correlationIdFromRequest, CORRELATION_ID_HEADER } from "./correlation";
import { enforcePayloadSize, parseBody, type ValidationResult } from "./input-validator";
import {
  toErrorResponse,
  validationErrorResponse,
  payloadTooLargeResponse,
  authErrorResponse,
  rateLimitResponse,
} from "./error-responder";
import { checkRateLimit, callerKeyFrom } from "./rate-limiter";
import { requireSession, requireOrgMembership, type AuthedCaller } from "./auth-guard";
import { logger } from "./logger";

export interface GuardContext<TBody> {
  body: TBody;
  caller: AuthedCaller | null;
  correlationId: string;
  request: Request;
}

export type AuthMode =
  | { kind: "none" }
  | { kind: "session" }
  | { kind: "org"; orgIdFrom: (body: unknown) => unknown };

export interface WithGuardsOptions<TBody> {
  /** Stable endpoint id used for rate-limit budgets and audit logs. */
  endpointId: string;
  /** When set, the endpoint is rate-limited under its own budget. */
  rateLimit?: boolean;
  /** Authentication/authorization requirement. */
  auth?: AuthMode;
  /** Body schema; when provided the parsed body is passed to the handler. */
  bodySchema?: ZodType<TBody>;
  /** Marks the endpoint as mutating so an audit event is emitted on completion. */
  mutating?: boolean;
  /** Maximum payload bytes (defaults to the shared limit). */
  maxBytes?: number;
}

export function withGuards<TBody = unknown>(
  options: WithGuardsOptions<TBody>,
  handler: (ctx: GuardContext<TBody>) => Promise<NextResponse> | NextResponse,
): (request: Request) => Promise<NextResponse> {
  return async function guardedHandler(request: Request): Promise<NextResponse> {
    const correlationId = correlationIdFromRequest(request);
    let caller: AuthedCaller | null = null;
    let outcome: "success" | "failure" = "failure";

    try {
      // 1. Payload-size (413) — before the body is buffered.
      const sizeCheck = enforcePayloadSize(request, options.maxBytes);
      if (!sizeCheck.ok) return payloadTooLargeResponse(correlationId);

      // Read the raw body once (if a schema is configured) so auth can derive orgId.
      let rawBody: unknown = undefined;
      if (options.bodySchema) {
        try {
          rawBody = await request.json();
        } catch {
          // Malformed JSON is a validation failure handled below.
          rawBody = undefined;
        }
      }

      // 2. Rate-limit (429) — cheaply shed floods before auth/validation.
      if (options.rateLimit) {
        // Pre-auth caller key uses IP; a userId refinement happens after auth
        // but the budget is keyed consistently per identity-or-IP.
        const decision = checkRateLimit(callerKeyFrom(null, request), options.endpointId);
        if (!decision.allowed) {
          return rateLimitResponse(decision.retryAfterSeconds ?? 60, correlationId);
        }
      }

      // 3. Auth (401/403/400).
      const authMode = options.auth ?? { kind: "none" };
      if (authMode.kind === "session") {
        const result = await requireSession();
        if (!result.ok) return authErrorResponse(result.status, correlationId);
        caller = result.caller;
      } else if (authMode.kind === "org") {
        const orgId = authMode.orgIdFrom(rawBody);
        const result = await requireOrgMembership(orgId);
        if (!result.ok) return authErrorResponse(result.status, correlationId);
        caller = result.caller;
      }

      // 4. Input-validation (400).
      let body = rawBody as TBody;
      if (options.bodySchema) {
        const parsed: ValidationResult<TBody> = parseBody(options.bodySchema, rawBody);
        if (!parsed.ok) return validationErrorResponse(parsed.errors, correlationId);
        body = parsed.value;
      }

      // 5. Handler.
      const response = await handler({ body, caller, correlationId, request });
      outcome = response.status < 400 ? "success" : "failure";
      response.headers.set(CORRELATION_ID_HEADER, correlationId);
      return response;
    } catch (error) {
      logger.error(options.endpointId, correlationId, "unhandled error in route handler", {
        name: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return toErrorResponse(error, correlationId);
    } finally {
      if (options.mutating) {
        logger.audit({
          caller: caller?.userId ?? "anonymous",
          endpointId: options.endpointId,
          correlationId,
          outcome,
        });
      }
    }
  };
}
