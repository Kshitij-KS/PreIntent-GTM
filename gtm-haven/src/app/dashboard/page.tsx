import type { Metadata } from "next";
import DemoDashboard from "@/components/DemoDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Undertow — Convergent GTM Intelligence",
  description:
    "Your Undertow GTM intelligence dashboard. Monitor competitor retreats, regulatory signals, and community pain signals across your target accounts.",
};

export default function DashboardPage() {
  return <DemoDashboard />;
}
