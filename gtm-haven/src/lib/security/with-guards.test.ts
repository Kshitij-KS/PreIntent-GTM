import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { MAX_PAYLOAD_BYTES } from "./schemas";
import { __setRateStore } from "./rate-limiter";

/**
 * withGuards composition tests (task 9.2).
 * Validates: Requirements 4.6, 6.6, 8.5 (plus ordering 413 → 429 → 401 → 400).
 */

const requireSession = vi.fn();
vi.mock("./auth-guard", () => ({
  requireSession: () => requireSession(),
  requireOrgMembership: vi.fn(),
}));

const bodySchema = z.object({ name: z.string().min(1) });

function makeReq(opts: { contentLength?: number; body?: unknown } = {}): Request {
  const headers = new Headers();
  if (opts.contentLength !== undefined) headers.set("content-length", String(opts.contentLength));
  return new Request("https://example.com/api/x", {
    method: "POST",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  __setRateStore(null);
  requireSession.mockResolvedValue({ ok: true, caller: { userId: "u1" } });
});

afterEach(() => __setRateStore(null));

describe("withGuards ordering and short-circuiting", () => {
  it("rejects oversize payloads with 413 before auth or handler", async () => {
    const handler = vi.fn();
    const { withGuards } = await import("./with-guards");
    const route = withGuards({ endpointId: "t", auth: { kind: "session" }, bodySchema }, handler as never);
    const res = await route(makeReq({ contentLength: MAX_PAYLOAD_BYTES + 1, body: { name: "x" } }));
    expect(res.status).toBe(413);
    expect(requireSession).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 before validation when unauthenticated", async () => {
    requireSession.mockResolvedValue({ ok: false, status: 401 });
    const handler = vi.fn();
    const { withGuards } = await import("./with-guards");
    const route = withGuards({ endpointId: "t", auth: { kind: "session" }, bodySchema }, handler as never);
    // Body is invalid too, but auth runs first → 401, not 400.
    const res = await route(makeReq({ body: { name: "" } }));
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body after auth passes", async () => {
    const handler = vi.fn();
    const { withGuards } = await import("./with-guards");
    const route = withGuards({ endpointId: "t", auth: { kind: "session" }, bodySchema }, handler as never);
    const res = await route(makeReq({ body: { name: "" } }));
    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler when all gates pass and echoes correlation id", async () => {
    const { NextResponse } = await import("next/server");
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const { withGuards } = await import("./with-guards");
    const route = withGuards({ endpointId: "t", auth: { kind: "session" }, bodySchema }, handler);
    const res = await route(makeReq({ body: { name: "valid" } }));
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(res.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("returns a sanitized 500 when the handler throws", async () => {
    const handler = vi.fn(async () => {
      throw new Error("boom internal /secret/path");
    });
    const { withGuards } = await import("./with-guards");
    const route = withGuards({ endpointId: "t", auth: { kind: "session" }, bodySchema }, handler);
    const res = await route(makeReq({ body: { name: "valid" } }));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("/secret/path");
  });
});
