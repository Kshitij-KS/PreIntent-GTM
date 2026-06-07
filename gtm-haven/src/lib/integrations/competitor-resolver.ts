/**
 * Competitor Resolution Agent
 *
 * Addresses the core problem: competitor names entered during onboarding (e.g. "Stripe")
 * are ambiguous  -  multiple companies use the same word. This agent uses Bright Data SERP
 * to find candidate companies, then uses the AI/ML API + company knowledge-doc context to
 * disambiguate and return the canonical competitor with a verified website URL.
 *
 * Modes (driven by BRIGHT_DATA_MODE + AI_ML_MODE):
 *   real   -  live SERP search + AI disambiguation
 *   mock   -  deterministic mock data (demo / CI)
 */

import pMap from "p-map";

import { type EnvMap, isRealMode } from "./env";
import type { CompanyKnowledgeDoc } from "../company-knowledge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolutionStatus = "resolved" | "ambiguous" | "not_found" | "mock";

export interface ResolvedCompetitor {
  /** Exactly what the user typed during onboarding */
  originalName: string;
  /** Canonical company name as found on the web */
  resolvedName: string;
  /** Primary website URL (with https://) */
  website: string;
  /** Pricing page URL if detectable, falls back to website */
  pricingUrl: string;
  /** One-sentence description from SERP snippet */
  description: string;
  /** 0–1 confidence in resolution accuracy */
  confidence: number;
  /** Resolution outcome */
  status: ResolutionStatus;
  /** ISO timestamp of resolution */
  resolvedAt: string;
}

interface SerpCandidate {
  title: string;
  url: string;
  snippet: string;
}

// ─── SERP Search via Bright Data ─────────────────────────────────────────────

async function searchSerp(
  query: string,
  env: EnvMap,
): Promise<SerpCandidate[]> {
  const apiKey = env.BRIGHT_DATA_API_KEY?.trim();
  const endpoint = env.BRIGHT_DATA_ENDPOINT || "https://api.brightdata.com/request";
  const serpZone = env.BRIGHT_DATA_SERP_ZONE || env.BRIGHT_DATA_ZONE || "serp";

  if (!apiKey) return [];

  const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=8&gl=us&hl=en`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        zone: serpZone,
        url: serpUrl,
        format: "raw",
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.warn(`[CompetitorResolver] SERP request failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const html = await res.text();
    return parseSerpHtml(html);
  } catch (err) {
    console.warn("[CompetitorResolver] SERP fetch error:", err);
    return [];
  }
}

/**
 * Lightweight HTML parser for Google SERP results.
 * Extracts title, URL and snippet from organic result blocks.
 * Resilient to Google's structural changes  -  uses multiple selector patterns.
 */
function parseSerpHtml(html: string): SerpCandidate[] {
  const candidates: SerpCandidate[] = [];

  // Pattern 1: Extract href from anchor tags near h3 headings
  const anchorPattern = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>\s*<h3[^>]*>([^<]+)<\/h3>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null && candidates.length < 8) {
    const url = match[1];
    const title = decodeHtmlEntities(match[2].trim());

    // Skip Google-internal URLs
    if (url.includes("google.com") || url.includes("accounts.google")) continue;

    // Extract nearby snippet (look for div after this position)
    const snippetStart = html.indexOf(match[0]) + match[0].length;
    const snippetRegion = html.slice(snippetStart, snippetStart + 800);
    const snippetMatch = snippetRegion.match(/<span[^>]*>([^<]{40,300})<\/span>/);
    const snippet = snippetMatch ? decodeHtmlEntities(snippetMatch[1].trim()) : "";

    // Skip obvious ad/shopping URLs
    if (url.includes("/aclk?") || url.includes("googleadservices")) continue;

    candidates.push({ title, url: normalizeUrl(url), snippet });
  }

  // Pattern 2: JSON-LD structured data (more reliable when present)
  const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data?.itemListElement) ? data.itemListElement : [];
      for (const item of items) {
        if (item?.item?.url && item?.item?.name) {
          const url = normalizeUrl(item.item.url);
          if (!candidates.some((c) => c.url === url)) {
            candidates.push({
              title: item.item.name,
              url,
              snippet: item.item.description ?? "",
            });
          }
        }
      }
    } catch {
      // non-fatal JSON parse error
    }
  }

  return candidates.slice(0, 8);
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Return origin + pathname, stripping query params from landing pages
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── AI Disambiguation ────────────────────────────────────────────────────────

interface DisambiguationResult {
  resolvedName: string;
  website: string;
  pricingUrl: string;
  description: string;
  confidence: number;
  reasoning: string;
}

