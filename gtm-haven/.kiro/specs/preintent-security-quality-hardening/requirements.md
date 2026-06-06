# Requirements Document

## Introduction

This feature hardens the PreIntent MVP (Next.js App Router, mock-first) for security and quality without changing its core demo behavior or its zero-cost, mock-first default. The system exposes API routes under `src/app/api`, server actions in `src/app/actions.ts` that call external AI/ML and Featherless-compatible services with mock fallbacks, sponsor integration adapters in `src/lib/integrations/`, a convergence engine in `src/lib/convergence.ts`, and Cognee persistence in browser `localStorage`.

The hardening effort focuses on two outcomes:

1. **Security**: validate all untrusted input on API routes, authenticate and authorize network-exposed endpoints that mutate data or trigger expensive work, protect API keys and secrets, validate external/model responses before use, rate-limit costly endpoints, sanitize error output, and safely handle persisted `localStorage` data.
2. **Quality**: enforce consistent error handling and structured logging across routes and actions, remove unsafe `any` typing and signature mismatches, and add automated test coverage for security-critical contracts and correctness properties.

Several concrete defects motivate these requirements, including: `POST /api/onboarding/profile` performs no authentication and no schema validation while constructing a service-role Supabase client and calling `runLiveSweep` with a mismatched argument shape; `POST /api/sweep` and the inline path of `POST /api/competitors/resolve` trigger external calls with no authentication or rate limiting; `POST /api/command-center` echoes arbitrary unvalidated input; route error handlers return raw exception messages to clients; the pain classifier model response is `JSON.parse`d without schema validation; and Cognee `localStorage` data is read without validation.

This document defines requirements only. Implementation choices (specific libraries, middleware, storage adapters) are deferred to the design phase.

## Glossary

