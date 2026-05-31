# Preintent - The market moves before it speaks.

**The Convergent GTM Intelligence Platform**

> **Three invisible forces. One unfair pipeline advantage.**

PREINTENT is an always-on GTM intelligence system that simultaneously monitors competitor retreats (Void Scanner), regulatory shockwaves (Compliance Radar), and community pain signals (Pain Listener) — triangulating them against your target account list and surfacing accounts where all three forces converge into a single high-confidence buying event, delivered as an AI-generated Intel Brief to your CRM and Slack before any intent vendor, analyst, or sales rep knows the signal exists.

This is the hackathon MVP implementing the exact architecture and demo flow defined in [Ideation and Architecture.md](../Ideation and Architecture.md). **RUN FULL SCAN** orchestrates the full pipeline server-side; every integration has mock fallbacks when keys are missing.

## What Works Now (MVP)

- **Live sweep orchestrator** (`runLiveSweep` server action + `POST /api/sweep`): Bright Data fetch → AI/ML scoring → Featherless pain classification → Speechmatics audio → convergence → Slack/webhooks → Intel Brief.
- Dense Preintent dashboard wired to the live sweep (scan animation + real profile updates + optional auto-brief).
- Typed Account Intelligence Profiles stored in browser localStorage as the zero-cost Cognee MVP.
- Three engine surfaces: Void Scanner, Compliance Radar, and Pain Listener with provenance on every signal.
- Convergence scoring (33/33/33) plus threshold delivery at ≥85 (Slack incoming webhook, optional TriggerWare/HubSpot webhooks).
- `GET /api/health` reports integration status from `.env.local`.
- All sponsor calls are server-side only; mock mode works with zero keys.
- Supabase SQL is future-facing reference schema for Preintent account profiles, engine signals, convergence runs, Intel Briefs, and integration connections. Runtime MVP does not require Supabase.
- TypeScript, lint, typecheck, unit tests, Playwright e2e, CI, and Vercel-ready build path.

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run test:e2e` runs the core Preintent demo path on desktop and mobile.

## Environment

Copy `.env.example` to `.env.local`, set `*_MODE=real`, and paste API keys. Restart `npm run dev`.

| Variable | Purpose |
|----------|---------|
| `AI_ML_API_KEY` | Signal scoring + Intel Brief |
| `FEATHERLESS_API_KEY` (or `GROQ_API_KEY`) | Pain classification |
| `BRIGHT_DATA_API_KEY` | Live competitor page + SERP fetch |
| `SLACK_WEBHOOK_URL` | Real AE alert when convergence ≥ 85 |
| `TRIGGERWARE_WEBHOOK_URL` / `HUBSPOT_WEBHOOK_URL` | Optional workflow webhooks |

See `.env.example` for all options. Missing keys → automatic mock fallback (demo still works).

Important policies (per architecture doc):
- Never call real sponsor APIs more than needed for the demo narrative.
- Every signal carries explicit provenance and sponsor tool attribution.
- Full mock path = $0 cost, works offline after `npm install`.

## Demo Script (The 10-Minute Story)

Follow the exact flow in [Ideation and Architecture.md](../Ideation and Architecture.md) "Demo Flow (Hackathon Presentation)":
1. Hook: Slack-style alert for Acme FinTech 87/100 convergence.
2. Void Scanner live diff (pricing tier removal via Cognee semantic diff, Bright Data Scraping Browser tag).
3. Compliance Radar (PCI-DSS bulletin via SERP + AI/ML extraction).
4. Pain Listener (r/fintech post + Speechmatics transcript + classification).
5. Convergence moment + TriggerWare fire.
6. Intel Brief generated (real AI/ML) + suggested outreach + actions.

Record your video against this flow on the deployed URL.

## Next (Post-Hackathon)

- Real Bright Data MCP + scheduled jobs (using free tier + paid as needed).
- Full Cognee service for persistent multi-account memory.
- Native Salesforce/HubSpot connectors + TriggerWare real workflows.
- Multi-user workspaces, auth, production deployment.
- Expand to more accounts and signal sources per the full phased roadmap in the architecture doc.

This MVP costs $0 to build and run while delivering the complete sponsor-powered narrative judges expect for Track 1.

