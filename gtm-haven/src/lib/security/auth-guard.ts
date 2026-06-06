/**
 * Auth_Guard — authentication + organization-membership authorization.
 *
 * Generalizes the proven pattern from `competitors/resolve`: Supabase session
 * via `createSupabaseServerClient()` + `auth.getUser()`, membership via the
 * `organization_members` table. All checks resolve BEFORE any service-role
 * client construction or external call (Req 2.1, 2.5).
 */

import { orgIdParamSchema } from "./schemas";

export interface AuthedCaller {
  userId: string;
}

export type AuthResult =
  | { ok: true; caller: AuthedCaller }
  | { ok: false; status: 400 | 401 | 403 };

/**
 * Verify a valid, unexpired authenticated session.
 * Returns 401 on missing/expired/invalid session (Req 2.1, 2.2).
 */
export async function requireSession(): Promise<AuthResult> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { ok: false, status: 401 };
    return { ok: true, caller: { userId: user.id } };
  } catch {
    // Misconfigured/unavailable auth is treated as unauthenticated.
    return { ok: false, status: 401 };
  }
}

/**
 * Verify authentication AND membership of `orgId`.
 * 400 missing/malformed orgId (Req 2.6), 401 unauthenticated (Req 2.2),
 * 403 authenticated-but-not-a-member (Req 2.3, 2.4).
 */
export async function requireOrgMembership(orgId: unknown): Promise<AuthResult> {
  const parsedOrgId = orgIdParamSchema.safeParse(orgId);
  if (!parsedOrgId.success) return { ok: false, status: 400 };

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, status: 401 };

    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", parsedOrgId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) return { ok: false, status: 403 };

    return { ok: true, caller: { userId: user.id } };
  } catch {
    return { ok: false, status: 401 };
  }
}
