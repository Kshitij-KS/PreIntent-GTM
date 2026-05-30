"use server";

/**
 * Undertow Server Actions — live sweep orchestration + sponsor calls.
 * Set *_MODE=real and API keys in .env.local; mocks apply automatically when keys are missing.
 */

import type { AccountIntelligenceProfile, EngineSignal, IntelBrief } from "@/lib/domain";
import { getAiMlConfig } from "@/lib/integrations/ai-ml";
import { runBrightDataSweep } from "@/lib/integrations/bright-data";
import { executeThresholdDelivery } from "@/lib/integrations/delivery";
import { transcribeAudioSignal } from "@/lib/integrations/speechmatics";
import { buildProfileFromSignals } from "@/lib/profile-from-signals";
import { z } from "zod";

const intelBriefPayloadSchema = z.object({
  whyNow: z
    .array(
      z.object({
        engine: z.enum(["void", "compliance", "pain"]),
        subScore: z.number(),
        narrative: z.string(),
      }),
    )
    .default([]),
  suggestedOpeningLine: z
    .string()
    .default(
      "Hi [Name] — the timing looks interesting given recent changes at your current vendor.",
    ),
  accountContext: z
    .object({
      industry: z.string(),
      size: z.string(),
      hq: z.string().optional(),
      stackHints: z.array(z.string()).optional(),
      keyContact: z.string().optional(),
    })
    .optional(),
});

export interface LiveSweepInput {
  account: string;
  industry: string;
  employees: number | string;
  competitor: string;
  competitorPricingUrl?: string;
  regulatoryQuery?: string;
  painText?: string;
  audioUrl?: string;
  audioTranscript?: string;
  crmStage?: string;
}

export interface LiveSweepResult {
  success: boolean;
  profile: AccountIntelligenceProfile;
  signals: EngineSignal[];
  notes: string[];
  slackSent: boolean;
  triggerwareSent: boolean;
  hubspotSent: boolean;
  brief?: IntelBrief;
  error?: string;
}

