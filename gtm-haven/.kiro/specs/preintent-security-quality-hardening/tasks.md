# Implementation Plan: PreIntent Security & Quality Hardening

## Overview

This plan composes a new `src/lib/security/` module of shared, server-side primitives (correlation, logger, schemas, input-validator, error-responder, auth-guard, rate-limiter, response-validator, with-guards), then wires those primitives into the existing API routes, hardens `src/lib/cognee.ts` and `src/app/actions.ts`, tightens integration status reporting, and rewrites the broken `onboarding/profile` route.

The build order is bottom-up: primitives first (each verified by property/example tests), then the `withGuards` composition, then route refactors, and finally the cross-cutting property tests (Properties 1–18) and tooling checkpoints. The mock-first, zero-cost default is preserved throughout — no new required secrets, Supabase and `fetch` are mocked in tests, and every guard degrades safely.

Language: TypeScript (Next.js App Router). Tests: vitest (unit/property) + Playwright (e2e). `fast-check` is added as a dev dependency for property-based testing.

Note on optional sub-tasks: tasks postfixed with `*` are test-related and may be skipped for a faster MVP. Property test tasks pin `numRuns: 100` minimum and each is tagged with a comment referencing its design property.

## Tasks

- [x] 1. Project setup and property-test tooling
  - [x] 1.1 Add fast-check and configure property-test infrastructure
    - Add `fast-check` to `devDependencies` in `package.json` (pinned version)
    - Confirm vitest config picks up `src/**/*.test.ts` / `src/lib/security/**/*.test.ts`; add a shared test setup helper for a controllable clock (injected `now()` / fake timers) used by rate-limiter and timeout tests
    - Do not change `test`, `typecheck`, `lint`, or `build` script semantics; keep the zero-cost default (no real network/credentials in tests)
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [x] 2. Correlation and structured logging primitives
  - [x] 2.1 Implement correlation id module
    - Create `src/lib/security/correlation.ts` exporting correlation id generation and per-request propagation helpers
    - _Requirements: 4.3, 8.4_

  - [x] 2.2 Implement structured logger with redaction and audit
    - Create `src/lib/security/logger.ts` with the ordered severity set (`debug` < `info` < `warn` < `error`), `LogRecord` shape (severity, source, correlationId, timestamp, message, meta), level suppression, secret/PII redaction with a fixed placeholder, and the `audit(...)` event for mutating endpoints
    - Logging is best-effort: never throws to callers
    - _Requirements: 3.6, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 2.3 Write property test for logger redaction
    - **Property 4: Secret and PII values are redacted in logs**
    - **Validates: Requirements 3.6, 8.6**

  - [ ]* 2.4 Write property test for log record completeness
    - **Property 15: Log records are structurally complete**
    - **Validates: Requirements 8.3**

  - [ ]* 2.5 Write property test for single correlation id per request
    - **Property 16: One correlation id per request**
    - **Validates: Requirements 8.4**

  - [ ]* 2.6 Write property test for log level suppression
    - **Property 17: Log level suppression**
    - **Validates: Requirements 8.7**

- [x] 3. Shared validation schemas
  - [x] 3.1 Implement shared zod schemas
    - Create `src/lib/security/schemas.ts` with `httpUrlSchema` (valid http/https, length ≤ 2048), `MAX_PAYLOAD_BYTES = 1_048_576`, `commandCenterBodySchema`, `seedAccountSchema`, `onboardingProfileBodySchema`, `orgIdParamSchema`, response schemas (`painClassificationSchema`), and Cognee schemas (`engineSignalSchema`, `profileRecordSchema`, `profileMapSchema`, `MAX_PROFILE_RECORDS = 10_000`)
    - Move `sweepBodySchema` and `scoreRequestSchema` here and adopt `httpUrlSchema` for URL fields; validation-path schemas must not coerce/transform (no `.default()`/`.transform()`)
    - _Requirements: 1.5, 1.6, 1.7, 1.9_

  - [x]* 3.2 Write property test for URL schema
    - **Property 1: URL field accept-iff-valid**
    - **Validates: Requirements 1.5, 1.9**

- [x] 4. Input validator
  - [x] 4.1 Implement input validator
    - Create `src/lib/security/input-validator.ts` with `enforcePayloadSize(req, maxBytes)` (reads `Content-Length`, rejects > max with 413 WITHOUT parsing), `parseBody`, and `parseParams`
    - Map `ZodError.issues` to `ValidationFieldError[]` reason categories (`missing` / `malformed` / `out_of_range`); pure, no I/O, no business-logic invocation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_

  - [ ]* 4.2 Write property test for invalid input rejection
    - **Property 2: Invalid input is rejected with no side effects**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.8, 2.6**

  - [ ]* 4.3 Write edge-case test for payload-size boundary
    - Assert pass at and below 1,048,576 bytes, 413 above, with no body parsing on rejection
    - _Requirements: 1.4_

