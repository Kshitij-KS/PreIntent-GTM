import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Auth_Guard example unit tests (task 6.2).
 * Validates: Requirements 10.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 *
 * The auth-guard uses `getSession()` from `@/lib/auth` which handles both mock
 * and Supabase sessions. We mock that module directly.
 */

const getSession = vi.fn();
const maybeSingle = vi.fn();
const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSession: () => getSession(),
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: () => true,
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

function buildClient() {
  return {
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
  it("returns 401 when there is no session", async () => {
    getSession.mockResolvedValue({ user: null, onboardingComplete: false });
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns the caller when a valid session exists", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1", email: "a@b.com", name: "A" }, onboardingComplete: true });
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.caller.userId).toBe("user-1");
  });

  it("returns 401 when getSession throws", async () => {
    getSession.mockRejectedValue(new Error("broken"));
    const { requireSession } = await import("./auth-guard");
    const result = await requireSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });
});

describe("requireOrgMembership", () => {
  it("returns 400 for a missing/malformed orgId", async () => {
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership("not-a-uuid");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValue({ user: null, onboardingComplete: false });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns 403 when authenticated but not a member", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1", email: "a@b.com", name: "A" }, onboardingComplete: true });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("returns the caller when authenticated and a member", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1", email: "a@b.com", name: "A" }, onboardingComplete: true });
    maybeSingle.mockResolvedValue({ data: { role: "owner" }, error: null });
    const { requireOrgMembership } = await import("./auth-guard");
    const result = await requireOrgMembership(VALID_UUID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.caller.userId).toBe("user-1");
  });
});
