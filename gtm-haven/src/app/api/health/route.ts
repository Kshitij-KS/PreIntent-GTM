import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/integrations/health";

export function GET() {
  return NextResponse.json({ integrations: getIntegrationStatuses() });
}