- [ ] 5. Error responder
  - [-] 5.1 Implement error responder
    - Create `src/lib/security/error-responder.ts` with `toErrorResponse(error, correlationId)` (generic message, category status, echoes correlation id, returns within 1000ms even if logging throws, excludes stack/raw external messages/paths/hosts/IPs/DB identifiers/secrets) and `validationErrorResponse(errors, correlationId)` (400, lists every failed field + reason category, no internal schema names/types)
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 8.1, 8.2_

  - [ ]* 5.2 Write property test for sanitized error responses
    - **Property 5: Client error responses are sanitized**
    - **Validates: Requirements 4.1, 4.2, 8.2**

  - [ ]* 5.3 Write property test for correlation id echo
    - **Property 6: Correlation id is echoed to the caller**
    - **Validates: Requirements 4.4**

  - [ ]* 5.4 Write property test for validation error rendering
    - **Property 7: Validation error rendering is complete and internal-detail-free**
    - **Validates: Requirements 4.5**

- [ ] 6. Auth guard
  - [-] 6.1 Implement auth guard
    - Create `src/lib/security/auth-guard.ts` with `requireSession()` (401 on missing/expired/invalid) and `requireOrgMembership(orgId)` (400 missing/malformed orgId, 401 unauthenticated, 403 non-member) generalizing the `competitors/resolve` pattern via `createSupabaseServerClient()` + `auth.getUser()` + `organization_members`
    - All checks resolve before any service-role client construction or external call
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 6.2 Write example unit tests for auth guard
    - Unauthenticated (missing/malformed/expired) → 401; authenticated non-member → 403; missing/malformed orgId → 400; assert no service-role client constructed on failure (spy on `createClient`)
    - _Requirements: 10.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 7. Rate limiter
  - [-] 7.1 Implement rate limiter
    - Create `src/lib/security/rate-limiter.ts` with `checkRateLimit(callerKey, endpointId, opts)` (in-process fixed window, default max 10 / 60s, independent budget per endpoint, caller key = userId else source IP, `Retry-After` integer clamped 1..60); wrap store access so a throw yields fail-closed `{ allowed: false, retryAfterSeconds: 60, status: 429 }`
    - Inject the clock (`now()`) so window math is deterministic in tests
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 7.2 Write property test for rate-limit window enforcement
    - **Property 10: Rate-limit window enforcement**
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [ ]* 7.3 Write property test for budget independence
    - **Property 11: Rate-limit budgets are independent per caller and per endpoint**
    - **Validates: Requirements 6.3, 6.5**

- [ ] 8. Response validator
  - [-] 8.1 Implement response validator
    - Create `src/lib/security/response-validator.ts` with `fetchWithTimeout` (default 10s, ceiling 30s via `AbortSignal.timeout`), `validateExternal(schema, parsed, source, correlationId)` (blocks downstream use until success, logs failing component + reason on failure), and `withFallback(primary, fallback, ctx)` (parse failure and timeout treated identically: log + fallback, downstream state unchanged)
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7_

  - [ ]* 8.2 Write property test for response round-trip identity
    - **Property 8: Response_Validator round-trip identity**
    - **Validates: Requirements 5.1, 5.7, 10.4**

  - [ ]* 8.3 Write property test for non-conforming fallback
    - **Property 9: Non-conforming responses fall back without mutating state**
    - **Validates: Requirements 5.2, 5.5**

- [ ] 9. Compose guards wrapper
  - [~] 9.1 Implement withGuards composition
    - Create `src/lib/security/with-guards.ts` sequencing: (1) payload-size 413, (2) rate-limit 429, (3) auth 401/403, (4) input-validation 400, (5) handler; catch any thrown error and route through `toErrorResponse` with a shared correlation id; emit the audit event on mutating completion
    - All four gates precede the handler so no external call/persistence occurs on rejection
    - _Requirements: 1.2, 2.1, 2.2, 4.1, 4.3, 6.6, 8.1, 8.5_

  - [ ]* 9.2 Write unit tests for guard ordering and wiring
    - Assert order (413 → 429 → 401/403 → 400 → handler), each gate short-circuits before side effects, sanitized response returned even when logging throws, audit emitted on completion
    - _Requirements: 4.6, 6.6, 8.5_

- [~] 10. Checkpoint - security primitives complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Harden Cognee localStorage persistence
  - [-] 11.1 Harden cognee store read/write paths
    - Update `src/lib/cognee.ts`: `loadAll()` parses → validates against `profileMapSchema` → enforces ≤ 10,000 records, discarding-and-recovering to an empty set with a logged reason on any failure; `saveProfile()` persists only schema-conformant records, rejects non-conformant without persisting, and catches quota write-failures leaving the prior value intact (logged). Keep public function names unchanged
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 11.2 Write property test for Cognee round-trip
    - **Property 12: Cognee round-trip equivalence** (includes a custom `arbitraryProfile` generator for schema-valid `AccountIntelligenceProfile` values)
    - **Validates: Requirements 7.8, 10.3**

  - [ ]* 11.3 Write property test for safe discard on load
    - **Property 13: Cognee load discards invalid data safely**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ]* 11.4 Write property test for conformant-only writes
    - **Property 14: Cognee write persists only conformant records**
    - **Validates: Requirements 7.6**

  - [ ]* 11.5 Write edge-case test for record-count boundary
    - Assert 10,000 records load, 10,001 discard to empty set
    - _Requirements: 7.4_

