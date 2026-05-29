export type EventType = 'M&A' | 'Executive Departure' | 'Negative Sentiment Spike' | 'Positive Milestone';

export interface CompanyEvent {
  id: string;
  type: EventType;
  description: string;
  date: string;
  impactScore: number;
}

export interface CompanyData {
  name: string;
  domain: string;
  events: CompanyEvent[];
}

export const simulatedCompanies: CompanyData[] = [
  {
    name: "Acme Corp",
    domain: "acme.com",
    events: [
      {
        id: "ev_1",
        type: "Executive Departure",
        description: "CTO departed unexpectedly after 4 years",
        date: "2026-05-10",
        impactScore: 30
      },
      {
        id: "ev_2",
        type: "M&A",
        description: "Acquired Beta Technologies to enter ML market",
        date: "2026-04-15",
        impactScore: 20
      },
      {
        id: "ev_3",
        type: "Negative Sentiment Spike",
        description: "Pricing changes sparked complaints on HackerNews",
        date: "2026-05-25",
        impactScore: 15
      }
    ]
  },
  {
    name: "Initech",
    domain: "initech.com",
    events: [
      {
        id: "ev_4",
        type: "Executive Departure",
        description: "VP of Sales left for a competitor",
        date: "2026-05-01",
        impactScore: 30
      },
      {
        id: "ev_5",
        type: "Positive Milestone",
        description: "Reached $100M ARR",
        date: "2026-03-20",
        impactScore: 0
      }
    ]
  },
  {
    name: "Globex",
    domain: "globex.com",
    events: [
      {
        id: "ev_6",
        type: "M&A",
        description: "Acquired by massive conglomerate",
        date: "2026-05-28",
        impactScore: 20
      }
    ]
  }
];
