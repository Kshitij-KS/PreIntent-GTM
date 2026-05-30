export const mockMAndAData = [
  {
    source: "Financial Times",
    title: "Acme Corp acquires Zenith Tech for $1.2B",
    snippet:
      "In a bold move to consolidate the enterprise CRM space, Acme Corp announced the acquisition of Zenith Tech...",
    date: "2026-05-28T10:00:00Z",
    url: "https://example.com/acme-acquires-zenith",
  },
  {
    source: "TechCrunch",
    title: "Nexus Data acquires small security firm ShieldX",
    snippet:
      "Nexus Data is expanding its portfolio into cybersecurity by picking up ShieldX in a quiet $50M deal.",
    date: "2026-05-25T14:30:00Z",
    url: "https://example.com/nexus-acquires-shieldx",
  },
];

export const mockExecDeparturesData = [
  {
    company: "Zenith Tech",
    name: "Sarah Jenkins",
    previousTitle: "Chief Technology Officer",
    status: "Departed",
    date: "2026-05-20T09:15:00Z",
    sourceUrl: "https://linkedin.com/in/sjenkins",
  },
  {
    company: "Nexus Data",
    name: "David Chen",
    previousTitle: "VP of Sales",
    status: "Departed",
    date: "2026-05-22T11:00:00Z",
    sourceUrl: "https://linkedin.com/in/dchen",
  },
];

export const mockSubredditPainData = [
  {
    subreddit: "r/SaaS",
    author: "throwaway_sales123",
    postTitle: "Anyone else fed up with Zenith Tech's new pricing?",
    postContent:
      "Since the acquisition rumors started, Zenith Tech removed their middle tier and forced everyone onto enterprise. Our bill went up 3x. Looking for alternatives.",
    date: "2026-05-27T16:45:00Z",
    url: "https://reddit.com/r/SaaS/comments/12345/zenith_pricing",
  },
];

export const mockNegativeSpaceData = [
  {
    company: "Zenith Tech",
    removedItemType: "Pricing Tier",
    details:
      'Removed "Pro" tier ($99/mo). Lowest available is now "Enterprise" ($499/mo).',
    detectedAt: "2026-05-26T08:00:00Z",
  },
  {
    company: "Acme Corp",
    removedItemType: "Job Requisition",
    details: 'Pulled 15 open roles for "New Product Innovation" team.',
    detectedAt: "2026-05-21T09:00:00Z",
  },
];
