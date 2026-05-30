import { NextResponse } from "next/server";
import { getDemoCommandCenterData } from "@/lib/demo-data";
import { buildProviderRegistry } from "@/lib/providers";

export async function GET() {
  const registry = buildProviderRegistry();
  const providerHealth = await Promise.all([registry.brightData.health()]);

  return NextResponse.json({
    providers: providerHealth,
    demoIntegrations: getDemoCommandCenterData().integrations,
  });
}
