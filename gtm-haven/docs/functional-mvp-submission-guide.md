# PreIntent Functional MVP Submission Guide

## Goal

To submit PreIntent as a fully functional, non-demo-only hackathon MVP, the product should prove one real end-to-end pipeline:

```text
Live web signal -> AI extraction/classification -> Account profile update -> convergence score -> Intel Brief -> real alert or delivery
```

The MVP does not need to be a full production SaaS. It needs to demonstrate that PreIntent can ingest real market evidence and convert it into actionable GTM intelligence.

## Submission-Critical Work

### 1. Make One Real Bright Data Sweep Work

Implement a live sweep that calls Bright Data for at least one real competitor or regulatory source.

Minimum target:

- Scrape one competitor pricing page with Scraping Browser or Web Unlocker.
- Optionally run one SERP API query for regulatory content.
- Return typed `EngineSignal[]`.
- Store source URL, Bright Data tool, and captured timestamp.

Relevant code areas:

- `src/lib/integrations/bright-data.ts`
- `src/lib/domain.ts`
- `src/components/DemoDashboard.tsx`
- A future server action or route such as `POST /api/sweep`

### 2. Replace Static Signal Scoring With AI/ML Scoring

Use AI/ML API for structured extraction and scoring, not only final brief writing.

Minimum target:

- Score one Void signal.
- Score one Compliance or Pain signal.
- Generate one real Intel Brief from the scored Account Intelligence Profile.

Relevant code areas:

- `src/app/actions.ts`
- `src/lib/convergence.ts`
- A future `src/lib/integrations/ai-ml.ts`

### 3. Wire Featherless Into Pain Listener

Use Featherless to classify one real or pasted community post.

Expected output:

```json
{
  "signalType": "active evaluation",
  "urgency": "high",
  "competitorMentioned": "Stripe Atlas",
  "companyAttribution": "Acme FinTech",
  "confidence": 0.91
}
```

Relevant code area:

- `classifyPainSignal()` in `src/app/actions.ts`

### 4. Persist Real Account Profiles

Store real sweep outputs in either:

- `localStorage` for the fastest hackathon path.
- Supabase for stronger backend credibility.

The profile should survive refresh and preserve:

- account info,
- engine signals,
- sub-scores,
- convergence score,
- generated brief metadata.

Relevant code areas:

- `src/lib/cognee.ts`
- `supabase/migrations/202605300001_initial_gtm_haven.sql`

### 5. Make One Real Alert Fire

When convergence crosses the threshold, send a real external notification.

Acceptable MVP targets:

- Slack incoming webhook,
- TriggerWare webhook,
- HubSpot lead/task creation.

Relevant code areas:

- `src/lib/integrations/triggerware.ts`
- Future `src/lib/integrations/slack.ts`
- Future `POST /api/trigger`

### 6. Optional: Add One Real Speechmatics Transcript

Use Speechmatics to transcribe one audio source and turn it into a Pain Listener signal.

If time is short, keep Speechmatics mocked and clearly labeled. The higher-priority sponsor proof is Bright Data + AI/ML API + Featherless + real delivery.

## Ideal MVP Flow

1. User enters a target account and competitor URL.
2. User clicks `Run Live Sweep`.
3. Backend calls Bright Data.
4. Backend passes the extracted signal into AI/ML API.
5. Backend classifies a pain signal with Featherless if applicable.
6. System updates the Account Intelligence Profile.
7. Convergence Engine recomputes score.
8. If score is `>= 85`, TriggerWare or Slack fires.
9. AI/ML API generates the Intel Brief.
10. UI displays source evidence, sponsor provenance, score, profile memory, delivery status, and brief.

## End-To-End User Story

### Story: Sales Rep Finds A Hidden Buying Event Before Competitors

Maya is an account executive selling compliance automation software to fintech companies. She has Acme FinTech on her target account list, but Acme is not currently in pipeline and has not shown up in any traditional intent vendor feed.

Maya opens PreIntent and enters:

- Target account: `Acme FinTech`
- Competitor: `Stripe Atlas`
- Competitor pricing URL: `https://example.com/pricing`
- Community signal source: a recent `r/fintech` post about evaluating Stripe Atlas alternatives

She clicks `Run Live Sweep`.

PREINTENT runs a Bright Data sweep against the competitor pricing page. The Scraping Browser captures the rendered page and detects that the SMB pricing tier has disappeared. The system records this as a Void Scanner signal with Bright Data provenance.

Next, Compliance Radar checks for PCI-DSS 4.0 enforcement content. AI/ML API extracts that the compliance deadline is approaching and that fintech/payment companies like Acme are likely in scope.

Pain Listener processes the `r/fintech` post. Featherless classifies it as `active evaluation`, detects high urgency, identifies Stripe Atlas as the competitor mentioned, and attributes the signal to Acme FinTech with high confidence.

Cognee-style account memory updates Acme's Account Intelligence Profile with all three signals:

- Void Score: `84`
- Compliance Score: `86`
- Pain Score: `91`

The Convergence Engine recomputes the account score:

```text
Convergence Score = 87 / 100
Urgency = HIGH
```

Because the score crosses `85`, TriggerWare or Slack fires a real alert:

```text
PreIntent: Acme FinTech hit 87/100 convergence.
Three signals aligned: competitor retreat, regulatory pressure, active evaluation.
Intel Brief ready.
```

AI/ML API generates the Intel Brief. Maya opens it and sees:

- why now,
- the three supporting signals,
- source provenance,
- suggested opening line,
- account context,
- recommended next action.

Maya now has a timely, evidence-backed reason to reach out before Acme appears in any standard intent platform.

## What Judges Should See

During the demo, explicitly show:

- Bright Data captured the live web evidence.
- AI/ML API extracted/scored the signal and generated the brief.
- Featherless classified the community pain signal.
- Cognee-style memory persisted the account profile.
- TriggerWare or Slack fired the workflow.
- The final Intel Brief is useful to a real sales rep.

## Definition Of Done

The hackathon MVP is functionally complete when:

- One live Bright Data source produces a real signal.
- At least one AI/ML API call runs successfully.
- At least one Featherless classification runs or has a reliable fallback.
- A profile persists after refresh.
- A convergence score is computed from real or semi-real inputs.
- A real Slack or TriggerWare notification fires.
- The Intel Brief is generated from the current profile.
- The full flow can be demoed reliably with mock fallback.

## Recommended Build Order

1. Add a `Run Live Sweep` backend path for one Bright Data competitor page.
2. Add AI/ML API structured extraction/scoring for the returned signal.
3. Wire Featherless classification into the Pain Listener flow.
4. Persist the resulting Account Intelligence Profile.
5. Fire one real Slack or TriggerWare alert when convergence crosses `85`.
6. Generate the Intel Brief from the updated profile.
7. Keep mock fallback enabled for demo reliability.

## Submission Notes

The strongest hackathon story is not "we integrated every production system." The strongest story is:

> PreIntent can take one live web signal, enrich it with AI, persist it as account intelligence, detect convergence, and deliver a useful brief to a GTM workflow.

If that path works once with real sponsor APIs, the remaining engines and sources can be presented as scalable extensions of the same architecture.
