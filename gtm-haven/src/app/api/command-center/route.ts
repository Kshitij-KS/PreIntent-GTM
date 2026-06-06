import { NextResponse } from "next/server";
import { withGuards } from "@/lib/security/with-guards";
import { commandCenterBodySchema, type CommandCenterBody } from "@/lib/security/schemas";

/**
 * Command Center API.
 * GET lists pending commands (public, read-only).
 * POST queues a validated command — no longer echoes arbitrary input.
 */
export function GET() {
  return NextResponse.json({
    commands: [],
    status: "ready",
    message: "Command center operational. No pending commands.",
  });
}

export const POST = withGuards<CommandCenterBody>(
  {
    endpointId: "command-center",
    auth: { kind: "session" },
    bodySchema: commandCenterBodySchema,
    mutating: true,
  },
  async ({ body }) => {
    // Only the validated command name is acknowledged — arbitrary input is not echoed.
    return NextResponse.json({
      success: true,
      commandId: `cmd-${Date.now()}`,
      command: body.command,
      status: "queued",
    });
  },
);
