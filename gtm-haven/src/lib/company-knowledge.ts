/**
 * Company Knowledge Document
 * Generated during onboarding  -  forms the AI context for all GTM actions.
 */

export type { ResolvedCompetitor, ResolutionStatus } from "./integrations/competitor-resolver";

export interface CompanyOnboardingData {
  // Step 1  -  Company Basics
  companyName: string;
  website?: string;
  industry: string;
  teamSize: string;
  hq: string;

  // Step 2  -  GTM Context
  icpDescription: string;
  targetVerticals: string[];
  topCompetitors: string[];
  mainPainPoints: string;

  // Step 3  -  Stack + Goals
  crm: string;
  existingTools: string[];
  gtmGoals: string;
  revenueTarget?: string;
}

export interface CompanyKnowledgeDoc {
  id: string;
  companyName: string;
  generatedAt: string;
  generatedBy: "ai_ml_api" | "mock";

  /** One-paragraph segment overview */
  segmentSummary: string;

  /** Structured ICP definition */
  icp: {
    companySize: string;
    industries: string[];
    roles: string[];
    painPoints: string[];
    triggerEvents: string[];
  };

  /** Competitive positioning */
  positioning: {
    differentiators: string[];
    weaknesses: string[];
    competitorVulnerabilities: Record<
      string,
      { opportunity: string; timing: string }
    >;
  };

  /** Top 3 GTM opportunities right now */
  opportunities: Array<{
    title: string;
    description: string;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    suggestedAction: string;
  }>;

  /** First target accounts PreIntent should monitor */
  seedAccounts: Array<{
    name: string;
    industry: string;
    employees: string;
    whyNow: string;
    competitor: string;
  }>;

  /** Recommended PreIntent scan configuration */
  scanConfig: {
    competitors: string[];
    regulatoryKeywords: string[];
    communityKeywords: string[];
  };

  /**
   * AI-resolved competitor list  -  populated asynchronously after onboarding
   * by the Competitor Resolution Agent via /api/competitors/resolve.
   * Each entry has the canonical name, verified website URL, and confidence score.
   * This field is persisted to Supabase and cached in localStorage.
   */
  resolvedCompetitors?: import("./integrations/competitor-resolver").ResolvedCompetitor[];

  /** Overall resolution status of the competitors list */
  competitorResolutionStatus?: "pending" | "resolving" | "resolved" | "failed";
}

