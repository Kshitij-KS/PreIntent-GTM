import { describe, expect, it } from "vitest";
import { buildProfileFromSignals } from "./profile-from-signals";
import { voidPricingRemoval, compliancePciDss, painRFintechPost } from "./preintent-demo";

describe("buildProfileFromSignals", () => {
  it("computes convergence from engine signals", () => {
    const profile = buildProfileFromSignals(
      { account: "Acme FinTech", industry: "FinTech", employees: 340 },
      [voidPricingRemoval, compliancePciDss, painRFintechPost],
    );

    expect(profile.void.subScore).toBe(84);
    expect(profile.compliance.subScore).toBe(71);
    expect(profile.pain.subScore).toBe(91);
    expect(profile.convergenceScore).toBeGreaterThan(80);
  });
});
