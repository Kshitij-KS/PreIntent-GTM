/**
 * Company Knowledge Document
 * Generated during onboarding — forms the AI context for all GTM actions.
 */

export interface CompanyOnboardingData {
  // Step 1 — Company Basics
  companyName: string;
  website?: string;
  industry: string;
  teamSize: string;
  hq: string;

  // Step 2 — GTM Context
  icpDescription: string;
  targetVerticals: string[];
  topCompetitors: string[];
  mainPainPoints: string;

  // Step 3 — Stack + Goals
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
            opportunity: `${comp} customers experiencing pricing pressure and support gaps — active evaluation signals detected`,
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

    seedAccounts: competitors.slice(0, 3).map((comp, i) => ({
      name: `${comp} Enterprise Customer ${i + 1}`,
      industry: data.targetVerticals[i] ?? data.industry,
      employees: "200–500",
      whyNow: `Confirmed ${comp} customer showing active evaluation signals. Contract renewal approaching.`,
      competitor: comp,
    })),

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
    env.AI_ML_MODEL ?? "mistralai/Mistral-7B-Instruct-v0.2";

  if (env.AI_ML_MODE !== "real" || !apiKey) return null;

  const prompt = `You are an elite GTM strategist building a company intelligence document for PreIntent, a convergent GTM intelligence platform.

Analyze this company and generate a detailed Company Knowledge Document.

Company: ${data.companyName}
Industry: ${data.industry}
Team Size: ${data.teamSize}
HQ: ${data.hq}
ICP: ${data.icpDescription}
Target Verticals: ${data.targetVerticals.join(", ")}
Top Competitors: ${data.topCompetitors.join(", ")}
Main Pain Points: ${data.mainPainPoints}
GTM Goals: ${data.gtmGoals}
Existing Tools: ${data.existingTools.join(", ")}

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "segmentSummary": "2-3 sentence strategic segment overview",
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
    {"name": "...", "industry": "...", "employees": "...", "whyNow": "...", "competitor": "..."}
  ],
  "scanConfig": {
    "competitors": ["..."],
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
        temperature: 0.3,
        max_tokens: 1800,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) throw new Error(`AI/ML API ${res.status}`);

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    const mock = buildMockKnowledgeDoc(data);
    return {
      ...mock,
      generatedBy: "ai_ml_api",
      segmentSummary: parsed.segmentSummary ?? mock.segmentSummary,
      icp: parsed.icp ?? mock.icp,
      positioning: parsed.positioning ?? mock.positioning,
      opportunities: parsed.opportunities ?? mock.opportunities,
      seedAccounts: parsed.seedAccounts ?? mock.seedAccounts,
      scanConfig: parsed.scanConfig ?? mock.scanConfig,
    };
  } catch (err) {
    console.error("AI knowledge doc failed, using mock:", err);
    return null;
  }
}

export async function generateCompanyKnowledgeDoc(
  data: CompanyOnboardingData,
): Promise<CompanyKnowledgeDoc> {
  const aiResult = await callAIForKnowledgeDoc(data);
  return aiResult ?? buildMockKnowledgeDoc(data);
}
