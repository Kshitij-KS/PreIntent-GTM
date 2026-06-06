/**
 * Structured logger with secret/PII redaction and audit events.
 *
 * - Ordered severity set debug < info < warn < error (Req 8.3).
 * - One correlation id per request is carried on every record (Req 8.4).
 * - Secret values and end-user PII are replaced with a fixed placeholder
 *   (Req 3.6, 8.6).
 * - Records below the configured level are suppressed (Req 8.7).
 * - Logging is best-effort and never throws to callers.
 */

export type Severity = "debug" | "info" | "warn" | "error";

const SEVERITY_ORDER: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const REDACTION_PLACEHOLDER = "[REDACTED]";

export interface LogRecord {
  severity: Severity;
  source: string;
  correlationId: string;
  timestamp: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface AuditRecord {
  caller: string;
  endpointId: string;
  correlationId: string;
  outcome: "success" | "failure";
  timestamp: string;
}

/** Env var name patterns whose values are treated as secrets. */
const SECRET_KEY_PATTERN = /(KEY|SECRET|TOKEN|PASSWORD|WEBHOOK_URL|SERVICE_ROLE)/i;

/** Patterns for end-user PII that should never be logged verbatim. */
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function collectSecretValues(env: Record<string, string | undefined>): string[] {
  const values: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (value && value.trim().length >= 4 && SECRET_KEY_PATTERN.test(key)) {
      values.push(value);
    }
  }
  return values;
}

/**
 * Redact known secret values and PII from an arbitrary string.
 * Secret values (and any substring containing them) are replaced wholesale.
 */
export function redactString(
  input: string,
  env: Record<string, string | undefined> = process.env,
): string {
  let output = input;
  for (const secret of collectSecretValues(env)) {
    if (secret && output.includes(secret)) {
      output = output.split(secret).join(REDACTION_PLACEHOLDER);
    }
  }
  output = output.replace(EMAIL_PATTERN, REDACTION_PLACEHOLDER);
  return output;
}

/** Recursively redact a value (string/array/object) for safe logging. */
export function redactValue(
  value: unknown,
  env: Record<string, string | undefined> = process.env,
): unknown {
  if (typeof value === "string") return redactString(value, env);
  if (Array.isArray(value)) return value.map((v) => redactValue(v, env));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Redact values under secret-like keys regardless of content.
      out[k] = SECRET_KEY_PATTERN.test(k) ? REDACTION_PLACEHOLDER : redactValue(v, env);
    }
    return out;
  }
  return value;
}

function resolveConfiguredLevel(
  env: Record<string, string | undefined> = process.env,
): Severity {
  const raw = (env.LOG_LEVEL || "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

/** True when a record at `severity` should be emitted under `configured`. */
export function isSeverityEnabled(severity: Severity, configured: Severity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[configured];
}

/**
 * Build a structurally-complete, redacted log record without emitting it.
 * Exposed for testing the record shape and redaction (Properties 4, 15, 16).
 */
export function buildLogRecord(
  severity: Severity,
  source: string,
  correlationId: string,
  message: string,
  meta?: Record<string, unknown>,
  env: Record<string, string | undefined> = process.env,
): LogRecord {
  return {
    severity,
    source,
    correlationId,
    timestamp: new Date().toISOString(),
    message: redactString(message, env),
    ...(meta ? { meta: redactValue(meta, env) as Record<string, unknown> } : {}),
  };
}

function emit(record: LogRecord): void {
  // Best-effort: never throw to callers.
  try {
    const line = JSON.stringify(record);
    if (record.severity === "error") console.error(line);
    else if (record.severity === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // Swallow logging failures intentionally.
  }
}

export const logger = {
  log(
    severity: Severity,
    source: string,
    correlationId: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    try {
      if (!isSeverityEnabled(severity, resolveConfiguredLevel())) return;
      emit(buildLogRecord(severity, source, correlationId, message, meta));
    } catch {
      // Best-effort logging.
    }
  },

  debug(source: string, correlationId: string, message: string, meta?: Record<string, unknown>) {
    this.log("debug", source, correlationId, message, meta);
  },
  info(source: string, correlationId: string, message: string, meta?: Record<string, unknown>) {
    this.log("info", source, correlationId, message, meta);
  },
  warn(source: string, correlationId: string, message: string, meta?: Record<string, unknown>) {
    this.log("warn", source, correlationId, message, meta);
  },
  error(source: string, correlationId: string, message: string, meta?: Record<string, unknown>) {
    this.log("error", source, correlationId, message, meta);
  },

  audit(entry: Omit<AuditRecord, "timestamp">): void {
    try {
      const record: AuditRecord = { ...entry, timestamp: new Date().toISOString() };
      emit({
        severity: "info",
        source: `audit:${entry.endpointId}`,
        correlationId: entry.correlationId,
        timestamp: record.timestamp,
        message: `audit ${entry.outcome}`,
        meta: { caller: entry.caller, outcome: entry.outcome, endpointId: entry.endpointId },
      });
    } catch {
      // Best-effort.
    }
  },
};
