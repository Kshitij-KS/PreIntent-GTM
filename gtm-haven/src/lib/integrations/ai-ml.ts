import { z } from "zod";
import type { EngineType } from "../domain";
import { type EnvMap, isRealMode, normalizeMode } from "./env";

export function getAiMlConfig(env: EnvMap = process.env) {
  return {
    mode: normalizeMode(env.AI_ML_MODE),
    apiKey: env.AI_ML_API_KEY,
    endpoint: env.AI_ML_ENDPOINT || "https://api.aimlapi.com/v1",
    model: env.AI_ML_MODEL || "gpt-4o",
    enabled: isRealMode(env, "AI_ML_MODE", ["AI_ML_API_KEY"]),
  };
}

async function chatCompletionJson<T>(
  env: EnvMap,
  prompt: string,
  schema: z.ZodType<T>,
  maxTokens = 600,
): Promise<T | null> {
  const config = getAiMlConfig(env);
  if (!config.enabled || !config.apiKey) return null;

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
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = String(data.choices?.[0]?.message?.content || "{}");
    const cleaned = content.replace(/```json|```/g, "").trim();
    return schema.parse(JSON.parse(cleaned));
  } catch {
    return null;
  }
}

const voidScoreSchema = z.object({
  subScore: z.number().min(0).max(100),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

const complianceScoreSchema = z.object({
  subScore: z.number().min(0).max(100),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

const painScoreSchema = z.object({
  subScore: z.number().min(0).max(100),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function scoreVoidFromPageContent(
  env: EnvMap,
  params: {
    account: string;
    competitor: string;
    url: string;
    htmlSnippet: string;
    self?: string;
  },
) {
  const selfLine = params.self
    ? `\nYou are doing this analysis on behalf of: ${params.self}. Judge how this competitor change creates a displacement opportunity for THEM specifically.`
    : "";
  const parsed = await chatCompletionJson(
    env,
    `You are a GTM void scanner. Analyze this competitor page snippet for pricing/product removals or gaps relevant to ${params.account} (competitor: ${params.competitor}).${selfLine}

URL: ${params.url}
Snippet (truncated):
${params.htmlSnippet.slice(0, 8000)}

Score 0-100 how strong a competitive-displacement signal this is. Be specific and cite what changed. Return ONLY JSON:
{"subScore":0-100,"title":"short specific headline","description":"2-3 sentences citing the concrete change","confidence":0.0-1.0}`,
    voidScoreSchema,
  );

  if (!parsed) {
    throw new Error(`AI/ML API fetch failed during void scoring for ${params.account}. Check AI_ML_API_KEY.`);
  }

  return parsed;
}

export async function scoreComplianceFromResearch(
  env: EnvMap,
  params: {
    account: string;
    industry: string;
    query: string;
    researchSnippet: string;
    self?: string;
  },
) {
  const selfLine = params.self
    ? `\nYou are doing this analysis on behalf of: ${params.self}. Judge regulatory urgency in terms of how it creates a buying window for THEM.`
    : "";
  const parsed = await chatCompletionJson(
    env,
    `You are a compliance radar for B2B GTM. Score regulatory urgency for ${params.account} (${params.industry}).${selfLine}

Query: ${params.query}
Research snippet:
${params.researchSnippet.slice(0, 6000)}

If the snippet contains no concrete regulation, deadline, or enforcement event, return a low subScore (under 25). Do not invent regulations. Return ONLY JSON:
{"subScore":0-100,"title":"short specific headline","description":"2-3 sentences citing the concrete regulation/deadline","confidence":0.0-1.0}`,
    complianceScoreSchema,
  );

  if (!parsed) {
    throw new Error(`AI/ML API fetch failed during compliance scoring for ${params.account}. Check AI_ML_API_KEY.`);
  }

  return parsed;
}

export async function scorePainFromText(
  env: EnvMap,
  params: {
    account: string;
    competitor: string;
    painText: string;
    classification?: Record<string, unknown>;
    self?: string;
  },
) {
  const classHint = params.classification
    ? `\nClassifier output: ${JSON.stringify(params.classification)}`
    : "";
  const selfLine = params.self
    ? `\nYou are doing this analysis on behalf of: ${params.self}.`
    : "";

  const parsed = await chatCompletionJson(
    env,
    `Score buying intent for ${params.account} (competitor: ${params.competitor}).${selfLine}

Pain text: "${params.painText}"${classHint}

Base the score ONLY on the evidence in the pain text. If it shows no real dissatisfaction or evaluation intent, return a low subScore. Return ONLY JSON:
{"subScore":0-100,"title":"short specific headline","description":"2-3 sentences grounded in the pain text","confidence":0.0-1.0}`,
    painScoreSchema,
  );

  if (!parsed) {
    throw new Error(`AI/ML API fetch failed during pain scoring for ${params.account}. Check AI_ML_API_KEY.`);
  }

  return parsed;
}

export function engineLabel(engine: EngineType): string {
  const map = { void: "Void", compliance: "Compliance", pain: "Pain" };
  return map[engine];
}