- **PreIntent_System**: The overall application comprising API routes, server actions, integration adapters, the convergence engine, and the dashboard.
- **API_Route**: Any HTTP request handler under `src/app/api` (for example `health`, `command-center`, `competitors/resolve`, `score`, `sweep`, `integrations`, `onboarding/profile`, `auth/callback`, `auth/signout`).
- **Mutating_Endpoint**: An API_Route that writes persistent data or triggers external/paid service calls (for example `sweep`, `competitors/resolve`, `onboarding/profile`, `command-center`).
- **Public_Endpoint**: An API_Route intended to be reachable without authentication (for example `health`, `auth/callback`, `auth/signout`, and the read-only `integrations`/`score` description endpoints).
- **Input_Validator**: The component that validates and parses incoming request bodies and parameters against an explicit schema before use.
- **Response_Validator**: The component that validates external service and model responses against an explicit schema before the response is used.
- **Auth_Guard**: The component that verifies caller identity (authentication) and permission to act on the requested resource (authorization) for an API_Route.
- **Rate_Limiter**: The component that restricts the number of requests a caller may make to a Mutating_Endpoint within a defined time window.
- **Secret**: Any API key, service-role key, token, or credential read from environment variables (for example `AI_ML_API_KEY`, `FEATHERLESS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Error_Responder**: The component that converts caught exceptions into client-facing HTTP responses.
- **Logger**: The component that records structured diagnostic and audit events server-side.
- **Cognee_Store**: The browser `localStorage` persistence layer keyed `preintent:cognee:profiles:v1` holding `AccountIntelligenceProfile` records.
- **Integration_Adapter**: A sponsor integration module in `src/lib/integrations/` controlled by a mode flag with values `mock`, `real`, or `disabled`.
- **Convergence_Engine**: The scoring logic in `src/lib/convergence.ts` that computes a convergence score and urgency from engine sub-scores.

## Requirements

### Requirement 1: Input validation on API routes

**User Story:** As a platform operator, I want every API route to validate untrusted input against an explicit schema, so that malformed or malicious requests are rejected before any processing occurs.

#### Acceptance Criteria

1. WHEN an API_Route receives a request body, THE Input_Validator SHALL parse the body against an explicit schema before any business logic, external service call, or persistence operation executes.
2. IF a request body fails schema validation, THEN THE API_Route SHALL return HTTP status 400 with an error response indicating the validation failure, SHALL NOT invoke external services or perform persistence, and SHALL leave system state unchanged.
3. WHEN an API_Route receives query or path parameters, THE Input_Validator SHALL validate each parameter against an explicit schema before the parameter is used by business logic.
4. IF a request body exceeds the configured maximum payload size (default 1,048,576 bytes), THEN THE API_Route SHALL reject the request with HTTP status 413 and an error response indicating the payload size limit was exceeded, without parsing the body or invoking business logic.
5. WHERE an API_Route accepts a URL field, THE Input_Validator SHALL accept the field only when the value is a syntactically valid `http` or `https` URL not exceeding 2,048 characters.
6. WHEN `POST /api/command-center` receives a request, THE Input_Validator SHALL validate the body against an explicit command schema before queuing the command.
7. WHEN `POST /api/onboarding/profile` receives a request, THE Input_Validator SHALL validate `orgId` and `seedAccounts` against an explicit schema before any database write or sweep execution.
8. IF a query or path parameter fails schema validation, THEN THE API_Route SHALL return HTTP status 400 with an error response indicating the validation failure, without invoking external services or persistence.
9. IF a URL field is not a syntactically valid `http` or `https` URL or exceeds 2,048 characters, THEN THE API_Route SHALL return HTTP status 400 with an error response indicating the invalid URL, without invoking external services or persistence.

### Requirement 2: Authentication and authorization on network-exposed endpoints

**User Story:** As a security owner, I want mutating and data-accessing endpoints to require authentication and authorization, so that unauthenticated callers cannot trigger expensive work or access another tenant's data.

#### Acceptance Criteria

1. WHEN a request is made to a Mutating_Endpoint, THE Auth_Guard SHALL verify that the request carries a valid, unexpired authenticated session before any external service call or persistence operation occurs.
2. IF a request to a Mutating_Endpoint carries no authenticated session, an expired session, or an otherwise invalid session, THEN THE Auth_Guard SHALL cause the API_Route to return HTTP status 401 with an error body indicating that authentication is required, AND SHALL ensure that no external service call or persistence operation has occurred.
3. WHEN a request targets a resource scoped to an organization, THE Auth_Guard SHALL verify that the authenticated caller is a member of that organization before the resource is read or modified.
4. IF an authenticated caller is not a member of the requested organization, THEN THE Auth_Guard SHALL cause the API_Route to return HTTP status 403 with an error body indicating that authorization was denied, AND SHALL ensure that the targeted resource is neither read nor modified.
5. WHEN `POST /api/onboarding/profile` receives a request, THE Auth_Guard SHALL verify caller authentication and organization membership for the supplied `orgId` before constructing any service-role database client.
6. IF a request to a Mutating_Endpoint that requires an `orgId` omits the `orgId` or supplies an `orgId` that is empty or malformed, THEN THE Auth_Guard SHALL cause the API_Route to return HTTP status 400 with an error body indicating that the `orgId` is missing or invalid, AND SHALL ensure that no external service call or persistence operation has occurred.
7. WHEN `POST /api/competitors/resolve` receives an inline request without an `orgId`, THE Auth_Guard SHALL verify caller authentication before the resolution agent executes.
8. WHERE an API_Route is a designated Public_Endpoint, THE PreIntent_System SHALL allow unauthenticated access to that endpoint.

### Requirement 3: Secret and API key handling

**User Story:** As a security owner, I want secrets to remain server-side and never appear in responses or client bundles, so that credentials cannot leak to end users.

#### Acceptance Criteria

1. THE PreIntent_System SHALL read every Secret value exclusively within server-side execution contexts and SHALL NOT transmit any Secret value to client-side or browser execution contexts.
2. THE PreIntent_System SHALL exclude every Secret value, including any partial or truncated portion of a Secret value, from all HTTP response bodies, all HTTP response headers, all URL query parameters, and all client-delivered JavaScript bundles and their source maps.
3. WHEN an Integration_Adapter reports status, THE PreIntent_System SHALL represent each Secret's presence as a boolean field that is set to true when the Secret is configured and false when the Secret is absent, and SHALL exclude the Secret value and any partial portion of it from that status.
4. IF a required Secret is missing for an Integration_Adapter in `real` mode, THEN THE Integration_Adapter SHALL report a `not_configured` status to the caller without exposing any Secret value.
5. IF a required Secret is missing for an Integration_Adapter in `real` mode, THEN THE Integration_Adapter SHALL operate in mock fallback and SHALL return mock data instead of performing the real external operation.
6. WHEN a Secret is referenced in a Logger event, THE Logger SHALL record the Secret by key name only and SHALL exclude the Secret value and any partial portion of it from the logged event.

### Requirement 4: Safe error handling and response sanitization

**User Story:** As a security owner, I want client-facing errors to be sanitized while full diagnostics are logged server-side, so that internal details are not disclosed to callers.

#### Acceptance Criteria

1. WHEN an unhandled exception occurs in an API_Route, THE Error_Responder SHALL return, within 1000 milliseconds of the exception being caught, a client-facing error response containing a generic error message that includes no internal diagnostic content and an HTTP status code corresponding to the error category (a client-error category for caller-induced faults and a server-error category for internal faults).
2. THE Error_Responder SHALL exclude stack traces, raw exception messages originating from external services, internal file paths, hostnames, IP addresses, and database or table identifiers from all client-facing responses.
3. WHEN an exception is caught in an API_Route or server action, THE Logger SHALL record server-side, within 1000 milliseconds of the exception being caught, the full error detail including the stack trace and the original exception message together with a correlation identifier that is unique per request.
4. WHEN the Error_Responder returns a sanitized error, THE Error_Responder SHALL include in the client-facing response the same correlation identifier that the Logger recorded for that event.
5. WHEN a validation failure occurs, THE Error_Responder SHALL return a client-facing message that lists every field that failed validation and a reason category for each failed field (for example: missing, malformed, or out-of-range) without including internal schema names, data type definitions, or other system details.
6. IF the Logger fails to record the error detail for a caught exception, THEN THE Error_Responder SHALL still return the sanitized client-facing error response to the caller.

### Requirement 5: Validation of external and model responses

**User Story:** As a developer, I want all external service and AI model responses validated against a schema before use, so that untrusted or malformed responses cannot corrupt downstream logic.

#### Acceptance Criteria

1. WHEN the PreIntent_System receives a response from an external AI/ML or Featherless-compatible service, THE Response_Validator SHALL validate the parsed response against an explicit schema, and SHALL block the response from being used by any downstream logic until validation completes successfully.
2. IF an external or model response fails schema validation, THEN THE PreIntent_System SHALL discard the response, SHALL leave all downstream state unchanged by the discarded response, and SHALL apply the defined mock or structured fallback in place of the discarded response.
3. IF an external or model response fails schema validation, THEN THE PreIntent_System SHALL record the validation failure via the Logger, including an indication of the validating component and the reason validation failed.
4. WHEN the pain classifier receives a model response, THE Response_Validator SHALL validate the classification payload against an explicit schema, and SHALL block the classification from being used until validation completes successfully.
5. IF parsing of an external or model response fails, THEN THE PreIntent_System SHALL apply the defined fallback in place of the unparseable response, SHALL leave all downstream state unchanged by the failed response, and SHALL record the parsing failure via the Logger.
6. WHEN an external service call exceeds its configured timeout of at most 30 seconds (default 10 seconds), THE PreIntent_System SHALL abort the call, SHALL apply the defined fallback in place of the aborted call's response, and SHALL record the timeout via the Logger.
7. FOR ALL responses validated by the Response_Validator, validating a value that already conforms to the schema SHALL produce a value equal to the input value (round-trip property), with no field added, removed, or modified.

### Requirement 6: Rate limiting on costly endpoints

**User Story:** As a platform operator, I want costly endpoints to be rate-limited per caller, so that abuse or runaway clients cannot exhaust external service quotas or budget.

#### Acceptance Criteria

1. WHEN a caller submits more than the configured maximum of 10 requests to a single Mutating_Endpoint within the configured rolling time window of 60 seconds, THE Rate_Limiter SHALL cause the API_Route to return HTTP status 429.
2. WHEN a caller submits a request to a Mutating_Endpoint and the caller's request count within the current 60-second rolling window is at or below the configured maximum of 10, THE Rate_Limiter SHALL allow the request to proceed.
3. THE Rate_Limiter SHALL identify each caller by authenticated caller identity, and WHERE no authenticated identity is present, THE Rate_Limiter SHALL identify the caller by source IP address.
4. WHEN the Rate_Limiter causes a 429 response, THE API_Route SHALL include a `Retry-After` header whose value is the number of whole seconds (an integer from 1 to 60) remaining until the caller's request count falls below the configured maximum.
5. THE Rate_Limiter SHALL apply the configured maximum of 10 requests per 60-second rolling window per caller independently to each of `POST /api/sweep`, `POST /api/competitors/resolve`, and `POST /api/onboarding/profile`.
6. WHEN a request causes the caller to exceed the configured request limit, THE API_Route SHALL reject the request and return HTTP status 429 before any external service call or persistence operation occurs, and SHALL NOT alter any stored state as a result of the rejected request.
7. IF the Rate_Limiter cannot determine a caller's current request count because its tracking backend is unavailable, THEN THE API_Route SHALL reject the request, return HTTP status 429, and include a `Retry-After` header indicating a retry delay of 60 seconds, without performing any external service call or persistence operation.

### Requirement 7: Safe handling of persisted localStorage data

**User Story:** As a developer, I want Cognee data read from localStorage to be validated before use, so that corrupted or tampered client storage cannot crash or mislead the dashboard.

#### Acceptance Criteria

1. WHEN the Cognee_Store reads data from `localStorage` key `preintent:cognee:profiles:v1`, THE Cognee_Store SHALL validate the parsed data against the `AccountIntelligenceProfile` record schema, including a maximum collection size of 10,000 records, before the data is used.
2. IF the stored Cognee data cannot be parsed as JSON, THEN THE Cognee_Store SHALL discard the invalid data and initialize an empty profile set without raising an unhandled error.
3. IF the stored Cognee data fails schema validation, THEN THE Cognee_Store SHALL discard the invalid data and initialize an empty profile set without raising an unhandled error.
4. IF the stored Cognee data exceeds the maximum collection size of 10,000 records, THEN THE Cognee_Store SHALL discard the invalid data and initialize an empty profile set without raising an unhandled error.
5. WHEN the Cognee_Store discards invalid data, THE Cognee_Store SHALL record a discard event via the Logger that includes the discard reason (JSON parse failure, schema validation failure, or record-count limit exceeded).
6. WHEN the Cognee_Store writes a profile, THE Cognee_Store SHALL serialize only schema-conformant `AccountIntelligenceProfile` records and SHALL reject any non-conformant record without persisting it.
7. IF a write to `localStorage` fails (for example because the storage quota is exceeded), THEN THE Cognee_Store SHALL leave the previously persisted value unchanged and SHALL record a write-failure event via the Logger.
8. FOR ALL valid `AccountIntelligenceProfile` records, writing a record to the Cognee_Store then reading it back SHALL produce an equivalent record (round-trip property), where equivalence is defined as equality of every schema-defined field value.

### Requirement 8: Consistent error handling and structured logging

**User Story:** As a developer, I want consistent error handling and structured logging across all routes and actions, so that failures are observable and uniformly handled.

#### Acceptance Criteria

1. IF an API_Route or server action raises an unhandled error, THEN THE Error_Responder SHALL return a structured error response that includes an error category, a human-readable error indication, and the request's correlation identifier, and SHALL preserve the caller's submitted data without partial persistence.
2. IF an error response is produced, THEN THE Error_Responder SHALL exclude stack traces, Secret values, and internal implementation details from the response body.
3. WHEN a Logger event is recorded, THE Logger SHALL emit a structured record that includes a severity level drawn from a defined ordered set of severities, a source identifier, a correlation identifier, and a timestamp.
4. WHEN multiple Logger events are recorded during the handling of a single request, THE Logger SHALL assign every emitted record the same correlation identifier for that request.
5. WHEN a Mutating_Endpoint completes a request, THE Logger SHALL record an audit event capturing the caller identity reference, the endpoint identifier, the correlation identifier, and an outcome value of either success or failure.
6. WHEN the Logger emits any record, THE Logger SHALL replace Secret values and end-user personally identifiable values with a fixed redaction placeholder rather than emitting their literal values.
7. WHERE the configured log level excludes a given severity, THE Logger SHALL suppress all records whose severity is below the configured log level.

### Requirement 9: Type safety and signature correctness

**User Story:** As a developer, I want type-safe route handlers with correct cross-module call signatures, so that interface mismatches are caught at build time rather than failing at runtime.

#### Acceptance Criteria

1. WHEN `npm run typecheck` is executed against the PreIntent_System, THE PreIntent_System SHALL terminate with exit code 0 and report zero type errors.
2. WHEN `npm run lint` is executed against the PreIntent_System, THE PreIntent_System SHALL terminate with exit code 0 and report zero lint errors and zero lint warnings.
3. WHEN an API_Route invokes a server action, THE supplied arguments SHALL be statically assignable to the action's declared input type, such that any non-conforming argument produces a typecheck error and terminates `npm run typecheck` with a non-zero exit code.
4. THE PreIntent_System SHALL declare every API_Route handler request payload using an explicit named type parsed through the Input_Validator, with zero `any`-typed request payloads remaining.
5. WHEN a server action is referenced by an import path, THE referenced module SHALL export a function whose parameter count, parameter types, and return type are verified as matching the call site at typecheck time.
6. IF `npm run typecheck` or `npm run lint` detects one or more errors, THEN THE PreIntent_System SHALL terminate with a non-zero exit code and emit output identifying each failing file and the corresponding error.

### Requirement 10: Automated test coverage for security and correctness contracts

**User Story:** As a developer, I want automated tests covering security contracts and correctness properties, so that hardening behavior is verified and protected against regression.

#### Acceptance Criteria

1. THE PreIntent_System SHALL include, for each Mutating_Endpoint, at least one test asserting that an unauthenticated request returns HTTP status 401, where an unauthenticated request is defined as a request whose credentials are missing, malformed, or expired.
2. THE PreIntent_System SHALL include, for each API_Route, at least one test asserting that a request whose body fails schema validation returns HTTP status 400.
3. THE PreIntent_System SHALL include a round-trip property test for the Cognee_Store that generates a minimum of 100 valid profile inputs and asserts, for each input, that the value read back is equal to the value written (write-then-read equivalence).
4. THE PreIntent_System SHALL include a round-trip property test for the Response_Validator that generates a minimum of 100 schema-conformant values and asserts, for each input, that the validated output is equal to the input (validation equivalence).
5. THE PreIntent_System SHALL include a property test for the Convergence_Engine that generates a minimum of 100 valid engine sub-score inputs and asserts, for each input, that the resulting convergence score lies within the inclusive range 0 to 100 (range invariant).
6. WHEN `npm run test` is executed after the hardening changes are applied, THE PreIntent_System SHALL complete with a success exit code and zero failing tests.
7. WHEN `npm run build` is executed after the hardening changes are applied, THE PreIntent_System SHALL complete with a success exit code and zero build errors.
