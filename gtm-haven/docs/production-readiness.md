# Production Readiness Notes

## Completed in This Pass

- Stabilized npm install with a clean lockfile.
- Added typed domain contracts and score calculation.
- Replaced the prototype page with a revenue-leader dashboard.
- Added API endpoints for score lookup, command-center data, and integration health.
- Added Supabase schema, seed data, RLS policies, indexes, and env template.
- Added provider/integration abstractions with mock-safe defaults.
- Added test, typecheck, format, Playwright, and CI wiring.

## Remaining Work

- Supabase Auth UI and server-side workspace data loading.
- Real Bright Data ingestion workers.
- Real AI/ML structured extraction and brief generation.
- Cognee-backed memory integration.
- Slack OAuth installation flow and signed event handling.
- HubSpot CRM setup, field mapping UI, and live sync retries.
- TriggerWare webhook workflow once alert payloads are stable.
- Observability, rate limiting, audit views, and deployment runbooks.

## Release Gate

Do not call this production-ready until these are green:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Supabase migration reset and advisors
- E2E smoke tests on desktop and mobile
- Manual accessibility/responsive QA
