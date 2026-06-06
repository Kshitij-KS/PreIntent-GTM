/**
 * Shared zod schemas for input validation, external-response validation, and
 * Cognee persistence. Validation-path schemas MUST NOT coerce or transform
 * (no `.default()` / `.transform()`) so validating a conformant value is an
 * identity operation (Req 5.7 round-trip).
 */

import { z } from "zod";

// ─── Limits ──────────────────────────────────────────────────────────────────

export const MAX_PAYLOAD_BYTES = 1_048_576; // 1 MiB (Req 1.4)
export const MAX_URL_LENGTH = 2_048; // (Req 1.5, 1.9)
export const MAX_PROFILE_RECORDS = 10_000; // (Req 7.1, 7.4)

// ─── Shared field schemas ──────────────────────────────────────────────────────

/** Syntactically valid http/https URL not exceeding 2048 chars (Req 1.5, 1.9). */
export const httpUrlSchema = z
  .string()
  .max(MAX_URL_LENGTH)
  .refine((value) => {
    if (value.length === 0 || value.length > MAX_URL_LENGTH) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "must be a valid http(s) URL");

// ─── Request body / param schemas ───────────────────────────────────────────────

export const sweepBodySchema = z.object({
  account: z.string().min(1),
  industry: z.string().min(1),
  employees: z.union([z.number(), z.string()]),
  competitor: z.string().min(1),
  competitorPricingUrl: httpUrlSchema.optional(),
  regulatoryQuery: z.string().optional(),
  painText: z.string().optional(),
  audioUrl: httpUrlSchema.optional(),
  audioTranscript: z.string().optional(),
  crmStage: z.string().optional(),
});
export type SweepBody = z.infer<typeof sweepBodySchema>;

export const scoreRequestSchema = z.object({
  voidScore: z.number().min(0).max(100),
  complianceScore: z.number().min(0).max(100),
  painScore: z.number().min(0).max(100),
  account: z.string().optional(),
});
export type ScoreRequest = z.infer<typeof scoreRequestSchema>;

export const commandCenterBodySchema = z.object({
  command: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type CommandCenterBody = z.infer<typeof commandCenterBodySchema>;

export const seedAccountSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: httpUrlSchema.optional(),
});
export type SeedAccount = z.infer<typeof seedAccountSchema>;

export const onboardingProfileBodySchema = z.object({
  orgId: z.string().uuid(),
  seedAccounts: z.array(seedAccountSchema).min(1).max(100),
});
export type OnboardingProfileBody = z.infer<typeof onboardingProfileBodySchema>;

/**
 * Real onboarding payload (`CompanyOnboardingData`) posted by the onboarding
 * wizard. companyName is required; the remaining fields default so downstream
 * knowledge-doc generation never dereferences undefined. `website` is a
 * descriptive, bounded string (not used for any server-side fetch here), so it
 * is not constrained to the strict http(s) URL schema.
 */
export const onboardingDataSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  website: z.string().max(2048).optional(),
  industry: z.string().max(200).optional().default(""),
  teamSize: z.string().max(100).optional().default(""),
  hq: z.string().max(200).optional().default(""),
  icpDescription: z.string().max(5000).optional().default(""),
  targetVerticals: z.array(z.string().max(200)).max(100).optional().default([]),
  topCompetitors: z.array(z.string().max(200)).max(100).optional().default([]),
  mainPainPoints: z.string().max(5000).optional().default(""),
  crm: z.string().max(100).optional().default(""),
  existingTools: z.array(z.string().max(200)).max(200).optional().default([]),
  gtmGoals: z.string().max(5000).optional().default(""),
  revenueTarget: z.string().max(100).optional(),
});
export type OnboardingData = z.infer<typeof onboardingDataSchema>;

export const orgIdParamSchema = z.string().uuid();

// ─── External / model response schemas ──────────────────────────────────────────

/** Pain classifier model response (previously JSON.parsed unchecked). */
export const painClassificationSchema = z.object({
  signalType: z.string(),
  urgency: z.enum(["low", "medium", "high", "unknown"]),
  competitorMentioned: z.string().nullable(),
  inferredSeniority: z.string(),
  companyAttribution: z.string(),
  confidence: z.number().min(0).max(1),
});
export type PainClassificationPayload = z.infer<typeof painClassificationSchema>;

// ─── Cognee persistence schemas ──────────────────────────────────────────────────

const provenanceSchema = z.object({
  sponsor: z.string(),
  tool: z.string().optional(),
  url: z.string().optional(),
  capturedAt: z.string(),
  note: z.string().optional(),
});

export const engineSignalSchema = z.object({
  id: z.string(),
  engine: z.enum(["void", "compliance", "pain"]),
  title: z.string(),
  description: z.string(),
  eventTime: z.string(),
  subScore: z.number(),
  confidence: z.number(),
  provenance: provenanceSchema,
  rawEvidence: z.record(z.string(), z.unknown()).optional(),
});

const engineSectionSchema = z.object({
  signals: z.array(engineSignalSchema),
  subScore: z.number(),
});

export const profileRecordSchema = z.object({
  account: z.string(),
  industry: z.string(),
  employees: z.union([z.number(), z.string()]),
  crmStage: z.string(),
  lastUpdated: z.string(),
  void: engineSectionSchema,
  compliance: engineSectionSchema,
  pain: engineSectionSchema,
  convergenceScore: z.number(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  thresholdCrossedAt: z.string().optional(),
});

export const profileMapSchema = z.record(z.string(), profileRecordSchema);
