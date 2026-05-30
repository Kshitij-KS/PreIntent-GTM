import { NextResponse } from "next/server";
import { getDemoCommandCenterData } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(getDemoCommandCenterData());
}
