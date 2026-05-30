import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/integrations/health";

/**
 * Integrations API
 * Returns full integration status, config modes, and health details.
 */
export function GET() {
  const integrations = getIntegrationStatuses();
  return NextResponse.json({
    integrations,
    total: integrations.length,
    live: integrations.filter((i) => i.status === "live" || i.status === "healthy").length,
    mock: integrations.filter((i) => i.mode === "mock").length,
  });
}
