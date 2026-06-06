# Undertow
### *The Convergent GTM Intelligence Platform*

> **Three invisible forces. One unfair pipeline advantage.**

Undertow is an always-on GTM intelligence system that simultaneously monitors competitor retreats, regulatory shockwaves, and community pain signals — triangulating them against your target account list and surfacing accounts where all three forces converge into a single high-confidence buying brief, delivered to your CRM before any intent vendor, analyst, or sales rep knows the signal exists.

---

## The Core Insight

Every B2B intent platform watches the same surface: content consumption, ad clicks, review site visits. They all see the same signals at the same time, which means everyone gets the same lead list.

Undertow watches three entirely different web surfaces that no existing tool monitors together:

| Signal Layer | What it watches | Why no one does it |
|---|---|---|
| **Void Scanner** | What competitors *remove* from their web presence | All tools track what's added, not what's gone |
| **Compliance Radar** | Regulations that just became law and make companies instantly in-market | Requires real-time regulatory parsing + firmographic cross-reference |
| **Pain Listener** | Practitioners expressing frustration in communities *right now* | Communities are unstructured, JS-heavy, and require real-time classification |

When all three converge on the same account, that company is not a lead — it is a **certified buying event** happening in real time.

---

## The Three Engines

### Engine 1 — Void Scanner
*Detects competitor retreats before they become industry news*

The Void Scanner runs continuous snapshots of every tracked competitor's public presence: pricing pages, feature comparison tables, integration directories, documentation, blog posts, customer case studies, job listings, and product changelogs. 

Most competitive intelligence tools do simple HTML diffs — they catch text edits but miss structural deletions. The Void Scanner uses semantic versioning via **Cognee**: it understands that "this page previously listed four pricing tiers and now lists three" is a strategic retreat, and that "this integration was listed in the directory last week and no longer exists" means an integration is dead — not just that the page changed.

**What gets detected:**
- Pricing tiers silently removed (signals: competitor losing segment, customers orphaned)
- Features removed from comparison pages (signals: product de-prioritisation)
- Integrations killed from partner directories (signals: partnership breakdown)
- Customer segments removed from positioning pages (signals: strategic pivot away from that ICP)
- Hiring fronts going quiet in specific domains (signals: product area deprioritised)
- Case studies unpublished (signals: customer churn in specific verticals)

**Bright Data tools used:**
- **Scraping Browser** — renders JS-heavy SPA pricing pages that block standard fetches
- **Web Unlocker** — bypasses bot detection on documentation and product pages
- **MCP Server** — orchestrates scheduled scraping jobs across competitor domains

**Why this matters for sales:** When a competitor removes their SMB tier, every one of their SMB customers is now on an orphaned plan with no obvious upgrade path. Those accounts are suddenly, urgently in-market — and Undertow surfaces them before anyone else knows the tier is gone.

---

### Engine 2 — Compliance Radar
*Turns every new law into a real-time in-market account list*

Compliance Radar monitors regulatory publications continuously across dozens of authoritative sources. The moment a rule is published, the engine parses it for commercial implications and maps it to affected companies in your TAM.

**Sources monitored:**
- US Federal: Federal Register, SEC EDGAR, FINRA, OCC, FDIC, FTC, CFPB, CMS, HHS
- European: EUR-Lex, ICO, CNIL, BaFin, FCA
- State-level: all 50 state legislature bill trackers for industry-relevant categories
- Industry bodies: NIST, ISO working group feeds, HIPAA enforcement bulletins, PCI-DSS updates

**The extraction pipeline:**

When a regulation hits:
1. **AI/ML API** extracts structured fields: affected industries, company size thresholds, geographic scope, required actions, compliance deadlines, and penalty structure.
2. **Web Scraper API** cross-references firmographic data to identify companies that fall inside scope.
3. **Cognee** builds a persistent "regulatory exposure map" per account — tracking which regulations apply, how directly, what the deadline pressure is, and whether the company has publicly acknowledged it yet.
4. A secondary scrape checks whether the target company has posted anything about this regulation (blog posts, press releases, hiring for compliance roles) — companies that *haven't* acknowledged a regulation they must comply with have the highest urgency score.

**Bright Data tools used:**
- **SERP API** — monitors search results for new regulatory content across all sources the moment they're indexed
- **Web Scraper API** — cross-references company firmographic pages, press releases, and job postings for compliance acknowledgment signals

