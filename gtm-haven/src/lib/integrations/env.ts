import type { ProviderMode } from "../domain";

export type EnvMap = Record<string, string | undefined>;

export function normalizeMode(value: string | undefined): ProviderMode {
  if (value === "real" || value === "disabled") return value;
  return "mock";
}

export function isRealMode(env: EnvMap, modeKey: string, keyNames: string[]): boolean {
  const mode = normalizeMode(env[modeKey]);
  if (mode !== "real") return false;
  if (keyNames.length === 0) return true;
  return keyNames.some((key) => Boolean(env[key]?.trim()));
}