async function disambiguateWithAI(
  originalName: string,
  candidates: SerpCandidate[],
  context: CompanyKnowledgeDoc,
  env: EnvMap,
): Promise<DisambiguationResult | null> {
  const apiKey = env.AI_ML_API_KEY?.trim();
  const endpoint = env.AI_ML_ENDPOINT || "https://api.aimlapi.com/v1";
  const model = env.AI_ML_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  if (!apiKey || env.AI_ML_MODE !== "real") return null;

  const candidateList = candidates
    .map((c, i) => `${i + 1}. Title: "${c.title}" | URL: ${c.url} | Snippet: "${c.snippet.slice(0, 200)}"`)
    .join("\n");

  const prompt = `You are a B2B competitive intelligence analyst. A company named "${context.companyName}" that operates in the "${context.icp.industries.join(", ")}" space is trying to track a competitor called "${originalName}".

Their business context:
- Segment: ${context.segmentSummary}
- Target industries: ${context.icp.industries.join(", ")}
- Key pain points: ${context.icp.painPoints.slice(0, 3).join(", ")}

From a web search for "${originalName} company software B2B", here are the top results:
${candidateList || "No results found."}

Task: Identify which result (if any) is the correct company that DIRECTLY competes with "${context.companyName}" in the SAME product category.

Rules:
- The match must operate in the same core category as "${context.companyName}" and compete for the same customers.
- A company in a different category (even a famous brand in the same country or market) is NOT a valid match. If the only candidates are out-of-category, return confidence <= 0.2.
- Prefer the official primary website (not a directory, news article, or aggregator).

Return ONLY valid JSON  -  no markdown, no explanation:
{
  "resolvedName": "canonical company name",
  "website": "https://example.com",
  "pricingUrl": "https://example.com/pricing",
  "description": "one sentence description of what they do",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why this is the right match and that it is the same category"
}

If no candidate is a plausible same-category competitor, set confidence to 0.1 and use the first result as a best guess.`;

  try {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      console.warn(`[CompetitorResolver] AI disambiguation failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = String(data.choices?.[0]?.message?.content || "{}");
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as DisambiguationResult;
  } catch (err) {
    console.warn("[CompetitorResolver] AI disambiguation error:", err);
    return null;
  }
}

// ─── Mock Resolution ─────────────────────────────────────────────────────────

/**
 * Deterministic mock resolution  -  used in demo mode, CI, or when API keys are absent.
 * Maps common competitor names to known websites so the UI is always useful.
 */
const KNOWN_COMPETITORS: Record<string, { website: string; pricingUrl: string; description: string }> = {
  stripe: { website: "https://stripe.com", pricingUrl: "https://stripe.com/pricing", description: "Online payment processing platform for internet businesses." },
  braintree: { website: "https://www.braintreepayments.com", pricingUrl: "https://www.braintreepayments.com/pricing", description: "PayPal-owned payment gateway for web and mobile apps." },
  adyen: { website: "https://www.adyen.com", pricingUrl: "https://www.adyen.com/pricing", description: "Global payment technology company for enterprise commerce." },
  salesforce: { website: "https://www.salesforce.com", pricingUrl: "https://www.salesforce.com/editions-pricing/sales-cloud/", description: "Leading CRM and enterprise cloud software platform." },
  hubspot: { website: "https://www.hubspot.com", pricingUrl: "https://www.hubspot.com/pricing", description: "CRM, marketing, sales, and service software platform." },
  zendesk: { website: "https://www.zendesk.com", pricingUrl: "https://www.zendesk.com/pricing/", description: "Customer service and engagement platform." },
  intercom: { website: "https://www.intercom.com", pricingUrl: "https://www.intercom.com/pricing", description: "Customer messaging and engagement platform." },
  "drift": { website: "https://www.drift.com", pricingUrl: "https://www.drift.com/pricing/", description: "Conversational marketing and sales platform." },
  segment: { website: "https://segment.com", pricingUrl: "https://segment.com/pricing/", description: "Customer data platform for collecting and routing data." },
  twilio: { website: "https://www.twilio.com", pricingUrl: "https://www.twilio.com/pricing", description: "Cloud communications platform for building customer engagement." },
  klaviyo: { website: "https://www.klaviyo.com", pricingUrl: "https://www.klaviyo.com/pricing", description: "Email and SMS marketing automation for e-commerce." },
  gong: { website: "https://www.gong.io", pricingUrl: "https://www.gong.io/pricing/", description: "Revenue intelligence platform for sales teams." },
  outreach: { website: "https://www.outreach.io", pricingUrl: "https://www.outreach.io/pricing", description: "Sales execution and engagement platform." },
  "apollo.io": { website: "https://www.apollo.io", pricingUrl: "https://www.apollo.io/pricing", description: "B2B sales intelligence and engagement platform." },
  apollo: { website: "https://www.apollo.io", pricingUrl: "https://www.apollo.io/pricing", description: "B2B sales intelligence and engagement platform." },
  zoominfo: { website: "https://www.zoominfo.com", pricingUrl: "https://www.zoominfo.com/pricing", description: "B2B intelligence and go-to-market platform." },
  "6sense": { website: "https://6sense.com", pricingUrl: "https://6sense.com/platform/pricing/", description: "Account-based marketing and revenue intelligence platform." },
  clearbit: { website: "https://clearbit.com", pricingUrl: "https://clearbit.com/pricing", description: "B2B data enrichment and buyer intent platform." },
  bombora: { website: "https://bombora.com", pricingUrl: "https://bombora.com/product/", description: "B2B intent data and audience solutions provider." },
  clari: { website: "https://www.clari.com", pricingUrl: "https://www.clari.com/product/", description: "Revenue operations platform for pipeline management." },
};

function buildMockResolution(originalName: string): ResolvedCompetitor {
  const key = originalName.toLowerCase().trim();
  const known = KNOWN_COMPETITORS[key];
  const now = new Date().toISOString();

  if (known) {
    return {
      originalName,
      resolvedName: originalName.charAt(0).toUpperCase() + originalName.slice(1),
      website: known.website,
      pricingUrl: known.pricingUrl,
      description: known.description,
      confidence: 0.92,
      status: "mock",
      resolvedAt: now,
    };
  }

  // Unknown competitor  -  construct plausible fallback
  const slug = key.replace(/[^a-z0-9]/g, "");
  return {
    originalName,
    resolvedName: originalName,
    website: `https://www.${slug}.com`,
    pricingUrl: `https://www.${slug}.com/pricing`,
    description: `${originalName} is a software company in your competitive landscape.`,
    confidence: 0.35,
    status: "mock",
    resolvedAt: now,
  };
}

// ─── Single Competitor Resolution ────────────────────────────────────────────

/**
 * Resolve a single competitor name to a canonical company + verified website URL.
 * Uses real SERP + AI when keys are available; falls back to mock gracefully.
 */
export async function resolveCompetitor(
  originalName: string,
  context: CompanyKnowledgeDoc,
  env: EnvMap = process.env,
): Promise<ResolvedCompetitor> {
  const now = new Date().toISOString();
  const trimmed = originalName.trim();

  // Guard: skip empty names
  if (!trimmed) {
    return {
      originalName,
      resolvedName: originalName,
      website: "",
      pricingUrl: "",
      description: "",
      confidence: 0,
      status: "not_found",
      resolvedAt: now,
    };
  }

  const hasBrightData = isRealMode(env, "BRIGHT_DATA_MODE", ["BRIGHT_DATA_API_KEY"]);
  const hasAiMl = env.AI_ML_MODE === "real" && Boolean(env.AI_ML_API_KEY?.trim());

  // Mock mode or no keys  -  return deterministic mock
  if (!hasBrightData && !hasAiMl) {
    return buildMockResolution(trimmed);
  }

  // Real mode: SERP search
  const serpQuery = `"${trimmed}" company B2B software ${context.icp.industries[0] ?? "SaaS"} site:*.com -site:linkedin.com -site:crunchbase.com`;
  const candidates = hasBrightData
    ? await searchSerp(serpQuery, env)
    : [];

  // If SERP returned nothing, fall back to mock
  if (candidates.length === 0) {
    const mock = buildMockResolution(trimmed);
    return { ...mock, status: "ambiguous" };
  }

  // AI disambiguation
  const aiResult = hasAiMl
    ? await disambiguateWithAI(trimmed, candidates, context, env)
    : null;

  if (aiResult && aiResult.website) {
    return {
      originalName: trimmed,
      resolvedName: aiResult.resolvedName || trimmed,
      website: aiResult.website,
      pricingUrl: aiResult.pricingUrl || `${aiResult.website}/pricing`,
      description: aiResult.description || "",
      confidence: Math.min(1, Math.max(0, aiResult.confidence ?? 0.7)),
      status: aiResult.confidence >= 0.6 ? "resolved" : "ambiguous",
      resolvedAt: now,
    };
  }

  // SERP only (no AI)  -  use the top result as best guess
  const top = candidates[0];
  return {
    originalName: trimmed,
    resolvedName: top.title.split(" - ")[0].split(" | ")[0].trim(),
    website: top.url,
    pricingUrl: `${top.url}/pricing`,
    description: top.snippet.slice(0, 200),
    confidence: 0.55,
    status: "ambiguous",
    resolvedAt: now,
  };
}

// ─── Batch Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve all competitor names from the knowledge doc with a concurrency limit of 2.
 * Failures on individual competitors are caught and returned as 'not_found' entries
 * so a single bad name never blocks the whole batch.
 */
export async function resolveAllCompetitors(
  competitors: string[],
  context: CompanyKnowledgeDoc,
  env: EnvMap = process.env,
): Promise<ResolvedCompetitor[]> {
  const unique = [...new Set(competitors.filter(Boolean))];
  if (unique.length === 0) return [];

  const results = await pMap(
    unique,
    async (name) => {
      try {
        return await resolveCompetitor(name, context, env);
      } catch (err) {
        console.error(`[CompetitorResolver] Failed to resolve "${name}":`, err);
        return {
          originalName: name,
          resolvedName: name,
          website: "",
          pricingUrl: "",
          description: "Resolution failed  -  will retry on next sweep.",
          confidence: 0,
          status: "not_found" as ResolutionStatus,
          resolvedAt: new Date().toISOString(),
        };
      }
    },
    { concurrency: 5 }
  );

  return results;
}
