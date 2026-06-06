/**
 * Cognee MVP  -  Persistent Account Intelligence Profiles via browser localStorage
 * Per architecture doc: "Artifact's persistent window.storage to store Account Intelligence Profiles across sessions."
 * Zero cost, zero backend. Full Cognee service is post-hackathon.
 */

import type {
  AccountIntelligenceProfile,
  EngineSignal,
  EngineType,
} from "./domain";
import { computeConvergenceScore, computeUrgency } from "./convergence";
import {
  profileMapSchema,
  profileRecordSchema,
  MAX_PROFILE_RECORDS,
} from "./security/schemas";
import { logger } from "./security/logger";
import { newCorrelationId } from "./security/correlation";

const STORAGE_KEY = "preintent:cognee:profiles:v1";
const LOG_SOURCE = "cognee-store";

/** A null-prototype profile map so pathological keys cannot pollute prototypes. */
function emptyProfileMap(): Record<string, AccountIntelligenceProfile> {
  return Object.create(null) as Record<string, AccountIntelligenceProfile>;
}

function readKey(
  map: Record<string, AccountIntelligenceProfile>,
  account: string,
): AccountIntelligenceProfile | null {
  return Object.prototype.hasOwnProperty.call(map, account) ? map[account] : null;
}

/**
 * Load and validate all persisted profiles.
 *
 * Discard-and-recover: a JSON parse failure (Req 7.2), schema validation
 * failure (Req 7.3), or a collection exceeding MAX_PROFILE_RECORDS (Req 7.1,
 * 7.4) results in an empty profile set, with the discard reason logged
 * (Req 7.5). Never throws to the UI.
 */
function loadAll(): Record<string, AccountIntelligenceProfile> {
  if (typeof window === "undefined") return emptyProfileMap();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyProfileMap();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn(LOG_SOURCE, newCorrelationId(), "discarded cognee data", {
      reason: "json_parse_failure",
    });
    return emptyProfileMap();
  }

  // Enforce the maximum collection size before deep validation (Req 7.1, 7.4).
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (Object.keys(parsed as Record<string, unknown>).length > MAX_PROFILE_RECORDS) {
      logger.warn(LOG_SOURCE, newCorrelationId(), "discarded cognee data", {
        reason: "record_count_limit_exceeded",
      });
      return emptyProfileMap();
    }
  }

  const result = profileMapSchema.safeParse(parsed);
  if (!result.success) {
    logger.warn(LOG_SOURCE, newCorrelationId(), "discarded cognee data", {
      reason: "schema_validation_failure",
    });
    return emptyProfileMap();
  }

  // Use a null-prototype container so pathological account keys (e.g.
  // "__proto__", "constructor") are stored/read as plain own properties and
  // cannot pollute the prototype chain.
  const safe = emptyProfileMap();
  for (const [key, value] of Object.entries(result.data)) {
    Object.defineProperty(safe, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return safe;
}

/**
 * Persist the full profile map. Only schema-conformant records are written;
 * a `localStorage` write failure (e.g. quota) leaves the prior value unchanged
 * and is logged (Req 7.6, 7.7). Never throws to the UI.
 */
function saveAll(profiles: Record<string, AccountIntelligenceProfile>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    logger.warn(LOG_SOURCE, newCorrelationId(), "cognee write failed; prior value preserved", {
      reason: "write_failure",
    });
  }
}

export function loadProfile(account: string): AccountIntelligenceProfile | null {
  const all = loadAll();
  return readKey(all, account);
}

export function saveProfile(profile: AccountIntelligenceProfile) {
  const candidate = {
    ...profile,
    lastUpdated: new Date().toISOString(),
  };

  // Persist only schema-conformant records; reject without persisting (Req 7.6).
  if (!profileRecordSchema.safeParse(candidate).success) {
    logger.warn(LOG_SOURCE, newCorrelationId(), "rejected non-conformant profile write", {
      reason: "schema_validation_failure",
      account: profile.account,
    });
    return;
  }

  const all = loadAll();
  Object.defineProperty(all, profile.account, {
    value: candidate,
    enumerable: true,
    writable: true,
    configurable: true,
  });
  saveAll(all);
}

export function updateProfileWithSignal(
  account: string,
  engine: EngineType,
  signal: EngineSignal,
  newSubScore: number,
): AccountIntelligenceProfile {
  let profile = loadProfile(account);

  if (!profile) {
    // Seed a minimal profile matching the doc example structure
    profile = {
      account,
      industry: "FinTech / Payments",
      employees: 340,
      crmStage: "Not in pipeline",
      lastUpdated: new Date().toISOString(),
      void: { signals: [], subScore: 0 },
      compliance: { signals: [], subScore: 0 },
      pain: { signals: [], subScore: 0 },
      convergenceScore: 0,
      urgency: "LOW",
    };
  }

  const section = profile[engine];
  section.signals = [...section.signals.filter((s) => s.id !== signal.id), signal].slice(-5); // keep last 5 per engine
  section.subScore = Math.max(0, Math.min(100, Math.round(newSubScore)));

  const maxSingleEngineScore = Math.max(
    profile.void.subScore,
    profile.compliance.subScore,
    profile.pain.subScore,
  );
  profile.convergenceScore = computeConvergenceScore(
    profile.void.subScore,
    profile.compliance.subScore,
    profile.pain.subScore,
  );
  profile.urgency = computeUrgency(profile.convergenceScore, maxSingleEngineScore);

  if (profile.convergenceScore >= 85 && !profile.thresholdCrossedAt) {
    profile.thresholdCrossedAt = new Date().toISOString();
  }

  saveProfile(profile);
  return profile;
}

export function getOrCreateProfile(account: string): AccountIntelligenceProfile {
  const existing = loadProfile(account);
  if (existing) return existing;

  const seed: AccountIntelligenceProfile = {
    account,
    industry: "FinTech / Payments",
    employees: 340,
    crmStage: "Not in pipeline",
    lastUpdated: new Date().toISOString(),
    void: { signals: [], subScore: 0 },
    compliance: { signals: [], subScore: 0 },
    pain: { signals: [], subScore: 0 },
    convergenceScore: 0,
    urgency: "LOW",
  };
  saveProfile(seed);
  return seed;
}

export function clearAllProfiles() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Convenience: export the key for debugging / reset buttons in UI
export const COGNEE_STORAGE_KEY = STORAGE_KEY;
