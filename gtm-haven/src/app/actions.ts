"use server";

/**
 * PreIntent Server Actions  -  live sweep orchestration + sponsor calls.
 *
 * Production rules:
 *  - Authenticated / onboarded users NEVER see demo data.
 *  - When API keys are missing, return zero-score structured signals
 *    with clear "pending configuration" descriptions.
 *  - Demo data (preintent-demo.ts) is ONLY used by the /demo route.
 *  - Mock fallbacks are graceful degradations, NOT demo fixtures.
 */

import type { AccountIntelligenceProfile, EngineSignal, IntelBrief } from "@/lib/domain";
import { getAiMlConfig } from "@/lib/integrations/ai-ml";
import { runBrightDataSweep } from "@/lib/integrations/bright-data";
import { executeThresholdDelivery } from "@/lib/integrations/delivery";
import { transcribeAudioSignal } from "@/lib/integrations/speechmatics";
import { buildProfileFromSignals } from "@/lib/profile-from-signals";
import { fetchWithTimeout, validateExternal } from "@/lib/security/response-validator";
import { painClassificationSchema } from "@/lib/security/schemas";
import { newCorrelationId } from "@/lib/security/correlation";
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
      "Hi [Name]  -  I noticed some movement at your current vendor recently that seemed worth a quick conversation.",
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

// ─── Intel Brief Generation ───────────────────────────────────────────────────

/**
 * Generates an Intel Brief using the AI/ML API when configured.
 * Falls back to a deterministic, structured brief from the account data.
 * Never imports demo data.
 */