**Why this matters for sales:** The window between "law passes" and "company starts RFP" is typically 30–90 days. Undertow puts you in front of affected accounts on day one, not day 60 when every competitor is also calling.

---

### Engine 3 — Pain Listener
*Intercepts buyers before they know they're buyers*

Pain Listener monitors the communities where practitioners talk honestly about vendor frustration: places where no marketing has sanitised the signal yet. Real buying intent surfaces in communities 30–90 days before it surfaces on any intent platform.

**Sources monitored:**
- Subreddits: vertical-specific and role-specific subs relevant to your product category (e.g. r/devops, r/fintech, r/salesforce, r/sysadmin, r/marketing)
- Hacker News: "Ask HN", "Show HN", and thread discussions
- Stack Overflow and Stack Exchange tags
- G2, Capterra, TrustRadius, Gartner Peer Insights — review feeds and "what are you evaluating next" sections
- LinkedIn public posts (company pages + practitioner posts)
- Podcasts and YouTube: **Speechmatics** transcribes audio content where practitioners discuss vendor decisions in long-form

**The classification pipeline:**

Each captured piece of content passes through AI/ML API for structured extraction:

| Field | What it captures |
|---|---|
| Signal type | Frustration, active evaluation, switching decision, contract renewal, budget allocation |
| Competitor named | Which vendor is being discussed and in what framing |
| Urgency level | Passive venting vs. active shopping vs. imminent decision |
| Author seniority | Inferred from language, title mentions, context |
| Company attribution | Mapped from profile, post history, email mentions, job title patterns |

A cross-reference agent then attempts to match the author to a specific company in your TAM. When a match is found and the signal is strong, it feeds into the account's Pain Expression Score.

**Bright Data tools used:**
- **Scraping Browser** — renders JS-heavy review platforms (G2, Capterra) that heavily throttle simple HTTP fetches
- **Web Unlocker** — bypasses bot detection on community and forum pages
- **SERP API** — surfaces fresh community content via search indexing, catching posts across platforms simultaneously

**Partner integration:**
- **Speechmatics** — transcribes podcast episodes and YouTube videos where practitioners discuss vendor frustrations and evaluation processes, adding an audio intelligence layer no other platform has

---

## The Convergence Engine

This is Undertow's central differentiator. The three engines each produce signal — but the Convergence Engine is where Undertow earns its value.

**Cognee** maintains a persistent **Account Intelligence Profile** for every company on your target account list, updated in real time:

```
Account: Acme Corp
Industry: FinTech / Payments
Employees: 340
CRM Stage: Not in pipeline

VOID SCANNER
  └─ SignalDate: 2025-06-02
  └─ Event: Competitor X removed SMB tier from pricing page
  └─ Relevance: Acme Corp is identified as a Competitor X SMB customer (G2 review, 2025-03)
  └─ Sub-score: 84 / 100

COMPLIANCE RADAR
  └─ SignalDate: 2025-05-28
  └─ Event: PCI-DSS 4.0 enforcement deadline in 87 days
  └─ Scope: Acme Corp processes card payments (confirmed from job postings)
  └─ Acknowledgement: No public compliance blog post or hiring found
  └─ Sub-score: 71 / 100

PAIN LISTENER
  └─ SignalDate: 2025-06-01
  └─ Source: r/fintech — "evaluating alternatives to [Competitor X], anyone tried [Your Product]?"
  └─ Author mapped to: Acme Corp (Head of Payments Infrastructure)
  └─ Signal type: Active evaluation
  └─ Sub-score: 91 / 100

CONVERGENCE SCORE: 82 / 100
ACTION TRIGGERED: CRM lead created + AE Slack alert + Intel Brief generated
```

### Scoring model

Each sub-score is computed by **AI/ML API** on every update cycle. The composite Convergence Score uses a configurable weighting (default 33/33/33):

```
Convergence Score = (w1 × VoidScore) + (w2 × ComplianceScore) + (w3 × PainScore)
```

**Threshold actions (configurable):**

