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

  if (apiKey) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          zone: zoneName,
          url,
          format: "raw",
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (res.ok) {
        return { body: (await res.text()).slice(0, 20_000), source: "bright_data" };
      }
    } catch (err) {
      console.warn("Bright Data request failed:", err);
    }
  }

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
    // fall through
  }

  return { body: "", source: "none" };
}

function makeSignal(
  base: EngineSignal,
  overrides: Partial<EngineSignal>,
): EngineSignal {
  return { ...base, ...overrides, provenance: { ...base.provenance, ...overrides.provenance } };
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

  const pricingUrl =
    input.competitorPricingUrl ||
    env.BRIGHT_DATA_DEFAULT_PRICING_URL ||
    "https://stripe.com/pricing";

  const regulatoryQuery =
    input.regulatoryQuery ||
    env.BRIGHT_DATA_DEFAULT_REGULATORY_QUERY ||
    `PCI-DSS 4.0 enforcement ${input.industry} deadline`;

  const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(regulatoryQuery)}`;

  if (!isRealMode(env, "BRIGHT_DATA_MODE", ["BRIGHT_DATA_API_KEY"])) {
    throw new Error("BRIGHT_DATA_API_KEY is missing but real mode is enforced. Live scraping failed.");
  }

  const notes: string[] = [];
  const signals: EngineSignal[] = [];
  const now = new Date().toISOString();

const pricingFetch = await fetchViaBrightData(
     pricingUrl,
     env,
     env.BRIGHT_DATA_ZONE || "web_unlocker",
   );

   if (pricingFetch.body) {
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
   } else {
     throw new Error(`Bright Data pricing fetch failed: Empty body or timeout for URL: ${pricingUrl}`);
   }

  const serpFetch = await fetchViaBrightData(
    serpUrl,
    env,
    env.BRIGHT_DATA_SERP_ZONE || env.BRIGHT_DATA_ZONE || "serp",
  );

  const researchBody =
    serpFetch.body ||
    `Regulatory query: ${regulatoryQuery}. Typical enforcement windows apply to ${input.industry} companies processing payments.`;

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

  return {
    mode: "real",
    signals,
    note: notes.join(" · ");
  };
}