- [ ] 12. Harden integration status reporting
  - [~] 12.1 Tighten integration status to presence-only booleans
    - Update the integration status layer in `src/lib/integrations/` to expose `configured: boolean` only (never the value or any substring); report `not_configured` when a real-mode adapter lacks its key and fall back to mock data
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 12.2 Write property test for status secret non-leak
    - **Property 3: Integration status never leaks secret values**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 12.3 Write example test for real-mode mock fallback
    - A real-mode adapter missing its key returns mock data without exposing any secret value
    - _Requirements: 3.5_

- [ ] 13. Refactor routes to compose the security primitives
  - [~] 13.1 Refactor POST /api/sweep route
    - Wrap with `withGuards` (payload-size, rate-limit `sweep`, auth, `sweepBodySchema` from `schemas.ts`); route errors through `Error_Responder`; no behavior change in mock mode
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 6.1, 6.5, 6.6_

  - [~] 13.2 Refactor POST /api/competitors/resolve route
    - Wrap with `withGuards`; org-scoped path uses `requireOrgMembership`, inline path uses `requireSession` (401 when unauthenticated); rate-limit `competitors/resolve`
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.7, 6.1, 6.5_

  - [~] 13.3 Refactor POST /api/command-center route
    - Validate body against `commandCenterBodySchema` before queuing; wrap with `withGuards`; stop echoing arbitrary unvalidated input
    - _Requirements: 1.1, 1.6, 2.1, 4.1_

  - [~] 13.4 Confirm public endpoints bypass auth guards
    - Ensure `health`, `auth/callback`, `auth/signout`, and read-only `integrations`/`score` GET allow unauthenticated access while still routing errors through `Error_Responder`
    - _Requirements: 2.8_

  - [~] 13.5 Rewrite POST /api/onboarding/profile route
    - Remove non-existent imports (`@/actions/sweep-actions`, `@/actions/org-actions`, `@/actions/competitor-actions`); call the real `runLiveSweep(input: LiveSweepInput)` from `@/app/actions` with the correct shape and consume `LiveSweepResult` (`.success`/`.profile`/`.signals`/`.brief`); replace all `any` with named types parsed through the Input_Validator; apply auth (org membership), input validation (`orgId` + `seedAccounts`), and rate-limit before constructing any service-role client; persist only validated row shapes
    - _Requirements: 1.7, 2.5, 2.6, 6.5, 9.3, 9.4, 9.5_

  - [~] 13.6 Harden actions.ts external/model response handling
    - Route the pain classifier model response through `validateExternal` against `painClassificationSchema` (no unchecked `JSON.parse`); apply `withFallback` for parse/schema/timeout failures; reduce the existing 90s/60s timeouts under the 30s ceiling via `fetchWithTimeout`; remove remaining `any` usages
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 9.4_

  - [ ]* 13.7 Write route-level example unit tests
    - For each Mutating_Endpoint: unauthenticated → 401, body failing schema → 400, mutating completion emits audit event; public GETs (`health`/`integrations`/`score`) → 200; assert no external call/persistence on rejected requests (Supabase + `fetch` mocked)
    - _Requirements: 10.1, 10.2, 2.8, 8.5_

- [ ] 14. Convergence score property coverage
  - [ ]* 14.1 Write property test for convergence range invariant
    - **Property 18: Convergence score range invariant** (test `computeConvergenceScore` in `src/lib/convergence.ts` over generated sub-score triples)
    - **Validates: Requirements 10.5**

- [~] 15. Final checkpoint - tooling and full suite
  - Ensure `npm run typecheck`, `npm run lint` (zero warnings), `npm run test`, and `npm run build` all exit 0; ask the user if questions arise.
  - _Requirements: 9.1, 9.2, 9.6, 10.6, 10.7_

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references the specific requirements (and, for property tests, the design property) it implements for traceability.
- Properties 1–18 from the design are each covered by their own dedicated property-test sub-task, placed next to the implementation they validate to catch errors early.
- Auth wiring, external-service calls, and build/tooling outcomes are covered by example/integration/smoke tests rather than property tests.
- Supabase and `fetch` are mocked in unit tests and a controllable clock backs rate-limiter/timeout tests, preserving the mock-first zero-cost default.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "4.2", "4.3", "5.1", "6.1", "7.1", "8.1", "11.1", "12.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "6.2", "7.2", "7.3", "8.2", "8.3", "9.1", "11.2", "11.3", "11.4", "11.5", "12.2", "12.3", "14.1"] },
    { "id": 4, "tasks": ["9.2", "13.1", "13.2", "13.3", "13.4", "13.5", "13.6"] },
    { "id": 5, "tasks": ["13.7"] }
  ]
}
```
