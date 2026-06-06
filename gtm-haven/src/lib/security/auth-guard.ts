/**
 * Auth_Guard  -  authentication + organization-membership authorization.
 *
 * Uses the app's `getSession()` which handles both mock sessions (cookie-based)
 * and real Supabase sessions transparently. Organization membership checks use
 * the Supabase `organization_members` table (only when Supabase is configured).
 */

import { orgIdParamSchema } from "./schemas";

export interface AuthedCaller {
  userId: string;
}

export type AuthResult =
  | { ok: true; caller: AuthedCaller }
  | { ok: false; status: 400 | 401 | 403 };

/**
 * Verify a valid session (mock or Supabase).
 * Returns 401 on missing/expired/invalid session (Req 2.1, 2.2).
 */
export async function requireSession(): Promise<AuthResult> {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session.user) return { ok: false, status: 401 };
    return { ok: true, caller: { userId: session.user.id } };
  } catch {
    return { ok: false, status: 401 };
  }
}

/**
 * Verify authentication AND membership of `orgId`.
 * 400 missing/malformed orgId (Req 2.6), 401 unauthenticated (Req 2.2),
 * 403 authenticated-but-not-a-member (Req 2.3, 2.4).
 *
 * Organization membership is only checked when Supabase is configured.
 * In mock mode, any authenticated session is authorized for any orgId.
 */
export async function requireOrgMembership(orgId: unknown): Promise<AuthResult> {
  const parsedOrgId = orgIdParamSchema.safeParse(orgId);
  if (!parsedOrgId.success) return { ok: false, status: 400 };

  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session.user) return { ok: false, status: 401 };

    // Check org membership only when Supabase is configured.
    const { isSupabaseConfigured } = await import("@/lib/supabase");
    if (isSupabaseConfigured()) {
      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseServerClient();

      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", parsedOrgId.data)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (memberError || !membership) return { ok: false, status: 403 };
    }

    return { ok: true, caller: { userId: session.user.id } };
  } catch {
    return { ok: false, status: 401 };
  }
}
