import { describe, expect, it } from "vitest";
import {
  getActiveSessionAuthDestination,
  getPostAuthDestination,
} from "./auth-routing";

describe("auth routing", () => {
  it("sends credential sign-in directly to the dashboard", () => {
    expect(
      getPostAuthDestination({
        intent: "signin",
        profile: { setup_status: "incomplete", first_onboarding_routed_at: null },
      }),
    ).toBe("/dashboard");
  });

  it("sends credential sign-in directly to the dashboard even if setup is complete", () => {
    expect(
      getPostAuthDestination({
        intent: "signin",
        profile: { setup_status: "complete", first_onboarding_routed_at: "2026-05-31T00:00:00.000Z" },
      }),
    ).toBe("/dashboard");
  });

  it("sends credential sign-up to onboarding", () => {
    expect(
      getPostAuthDestination({
        intent: "signup",
        profile: { setup_status: "incomplete", first_onboarding_routed_at: null },
      }),
    ).toBe("/onboarding");
  });

  it("sends credential sign-up to onboarding even if setup is complete", () => {
    expect(
      getPostAuthDestination({
        intent: "signup",
        profile: { setup_status: "complete", first_onboarding_routed_at: "2026-05-31T00:00:00.000Z" },
      }),
    ).toBe("/onboarding");
  });

  it("sends the first OAuth entry to onboarding", () => {
    expect(
      getPostAuthDestination({
        intent: "auto",
        profile: { setup_status: "incomplete", first_onboarding_routed_at: null },
      }),
    ).toBe("/onboarding");
  });

  it("sends a returning incomplete OAuth user to the dashboard", () => {
    expect(
      getPostAuthDestination({
        intent: "auto",
        profile: {
          setup_status: "incomplete",
          first_onboarding_routed_at: "2026-05-31T00:00:00.000Z",
        },
      }),
    ).toBe("/dashboard");
  });

  it("sends a returning complete OAuth user to the dashboard", () => {
    expect(
      getPostAuthDestination({
        intent: "auto",
        profile: {
          setup_status: "complete",
          first_onboarding_routed_at: null,
        },
      }),
    ).toBe("/dashboard");
  });

  it("routes active sessions away from auth pages by setup state", () => {
    expect(
      getActiveSessionAuthDestination({ setup_status: "complete" }),
    ).toBe("/dashboard");
    expect(
      getActiveSessionAuthDestination({ setup_status: "incomplete" }),
    ).toBe("/onboarding");
  });
});
