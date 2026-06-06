import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { __setRateStore } from "@/lib/security/rate-limiter";

/**
 * Route-level example tests (task 13.7).
 * Validates: Requirements 10.1, 10.2, 2.8, 8.5
 *
 * Supabase and server actions are mocked — mock-first, zero network.
 */

const getUser = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: "owner" }, error: null }) }) }) }),
    }),
  }),
}));

const runLiveSweep = vi.fn();
vi.mock("@/app/actions", () => ({
  runLiveSweep: (...args: unknown[]) => runLiveSweep(...args),
}));

function jsonReq(body: unknown): Request {
  return new Request("https://example.com/api/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function unauth() {
  getUser.mockResolvedValue({ data: { user: null }, error: null });
}
function authed() {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  __setRateStore(null);
});
afterEach(() => __setRateStore(null));

describe("POST /api/sweep", () => {
  it("returns 401 for an unauthenticated request (no side effects)", async () => {
    unauth();
    const { POST } = await import("./sweep/route");
    const res = await POST(jsonReq({ account: "Acme", industry: "Fin", employees: 10, competitor: "X" }));
    expect(res.status).toBe(401);
    expect(runLiveSweep).not.toHaveBeenCalled();
  });

  it("returns 400 for a body failing schema when authenticated", async () => {
    authed();
    const { POST } = await import("./sweep/route");
    const res = await POST(jsonReq({ account: "" }));
    expect(res.status).toBe(400);
    expect(runLiveSweep).not.toHaveBeenCalled();
  });

  it("runs the sweep and returns 200 when authenticated with a valid body", async () => {
    authed();
    runLiveSweep.mockResolvedValue({ success: true, profile: {}, signals: [], notes: [] });
    const { POST } = await import("./sweep/route");
    const res = await POST(jsonReq({ account: "Acme", industry: "Fin", employees: 10, competitor: "X" }));
    expect(res.status).toBe(200);
    expect(runLiveSweep).toHaveBeenCalledOnce();
  });
});

describe("POST /api/command-center", () => {
  it("returns 401 for an unauthenticated request", async () => {
    unauth();
    const { POST } = await import("./command-center/route");
    const res = await POST(jsonReq({ command: "do-thing" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid command body when authenticated", async () => {
    authed();
    const { POST } = await import("./command-center/route");
    const res = await POST(jsonReq({ notcommand: 1 }));
    expect(res.status).toBe(400);
  });

  it("does not echo arbitrary input back", async () => {
    authed();
    const { POST } = await import("./command-center/route");
    const res = await POST(jsonReq({ command: "valid", payload: { secretField: "leak-me" } }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("leak-me");
  });
});

describe("public GET endpoints (Req 2.8)", () => {
  it("GET /api/health returns 200 without auth", async () => {
    const { GET } = await import("./health/route");
    const res = GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/integrations returns 200 without auth", async () => {
    const { GET } = await import("./integrations/route");
    const res = GET();
    expect(res.status).toBe(200);
  });

  it("GET /api/score returns 200 without auth", async () => {
    const { GET } = await import("./score/route");
    const res = GET();
    expect(res.status).toBe(200);
  });
});
