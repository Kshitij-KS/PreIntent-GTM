import { NextResponse } from "next/server";
import { runLiveSweep, type LiveSweepInput } from "@/app/actions";
import { z } from "zod";

const sweepBodySchema = z.object({
  account: z.string().min(1),
  industry: z.string().min(1),
  employees: z.union([z.number(), z.string()]),
  competitor: z.string().min(1),
  competitorPricingUrl: z.string().url().optional(),
  regulatoryQuery: z.string().optional(),
  painText: z.string().optional(),
  audioUrl: z.string().url().optional(),
  audioTranscript: z.string().optional(),
  crmStage: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = sweepBodySchema.parse(await request.json());
    const result = await runLiveSweep(body as LiveSweepInput);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid sweep request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