| Score | Action |
|---|---|
| ≥ 50 | Account added to watchlist, monitoring frequency doubled |
| ≥ 65 | Account flagged in CRM with signal summary attached |
| ≥ 75 | CRM lead created with full signal breakdown |
| ≥ 85 | Immediate Slack alert to assigned AE + pre-written outreach draft |
| ≥ 95 | High-priority alert with executive CC + "act today" recommendation |
| 100 on any single dimension | Immediate trigger regardless of composite score |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WEB SOURCES                             │
│  Competitor sites │ Regulatory feeds │ Community forums     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   BRIGHT DATA LAYER                         │
│                                                             │
│  Scraping Browser  │  Web Scraper API  │  SERP API          │
│  Web Unlocker      │  MCP Server (orchestration)            │
└──────┬─────────────────────┬──────────────────────┬─────────┘
       │                     │                      │
┌──────▼──────┐   ┌──────────▼────────┐   ┌────────▼────────┐
│   VOID      │   │  COMPLIANCE       │   │  PAIN           │
│   SCANNER   │   │  RADAR            │   │  LISTENER       │
│             │   │                   │   │                 │
│ Scraping    │   │ SERP API →        │   │ Scraping        │
│ Browser +   │   │ AI/ML API extract │   │ Browser +       │
│ Web Unlock  │   │ Web Scraper cross │   │ Web Unlocker +  │
│ Cognee diff │   │ ref firmographics │   │ Speechmatics    │
│             │   │ Cognee exposure   │   │ AI/ML classify  │
│ Competitor  │   │ map per account   │   │ Cognee author   │
│ retreat     │   │                   │   │ company map     │
│ sub-score   │   │ Compliance        │   │                 │
│             │   │ pressure sub-     │   │ Pain expression │
│             │   │ score             │   │ sub-score       │
└──────┬──────┘   └──────────┬────────┘   └────────┬────────┘
       │                     │                      │
