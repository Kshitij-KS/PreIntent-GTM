import type { Metadata } from "next";
import DemoDashboard from "@/components/DemoDashboard";

export const metadata: Metadata = {
  title: "Demo | Undertow — Convergent GTM Intelligence",
  description:
    "Try the Undertow GTM intelligence demo dashboard. Monitor competitor retreats, regulatory signals, and community pain signals.",
};

export default function DemoPage() {
  return <DemoDashboard />;
}
