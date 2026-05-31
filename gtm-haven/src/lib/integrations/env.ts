import type { ProviderMode } from "../domain";

export type EnvMap = Record<string, string | undefined>;

export function normalizeMode(value: string | undefined): ProviderMode {
  if (value === "disabled") return "disabled";
  if (value === "mock") return "mock";
  return "real";
}

export function isRealMode(env: EnvMap, modeKey: string, keyNames: string[]): boolean {
  const mode = normalizeMode(env[modeKey]);
  if (mode !== "real") return false;
  
  // Check that all required keys are present and non-empty
  return keyNames.every(key => Boolean(env[key]?.trim()));
}