export async function generateRealIntelBrief(
  profile: AccountIntelligenceProfile,
): Promise<IntelBrief> {
  const config = getAiMlConfig();
  const now = new Date().toISOString();
  const id = `brief-${profile.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  // ── AI-powered brief ───────────────────────────────────────────────────────
  if (config.enabled && config.apiKey) {
    const prompt = `You are an elite GTM intelligence analyst for PreIntent.

Generate a concise, high-impact Intel Brief for the following account. Be specific, cite the signal data, and write a natural, sales-ready suggested opening line.

Account: ${profile.account}
Industry: ${profile.industry}
Size: ${profile.employees}
CRM Stage: ${profile.crmStage}

VOID SCANNER SIGNALS (sub-score ${profile.void.subScore}):
${profile.void.signals.map((s) => `- ${s.title}: ${s.description}`).join("\n") || "No void signals yet"}

COMPLIANCE RADAR SIGNALS (sub-score ${profile.compliance.subScore}):
${profile.compliance.signals.map((s) => `- ${s.title}: ${s.description}`).join("\n") || "No compliance signals yet"}

PAIN LISTENER SIGNALS (sub-score ${profile.pain.subScore}):
${profile.pain.signals.map((s) => `- ${s.title}: ${s.description}`).join("\n") || "No pain signals yet"}

Convergence Score: ${profile.convergenceScore}/100
Urgency: ${profile.urgency}

Return ONLY valid JSON (no markdown):
{
  "whyNow": [
    {"engine": "void", "subScore": ${profile.void.subScore}, "narrative": "2-4 sentence analysis"},
    {"engine": "compliance", "subScore": ${profile.compliance.subScore}, "narrative": "2-4 sentence analysis"},
    {"engine": "pain", "subScore": ${profile.pain.subScore}, "narrative": "2-4 sentence analysis"}
  ],
  "suggestedOpeningLine": "Hi [Name]  -  ...",
  "accountContext": {
    "industry": "${profile.industry}",
    "size": "${profile.employees}",
    "hq": "inferred or unknown",
    "stackHints": [],
    "keyContact": "inferred decision-maker title"
  }
}`;

    try {
      // Long completion (≈1200 tokens): request the maximum budget the helper
      // permits (capped at 30s) rather than the short 10s default, so a slow
      // but successful provider response is not aborted prematurely.
      const res = await fetchWithTimeout(
        `${config.endpoint}/chat/completions`,
        {
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
        },
        30_000,
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const parsed = intelBriefPayloadSchema.parse(
          JSON.parse(content.replace(/```json|```/g, "").trim()),
        );

        return {
          id,
          account: profile.account,
          convergenceScore: profile.convergenceScore,
          urgency:
            profile.urgency === "CRITICAL"
              ? "CRITICAL  -  act today"
              : `${profile.urgency}  -  act within 5 days`,
          generatedAt: now,
          generatedBy: "ai_ml_api",
          whyNow: parsed.whyNow,
          suggestedOpeningLine: parsed.suggestedOpeningLine,
          accountContext: parsed.accountContext || {
            industry: profile.industry,
            size: String(profile.employees),
          },
          recommendedActions: buildRecommendedActions(profile),
        };
      }

      console.warn("[IntelBrief] AI/ML API returned:", res.status);
    } catch (err) {
      console.error("[IntelBrief] AI/ML API failed:", err);
    }
  }

  // ── Deterministic structured brief (no AI key / AI failed) ────────────────
  // This is NOT demo data  -  it's built directly from the real account signals.
  return buildStructuredBrief(profile, id, now);
}

function buildStructuredBrief(
  profile: AccountIntelligenceProfile,
  id: string,
  now: string,
): IntelBrief {
  const voidSignal = profile.void.signals[0];
  const complianceSignal = profile.compliance.signals[0];
  const painSignal = profile.pain.signals[0];

  const hasPendingSignals =
    profile.void.subScore === 0 &&
    profile.compliance.subScore === 0 &&
    profile.pain.subScore === 0;

  const whyNow = [
    {
      engine: "void" as const,
      subScore: profile.void.subScore,
      narrative: voidSignal?.description ||
        (hasPendingSignals
          ? `Void scanner is ready to monitor competitor pricing for ${profile.account}. Configure BRIGHT_DATA_API_KEY and AI_ML_API_KEY to enable live pricing intelligence.`
          : `No void signals detected for ${profile.account} in this sweep.`),
    },
    {
      engine: "compliance" as const,
      subScore: profile.compliance.subScore,
      narrative: complianceSignal?.description ||
        (hasPendingSignals
          ? `Compliance radar is ready to scan regulatory activity in the ${profile.industry} space. Configure BRIGHT_DATA_API_KEY and AI_ML_API_KEY to enable live compliance intelligence.`
          : `No compliance signals detected for ${profile.account} in this sweep.`),
    },
    {
      engine: "pain" as const,
      subScore: profile.pain.subScore,
      narrative: painSignal?.description ||
        (hasPendingSignals
          ? `Pain listener is ready to classify buying intent signals for ${profile.account}. Configure FEATHERLESS_API_KEY or GEMINI_API_KEY to enable live community signal analysis.`
          : `No pain signals detected for ${profile.account} in this sweep.`),
    },
  ];

  const suggestedOpeningLine = hasPendingSignals
    ? `Hi [Name]  -  we're setting up your PreIntent intelligence workspace. Once configured, we'll surface the exact moment to reach out to ${profile.account}.`
    : profile.convergenceScore >= 85
    ? `Hi [Name]  -  our intelligence platform flagged ${profile.account} as a high-urgency opportunity. The timing looks compelling right now.`
    : profile.convergenceScore >= 55
    ? `Hi [Name]  -  we're seeing some early signals around ${profile.account} that might be worth a conversation.`
    : `Hi [Name]  -  we're monitoring ${profile.account} for buying signals. I'll reach out when the timing looks right.`;

  return {
    id,
    account: profile.account,
    convergenceScore: profile.convergenceScore,
    urgency:
      profile.urgency === "CRITICAL"
        ? "CRITICAL  -  act today"
        : `${profile.urgency}  -  ${hasPendingSignals ? "configure API keys to activate" : "act within 5 days"}`,
    generatedAt: now,
    generatedBy: "mock",
    whyNow,
    suggestedOpeningLine,
    accountContext: {
      industry: profile.industry,
      size: String(profile.employees),
    },
    recommendedActions: buildRecommendedActions(profile),
  };
}

function buildRecommendedActions(profile: AccountIntelligenceProfile): string[] {
  const hasPendingSignals =
    profile.void.subScore === 0 &&
    profile.compliance.subScore === 0 &&
    profile.pain.subScore === 0;

  if (hasPendingSignals) {
    return [
      "Add BRIGHT_DATA_API_KEY to enable live competitor pricing scrapes",
      "Add AI_ML_API_KEY to enable signal scoring and Intel Brief generation",
      "Add FEATHERLESS_API_KEY (or GEMINI_API_KEY) to enable pain signal classification",
    ];
  }

  if (profile.convergenceScore >= 85) {
    return [
      `Reach out to ${profile.account} immediately  -  convergence at ${profile.convergenceScore}/100`,
      "Create HubSpot lead with full signal breakdown attached",
      "Send personalized Slack alert to assigned AE",
      "Schedule follow-up task within 48h  -  high urgency window",
    ];
  }

  return [
    `Continue monitoring ${profile.account}  -  convergence at ${profile.convergenceScore}/100`,
    "Run next sweep in 7 days to track signal progression",
    "Set up Slack alert for threshold ≥ 75",
  ];
}

// ─── Pain Signal Classification ───────────────────────────────────────────────

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

interface PainClassification {
  signalType: string;
  urgency: string;
  competitorMentioned: string | null;
  inferredSeniority: string;
  companyAttribution: string;
  confidence: number;
  model: string;
  [key: string]: unknown;
}

