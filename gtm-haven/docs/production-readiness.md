# Production Readiness Notes

## Completed in This Pass

- Aligned the runtime model to Preintent's three engines: Void Scanner, Compliance Radar, Pain Listener, and the Convergence Engine.
- Added mock-first integration seams for Bright Data, Speechmatics, TriggerWare, and integration health.
- Added server-side AI/ML API and Featherless-compatible actions with mock fallbacks.
- Added `GET /api/health` for sponsor mode/status reporting.
- Replaced the obsolete GTM Haven scoring test with Preintent convergence and integration contract tests.
- Reworked the Supabase reference schema around Preintent account profiles, engine signals, convergence runs, Intel Briefs, and integration connections.

## Remaining Work

- Supabase Auth UI and server-side workspace data loading if the project moves beyond the zero-cost localStorage MVP.
- Real Bright Data MCP scheduled jobs and live page snapshot storage.
- AI/ML API extraction and scoring for all engine updates, not only Intel Brief generation.
- Hosted Cognee memory integration and semantic diff persistence.
- Speechmatics podcast/YouTube ingestion beyond mocked transcripts.
- Slack OAuth installation flow and signed event handling.
- HubSpot/Salesforce CRM setup, field mapping UI, and live sync retries.
- TriggerWare webhook workflow once routing payloads are stable.
- Observability, rate limiting, audit views, and deployment runbooks.

## Release Gate

Do not call this production-ready until these are green:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Supabase migration reset and advisors if Supabase is enabled
- E2E smoke tests on desktop and mobile
- Manual accessibility/responsive QA
