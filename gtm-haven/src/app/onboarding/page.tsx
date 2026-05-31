import type { Metadata } from "next";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Onboarding | Preintent — Set Up Your Intelligence Workspace",
  description:
    "Tell Preintent about your company and competitors. Our AI will build your GTM knowledge doc and configure your intelligence workspace.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
