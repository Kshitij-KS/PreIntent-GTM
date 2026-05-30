"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  DatabaseZap,
  Gauge,
  LineChart,
  ListFilter,
  Moon,
  RadioTower,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Workflow,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import EventTimeline from "@/components/EventTimeline";
import ScoreGauge from "@/components/ScoreGauge";
import type {
  Alert,
  CommandCenterData,
  CompetitorProfile,
  IntegrationStatus,
  Severity,
} from "@/lib/domain";
import {
  buildHubSpotTaskPayload,
  buildSlackAlertPayload,
} from "@/lib/integrations";

type ThemeMode = "light" | "dark";
type AccentMode = "slate" | "cyan" | "emerald" | "violet";

interface DemoDashboardProps {
  initialData: CommandCenterData;
}

interface DemoStep {
  id: string;
  label: string;
  title: string;
  talkTrack: string;
  nextClick: string;
}

const demoSteps: DemoStep[] = [
  {
    id: "signal",
    label: "Signal detected",
    title: "Pricing change detected",
    talkTrack:
      "Zenith removed its Pro tier and a renewal complaint appeared the next day. The demo starts with source-backed signals, not a vague score.",
    nextClick: "Open the score explanation.",
  },
  {
    id: "score",
    label: "Risk score explained",
    title: "Score moves to critical",
    talkTrack:
      "The score is explainable: recency, confidence, source quality, and category caps all contribute to the final number.",
    nextClick: "Review the recommended revenue play.",
  },
  {
    id: "play",
    label: "Recommended play",
    title: "Renewal rescue motion",
    talkTrack:
      "The app turns the signal into a specific revenue motion with an owner, confidence, and a CRM-ready next step.",
    nextClick: "Prepare Slack delivery.",
  },
  {
    id: "slack",
    label: "Slack alert ready",
    title: "Executive channel prepared",
    talkTrack:
      "The Slack payload is deterministic and source-backed. In the demo, sending updates local state without depending on live credentials.",
    nextClick: "Create the HubSpot task.",
  },
  {
    id: "hubspot",
    label: "HubSpot task ready",
    title: "CRM action staged",
    talkTrack:
      "The HubSpot task uses an idempotency key and includes evidence, priority, account domain, and the recommended play.",
    nextClick: "Mark the alert actioned.",
  },
  {
    id: "summary",
    label: "Executive summary complete",
    title: "Demo complete",
    talkTrack:
      "The story ends with a clean operating summary: what happened, why it matters, and what the revenue team did next.",
    nextClick: "Reset the demo or switch themes.",
  },
];