/**
 * Classifies pain text for buying intent signals.
 * No-key mode returns a neutral pending classification instead of fake high-confidence data.
 */
export async function classifyPainSignal(
  text: string,
  context?: string,
): Promise<PainClassification> {
  const config = getPainClassifierConfig();

  // No classifier configured  -  return honest zero-confidence classification
  // instead of fake "active evaluation, 0.91 confidence" hardcode
  if (!config) {
    return {
      signalType: "evaluation_pending",
      urgency: "unknown",
      competitorMentioned: null,
      inferredSeniority: "unknown",
      companyAttribution: "Pending classification  -  configure FEATHERLESS_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY",
      confidence: 0,
      model: "pending_configuration",
    };
  }

  const prompt = `Classify this community post for GTM buying intent. Return strict JSON only.

Post: "${text}"
${context ? `Context: ${context}` : ""}

JSON shape:
{
  "signalType": "frustration | active evaluation | switching decision | contract renewal | budget allocation | other",
  "urgency": "low | medium | high",
  "competitorMentioned": "exact company name or null",
  "inferredSeniority": "string describing likely seniority level",
  "companyAttribution": "string explaining company match confidence",
  "confidence": 0.0-1.0
}`;

  try {
    const res = await fetchWithTimeout(`${config.endpoint}/chat/completions`, {
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
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    // Validate the model response against an explicit schema before use (Req 5.4).
    const validated = validateExternal(
      painClassificationSchema,
      parsed,
      "pain-classifier",
      newCorrelationId(),
    );
    if (!validated.ok) {
      return {
        signalType: "evaluation_pending",
        urgency: "unknown",
        competitorMentioned: null,
        inferredSeniority: "unknown",
        companyAttribution: "Classification response failed validation  -  applied safe fallback.",
        confidence: 0,
        model: "validation_fallback",
      };
    }
    return { ...validated.value, model: config.model };
  } catch (e) {
    console.error("[PainClassifier] Classification failed:", e);
    return {
      signalType: "evaluation_pending",
      urgency: "unknown",
      competitorMentioned: null,
      inferredSeniority: "unknown",
      companyAttribution: "Classification failed  -  check classifier API key",
      confidence: 0,
      model: "error_fallback",
    };
  }
}

// ─── Pain Signal Builder ──────────────────────────────────────────────────────

async function buildPainSignal(
  input: LiveSweepInput,
  classification: PainClassification,
): Promise<EngineSignal> {
  const now = new Date().toISOString();
  const painText =
    input.painText ||
    `Evaluating alternatives to ${input.competitor}  -  contract renewal approaching, need a decision soon.`;

  // If classifier had no config, return a zero-score pending pain signal
  if (classification.model === "pending_configuration" || classification.confidence === 0) {
    return {
      id: `pain-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      engine: "pain",
      title: `Pain signals  -  ${input.account} (pending)`,
      description: `Pain signal classification requires a classifier API key (FEATHERLESS_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY). Configure one to enable live community signal analysis for ${input.account}.`,
      eventTime: now,
      subScore: 0,
      confidence: 0,
      provenance: {
        sponsor: "featherless",
        tool: "Featherless (open model)",
        capturedAt: now,
        note: "Pending  -  configure classifier API key to enable live pain signal classification.",
      },
      rawEvidence: { status: "pending_configuration", competitor: input.competitor },
    };
  }

  // Real classification result  -  try to score it with AI/ML, else use heuristic
  const { scorePainFromText } = await import("@/lib/integrations/ai-ml");
  let title: string;
  let description: string;
  let subScore: number;

  try {
    const scored = await scorePainFromText(process.env, {
      account: input.account,
      competitor: input.competitor,
      painText,
      classification,
    });
    title = scored.title;
    description = scored.description;
    subScore = scored.subScore;
  } catch {
    // AI scoring failed  -  derive score from classifier confidence
    const urgencyMultiplier =
      classification.urgency === "high" ? 0.9 :
      classification.urgency === "medium" ? 0.6 : 0.3;
    subScore = Math.round(classification.confidence * urgencyMultiplier * 100);
    title = `${classification.signalType} signal  -  ${input.account}`;
    description = `${painText} (Classified as ${classification.signalType}, urgency: ${classification.urgency})`;
  }

  return {
    id: `pain-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    engine: "pain",
    title,
    description,
    eventTime: now,
    subScore,
    confidence: classification.confidence,
    provenance: {
      sponsor: "featherless",
      tool: "Featherless (open model)",
      capturedAt: now,
      note: `Classified as ${classification.signalType} (${classification.urgency} urgency) · model: ${classification.model}`,
    },
    rawEvidence: { classification, sourceText: painText },
  };
}

// ─── Main Sweep Orchestrator ──────────────────────────────────────────────────

export async function runLiveSweep(input: LiveSweepInput): Promise<LiveSweepResult> {
  const notes: string[] = [];
  const startTime = Date.now();
  console.log(`[runLiveSweep] START account=${input.account}, competitor=${input.competitor}`);

  try {
    // 1. Bright Data sweep (void + compliance signals)
    console.log(`[runLiveSweep] Step 1: BrightData sweep...`);
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
    console.log(`[runLiveSweep] Step 1 done (${Date.now() - startTime}ms): mode=${bright.mode}, signals=${bright.signals.length}`);
    notes.push(bright.note);

    const signals: EngineSignal[] = [...bright.signals];

    // 2. Speechmatics audio transcription
    console.log(`[runLiveSweep] Step 2: Speechmatics...`);
    const speech = await transcribeAudioSignal(
      {
        account: input.account,
        competitor: input.competitor,
        audioUrl: input.audioUrl || process.env.SPEECHMATICS_AUDIO_URL,
        demoTranscript: input.audioTranscript,
      },
      process.env,
    );
    console.log(`[runLiveSweep] Step 2 done (${Date.now() - startTime}ms): mode=${speech.mode}`);
    // Only include audio signal if it has actual content (non-zero score or real mode)
    if (speech.signal && (speech.signal.subScore > 0 || speech.mode === "real")) {
      signals.push(speech.signal);
      notes.push(speech.note);
    }

    // 3. Pain signal classification
    console.log(`[runLiveSweep] Step 3: Pain classification...`);
    const painText =
      input.painText ||
      `Evaluating alternatives to ${input.competitor}. Contract renewal is coming up in 60 days and we need to assess our options.`;

    const classification = await classifyPainSignal(
      painText,
      `Account: ${input.account}, Industry: ${input.industry}, Competitor: ${input.competitor}`,
    );
    console.log(`[runLiveSweep] Step 3 done (${Date.now() - startTime}ms): model=${classification.model}, urgency=${classification.urgency}`);
    notes.push(`Pain classifier: ${classification.model}  -  ${classification.signalType} (${classification.urgency})`);

    const painSignal = await buildPainSignal(input, classification);
    signals.push(painSignal);

    // 4. Build convergence profile
    console.log(`[runLiveSweep] Step 4: Building convergence profile...`);
    const profile = buildProfileFromSignals(
      {
        account: input.account,
        industry: input.industry,
        employees: input.employees,
        crmStage: input.crmStage,
      },
      signals,
    );
    console.log(`[runLiveSweep] Step 4 done (${Date.now() - startTime}ms): convergence=${profile.convergenceScore}, urgency=${profile.urgency}`);

    // 5. Generate Intel Brief only if convergence is meaningful
    let brief: IntelBrief | undefined;
    if (profile.convergenceScore >= 50) {
      console.log(`[runLiveSweep] Step 5: Generating Intel Brief (convergence ${profile.convergenceScore} >= 50)...`);
      brief = await generateRealIntelBrief(profile);
      console.log(`[runLiveSweep] Step 5 done (${Date.now() - startTime}ms): generatedBy=${brief.generatedBy}`);
      notes.push(`Intel Brief: ${brief.generatedBy}`);
    } else {
      console.log(`[runLiveSweep] Step 5: SKIPPED Intel Brief (convergence ${profile.convergenceScore} < 50)`);
    }

    // 6. Threshold delivery (Slack, HubSpot, TriggerWare)
    console.log(`[runLiveSweep] Step 6: Threshold delivery...`);
    const delivery = await executeThresholdDelivery(profile, brief, process.env);
    console.log(`[runLiveSweep] COMPLETE (${Date.now() - startTime}ms): convergence=${profile.convergenceScore}, signals=${signals.length}, slackSent=${delivery.slack.sent}`);
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
    console.error("[runLiveSweep] Failed:", err);

    // Graceful degradation: return a zero-score profile with no fake data.
    // The dashboard will show an empty state rather than demo signals.
    const now = new Date().toISOString();
    const emptyProfile = buildProfileFromSignals(
      {
        account: input.account,
        industry: input.industry,
        employees: input.employees,
        crmStage: input.crmStage,
      },
      [
        {
          id: `error-signal-${Date.now()}`,
          engine: "void",
          title: "Sweep encountered an error",
          description: `The sweep for ${input.account} encountered an error: ${message}. Please check your API configuration and try again.`,
          eventTime: now,
          subScore: 0,
          confidence: 0,
          provenance: {
            sponsor: "bright_data",
            tool: undefined,
            capturedAt: now,
            note: `Error: ${message}`,
          },
        },
      ],
    );

    return {
      success: false,
      profile: emptyProfile,
      signals: emptyProfile.void.signals,
      notes: [`Sweep error: ${message}`],
      slackSent: false,
      triggerwareSent: false,
      hubspotSent: false,
      error: message,
    };
  }
}
