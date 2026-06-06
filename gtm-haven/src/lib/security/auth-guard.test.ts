import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Auth_Guard example unit tests (task 6.2).
 * Validates: Requirements 10.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 *
 * Supabase is fully mocked — no real network or credentials (mock-first).
 */

const getUser = vi.fn();
const maybeSingle = vi.fn();
const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

function buildClient() {
  return {
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createSupabaseServerClient.mockResolvedValue(buildClient());
});

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("requireSession", () => {
  it("returns 401 when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns the caller when a valid session exists", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.caller.userId).toBe("user-1");
  });

  it("returns 401 when the client construction throws", async () => {
    createSupabaseServerClient.mockRejectedValue(new Error("not configured"));
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });
});

describe("requireOrgMembership", () => {
  it("returns 400 for a missing/malformed orgId before any client construction", async () => {
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership("not-a-uuid");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns 403 when authenticated but not a member", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("returns the caller when authenticated and a member", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { role: "owner" }, error: null });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.caller.userId).toBe("user-1");
  });
});
