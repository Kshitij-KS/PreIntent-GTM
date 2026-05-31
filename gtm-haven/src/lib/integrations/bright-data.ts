import type { EngineSignal, ProviderMode } from "../domain";
import { scoreComplianceFromResearch, scoreVoidFromPageContent } from "./ai-ml";
import { type EnvMap, isRealMode, normalizeMode } from "./env";

export interface BrightDataSweepInput {
  account: string;
  industry: string;
  competitor: string;
  competitorPricingUrl?: string;
  regulatoryQuery?: string;
}

export interface BrightDataSweepResult {
  mode: ProviderMode;
  signals: EngineSignal[];
  note: string;
}

async function fetchViaBrightData(
  url: string,
  env: EnvMap,
  zone?: string,
): Promise<{ body: string; source: "bright_data" | "direct" | "none" }> {
  const apiKey = env.BRIGHT_DATA_API_KEY?.trim();
  const endpoint = env.BRIGHT_DATA_ENDPOINT || "https://api.brightdata.com/request";
  const zoneName = zone || env.BRIGHT_DATA_ZONE || "web_unlocker";

  // Try Bright Data first (if key present)
  if (apiKey) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ zone: zoneName, url, format: "raw" }),
        signal: AbortSignal.timeout(45_000),
      });

      if (res.ok) {
        return { body: (await res.text()).slice(0, 20_000), source: "bright_data" };
      }
      console.warn(`[BrightData] Request returned ${res.status} for ${url}`);
    } catch (err) {
      console.warn("[BrightData] Request failed:", err);
    }
  }

  // Fallback: direct HTTP (best-effort, some sites will block)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PreIntent/1.0 (+https://preintent.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      return { body: (await res.text()).slice(0, 20_000), source: "direct" };
    }
  } catch {
    // fall through to none
  }

  return { body: "", source: "none" };
}

