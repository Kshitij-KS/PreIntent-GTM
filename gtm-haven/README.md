# GTM Haven

Predictive competitive intelligence for revenue leaders. GTM Haven fuses public competitor signals into an explainable Strategic Instability Score, then routes action briefs into Slack and HubSpot.

## What Works Now

- Production-shaped Next.js command center with portfolio overview, competitor risk board, alert center, signal evidence, recommended plays, and integration health.
- Deterministic demo workspace for Acme, Zenith, Initech, and Globex.
- Typed signal, scoring, provider, and integration contracts.
- Explainable score service with recency decay, confidence adjustment, source-quality adjustment, category weighting, and category caps.
- Hybrid provider mode contract: `real`, `mock`, or `disabled`.
- Supabase migration scaffold with workspaces, memberships, competitors, signals, scoring runs, recommendations, alerts, integrations, sync logs, indexes, and RLS.
- Slack and HubSpot payload builders with idempotency keys.
- Unit tests, Playwright smoke test, CI workflow, and env template.

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

`npm run test:e2e` starts the app through Playwright and verifies the main dashboard renders on desktop and mobile projects.

## Environment

Copy `.env.example` to `.env.local` and fill production credentials when available. Defaults are mock-safe for demos.

Important policies:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only for browser/server clients.
- Keep provider modes explicit. Production should show degraded/not-configured states instead of silently fabricating live data.
- Every score and recommendation must remain tied to stored source evidence.

## Supabase

Schema lives in `supabase/migrations/202605300001_initial_gtm_haven.sql`.

The migration enables RLS on every exposed table. Workspace authorization is membership-based. Privileged helper logic is kept in the private schema, not in `public`.

Recommended implementation flow:

```bash
supabase start
supabase db reset
supabase db diff
supabase db advisors
```

Use `supabase --help` and command-specific `--help` before running CLI commands, because Supabase CLI flags change over time.

## Integration Modes

- `BRIGHT_DATA_MODE`: `mock` for fixtures, `real` for live SERP/Web Scraper/Scraping Browser/Web Unlocker, `disabled` to skip ingestion.
- `AI_ML_MODE`: `mock` for deterministic briefs, `real` for structured extraction/classification/brief generation.
- `COGNEE_MODE`: `mock` for demo memory, `real` for historical competitor context.
- `SLACK_MODE`: `mock` for payload preview, `real` for channel delivery.
- `HUBSPOT_MODE`: `mock` for CRM task payload preview, `real` for company/task/note sync.
- `TRIGGERWARE_MODE`: default `disabled` until Slack and HubSpot are production-connected.

## Next Production Steps

- Connect Supabase Auth in the UI and replace demo data reads with workspace-scoped database queries.
- Implement scheduled ingestion jobs and persist normalized provider signals.
- Add Slack OAuth and HubSpot token/OAuth setup screens.
- Add error tracking, rate limiting, webhook signature verification, and production deployment config.