function buildMockKnowledgeDoc(
  data: CompanyOnboardingData,
): CompanyKnowledgeDoc {
  const competitors = data.topCompetitors.filter(Boolean);
  const primaryCompetitor = competitors[0] ?? "the market leader";

  return {
    id: `kdoc-${data.companyName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    companyName: data.companyName,
    generatedAt: new Date().toISOString(),
    generatedBy: "mock",

    segmentSummary: `${data.companyName} operates in the ${data.industry} space, targeting ${data.icpDescription}. With a team of ${data.teamSize} based in ${data.hq}, the company is positioned to capture market share from ${primaryCompetitor} as buyer expectations shift toward more agile, transparent vendors. Current GTM goals center on ${data.gtmGoals}, with PreIntent monitoring competitor movements, regulatory shifts, and community buying signals across ${data.targetVerticals.join(", ")}.`,

    icp: {
      companySize: "100–1000 employees",
      industries: data.targetVerticals.length
        ? data.targetVerticals
        : [data.industry],
      roles: ["VP of Sales", "Head of RevOps", "Chief Revenue Officer", "Head of Strategy"],
      painPoints: data.mainPainPoints
        ? data.mainPainPoints.split(/[,.\n]/).map((s) => s.trim()).filter(Boolean)
        : [
            `Over-reliance on ${primaryCompetitor}`,
            "Reactive competitor monitoring",
            "Missed buying windows",
            "Manual research overhead",
          ],
      triggerEvents: [
        `${primaryCompetitor} pricing or product change`,
        "Regulatory compliance deadline approaching",
        "Contract renewal within 90 days",
        "Leadership change at prospect",
        "Negative community sentiment about current vendor",
      ],
    },

    positioning: {
      differentiators: [
        "Predictive convergence scoring vs reactive monitoring",
        "Three-signal triangulation (Void + Compliance + Pain)",
        "AI-generated Intel Briefs ready to send",
        "Real-time community signal classification",
      ],
      weaknesses: [
        "Newer entrant vs established platforms",
        "Integration depth still growing",
      ],
      competitorVulnerabilities: competitors.reduce(
        (acc, comp) => ({
          ...acc,
          [comp]: {
            opportunity: `${comp} customers experiencing pricing pressure and support gaps  -  active evaluation signals detected`,
            timing: "Act within next 30 days for highest conversion",
          },
        }),
        {} as Record<string, { opportunity: string; timing: string }>,
      ),
    },

    opportunities: [
      {
        title: `${primaryCompetitor} Customer Displacement`,
        description: `${primaryCompetitor} has recently changed pricing or product scope. Monitor their customers in your ICP for active evaluation signals.`,
        urgency: "HIGH",
        suggestedAction: `Run Void Scanner sweep on ${primaryCompetitor} pricing pages weekly. Alert AEs when convergence > 75.`,
      },
      {
        title: "Regulatory Compliance Window",
        description: `Companies in ${data.targetVerticals[0] ?? data.industry} face upcoming regulatory deadlines creating urgent evaluation need.`,
        urgency: "HIGH",
        suggestedAction: "Set Compliance Radar alerts for relevant regulatory bodies and map to your target account list.",
      },
      {
        title: "Community Pain Mining",
        description: `r/${data.industry.toLowerCase().replace(/\s+/g, "")}, LinkedIn, and G2 reviews show active buying intent from your ICP personas.`,
        urgency: "MEDIUM",
        suggestedAction: "Configure Pain Listener with competitor and industry keywords to surface hot accounts.",
      },
    ],

    seedAccounts: (competitors.length ? competitors : [primaryCompetitor]).slice(0, 3).map((comp, i) => {
      const vertical = data.targetVerticals[i] ?? data.targetVerticals[0] ?? data.industry;
      return {
        name: `Sample ${vertical} prospect ${i + 1}`,
        industry: vertical,
        employees: "200–500",
        whyNow: `Illustrative target in ${vertical}. Connect API keys and run a scan to replace this with a real, AI-identified account currently using ${comp} and showing buying signals.`,
        competitor: comp,
      };
    }),

    scanConfig: {
      competitors: competitors,
      regulatoryKeywords: [
        data.industry + " compliance",
        data.industry + " regulation 2025",
        "enforcement deadline",
      ],
      communityKeywords: competitors.flatMap((c) => [
        `alternatives to ${c}`,
        `${c} pricing`,
        `${c} contract renewal`,
        `replacing ${c}`,
      ]),
    },
  };
}

async function callAIForKnowledgeDoc(
  data: CompanyOnboardingData,
): Promise<CompanyKnowledgeDoc | null> {
  const env = process.env;
  const apiKey = env.AI_ML_API_KEY;
  const endpoint = env.AI_ML_ENDPOINT ?? "https://api.aimlapi.com/v1";
  const model =
    env.AI_ML_MODEL ?? "gpt-4o";

  if (env.AI_ML_MODE !== "real" || !apiKey) return null;

  const userCompetitors = data.topCompetitors.filter(Boolean);

  const prompt = `You are an elite B2B go-to-market strategist building a Company Intelligence Document for PreIntent, a competitive-intelligence platform.

## COMPANY YOU ARE ANALYZING
Name: ${data.companyName}
Industry / category: ${data.industry}
Team size: ${data.teamSize}
HQ: ${data.hq}
Ideal customer profile: ${data.icpDescription}
Target verticals: ${data.targetVerticals.join(", ") || "(not specified)"}
Competitors the user explicitly named: ${userCompetitors.join(", ") || "(none)"}
Main pain points: ${data.mainPainPoints}
GTM goals: ${data.gtmGoals}

## CRITICAL RULES FOR COMPETITORS (read carefully)
1. First, in one phrase, determine the company's EXACT product category (e.g. "ride-hailing / mobility", "payment processing", "food delivery", "CRM software"). Everything below must respect this category.
2. The user-named competitors are authoritative - ALWAYS include every one of them.
3. You MAY add at most 3 additional competitors, but ONLY companies that offer the SAME core product in the SAME category and realistically compete for the SAME customers.
4. NEVER include a company from a different category, even if it is famous in the same country or is a well-known tech brand. Example of what NOT to do: if the company is a ride-hailing app whose competitors are Uber and Ola, do NOT add a food-delivery company (e.g. Zomato/Swiggy/DoorDash), a fintech, or any unrelated brand. They are NOT competitors.
5. If you are not confident a candidate is a direct same-category competitor, leave it out. A short, correct list beats a long, wrong one.

## RULES FOR SEED ACCOUNTS (target accounts to monitor)
- seedAccounts are REAL, currently-operating, named companies that are realistic TARGET CUSTOMERS / prospects matching the ICP and target verticals above.
- They must NOT be ${data.companyName} itself, and must NOT be any of the competitors.
- Each seedAccount's "competitor" field must be one of the competitors from your final competitor list (the incumbent that account most likely uses today).
- Each "whyNow" must be a specific, plausible buying-signal narrative tied to that competitor's recent moves or the account's situation. No generic filler.
- Provide 3 to 5 seed accounts.

Return ONLY valid JSON matching this exact structure (no markdown, no commentary):
{
  "productCategory": "the exact category you determined",
  "segmentSummary": "2-3 sentence strategic segment overview specific to ${data.companyName}",
  "icp": {
    "companySize": "X-Y employees",
    "industries": ["industry1", "industry2"],
    "roles": ["role1", "role2", "role3"],
    "painPoints": ["pain1", "pain2", "pain3", "pain4"],
    "triggerEvents": ["event1", "event2", "event3"]
  },
  "positioning": {
    "differentiators": ["diff1", "diff2", "diff3"],
    "weaknesses": ["weakness1", "weakness2"],
    "competitorVulnerabilities": {
      "CompetitorName": {"opportunity": "...", "timing": "..."}
    }
  },
  "opportunities": [
    {"title": "...", "description": "...", "urgency": "HIGH", "suggestedAction": "..."},
    {"title": "...", "description": "...", "urgency": "MEDIUM", "suggestedAction": "..."},
    {"title": "...", "description": "...", "urgency": "LOW", "suggestedAction": "..."}
  ],
  "seedAccounts": [
    {"name": "Real Company Name", "industry": "...", "employees": "...", "whyNow": "...", "competitor": "OneOfYourCompetitors"}
  ],
  "scanConfig": {
    "competitors": ["user competitors first, then any same-category additions"],
    "regulatoryKeywords": ["...", "..."],
    "communityKeywords": ["...", "..."]
  }
}`;

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
        temperature: 0.15,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) throw new Error(`AI/ML API ${res.status}`);

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    const mock = buildMockKnowledgeDoc(data);
    const merged: CompanyKnowledgeDoc = {
      ...mock,
      generatedBy: "ai_ml_api",
      segmentSummary: parsed.segmentSummary ?? mock.segmentSummary,
      icp: parsed.icp ?? mock.icp,
      positioning: parsed.positioning ?? mock.positioning,
      opportunities: parsed.opportunities ?? mock.opportunities,
      seedAccounts: parsed.seedAccounts ?? mock.seedAccounts,
      scanConfig: parsed.scanConfig ?? mock.scanConfig,
    };

    // Enforce relevance/sanity rules even if the model strays.
    return sanitizeKnowledgeDoc(merged, data);
  } catch (err) {
    console.error("AI knowledge doc failed, using mock:", err);
    return null;
  }
}

/**
 * Post-process an AI-generated knowledge doc to enforce relevance rules the
 * model may not have followed:
 *  - the user's explicitly-named competitors are always present
 *  - the company's own name is never listed as its own competitor
 *  - competitors are de-duplicated (case-insensitive)
 *  - seed accounts never reference the company itself or non-competitors, and
 *    every seed account's competitor is one of the final competitors
 */
function sanitizeKnowledgeDoc(
  doc: CompanyKnowledgeDoc,
  data: CompanyOnboardingData,
): CompanyKnowledgeDoc {
  const self = data.companyName.trim().toLowerCase();
  const userCompetitors = data.topCompetitors.map((c) => c.trim()).filter(Boolean);

  // Build the canonical competitor list: user competitors first (authoritative),
  // then any AI additions, de-duped case-insensitively, excluding the company itself.
  const seen = new Set<string>();
  const competitors: string[] = [];
  const addCompetitor = (name: unknown) => {
    if (typeof name !== "string") return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (key === self || seen.has(key)) return;
    seen.add(key);
    competitors.push(trimmed);
  };
  userCompetitors.forEach(addCompetitor);
  (doc.scanConfig?.competitors ?? []).forEach(addCompetitor);

  const finalCompetitors = competitors.slice(0, 8);
  const competitorKeys = new Set(finalCompetitors.map((c) => c.toLowerCase()));
  const primaryCompetitor = finalCompetitors[0] ?? "the market leader";

  // Keep only seed accounts that are real prospects: not the company itself,
  // not a competitor, with a competitor field mapped to a real competitor.
  const cleanedSeeds = (doc.seedAccounts ?? [])
    .filter((s) => {
      const name = (s?.name ?? "").trim().toLowerCase();
      return name && name !== self && !competitorKeys.has(name);
    })
    .map((s) => ({
      ...s,
      competitor: competitorKeys.has((s.competitor ?? "").trim().toLowerCase())
        ? s.competitor
        : primaryCompetitor,
    }));

  const seedAccounts = cleanedSeeds.length > 0 ? cleanedSeeds : buildMockKnowledgeDoc(data).seedAccounts;

  return {
    ...doc,
    seedAccounts,
    scanConfig: {
      ...doc.scanConfig,
      competitors: finalCompetitors,
    },
  };
}

export async function generateCompanyKnowledgeDoc(
  data: CompanyOnboardingData,
): Promise<CompanyKnowledgeDoc> {
  const aiResult = await callAIForKnowledgeDoc(data);
  return aiResult ?? buildMockKnowledgeDoc(data);
}