/** Build a zero-signal stub for when real data isn't available yet. */
function buildPendingSignal(
  engine: "void" | "compliance",
  account: string,
  competitor: string,
  industry: string,
  now: string,
): EngineSignal {
  const isVoid = engine === "void";
  return {
    id: `${engine}-${account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    engine,
    title: isVoid
      ? `${competitor} — pricing intelligence pending`
      : `${industry} regulatory landscape — analysis pending`,
    description: isVoid
      ? `Bright Data sweep will populate live competitor pricing data for ${competitor} once API keys are configured. Add BRIGHT_DATA_API_KEY and AI_ML_API_KEY to enable real-time analysis.`
      : `Compliance radar will monitor regulatory changes affecting ${industry} companies once API keys are configured. Add BRIGHT_DATA_API_KEY and AI_ML_API_KEY to enable.`,
    eventTime: now,
    subScore: 0,
    confidence: 0,
    provenance: {
      sponsor: "bright_data",
      tool: engine === "void" ? "Scraping Browser" : "SERP API",
      capturedAt: now,
      note: "Pending — configure BRIGHT_DATA_API_KEY and AI_ML_API_KEY to enable live sweeps.",
    },
    rawEvidence: { status: "pending_api_key" },
  };
}

/** Build a real scored signal when AI scoring fails but we have page content. */
function buildHeuristicVoidSignal(
  account: string,
  competitor: string,
  pricingUrl: string,
  fetchSource: string,
  now: string,
): EngineSignal {
  return {
    id: `void-${account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    engine: "void",
    title: `${competitor} pricing page retrieved`,
    description: `Live pricing data fetched from ${competitor}. AI scoring requires AI_ML_API_KEY to compute sub-scores. Configure the key to unlock full void scoring.`,
    eventTime: now,
    subScore: 30,
    confidence: 0.4,
    provenance: {
      sponsor: "bright_data",
      tool: "Scraping Browser",
      url: pricingUrl,
      capturedAt: now,
      note: `Fetched via ${fetchSource === "bright_data" ? "Bright Data" : "direct HTTP"}; AI scoring pending`,
    },
    rawEvidence: { fetchSource, url: pricingUrl },
  };
}

function buildHeuristicComplianceSignal(
  account: string,
  industry: string,
  query: string,
  serpUrl: string,
  fetchSource: string,
  now: string,
): EngineSignal {
  return {
    id: `compliance-${account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    engine: "compliance",
    title: `${industry} regulatory signals retrieved`,
    description: `SERP data fetched for "${query}". AI scoring requires AI_ML_API_KEY to compute compliance sub-scores. Configure the key to unlock full regulatory analysis.`,
    eventTime: now,
    subScore: 25,
    confidence: 0.35,
    provenance: {
      sponsor: "bright_data",
      tool: "SERP API",
      url: serpUrl,
      capturedAt: now,
      note: `SERP fetched via ${fetchSource}; AI scoring pending`,
    },
    rawEvidence: { query, fetchSource },
  };
}

export async function runBrightDataSweep(
  input: BrightDataSweepInput,
  env: EnvMap = process.env,
): Promise<BrightDataSweepResult> {
  const mode = normalizeMode(env.BRIGHT_DATA_MODE);

  if (mode === "disabled") {
    return {
      mode,
      signals: [],
      note: "Bright Data disabled by BRIGHT_DATA_MODE.",
    };
  }

  const now = new Date().toISOString();
  const notes: string[] = [];
  const signals: EngineSignal[] = [];

  // Determine the pricing URL to scrape:
  // 1. Explicit input URL (e.g. from resolved competitors)
  // 2. Env default
  // 3. Construct from competitor name (best effort)
  const pricingUrl =
    input.competitorPricingUrl?.trim() ||
    env.BRIGHT_DATA_DEFAULT_PRICING_URL?.trim() ||
    `https://www.${input.competitor.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/pricing`;

  const regulatoryQuery =
    input.regulatoryQuery?.trim() ||
    env.BRIGHT_DATA_DEFAULT_REGULATORY_QUERY?.trim() ||
    `${input.industry} compliance regulation 2025 enforcement deadline`;

  const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(regulatoryQuery)}&num=10`;

  // ── MOCK MODE: no keys configured ─────────────────────────────────────────
  // Return zero-score pending signals that are real in structure but honest
  // about needing API keys. NO demo/preintent-demo imports.
  if (mode === "mock" || !isRealMode(env, "BRIGHT_DATA_MODE", ["BRIGHT_DATA_API_KEY"])) {
    const hasAiKey = Boolean(env.AI_ML_API_KEY?.trim());

    if (!hasAiKey) {
      // Both Bright Data and AI/ML missing — return pending stubs
      return {
        mode: "mock",
        signals: [
          buildPendingSignal("void", input.account, input.competitor, input.industry, now),
          buildPendingSignal("compliance", input.account, input.competitor, input.industry, now),
        ],
        note: "Mock mode: configure BRIGHT_DATA_API_KEY + AI_ML_API_KEY to enable live sweeps.",
      };
    }

    // AI key exists but no Bright Data — try direct fetch for partial data
    const [pricingFetch, serpFetch] = await Promise.all([
      fetchViaBrightData(pricingUrl, { ...env, BRIGHT_DATA_API_KEY: undefined }, undefined),
      fetchViaBrightData(serpUrl, { ...env, BRIGHT_DATA_API_KEY: undefined }, undefined),
    ]);

    if (pricingFetch.body) {
      try {
        const scored = await scoreVoidFromPageContent(env, {
          account: input.account,
          competitor: input.competitor,
          url: pricingUrl,
          htmlSnippet: pricingFetch.body,
        });
        signals.push({
          id: `void-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          engine: "void",
          title: scored.title,
          description: scored.description,
          eventTime: now,
          subScore: scored.subScore,
          confidence: scored.confidence ?? 0.7,
          provenance: {
            sponsor: "bright_data",
            tool: "Scraping Browser",
            url: pricingUrl,
            capturedAt: now,
            note: "Fetched via direct HTTP (no Bright Data key); scored by AI/ML API",
          },
          rawEvidence: { fetchSource: pricingFetch.source, url: pricingUrl },
        });
        notes.push(`Void: direct fetch OK (${pricingUrl})`);
      } catch {
        signals.push(buildHeuristicVoidSignal(input.account, input.competitor, pricingUrl, pricingFetch.source, now));
        notes.push("Void: direct fetch OK; AI scoring pending (add AI_ML_API_KEY)");
      }
    } else {
      signals.push(buildPendingSignal("void", input.account, input.competitor, input.industry, now));
      notes.push("Void: direct fetch returned empty — add BRIGHT_DATA_API_KEY for full access");
    }

    const researchBody = serpFetch.body ||
      `Regulatory environment: ${regulatoryQuery}. ${input.industry} companies face evolving compliance requirements.`;

    try {
      const complianceScored = await scoreComplianceFromResearch(env, {
        account: input.account,
        industry: input.industry,
        query: regulatoryQuery,
        researchSnippet: researchBody,
      });
      signals.push({
        id: `compliance-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        engine: "compliance",
        title: complianceScored.title,
        description: complianceScored.description,
        eventTime: now,
        subScore: complianceScored.subScore,
        confidence: complianceScored.confidence ?? 0.7,
        provenance: {
          sponsor: "bright_data",
          tool: "SERP API",
          url: serpUrl,
          capturedAt: now,
          note: `SERP via ${serpFetch.source}; scored by AI/ML API`,
        },
        rawEvidence: { query: regulatoryQuery, fetchSource: serpFetch.source },
      });
      notes.push(`Compliance: ${serpFetch.source} + AI scored`);
    } catch {
      signals.push(buildHeuristicComplianceSignal(input.account, input.industry, regulatoryQuery, serpUrl, serpFetch.source, now));
      notes.push("Compliance: AI scoring pending (add AI_ML_API_KEY)");
    }

    return { mode: "mock", signals, note: notes.join(" · ") };
  }

  // ── REAL MODE: Bright Data key present ────────────────────────────────────
  const pricingFetch = await fetchViaBrightData(
    pricingUrl,
    env,
    env.BRIGHT_DATA_ZONE || "web_unlocker",
  );

  if (pricingFetch.body) {
    try {
      const scored = await scoreVoidFromPageContent(env, {
        account: input.account,
        competitor: input.competitor,
        url: pricingUrl,
        htmlSnippet: pricingFetch.body,
      });
      signals.push({
        id: `void-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        engine: "void",
        title: scored.title,
        description: scored.description,
        eventTime: now,
        subScore: scored.subScore,
        confidence: scored.confidence ?? 0.88,
        provenance: {
          sponsor: "bright_data",
          tool: "Scraping Browser",
          url: pricingUrl,
          capturedAt: now,
          note: `Fetched via ${pricingFetch.source === "bright_data" ? "Bright Data" : "direct HTTP"}; scored by AI/ML API`,
        },
        rawEvidence: { fetchSource: pricingFetch.source, url: pricingUrl },
      });
      notes.push(`Void: ${pricingFetch.source} fetch OK (${pricingUrl})`);
    } catch {
      // AI scoring failed but we have the page — use heuristic signal
      signals.push(buildHeuristicVoidSignal(input.account, input.competitor, pricingUrl, pricingFetch.source, now));
      notes.push(`Void: page fetched via ${pricingFetch.source}; AI scoring failed`);
    }
  } else {
    // Could not fetch pricing page — return pending stub, don't throw
    signals.push(buildPendingSignal("void", input.account, input.competitor, input.industry, now));
    notes.push(`Void: fetch failed for ${pricingUrl}`);
  }

  const serpFetch = await fetchViaBrightData(
    serpUrl,
    env,
    env.BRIGHT_DATA_SERP_ZONE || env.BRIGHT_DATA_ZONE || "serp",
  );

  const researchBody =
    serpFetch.body ||
    `Regulatory environment: ${regulatoryQuery}. ${input.industry} companies face evolving compliance requirements.`;

  try {
    const complianceScored = await scoreComplianceFromResearch(env, {
      account: input.account,
      industry: input.industry,
      query: regulatoryQuery,
      researchSnippet: researchBody,
    });
    signals.push({
      id: `compliance-${input.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      engine: "compliance",
      title: complianceScored.title,
      description: complianceScored.description,
      eventTime: now,
      subScore: complianceScored.subScore,
      confidence: complianceScored.confidence ?? 0.85,
      provenance: {
        sponsor: "bright_data",
        tool: "SERP API",
        url: serpUrl,
        capturedAt: now,
        note: `SERP research via ${serpFetch.source}; scored by AI/ML API`,
      },
      rawEvidence: { query: regulatoryQuery, fetchSource: serpFetch.source },
    });
    notes.push(`Compliance: SERP ${serpFetch.source}`);
  } catch {
    signals.push(buildHeuristicComplianceSignal(input.account, input.industry, regulatoryQuery, serpUrl, serpFetch.source, now));
    notes.push(`Compliance: SERP ${serpFetch.source}; AI scoring failed`);
  }

  return {
    mode: "real",
    signals,
    note: notes.join(" · "),
  };
}
