import { describe, expect, it } from "vitest";
import { getDemoOpeningLine } from "./demo-mode";
import type { PremiumAccount } from "./premium-demo-data";

describe("getDemoOpeningLine", () => {
  it("returns predefined opening line for known accounts", () => {
    const brexAccount = {
      name: "Brex",
    } as PremiumAccount;

    const line = getDemoOpeningLine(brexAccount);
    expect(line).toContain("Stripe Atlas removed their SMB fast-track tier");
  });

  it("generates a fallback opening line with correctly extracted data", () => {
    const fallbackAccount = {
      name: "UnknownCorp",
      contact: {
        name: "John Doe",
      },
      competitor: "MegaCorp",
      complianceEvent: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THIS IS A VERY LONG COMPLIANCE EVENT THAT EXCEEDS 60 CHARACTERS",
    } as unknown as PremiumAccount;

    const line = getDemoOpeningLine(fallbackAccount);
    expect(line).toContain("Hi John  - ");
    expect(line).toContain("I noticed MegaCorp made recent changes");
    expect(line).toContain("with the quick brown fox jumps over the lazy dog and this is a ve...");
    expect(line).toContain("companies like UnknownCorp.");
  });

  it("handles short compliance events correctly", () => {
    const fallbackAccount = {
      name: "SmallCorp",
      contact: {
        name: "Jane Smith",
      },
      competitor: "RivalCorp",
      complianceEvent: "Minor Event",
    } as unknown as PremiumAccount;

    const line = getDemoOpeningLine(fallbackAccount);
    expect(line).toContain("Hi Jane  - ");
    expect(line).toContain("with minor event...");
  });
});