const navItems = [
  { label: "Overview", icon: Gauge, active: true },
  { label: "Watchlist", icon: BriefcaseBusiness, active: false },
  { label: "Alerts", icon: BellRing, active: false },
  { label: "Signals", icon: LineChart, active: false },
  { label: "Integrations", icon: DatabaseZap, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const accentOptions: Array<{ label: string; value: AccentMode }> = [
  { label: "Slate", value: "slate" },
  { label: "Cyan", value: "cyan" },
  { label: "Emerald", value: "emerald" },
  { label: "Violet", value: "violet" },
];

const severityClasses: Record<Severity, string> = {
  critical: "status-danger",
  high: "status-warning",
  medium: "status-caution",
  low: "status-success",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getDemoStatus(stepIndex: number) {
  return {
    sweepComplete: stepIndex >= 0,
    scoreExplained: stepIndex >= 1,
    playSelected: stepIndex >= 2,
    slackSent: stepIndex >= 3,
    hubspotCreated: stepIndex >= 4,
    actioned: stepIndex >= 5,
  };
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  trend: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="surface metric-card">
      <div className="metric-top">
        <div>
          <p>{label}</p>
          <strong>{value}</strong>
        </div>
        <div className="metric-icon">
          <Icon />
        </div>
      </div>
      <span>{trend}</span>
    </div>
  );
}

function DemoRail({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="demo-rail" aria-label="Demo progress">
      {demoSteps.map((step, index) => {
        const state =
          index < stepIndex
            ? "complete"
            : index === stepIndex
              ? "active"
              : "idle";

        return (
          <div className={`demo-step ${state}`} key={step.id}>
            <span>{index < stepIndex ? <Check /> : index + 1}</span>
            <p>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function CompetitorRow({
  competitor,
  selected,
}: {
  competitor: CompetitorProfile;
  selected: boolean;
}) {
  const topContribution = competitor.scoreRun.contributions[0];

  return (
    <tr className={selected ? "selected-row" : undefined}>
      <td>
        <div className="company-cell">
          <div className="company-mark">
            <Building2 />
          </div>
          <div>
            <p>{competitor.name}</p>
            <span>{competitor.domain}</span>
          </div>
        </div>
      </td>
      <td>
        <span
          className={`status-pill ${severityClasses[competitor.scoreRun.severity]}`}
        >
          {competitor.scoreRun.severity}
        </span>
      </td>
      <td className="numeric">{competitor.scoreRun.score}</td>
      <td className="driver-cell">
        {topContribution?.title ?? "No active driver"}
      </td>
      <td className="numeric muted">{competitor.signals.length}</td>
    </tr>
  );
}

function AlertRow({
  alert,
  competitor,
  status,
}: {
  alert: Alert;
  competitor: CompetitorProfile;
  status: ReturnType<typeof getDemoStatus>;
}) {
  const slackPayload = buildSlackAlertPayload(alert, competitor);
  const hubspotPayload = buildHubSpotTaskPayload(
    alert,
    competitor,
    competitor.recommendations[0],
  );

  return (
    <article className="alert-row">
      <div className="alert-icon">
        <AlertTriangle />
      </div>
      <div className="alert-body">
        <div className="alert-meta">
          <span className={`status-pill ${severityClasses[alert.severity]}`}>
            {alert.severity}
          </span>
          <span className="status-pill neutral">
            {status.actioned ? "actioned" : alert.status}
          </span>
          <span>{formatDate(alert.createdAt)}</span>
        </div>
        <h3>{alert.title}</h3>
        <p>{competitor.scoreRun.explanation}</p>
        <div className="delivery-row">
          <span>{slackPayload.channel}</span>
          <span>{status.slackSent ? "Slack sent" : "Slack ready"}</span>
          <span>
            {status.hubspotCreated
              ? "HubSpot task created"
              : `${hubspotPayload.priority} task ready`}
          </span>
        </div>
      </div>
      <ChevronRight className="row-arrow" />
    </article>
  );
}

function IntegrationRow({
  integration,
  status,
}: {
  integration: IntegrationStatus;
  status: ReturnType<typeof getDemoStatus>;
}) {
  const providerState =
    integration.provider === "slack" && status.slackSent
      ? "sent"
      : integration.provider === "hubspot" && status.hubspotCreated
        ? "created"
        : integration.status;

  return (
    <div className="integration-row">
      <div>
        <p>{integration.name}</p>
        <span>{integration.mode} mode</span>
      </div>
      <div className="health-state">
        <span
          className={integration.status === "disabled" ? "dot muted" : "dot"}
        />
        {providerState}
      </div>
    </div>
  );
}

function DemoBrief({
  step,
  stepIndex,
  onPrevious,
  onNext,
  onReset,
  onCopy,
}: {
  step: DemoStep;
  stepIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onCopy: () => void;
}) {
  return (
    <aside className="surface demo-brief">
      <div className="brief-heading">
        <div>
          <p className="eyebrow">Presenter brief</p>
          <h2>{step.title}</h2>
        </div>
        <span>
          {stepIndex + 1}/{demoSteps.length}
        </span>
      </div>
      <p className="brief-copy">{step.talkTrack}</p>
      <div className="next-click">
        <span>Next click</span>
        <strong>{step.nextClick}</strong>
      </div>
      <div className="brief-actions">
        <button className="btn secondary" onClick={onPrevious} type="button">
          <ChevronLeft />
          Previous
        </button>
        <button className="btn primary" onClick={onNext} type="button">
          Next
          <ChevronRight />
        </button>
      </div>
      <div className="brief-actions compact">
        <button className="btn ghost" onClick={onReset} type="button">
          <RefreshCcw />
          Reset demo
        </button>
        <button className="btn ghost" onClick={onCopy} type="button">
          <Copy />
          Copy talk track
        </button>
      </div>
    </aside>
  );
}

export default function DemoDashboard({ initialData }: DemoDashboardProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [accent, setAccent] = useState<AccentMode>("cyan");
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const primaryCompetitor =
    initialData.competitors[1] ?? initialData.competitors[0];
  const firstAlert = initialData.alerts[0];
  const firstAlertCompetitor =
    initialData.competitors.find(
      (item) => item.id === firstAlert?.competitorId,
    ) ?? primaryCompetitor;
  const currentStep = demoSteps[stepIndex];
  const demoStatus = useMemo(() => getDemoStatus(stepIndex), [stepIndex]);
  const firstRecommendation = primaryCompetitor.recommendations[0];

  const moveNext = () =>
    setStepIndex((current) => Math.min(demoSteps.length - 1, current + 1));
  const movePrevious = () =>
    setStepIndex((current) => Math.max(0, current - 1));
  const resetDemo = () => setStepIndex(0);
  const copyTalkTrack = async () => {
    setCopied(true);
    try {
      await navigator.clipboard.writeText(currentStep.talkTrack);
    } catch {
      // Clipboard is optional during local demos.
    }
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="app-root" data-theme={theme} data-accent={accent}>
      <div className="app-frame">
        <aside className="sidebar">
          <div className="brand-row">
            <div className="brand-mark">
              <RadioTower />
            </div>
            <div>
              <p>GTM Haven</p>
              <span>Revenue intelligence</span>
            </div>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => (
              <a
                className={item.active ? "active" : undefined}
                href="#"
                key={item.label}
              >
                <item.icon />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="sidebar-card">
            <div>
              <ShieldCheck />
              <strong>Evidence policy</strong>
            </div>
            <p>
              Every score shown in the demo maps back to source, confidence, and
              event time.
            </p>
          </div>

          <DemoRail stepIndex={stepIndex} />
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="title-lockup">
              <p>Competitive signals</p>
              <span>
                {initialData.summary.workspaceName} · Last sweep{" "}
                {formatDate(initialData.summary.lastIngestionAt)}
              </span>
            </div>
            <div className="search-box">
              <Search />
              <span>Search companies, signals, sources</span>
            </div>
            <div className="toolbar-actions">
              <div className="segmented" aria-label="Theme">
                <button
                  className={theme === "light" ? "active" : undefined}
                  onClick={() => setTheme("light")}
                  type="button"
                >
                  <Sun />
                  Light
                </button>
                <button
                  className={theme === "dark" ? "active" : undefined}
                  onClick={() => setTheme("dark")}
                  type="button"
                >
                  <Moon />
                  Dark
                </button>
              </div>
              <select
                aria-label="Accent color"
                className="accent-select"
                onChange={(event) =>
                  setAccent(event.target.value as AccentMode)
                }
                value={accent}
              >
                {accentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="btn secondary compact-only" type="button">
                <ListFilter />
                Filters
              </button>
              <button className="btn primary" onClick={moveNext} type="button">
                <Sparkles />
                Run sweep
              </button>
            </div>
          </header>

          <div className="content-grid">
            <section className="hero-panel surface">
              <div className="hero-copy">
                <p className="eyebrow">Demo console</p>
                <h1>Competitor Risk Board</h1>
                <p>
                  A presenter-safe workflow for showing how a market signal
                  becomes an explained score, an account play, and a routed
                  revenue action.
                </p>
              </div>
              <div className="hero-status">
                <div>
                  <span>Current focus</span>
                  <strong>{primaryCompetitor.name}</strong>
                </div>
                <div>
                  <span>Demo step</span>
                  <strong>{currentStep.label}</strong>
                </div>
              </div>
            </section>

            <DemoBrief
              step={currentStep}
              stepIndex={stepIndex}
              onPrevious={movePrevious}
              onNext={moveNext}
              onReset={resetDemo}
              onCopy={copyTalkTrack}
            />

            <section className="metrics-grid">
              <Metric
                label="Monitored competitors"
                value={initialData.summary.monitoredCompetitors}
                trend="All have fresh signal coverage"
                icon={BriefcaseBusiness}
              />
              <Metric
                label="Critical alerts"
                value={initialData.summary.criticalAlerts}
                trend="Needs same-day review"
                icon={BellRing}
              />
              <Metric
                label="Average score"
                value={initialData.summary.averageScore}
                trend="Portfolio weighted risk"
                icon={Gauge}
              />
              <Metric
                label="Queued plays"
                value={initialData.summary.openRevenueOpportunities}
                trend="Ready for Slack or HubSpot"
                icon={ArrowUpRight}
              />
            </section>

            <section className="surface watchlist-panel">
              <PanelHeader
                eyebrow="Watchlist"
                title="Competitor Risk Board"
                action={
                  <span className="small-muted">
                    {initialData.competitors.length} companies
                  </span>
                }
              />
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Severity</th>
                      <th className="numeric">Score</th>
                      <th>Top driver</th>
                      <th className="numeric">Signals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData.competitors.map((competitor) => (
                      <CompetitorRow
                        key={competitor.id}
                        competitor={competitor}
                        selected={competitor.id === primaryCompetitor.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="side-stack">
              <section className="surface next-action-card">
                <div className="next-action-top">
                  <div>
                    <p className="eyebrow">Today</p>
                    <h2>Next action</h2>
                  </div>
                  <span
                    className={`status-pill ${severityClasses[firstAlert?.severity ?? "low"]}`}
                  >
                    {firstAlert?.severity ?? "low"}
                  </span>
                </div>
                <p className="action-title">{firstAlert?.title}</p>
                <p className="action-copy">
                  Owner: {firstAlert?.owner}.{" "}
                  {demoStatus.hubspotCreated
                    ? "HubSpot task is created and ready for follow-up."
                    : "Create the HubSpot task and route the source-backed note to Slack."}
                </p>
                <div className="action-buttons">
                  <button
                    className="btn secondary"
                    onClick={() => setStepIndex(3)}
                    type="button"
                  >
                    <Send />
                    Send Slack alert
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setStepIndex(4)}
                    type="button"
                  >
                    <CheckCircle2 />
                    Create HubSpot task
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => setStepIndex(5)}
                    type="button"
                  >
                    <Check />
                    Mark actioned
                  </button>
                </div>
                <div className="timestamp-row">
                  <Clock3 />
                  {formatDate(
                    firstAlert?.createdAt ??
                      initialData.summary.lastIngestionAt,
                  )}
                </div>
              </section>

              <section className="surface alerts-panel">
                <PanelHeader
                  eyebrow="Alert center"
                  title="Executive Actions"
                  action={<AlertTriangle />}
                />
                {initialData.alerts.map((alert) => {
                  const competitor =
                    initialData.competitors.find(
                      (item) => item.id === alert.competitorId,
                    ) ?? firstAlertCompetitor;
                  return (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      competitor={competitor}
                      status={demoStatus}
                    />
                  );
                })}
              </section>
            </section>

            <section className="detail-grid">
              <ScoreGauge
                score={primaryCompetitor.scoreRun.score}
                severity={primaryCompetitor.scoreRun.severity}
                contributions={primaryCompetitor.scoreRun.contributions}
                confidence={Math.round(
                  (primaryCompetitor.signals.reduce(
                    (total, signal) => total + signal.confidence,
                    0,
                  ) /
                    primaryCompetitor.signals.length) *
                    100,
                )}
                evidenceCount={primaryCompetitor.signals.length}
              />
              <EventTimeline signals={primaryCompetitor.signals} />
            </section>

            <section className="surface plays-panel">
              <PanelHeader
                eyebrow="Recommended work"
                title="Revenue plays"
                action={<Workflow />}
              />
              <div className="play-grid">
                {initialData.competitors.flatMap((competitor) =>
                  competitor.recommendations.map((recommendation) => (
                    <article
                      className={
                        recommendation.id === firstRecommendation?.id
                          ? "play-card highlighted"
                          : "play-card"
                      }
                      key={recommendation.id}
                    >
                      <div>
                        <p>{recommendation.title}</p>
                        <span>{recommendation.ownerRole}</span>
                      </div>
                      <strong>
                        {Math.round(recommendation.confidence * 100)}%
                      </strong>
                      <p>{recommendation.brief}</p>
                    </article>
                  )),
                )}
              </div>
            </section>

            <section className="surface systems-panel">
              <PanelHeader
                eyebrow="Systems"
                title="Delivery state"
                action={<DatabaseZap />}
              />
              <div>
                {initialData.integrations.map((integration) => (
                  <IntegrationRow
                    key={integration.id}
                    integration={integration}
                    status={demoStatus}
                  />
                ))}
              </div>
            </section>

            <section className="policy-grid">
              <div className="surface policy-card">
                <CheckCircle2 />
                <h2>Data policy</h2>
                <p>
                  Public or authorized collection only. Source URLs and
                  timestamps stay attached to each signal.
                </p>
              </div>
              <div className="surface policy-card">
                <ShieldCheck />
                <h2>Access control</h2>
                <p>
                  Workspace-scoped records, RLS policies, and server-only
                  service credentials.
                </p>
              </div>
              <div className="surface policy-card">
                <Workflow />
                <h2>Workflow logs</h2>
                <p>
                  Slack, HubSpot, and provider syncs use idempotency keys and
                  delivery states.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {copied ? <div className="copy-toast">Talk track copied</div> : null}
    </main>
  );
}