export async function generateRealIntelBrief(
  profile: AccountIntelligenceProfile,
): Promise<IntelBrief> {
  const config = getAiMlConfig();

  if (!config.enabled || !config.apiKey) {
    const { generateMockIntelBrief } = await import("@/lib/undertow-demo");
    return generateMockIntelBrief(profile);
  }

  const prompt = `You are an elite GTM intelligence analyst for Undertow.

Generate a concise, high-impact Intel Brief for the following account using the exact structure below. Use only the provided signals. Be specific, cite dates and sources, and write a natural, sales-ready suggested opening line.

Account: ${profile.account}
Industry: ${profile.industry}
Size: ${profile.employees}
CRM Stage: ${profile.crmStage}

VOID SCANNER SIGNALS (sub-score ${profile.void.subScore}):
${profile.void.signals.map((s) => `- ${s.title} (${new Date(s.eventTime).toLocaleDateString()}): ${s.description}`).join("\n")}

COMPLIANCE RADAR SIGNALS (sub-score ${profile.compliance.subScore}):
${profile.compliance.signals.map((s) => `- ${s.title} (${new Date(s.eventTime).toLocaleDateString()}): ${s.description}`).join("\n")}

PAIN LISTENER SIGNALS (sub-score ${profile.pain.subScore}):
${profile.pain.signals.map((s) => `- ${s.title} (${new Date(s.eventTime).toLocaleDateString()}): ${s.description}`).join("\n")}

Current Convergence Score: ${profile.convergenceScore}/100
Urgency: ${profile.urgency}

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
{
  "whyNow": [
    {"engine": "void", "subScore": ${profile.void.subScore}, "narrative": "... 2-4 sentence paragraph ..."},
    {"engine": "compliance", "subScore": ${profile.compliance.subScore}, "narrative": "..."},
    {"engine": "pain", "subScore": ${profile.pain.subScore}, "narrative": "..."}
  ],
  "suggestedOpeningLine": "Hi [Name] — ...",
  "accountContext": {
    "industry": "${profile.industry}",
    "size": "${profile.employees}",
    "hq": "Austin, TX",
    "stackHints": ["AWS", "Stripe", "Postgres"],
    "keyContact": "Head of Payments Infrastructure"
  }
}`;

  try {
    const res = await fetch(`${config.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) throw new Error(`AI/ML API error: ${res.status}`);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = intelBriefPayloadSchema.parse(
      JSON.parse(content.replace(/```json|```/g, "").trim()),
    );

    const now = new Date().toISOString();

    return {
      id: `brief-${profile.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      account: profile.account,
      convergenceScore: profile.convergenceScore,
      urgency:
        profile.urgency === "CRITICAL"
          ? "CRITICAL — act today"
          : `${profile.urgency} — act within 5 days`,
      generatedAt: now,
      generatedBy: "ai_ml_api",
      whyNow: parsed.whyNow || [],
      suggestedOpeningLine:
        parsed.suggestedOpeningLine ||
        "Hi [Name] — the timing looks interesting given recent changes at your current vendor.",
      accountContext: parsed.accountContext || {
        industry: profile.industry,
        size: String(profile.employees),
        hq: "Austin, TX",
        stackHints: ["AWS", "Stripe", "Postgres"],
        keyContact: "Head of Payments Infrastructure",
      },
      recommendedActions: [
        "Create HubSpot lead with full signal breakdown",
        "Send personalized Slack alert to assigned AE with brief attached",
        "Add task: 'Call within 48h — high convergence, active evaluation signal'",
      ],
    };
  } catch (err) {
    console.error("Real AI/ML brief failed, falling back to mock:", err);
    const { generateMockIntelBrief } = await import("@/lib/undertow-demo");
    const mock = generateMockIntelBrief(profile);
    return { ...mock, generatedBy: "mock" };
  }
}

function getPainClassifierConfig() {
  const env = process.env;
  const groqReal = env.GROQ_MODE === "real" && env.GROQ_API_KEY;
  const geminiReal = env.GEMINI_MODE === "real" && env.GEMINI_API_KEY;
  const featherlessReal = env.FEATHERLESS_MODE === "real" && env.FEATHERLESS_API_KEY;

  if (groqReal) {
    return {
      apiKey: env.GROQ_API_KEY!,
      endpoint: env.GROQ_ENDPOINT || "https://api.groq.com/openai/v1",
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  if (geminiReal) {
    return {
      apiKey: env.GEMINI_API_KEY!,
      endpoint:
        env.GEMINI_ENDPOINT ||
        "https://generativelanguage.googleapis.com/v1beta/openai",
      model: env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }
  if (featherlessReal) {
    return {
      apiKey: env.FEATHERLESS_API_KEY!,
      endpoint: env.FEATHERLESS_ENDPOINT || "https://api.featherless.ai/v1",
      model: env.FEATHERLESS_MODEL || "meta-llama/Llama-3.3-70B-Instruct",
    };
  }
  return null;
}

export async function classifyPainSignal(text: string, context?: string) {
  const config = getPainClassifierConfig();

  if (!config) {
    return {
      signalType: "active evaluation",
      urgency: "high",
      competitorMentioned: "Competitor",
      inferredSeniority: "Head of Payments Infrastructure",
      companyAttribution: "Strong match from profile + post text",
      confidence: 0.91,
      model: "mock-classifier",
    };
  }

  const prompt = `Classify this community post for GTM buying intent. Return strict JSON only.

Post: "${text}"
${context ? `Context: ${context}` : ""}

JSON shape:
{
  "signalType": "frustration | active evaluation | switching decision | contract renewal | budget allocation",
  "urgency": "low | medium | high",
  "competitorMentioned": "exact name or null",
  "inferredSeniority": "string",
  "companyAttribution": "string",
  "confidence": 0.0-1.0
}`;

  try {
    const res = await fetch(`${config.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Pain classification failed:", e);
    return {
      signalType: "active evaluation",
      urgency: "high",
      competitorMentioned: null,
      inferredSeniority: "Senior",
      companyAttribution: "Inferred from post",
      confidence: 0.85,
      model: "fallback",
    };
  }
}

async function buildPainSignal(
  input: LiveSweepInput,
  classification: Record<string, unknown>,
): Promise<EngineSignal> {
  const { scorePainFromText } = await import("@/lib/integrations/ai-ml");
  const painText =
    input.painText ||
    `evaluating alternatives to ${input.competitor} — contract renewal approaching`;

  const scored = await scorePainFromText(process.env, {
    account: input.account,
    competitor: input.competitor,
    painText,
    classification,
  });

  const now = new Date().toISOString();
  const urgency = String(classification.urgency || "high");

  return {
    id: `pain-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    engine: "pain",
    title: scored.title,
    description: scored.description,
    eventTime: now,
    subScore: scored.subScore,
    confidence: Number(classification.confidence) || scored.confidence || 0.9,
    provenance: {
      sponsor: "featherless",
      tool: "Featherless (open model)",
      url: "https://www.reddit.com/r/fintech",
      capturedAt: now,
      note: `Classified as ${classification.signalType || "active evaluation"} (${urgency} urgency)`,
    },
    rawEvidence: { classification, sourceText: painText },
  };
}

export async function runLiveSweep(input: LiveSweepInput): Promise<LiveSweepResult> {
  const notes: string[] = [];

  try {
    const bright = await runBrightDataSweep(
      {
        account: input.account,
        industry: input.industry,
        competitor: input.competitor,
        competitorPricingUrl: input.competitorPricingUrl,
        regulatoryQuery: input.regulatoryQuery,
      },
      process.env,
    );
    notes.push(bright.note);

    const signals: EngineSignal[] = [...bright.signals];

    const speech = await transcribeAudioSignal(
      {
        account: input.account,
        competitor: input.competitor,
        audioUrl: input.audioUrl || process.env.SPEECHMATICS_AUDIO_URL,
        demoTranscript: input.audioTranscript,
      },
      process.env,
    );
    if (speech.signal) {
      signals.push(speech.signal);
      notes.push(speech.note);
    }

    const painText =
      input.painText ||
      `evaluating alternatives to ${input.competitor} — anyone tried alternatives? Contract is up in 60 days`;

    const classification = await classifyPainSignal(
      painText,
      `Account: ${input.account}, Industry: ${input.industry}, Competitor: ${input.competitor}`,
    );
    notes.push(
      `Featherless: ${classification.signalType || "classified"} (${classification.model || "live"})`,
    );

    const painSignal = await buildPainSignal(input, classification);
    signals.push(painSignal);

    const profile = buildProfileFromSignals(
      {
        account: input.account,
        industry: input.industry,
        employees: input.employees,
        crmStage: input.crmStage,
      },
      signals,
    );

    let brief: IntelBrief | undefined;
    if (profile.convergenceScore >= 85) {
      brief = await generateRealIntelBrief(profile);
      notes.push(`Intel Brief: ${brief.generatedBy}`);
    }

    const delivery = await executeThresholdDelivery(profile, brief, process.env);
    notes.push(delivery.slack.detail);
    if (delivery.triggerware.sent) notes.push(delivery.triggerware.detail);
    if (delivery.hubspot.sent) notes.push(delivery.hubspot.detail);

    return {
      success: true,
      profile,
      signals,
      notes,
      slackSent: delivery.slack.sent,
      triggerwareSent: delivery.triggerware.sent,
      hubspotSent: delivery.hubspot.sent,
      brief,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("runLiveSweep failed:", err);

    const { voidPricingRemoval, compliancePciDss, painRFintechPost } = await import(
      "@/lib/undertow-demo"
    );
    const fallbackSignals = [voidPricingRemoval, compliancePciDss, painRFintechPost];
    const profile = buildProfileFromSignals(
      {
        account: input.account,
        industry: input.industry,
        employees: input.employees,
        crmStage: input.crmStage,
      },
      fallbackSignals,
    );

    return {
      success: false,
      profile,
      signals: fallbackSignals,
      notes: [`Sweep error: ${message}`, "Returned deterministic fallback signals."],
      slackSent: false,
      triggerwareSent: false,
      hubspotSent: false,
      error: message,
    };
  }
}
