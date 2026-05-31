/**
 * Cognee MVP — Persistent Account Intelligence Profiles via browser localStorage
 * Per architecture doc: "Artifact's persistent window.storage to store Account Intelligence Profiles across sessions."
 * Zero cost, zero backend. Full Cognee service is post-hackathon.
 */

import type {
  AccountIntelligenceProfile,
  EngineSignal,
  EngineType,
} from "./domain";
import { computeConvergenceScore, computeUrgency } from "./convergence";

const STORAGE_KEY = "preintent:cognee:profiles:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAll(): Record<string, AccountIntelligenceProfile> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse<Record<string, AccountIntelligenceProfile>>(raw) || {};
}

function saveAll(profiles: Record<string, AccountIntelligenceProfile>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function loadProfile(account: string): AccountIntelligenceProfile | null {
  const all = loadAll();
  return all[account] || null;
}

export function saveProfile(profile: AccountIntelligenceProfile) {
  const all = loadAll();
  all[profile.account] = {
    ...profile,
    lastUpdated: new Date().toISOString(),
  };
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
