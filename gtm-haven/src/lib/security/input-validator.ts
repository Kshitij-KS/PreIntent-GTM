/**
 * Input_Validator — pure (no I/O) parsing of request bodies and params plus a
 * payload-size guard. The validator never invokes business logic; on failure
 * the route returns 400 (or 413 for oversize) and performs no external call or
 * persistence (Req 1.1, 1.2, 1.3, 1.4, 1.8).
 */

import type { ZodType } from "zod";
import { ZodError } from "zod";
import { MAX_PAYLOAD_BYTES } from "./schemas";

export interface ValidationFieldError {
  field: string;
  reason: "missing" | "malformed" | "out_of_range";
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationFieldError[] };

export type PayloadSizeResult = { ok: true } | { ok: false; status: 413 };

/**
 * Reject requests whose declared `Content-Length` exceeds `maxBytes` WITHOUT
 * parsing the body. Requests without a Content-Length header are allowed
 * through (the body schema still bounds their contents).
 */
export function enforcePayloadSize(
  req: Request,
  maxBytes: number = MAX_PAYLOAD_BYTES,
): PayloadSizeResult {
  const header = req.headers.get("content-length");
  if (header === null) return { ok: true };
  const declared = Number(header);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413 };
  }
  return { ok: true };
}

interface NormalizedIssue {
  code: string;
  path: PropertyKey[];
  input?: unknown;
}

function categorizeIssue(issue: NormalizedIssue): ValidationFieldError["reason"] {
  const code = issue.code;
  // A missing required field reports as invalid_type with an undefined input.
  if (code === "invalid_type" && issue.input === undefined) return "missing";
  if (code === "too_small" || code === "too_big") return "out_of_range";
  return "malformed";
}

function issuesToFieldErrors(error: ZodError): ValidationFieldError[] {
  return error.issues.map((issue) => {
    const normalized: NormalizedIssue = {
      code: String((issue as { code?: unknown }).code ?? "malformed"),
      path: issue.path as PropertyKey[],
      input: (issue as { input?: unknown }).input,
    };
    return {
      field: normalized.path.length > 0 ? normalized.path.map(String).join(".") : "(root)",
      reason: categorizeIssue(normalized),
    };
  });
}

export function parseBody<T>(schema: ZodType<T>, raw: unknown): ValidationResult<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: issuesToFieldErrors(result.error) };
}

export function parseParams<T>(
  schema: ZodType<T>,
  params: Record<string, unknown>,
): ValidationResult<T> {
  const result = schema.safeParse(params);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: issuesToFieldErrors(result.error) };
}
