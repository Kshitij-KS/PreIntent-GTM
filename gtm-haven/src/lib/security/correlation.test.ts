import { describe, expect, it } from "vitest";

import {
  CORRELATION_ID_HEADER,
  correlationHeaders,
  correlationIdFromRequest,
  getCorrelationId,
  isValidCorrelationId,
  newCorrelationId,
} from "./correlation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("newCorrelationId", () => {
  it("produces a syntactically valid UUID", () => {
    expect(newCorrelationId()).toMatch(UUID_PATTERN);
  });

  it("produces a unique value per call", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      ids.add(newCorrelationId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe("isValidCorrelationId", () => {
  it("accepts a generated id", () => {
    expect(isValidCorrelationId(newCorrelationId())).toBe(true);
  });

  it("rejects non-UUID and non-string values", () => {
    expect(isValidCorrelationId("not-a-uuid")).toBe(false);
    expect(isValidCorrelationId("")).toBe(false);
    expect(isValidCorrelationId(undefined)).toBe(false);
    expect(isValidCorrelationId(null)).toBe(false);
    expect(isValidCorrelationId(42)).toBe(false);
  });
});

describe("getCorrelationId", () => {
  it("propagates a valid inbound id unchanged", () => {
    const incoming = newCorrelationId();
    expect(getCorrelationId(incoming)).toBe(incoming);
  });

  it("generates a fresh id when none/invalid is supplied", () => {
    expect(getCorrelationId(undefined)).toMatch(UUID_PATTERN);
    expect(getCorrelationId(null)).toMatch(UUID_PATTERN);
    expect(getCorrelationId("garbage")).toMatch(UUID_PATTERN);
  });
});

describe("correlationIdFromRequest", () => {
  const makeReq = (headerValue: string | null) => ({
    headers: { get: (name: string) => (name === CORRELATION_ID_HEADER ? headerValue : null) },
  });

  it("propagates a valid header value", () => {
    const incoming = newCorrelationId();
    expect(correlationIdFromRequest(makeReq(incoming))).toBe(incoming);
  });

  it("generates a new id when header is absent or invalid", () => {
    expect(correlationIdFromRequest(makeReq(null))).toMatch(UUID_PATTERN);
    expect(correlationIdFromRequest(makeReq("nope"))).toMatch(UUID_PATTERN);
    expect(correlationIdFromRequest(undefined)).toMatch(UUID_PATTERN);
  });
});

describe("correlationHeaders", () => {
  it("echoes the correlation id under the canonical header", () => {
    const id = newCorrelationId();
    expect(correlationHeaders(id)).toEqual({ [CORRELATION_ID_HEADER]: id });
  });
});
