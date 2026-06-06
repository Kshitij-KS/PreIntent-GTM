import { NextResponse } from "next/server";
import { runLiveSweep, type LiveSweepInput } from "@/app/actions";
import { withGuards } from "@/lib/security/with-guards";
import { sweepBodySchema, type SweepBody } from "@/lib/security/schemas";

/**
 * POST /api/sweep — Mutating_Endpoint.
 * Guards: payload-size (413) → rate-limit (429) → auth session (401) →
 * body validation (400) → handler. Errors are sanitized by withGuards.
 */
export const POST = withGuards<SweepBody>(
  {
    endpointId: "sweep",
    rateLimit: true,
    auth: { kind: "session" },
    bodySchema: sweepBodySchema,
    mutating: true,
  },
  async ({ body }) => {
    const result = await runLiveSweep(body as LiveSweepInput);
    return NextResponse.json(result);
  },
);
