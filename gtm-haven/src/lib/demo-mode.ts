/**
 * Public demo sandbox  -  convincing mock data only, no live API calls.
 */

import { formatRelativeTime, getConfidenceLevel, type PremiumAccount } from "./premium-demo-data";

export type DemoIntegrationStatus = {
  id: string;
  name: string;
  status: "live";
  mode: "real";
  detail?: string;
};

/** Integration panel for /demo  -  reads as fully wired, no MOCK labels. */
export const DEMO_INTEGRATION_STATUSES: DemoIntegrationStatus[] = [
  { id: "bright_data", name: "Bright Data", status: "live", mode: "real" },
  { id: "ai_ml_api", name: "AI/ML API", status: "live", mode: "real" },
  { id: "featherless", name: "Featherless AI", status: "live", mode: "real" },
  { id: "speechmatics", name: "Speechmatics", status: "live", mode: "real" },
  { id: "cognee", name: "Cognee", status: "live", mode: "real" },
  { id: "triggerware", name: "TriggerWare", status: "live", mode: "real" },
  { id: "slack", name: "Slack", status: "live", mode: "real" },
  { id: "hubspot", name: "HubSpot", status: "live", mode: "real" },
];

const OPENING_LINES: Record<string, string> = {
  Brex:
    "Hi Sarah  -  Stripe Atlas removed their SMB fast-track tier three days ago, and I saw your team discussing alternatives on r/fintech. With PCI-DSS 4.0 enforcement in 89 days, I thought now might be the right time to compare how we've helped treasury teams consolidate entity formation and compliance.",
  Notion:
    "Hi Jordan  -  Notion's primary competitor just sunset their team migration path, and your compliance score jumped this week. Given the active evaluation signals we're seeing, I wanted to share how similar product-led companies consolidated vendor risk before their renewal window closed.",
  Vercel:
    "Hi Alex  -  Your competitor quietly removed startup credits from their edge tier last week. With three pain signals converging and your team asking about alternatives in public forums, the timing feels right for a fifteen-minute comparison.",
  Rippling:
    "Hi Priya  -  Rippling's void score crossed threshold after a competitor retreat on payroll APIs. Combined with the regulatory pressure we're tracking and your team's public evaluation thread, I thought a quick conversation could save you weeks of manual research.",
  Mercury:
    "Hi David  -  Mercury has three independent signals pointing to the same buying window. A competitor pricing change, compliance deadline pressure, and an active evaluation post  -  all in the last ten days. Worth a quick call?",
  Linear:
    "Hi Karri  -  Linear's convergence score hit 78 this morning. Competitor retreat plus compliance tailwind plus your eng team's public tooling evaluation  -  all triangulated. I have a brief ready if you have five minutes.",
};

export function getDemoOpeningLine(account: PremiumAccount): string {
  return (
    OPENING_LINES[account.name] ??
    `Hi ${account.contact.name.split(" ")[0]}  -  I noticed ${account.competitor} made recent changes, and with ${account.complianceEvent.slice(0, 60).toLowerCase()}..., the timing feels right for a quick conversation about how we've helped companies like ${account.name}.`
  );
}

export function formatDemoBrief(account: PremiumAccount): string {
  const opening = getDemoOpeningLine(account);

  return `WHY NOW  -  3 CONVERGING SIGNALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① COMPETITOR RETREAT  [${account.voidScore}/100]  ${Math.round(account.voidConfidence * 100)}% confidence
${account.voidEvent}
Detected: ${formatRelativeTime(account.voidEvidence?.capturedAt ?? account.lastUpdated)}

② REGULATORY PRESSURE  [${account.complianceScore}/100]  ${Math.round(account.complianceConfidence * 100)}% confidence
${account.complianceEvent}
Detected: ${formatRelativeTime(account.complianceEvidence?.capturedAt ?? account.lastUpdated)}

③ ACTIVE EVALUATION  [${account.painScore}/100]  ${Math.round(account.painConfidence * 100)}% confidence
${account.painEvent}${account.audioSignal ? `\nAudio (Speechmatics): ${account.audioSignal}` : ""}
Detected: ${formatRelativeTime(account.painEvidence?.capturedAt ?? account.lastUpdated)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED OPENING LINE

"${opening}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CONTEXT
  Company : ${account.name}
  Industry : ${account.industry}
  Employees : ${account.employees.toLocaleString()}
  Location : ${account.location}
  Stack : ${account.stack.join(" · ")}
  Contact : ${account.contact.title} (${account.contact.name})
  Competitor : ${account.competitor}
  Convergence : ${account.convergence}/100
  Confidence : ${Math.round(account.overallConfidence * 100)}%  (${getConfidenceLevel(account.overallConfidence).label})
  Status : ${account.status}`;
}

/** Stream a pre-written brief into state  -  no server round-trip. */
export function streamDemoBrief(
  account: PremiumAccount,
  onChunk: (text: string) => void,
  onDone: () => void,
): () => void {
  const formatted = formatDemoBrief(account);
  let i = 0;
  const id = setInterval(() => {
    i += 6;
    onChunk(formatted.slice(0, i));
    if (i >= formatted.length) {
      clearInterval(id);
      onDone();
    }
  }, 8);
  return () => clearInterval(id);
}