┌──────▼─────────────────────▼──────────────────────▼────────┐
│                  CONVERGENCE ENGINE                         │
│                                                             │
│  Cognee: persistent Account Intelligence Profiles          │
│  AI/ML API: composite convergence scoring                  │
│  TriggerWare.ai: threshold evaluation + routing            │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐
│  CRM Lead    │  │  Slack Alert  │  │  Intel Brief  │
│  Salesforce  │  │  + AE draft   │  │  PDF/Notion  │
│  HubSpot     │  │  outreach     │  │  weekly      │
└──────────────┘  └───────────────┘  └──────────────┘
```

---

## The Intelligence Brief

When a Convergence Score exceeds 85, Undertow generates a structured **Intel Brief** — a ready-to-use document the AE receives before making the first call:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNDERTOW INTEL BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account:        Acme Corp
Convergence:    82 / 100  ██████████████████░░
Urgency:        HIGH — act within 5 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY NOW

1. COMPETITOR RETREAT (84/100)
   Competitor X removed their SMB pricing tier on Jun 2.
   Acme Corp is a confirmed Competitor X SMB customer
   (G2 review, Mar 2025). They have no upgrade path and
   no competitive lock-in. Window: ~30 days before they
   start formal evaluation.

2. REGULATORY PRESSURE (71/100)
   PCI-DSS 4.0 enforcement begins Aug 31 (87 days).
   Acme Corp processes card payments (confirmed via job
   postings). No compliance blog post, no compliance
   hiring detected — they are behind. Your product
   covers 4 of the 6 new mandatory controls.

3. ACTIVE EVALUATION (91/100)
   Head of Payments Infrastructure at Acme posted on
   r/fintech Jun 1: "evaluating alternatives to
   [Competitor X], anyone tried [Your Product]?"
   Post has 34 upvotes. They are actively shopping now.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED OPENING LINE

"Hi [Name] — I noticed [Competitor X] made some changes 
to their plans recently, and with PCI-DSS 4.0 coming in 
August, I thought the timing might be worth a 
conversation. We've helped three payments companies your 
size get compliant without replacing their whole stack..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CONTEXT
  Industry:    FinTech / Payments
  Size:        340 employees
  HQ:          Austin, TX
  Stack hints: AWS, Stripe, Postgres (from job postings)
  Key contact: Head of Payments Infrastructure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Orchestration | Bright Data MCP Server | Schedules and manages all scraping jobs |
| Competitor snapshots | Bright Data Scraping Browser | JS-rendered pricing + feature pages |
| Community crawling | Bright Data Web Unlocker | Bot-detection bypass on forums/review sites |
| Regulatory monitoring | Bright Data SERP API | Real-time regulatory publication detection |
| Firmographic cross-ref | Bright Data Web Scraper API | Company page enrichment |
| Audio intelligence | Speechmatics | Podcast/video transcription for pain signals |
| Account memory | Cognee | Persistent Account Intelligence Profiles |
| AI reasoning | AI/ML API (claude-sonnet-4) | Extraction, classification, scoring, brief generation |
| Workflow routing | TriggerWare.ai | Threshold evaluation + CRM/Slack/email delivery |
| CRM delivery | Salesforce / HubSpot (native connectors) | Lead creation + field enrichment |

---

## Judging Criteria Alignment

### Application of Technology
Undertow uses every Bright Data tool for a distinct, justified purpose — no superficial integration. Scraping Browser handles JS-heavy SPA pages. Web Unlocker bypasses community bot detection. SERP API enables real-time regulatory detection. Web Scraper API handles structured firmographic extraction. MCP Server orchestrates all of it. Speechmatics and Cognee are integrated in ways no other project will replicate: Cognee isn't used as a simple cache — it's the semantic versioning layer that makes the Void Scanner possible. Speechmatics isn't a novelty — it adds a genuinely new intelligence channel (audio) that text-only platforms miss entirely.

### Business Value
The TAM is every revenue team at every B2B SaaS company — an enormous and well-funded market. The value proposition is defensible and concrete: Undertow surfaces pipeline before any competing tool because it watches three non-overlapping signal sources. The convergence score is configurable to each team's ICP, making it immediately deployable. The Intel Brief is the last step that turns intelligence into action — the output is not a dashboard to stare at, it's a ready-to-send message.

### Originality
The individual engines are each novel. Their combination is genuinely unique. No existing tool — not Bombora, not G2 Buyer Intent, not Crayon, not Klue, not Demandbase — monitors all three signal types, let alone triangulates them. The Void Scanner is the most original idea in the market: the entire competitive intelligence category tracks additions, not deletions. "What your competitor removed" is the signal nobody is watching.

### Presentation
The demo script writes itself: pick a real company, show their competitor removing a pricing page in real-time, drop a regulatory bulletin into the system, find a live community post about them, and watch the convergence score rise and the Intel Brief generate. The three-signal convergence moment is visually and narratively compelling.

---

## Demo Flow (Hackathon Presentation)

**Minute 0–1: The hook**
Show a Slack message arriving: *"🔴 Undertow: Acme Corp just hit 87/100 convergence — 3 simultaneous signals. Brief attached."* Open the brief.

**Minute 1–3: Signal 1 — Void Scanner**
Show the live diff: Competitor X's pricing page, before and after. The SMB tier is gone. Explain how Cognee detected the semantic deletion, not just the HTML change. Show the list of 40 accounts who are confirmed Competitor X SMB customers.

**Minute 3–5: Signal 2 — Compliance Radar**
Show the SERP API feed with PCI-DSS 4.0 enforcement bulletin. Show AI/ML API extracting scope fields. Show the filtered account list: 40 in-scope companies in your TAM. Highlight Acme Corp — no compliance hiring, no compliance blog post — the highest urgency.

**Minute 5–7: Signal 3 — Pain Listener**
Show the live r/fintech post from the Head of Payments Infrastructure at Acme Corp. Show the classification output: active evaluation, senior author, company mapped. Show Speechmatics transcript from a podcast episode where the same person discussed vendor frustration two weeks ago.

**Minute 7–9: The convergence moment**
Show the Cognee Account Intelligence Profile for Acme Corp updating in real time as all three signals land. Show the convergence score cross 85. Watch TriggerWare.ai fire: the CRM lead appears in HubSpot, the Slack alert hits the AE, the Intel Brief is attached. Show the pre-written outreach message.

**Minute 9–10: The close**
"Every intent vendor gives you the same leads at the same time. Undertow gives you leads that don't exist yet — because it watches the three signals that come before intent."

---

## Submission Checklist

- [x] **Bright Data requirement:** Scraping Browser, Web Scraper API, SERP API, Web Unlocker, MCP Server — all five tools used for distinct, justified purposes
- [x] **Partner challenges:** AI/ML API (intelligence layer), Cognee (agent memory), Speechmatics (voice-enabled research pipeline), TriggerWare.ai (end-to-end automated workflow)
- [x] **Track:** GTM Intelligence (Track 1)
- [x] **Category tags:** Competitive Intelligence, GTM Automation, Sales Intelligence, Regulatory Tech, Buyer Intent
- [x] **Deliverables:** Public GitHub, hosted demo, video walkthrough, slide deck
