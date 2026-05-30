"use client";

import { useState, useEffect, useRef } from "react";
import type { AccountIntelligenceProfile, EngineSignal, IntegrationStatus } from "@/lib/domain";
import {
  arriveSignal,
  compliancePciDss,
  painPodcastTranscript,
  painRFintechPost,
  resetDemoProfile,
  voidPricingRemoval,
} from "@/lib/undertow-demo";
import { computeConvergenceScore, computeUrgency } from "@/lib/convergence";
import { previewTriggerWareWorkflow } from "@/lib/integrations/triggerware";

// ─── EXACT DATA FROM THE REQUESTED DASHBOARD FEEL ────────────────────────────

const ACCOUNTS = [
  { id: 1, name: "Acme FinTech", industry: "FinTech / Payments", employees: 340, location: "Austin, TX",
    competitor: "Stripe Atlas", voidScore: 84, complianceScore: 71, painScore: 91, convergence: 82,
    status: "ALERT", contact: "Head of Payments Infra", stack: ["AWS", "Stripe", "Postgres"],
    voidEvent: "Stripe Atlas removed SMB pricing tier from /pricing (Jun 2)",
    complianceEvent: "PCI-DSS 4.0 enforcement begins in 87 days",
    painEvent: "r/fintech: \"evaluating alternatives to Stripe Atlas — contract up in 60 days\"",
    audioSignal: "FinTech Unplugged Ep.84 — speaker discusses active vendor migration planning" },
  { id: 2, name: "Nexus Healthcare", industry: "HealthTech", employees: 180, location: "Boston, MA",
    competitor: "Veeva Systems", voidScore: 62, complianceScore: 88, painScore: 45, convergence: 65,
    status: "WATCH", contact: "VP of Compliance", stack: ["Azure", "Salesforce", "React"],
    voidEvent: "Veeva removed clinical trial integration from partner docs",
    complianceEvent: "HIPAA enforcement action bulletin — OCR targeting Veeva clients",
    painEvent: "G2 review: \"looking for Veeva alternatives for 2025 renewal\"",
    audioSignal: null },
  { id: 3, name: "Orbital SaaS", industry: "B2B SaaS", employees: 95, location: "San Francisco, CA",
    competitor: "HubSpot", voidScore: 45, complianceScore: 55, painScore: 72, convergence: 57,
    status: "WATCH", contact: "Head of RevOps", stack: ["GCP", "HubSpot", "Node.js"],
    voidEvent: "HubSpot Starter plan email limits quietly changed in docs",
    complianceEvent: "EU AI Act SaaS compliance requirements published",
    painEvent: "LinkedIn: \"HubSpot contract up in 60 days — actively fielding demos\"",
    audioSignal: null },
  { id: 4, name: "Vertex Capital", industry: "FinTech / Invest.", employees: 520, location: "New York, NY",
    competitor: "Carta", voidScore: 71, complianceScore: 79, painScore: 38, convergence: 63,
    status: "WATCH", contact: "CFO", stack: ["AWS", "Carta", "Python"],
    voidEvent: "Carta removed fund admin self-service tier from pricing page",
    complianceEvent: "SEC Rule 10c-1 securities lending compliance deadline",
    painEvent: "Twitter/X: \"Carta pricing 3x on renewal — evaluating alternatives\"",
    audioSignal: null },
  { id: 5, name: "Cascade DevOps", industry: "Developer Tools", employees: 67, location: "Remote",
    competitor: "Datadog", voidScore: 28, complianceScore: 35, painScore: 55, convergence: 39,
    status: "MONITOR", contact: "CTO", stack: ["AWS", "Datadog", "Kubernetes"],
    voidEvent: "No critical removals detected (log retention options changed)",
    complianceEvent: "SOC 2 Type II renewal window approaching",
    painEvent: "r/devops: \"Datadog renewal came back 3x — actively looking at alternatives\"",
    audioSignal: null },
  { id: 6, name: "Meridian Logistics", industry: "Supply Chain", employees: 240, location: "Chicago, IL",
    competitor: "Oracle SCM", voidScore: 55, complianceScore: 42, painScore: 61, convergence: 53,
    status: "MONITOR", contact: "VP of Operations", stack: ["Azure", "Oracle", "SAP"],
    voidEvent: "Oracle SCM removed SMB logistics module from public pricing",
    complianceEvent: "FDA DSCSA serialization enforcement — supply chain traceability",
    painEvent: "Hacker News: \"Oracle support has become completely unresponsive\"",
    audioSignal: null },
];

const VOID_SIGNALS = [
  { id: 1, company: "Stripe Atlas", event: "SMB pricing tier silently removed from /pricing page", severity: "CRITICAL", ago: "2m", affected: ["Acme FinTech", "+2 accounts"], bdTool: "Scraping Browser" },
  { id: 2, company: "Carta", event: "Fund admin self-service tier deleted from pricing", severity: "HIGH", ago: "44m", affected: ["Vertex Capital"], bdTool: "Web Unlocker" },
  { id: 3, company: "Veeva Systems", event: "Clinical trial integration removed from partner docs", severity: "HIGH", ago: "1h", affected: ["Nexus Healthcare"], bdTool: "Scraping Browser" },
  { id: 4, company: "HubSpot", event: "Starter plan email send limits quietly modified", severity: "MODERATE", ago: "6h", affected: ["Orbital SaaS", "+1"], bdTool: "Web Scraper API" },
  { id: 5, company: "Datadog", event: "Log retention comparison row removed from features page", severity: "LOW", ago: "12h", affected: ["Cascade DevOps"], bdTool: "Web Unlocker" },
];

const COMPLIANCE_SIGNALS = [
  { id: 1, regulation: "PCI-DSS 4.0", body: "PCI Council", deadline: "87 days", affected: 12, severity: "CRITICAL", ago: "6h", bdTool: "SERP API" },
  { id: 2, regulation: "SEC Rule 10c-1", body: "SEC EDGAR", deadline: "120 days", affected: 7, severity: "HIGH", ago: "1d", bdTool: "SERP API" },
  { id: 3, regulation: "HIPAA Enforcement Bulletin", body: "HHS OCR", deadline: "45 days", affected: 4, severity: "HIGH", ago: "2d", bdTool: "SERP API" },
  { id: 4, regulation: "EU AI Act (SaaS tools)", body: "EUR-Lex", deadline: "180 days", affected: 9, severity: "MODERATE", ago: "3d", bdTool: "SERP API" },
  { id: 5, regulation: "FDA DSCSA Serialization", body: "FDA.gov", deadline: "210 days", affected: 3, severity: "MODERATE", ago: "4d", bdTool: "SERP API" },
];

const PAIN_SIGNALS = [
  { id: 1, source: "r/fintech", snippet: "\"evaluating alternatives to Stripe Atlas — anyone tried [product]? Contract is up in 60 days\"", company: "Acme FinTech", type: "ACTIVE EVAL", ago: "4m", bdTool: "Web Unlocker", engine: "Featherless AI", isAudio: false },
  { id: 2, source: "FinTech Unplugged Ep.84", snippet: "\"...we are actively planning to migrate before the PCI deadline — our current vendor has not responded to support tickets in three weeks...\"", company: "Acme FinTech", type: "SWITCHING", ago: "2h", bdTool: "Speechmatics", engine: "Speechmatics", isAudio: true },
  { id: 3, source: "G2 Reviews", snippet: "\"Looking for Veeva alternatives for our 2025 renewal — open to platform demos before Q3\"", company: "Nexus Healthcare", type: "ACTIVE EVAL", ago: "3h", bdTool: "Scraping Browser", engine: "Featherless AI", isAudio: false },
  { id: 4, source: "LinkedIn", snippet: "\"HubSpot contract is up in 60 days and I am actively fielding demos — DM with deck\"", company: "Orbital SaaS", type: "ACTIVE EVAL", ago: "5h", bdTool: "Web Scraper API", engine: "Featherless AI", isAudio: false },
  { id: 5, source: "r/devops", snippet: "\"Datadog renewal came back 3x what we paid last year. Actively evaluating Grafana Cloud and Honeycomb\"", company: "Cascade DevOps", type: "SWITCHING", ago: "8h", bdTool: "Web Unlocker", engine: "Featherless AI", isAudio: false },
];

const SCAN_STEPS = [
  "Initializing BrightData MCP Server...",
  "Void Scanner — Scraping Browser crawling competitor pages...",
  "Compliance Radar — SERP API scanning regulatory feeds...",
  "Pain Listener — Web Unlocker accessing community forums...",
  "Speechmatics — Transcribing audio signals from podcast feeds...",
  "Featherless AI — Classifying pain signals (Mistral-7B)...",
  "Cognee — Updating Account Intelligence Profiles in memory...",
  "Convergence Engine — Scoring 6 accounts...",
  "TriggerWare — Routing alert for Acme FinTech (87/100)...",
];

const DEMO_BRIEF = `WHY NOW — 3 CONVERGING SIGNALS

① COMPETITOR RETREAT  [84/100]
Stripe Atlas silently removed their SMB pricing tier on June 2nd. Acme FinTech is a confirmed Stripe Atlas SMB customer (G2 review, March 2025). With no upgrade path and no communication from Stripe Atlas, their account is orphaned. Estimated decision window: 30 days before formal RFP begins.

② REGULATORY PRESSURE  [71/100]
PCI-DSS 4.0 mandatory enforcement begins in 87 days. Acme processes card payments (confirmed via recent job postings). Undertow found zero compliance acknowledgment — no blog posts, no compliance hiring, no partner notices. They are behind schedule.

③ ACTIVE EVALUATION  [91/100]
Head of Payments Infrastructure posted on r/fintech 4 hours ago: "evaluating alternatives to Stripe Atlas." Speechmatics transcript from FinTech Unplugged Ep.84 (2 weeks prior) confirms the same individual discussed migration planning in audio. This is an active buy, not passive frustration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED OPENING LINE

"Hi [Name] — I noticed Stripe Atlas recently restructured their plans, and with PCI-DSS 4.0 enforcement coming in August, I thought the timing might make a quick conversation worthwhile. We've helped three payments companies your size get compliant without replacing their existing stack."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CONTEXT
• Industry: FinTech / Payments  |  340 employees  |  Austin, TX
• Stack: AWS · Stripe · Postgres
• Key contact: Head of Payments Infrastructure
• Competitor: Stripe Atlas (confirmed SMB tier customer, orphaned)
• Compliance deadline: Aug 31, 2025 (87 days)
• Audio signal: FinTech Unplugged Ep.84 — migration intent confirmed`;

// ─── DESIGN TOKENS (exact match to requested feel) ───────────────────────────

const C = {
  bg: "#07090f", surface: "#0c1018", surface2: "#111820",
  border: "#18232f", border2: "#1e2d3e",
  text: "#c2d0de", muted: "#4a6070", dim: "#243040",
  void: "#ff5a52", compliance: "#f0a000", pain: "#24c038",
  conv: "#9060ff", blue: "#2070ff", white: "#ddeeff",
};

const sponsorColors: Record<string, string> = {
  BrightData: "#00aaff", "AI/ML API": "#ff5a52",
  Speechmatics: "#f0a000", "Featherless AI": "#24c038",
  Cognee: "#9060ff", TriggerWare: "#ff8800",
};

const SponsorTag = ({ name }: { name: string }) => {
  const c = sponsorColors[name] || "#888";
  return <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "2px", background: `${c}18`, color: c, border: `1px solid ${c}38`, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{name}</span>;
};

const SevBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = { CRITICAL: C.void, HIGH: C.compliance, MODERATE: "#6090cc", LOW: C.muted };
  const c = map[s] || C.muted;
  return <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "2px", background: `${c}20`, color: c, border: `1px solid ${c}40`, letterSpacing: "0.06em" }}>{s}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const m: Record<string, string> = { ALERT: C.void, WATCH: C.compliance, MONITOR: C.muted };
  const c = m[status] || C.muted;
  return <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "2px", background: `${c}1a`, color: c, border: `1px solid ${c}45`, letterSpacing: "0.08em" }}>{status}</span>;
};

const Bar = ({ v, color }: { v: number; color: string }) => (
  <div style={{ background: C.border, borderRadius: "2px", height: "3px", flex: 1 }}>
    <div style={{ background: color, width: `${v}%`, height: "100%", borderRadius: "2px", transition: "width 1.2s ease" }} />
  </div>
);

function sectionFromSignal(signal: EngineSignal) {
  return { signals: [signal], subScore: signal.subScore };
}

function createAcmeProfile(account = ACCOUNTS[0]): AccountIntelligenceProfile {
  const convergenceScore = computeConvergenceScore(
    account.voidScore,
    account.complianceScore,
    account.painScore,
  );
  const maxSingleEngine = Math.max(account.voidScore, account.complianceScore, account.painScore);

  return {
    account: account.name,
    industry: account.industry,
    employees: account.employees,
    crmStage: "Not in pipeline",
    lastUpdated: new Date().toISOString(),
    void: sectionFromSignal({ ...voidPricingRemoval, subScore: account.voidScore }),
    compliance: sectionFromSignal({ ...compliancePciDss, subScore: account.complianceScore }),
    pain: { signals: [painRFintechPost, painPodcastTranscript], subScore: account.painScore },
    convergenceScore,
    urgency: computeUrgency(convergenceScore, maxSingleEngine),
  };
}

function loadInitialProfile(): AccountIntelligenceProfile {
  return createAcmeProfile();
}

// ─── MAIN DASHBOARD (matching the exact requested aesthetic) ─────────────────

type View = "dashboard" | "signals" | "intel" | "brief" | "settings";

export default function UndertowDashboard() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0]);
  const [model] = useState("mistralai/Mistral-7B-Instruct-v0.2");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [scanDone, setScanDone] = useState(false);
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [signalFilter, setSignalFilter] = useState<"all" | "void" | "compliance" | "pain">("all");
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");
  const [triggerFired, setTriggerFired] = useState(false);
  const [profile, setProfile] = useState<AccountIntelligenceProfile>(() => loadInitialProfile());
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [memoryStatus, setMemoryStatus] = useState("");
  const [sweepNotes, setSweepNotes] = useState<string[]>([]);
  const [sweepError, setSweepError] = useState("");
  const [slackDelivered, setSlackDelivered] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerWorkflow = previewTriggerWareWorkflow(profile);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setIntegrationStatuses(data.integrations || []))
      .catch(() => setIntegrationStatuses([]));

    // Load browser-specific data on mount to avoid hydration mismatches
    try {
      const rawDoc = localStorage.getItem("undertow_company_kdoc");
      const doc = rawDoc ? JSON.parse(rawDoc) : null;
      if (doc?.companyName) {
        const name = doc.companyName;
        setTimeout(() => setCompanyName(name), 0);
      }
    } catch {}

    try {
      const rawProfiles = localStorage.getItem("undertow:cognee:profiles:v1");
      const profiles = rawProfiles ? JSON.parse(rawProfiles) : {};
      const savedProfile = profiles[ACCOUNTS[0].name];
      if (savedProfile) {
        setTimeout(() => setProfile(savedProfile), 0);
      }
    } catch {}
  }, []);


  const saveCogneeProfile = (nextProfile: AccountIntelligenceProfile) => {
    setProfile(nextProfile);
    try {
      const raw = localStorage.getItem("undertow:cognee:profiles:v1");
      const profiles = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "undertow:cognee:profiles:v1",
        JSON.stringify({ ...profiles, [nextProfile.account]: nextProfile }),
      );
      setMemoryStatus("Cognee memory updated");
      setTimeout(() => setMemoryStatus(""), 2800);
    } catch {}
  };

  const runDemoScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanDone(false);
    setScanStep(0);
    setTriggerFired(false);
    setSweepNotes([]);
    setSweepError("");
    setSlackDelivered(false);

    const target = ACCOUNTS[0];
    const painText = target.painEvent.replace(/^[^:]+:\s*/, "").replace(/^"|"$/g, "");

    const sweepPromise = import("@/app/actions").then(({ runLiveSweep }) =>
      runLiveSweep({
        account: target.name,
        industry: target.industry,
        employees: target.employees,
        competitor: target.competitor,
        competitorPricingUrl: "https://stripe.com/pricing",
        regulatoryQuery: `PCI-DSS 4.0 enforcement ${target.industry}`,
        painText,
        audioTranscript: target.audioSignal || undefined,
      }),
    );

    let step = 0;
    scanTimerRef.current = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= SCAN_STEPS.length - 1) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);

        void sweepPromise
          .then((result) => {
            const p = result.profile;
            const finalAccount = {
              ...target,
              voidScore: p.void.subScore,
              complianceScore: p.compliance.subScore,
              painScore: p.pain.subScore,
              convergence: p.convergenceScore,
              status: (p.convergenceScore >= 85 ? "ALERT" : p.convergenceScore >= 65 ? "WATCH" : "MONITOR") as
                | "ALERT"
                | "WATCH"
                | "MONITOR",
            };

            resetDemoProfile(finalAccount.name);
            saveCogneeProfile(p);
            setSweepNotes(result.notes);
            if (result.error) setSweepError(result.error);
            setSlackDelivered(result.slackSent);
            setTriggerFired(p.convergenceScore >= 85);

            setAccounts((prev) =>
              prev.map((a) => (a.id === 1 ? finalAccount : a)),
            );
            setSelectedAccount((current) => (current.id === 1 ? finalAccount : current));

            if (result.brief) {
              const b = result.brief;
              const formatted = `WHY NOW — 3 CONVERGING SIGNALS\n\n① COMPETITOR RETREAT  [${finalAccount.voidScore}/100]\n${finalAccount.voidEvent}\n\n② REGULATORY PRESSURE  [${finalAccount.complianceScore}/100]\n${finalAccount.complianceEvent}\n\n③ ACTIVE EVALUATION  [${finalAccount.painScore}/100]\n${finalAccount.painEvent}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSUGGESTED OPENING LINE\n\n"${b.suggestedOpeningLine}"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nACCOUNT CONTEXT\n• Industry: ${finalAccount.industry}  |  ${finalAccount.employees} employees  |  ${finalAccount.location}\n• Generated by: ${b.generatedBy}`;
              setBrief(formatted);
            }
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            setSweepError(message);
            const fallback = {
              ...target,
              complianceScore: 86,
              convergence: computeConvergenceScore(84, 86, 91),
              status: "ALERT" as const,
            };
            resetDemoProfile(fallback.name);
            let finalProfile = arriveSignal(
              fallback.name,
              { ...voidPricingRemoval, subScore: fallback.voidScore },
              "void",
            );
            arriveSignal(
              fallback.name,
              { ...compliancePciDss, subScore: fallback.complianceScore },
              "compliance",
            );
            finalProfile = arriveSignal(
              fallback.name,
              { ...painRFintechPost, subScore: fallback.painScore },
              "pain",
            );
            finalProfile = {
              ...finalProfile,
              pain: {
                signals: [painRFintechPost, painPodcastTranscript],
                subScore: fallback.painScore,
              },
              convergenceScore: fallback.convergence,
              urgency: computeUrgency(fallback.convergence, fallback.painScore),
              thresholdCrossedAt: new Date().toISOString(),
            };
            saveCogneeProfile(finalProfile);
            setAccounts((prev) => prev.map((a) => (a.id === 1 ? fallback : a)));
            setTriggerFired(true);
          })
          .finally(() => {
            setTimeout(() => {
              setIsScanning(false);
              setScanDone(true);
            }, 700);
          });
      }
    }, 920);
  };

  // Real AI/ML brief generation is server-side. Env mode decides real vs mock.
  const generateBrief = async () => {
    setBriefLoading(true);
    setBriefError("");
    setBrief("");

    const account = selectedAccount;

    const stream = (text: string) => {
      setBriefLoading(false);
      let i = 0;
      const iv = setInterval(() => {
        i += 7;
        setBrief(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setBrief(text); }
      }, 11);
    };

    try {
      const { generateRealIntelBrief } = await import("@/app/actions");

      const profileForBrief = account.id === 1 ? profile : createAcmeProfile(account);
      const realBrief = await generateRealIntelBrief(profileForBrief);
      const formatted = `WHY NOW — 3 CONVERGING SIGNALS\n\n① COMPETITOR RETREAT  [${account.voidScore}/100]\n${account.voidEvent}\n\n② REGULATORY PRESSURE  [${account.complianceScore}/100]\n${account.complianceEvent}\n\n③ ACTIVE EVALUATION  [${account.painScore}/100]\n${account.painEvent}${account.audioSignal ? `\n\nAudio signal (Speechmatics): ${account.audioSignal}` : ""}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSUGGESTED OPENING LINE\n\n"${realBrief.suggestedOpeningLine || "Hi [Name] — the timing looks interesting given recent changes at your current vendor."}"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nACCOUNT CONTEXT\n• Industry: ${account.industry}  |  ${account.employees} employees  |  ${account.location}\n• Stack: ${account.stack.join(" · ")}\n• Key contact: ${account.contact}\n• Competitor: ${account.competitor}\n• Convergence: ${account.convergence}/100`;

      stream(formatted);
    } catch (e: unknown) {
      setBriefLoading(false);
      const message = e instanceof Error ? e.message : String(e);
      setBriefError(`AI/ML API error: ${message}. Falling back to demo brief.`);
      stream(DEMO_BRIEF);
    }
  };

  const handleSignOut = () => {
    // Clear mock session cookie
    document.cookie = "undertow_mock_session=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "undertow_onboarding_done=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("undertow_company_kdoc");
    localStorage.removeItem("undertow:cognee:profiles:v1");
    window.location.href = "/";
  };

  const Nav = () => (
    <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: "52px", background: C.surface, borderBottom: `1px solid ${C.border}`, gap: "0", flexShrink: 0, overflowX: "auto", overflowY: "hidden" }}>
      <a href="/dashboard" style={{ fontWeight: 700, fontSize: "15px", color: C.white, letterSpacing: "0.15em", marginRight: "32px", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, textDecoration: "none" }}>
        <span style={{ color: C.conv }}>▼</span>UNDERTOW
      </a>
      {(["dashboard", "signals", "intel", "brief", "settings"] as const).map(v => (
        <button key={v} onClick={() => setView(v)} style={{
          background: "transparent", border: "none", padding: "0 14px", height: "52px", flexShrink: 0,
          fontSize: "10px", fontFamily: "inherit", letterSpacing: "0.1em", cursor: "pointer",
          color: view === v ? C.white : C.muted,
          borderBottom: view === v ? `2px solid ${C.conv}` : "2px solid transparent",
          textTransform: "uppercase", transition: "all 0.15s",
        }}>{v}</button>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px", fontSize: "9px" }}>
        {memoryStatus && <span style={{ color: C.conv }}>◈ {memoryStatus}</span>}
        {triggerFired && <span style={{ color: C.compliance, animation: "pulse 1.5s infinite" }}>⚡ TriggerWare fired</span>}
        {companyName && (
          <span style={{ fontSize: "10px", color: C.muted, padding: "3px 10px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
            {companyName}
          </span>
        )}
        <button
          onClick={handleSignOut}
          style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: "4px",
            padding: "4px 10px",
            fontSize: "10px",
            color: C.muted,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  // ─── DASHBOARD VIEW (exact table + scan feel) ──────────────────────────────

  const DashboardView = () => (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "18px" }}>
        {[
          { label: "accounts tracked", value: "6", color: C.blue, sub: "target list" },
          { label: "convergence alerts", value: accounts.filter(a => a.status === "ALERT").length, color: C.void, sub: "act now" },
          { label: "signals today", value: VOID_SIGNALS.length + COMPLIANCE_SIGNALS.length + PAIN_SIGNALS.length, color: C.pain, sub: "3 engines" },
          { label: "briefs generated", value: brief ? "1" : "0", color: C.conv, sub: "this session" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: C.muted, marginBottom: "8px", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: "30px", fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "10px", color: C.dim, marginTop: "5px" }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "14px 16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: isScanning ? "12px" : "0" }}>
          <button onClick={runDemoScan} disabled={isScanning} style={{
            background: isScanning ? C.dim : C.blue, color: C.white, border: "none", borderRadius: "4px",
            padding: "7px 18px", fontSize: "10px", fontFamily: "inherit", letterSpacing: "0.1em",
            cursor: isScanning ? "not-allowed" : "pointer", flexShrink: 0
          }}>
            {isScanning ? "◌  SCANNING..." : "▶  RUN FULL SCAN"}
          </button>
          {!isScanning && !scanDone && <span style={{ fontSize: "10px", color: C.muted }}>Simulates BrightData → AI → Cognee → TriggerWare</span>}
          {scanDone && !isScanning && (
            <span style={{ fontSize: "10px", color: C.pain }}>
              ✓ Scan complete — {accounts[0].name} at {accounts[0].convergence}/100
              {triggerFired ? " — threshold crossed" : ""}
              {slackDelivered ? " — Slack delivered" : ""}
            </span>
          )}
          {sweepError && <span style={{ fontSize: "10px", color: C.void, display: "block", marginTop: 6 }}>⚠ {sweepError}</span>}
          {sweepNotes.length > 0 && scanDone && (
            <div style={{ fontSize: "9px", color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              {sweepNotes.slice(0, 4).map((n, i) => (
                <div key={i}>· {n}</div>
              ))}
            </div>
          )}
        </div>

        {isScanning && scanStep >= 0 && (
          <div>
            <div style={{ background: C.border, borderRadius: "2px", height: "3px", marginBottom: "10px" }}>
              <div style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`, height: "100%", background: C.blue, borderRadius: "2px", transition: "width 0.9s ease" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {SCAN_STEPS.map((s, i) => (
                <span key={i} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "2px",
                  background: i < scanStep ? `${C.pain}15` : i === scanStep ? `${C.blue}20` : C.dim + "20",
                  color: i < scanStep ? C.pain : i === scanStep ? C.blue : C.dim,
                  border: `1px solid ${i < scanStep ? C.pain + "30" : i === scanStep ? C.blue + "40" : C.dim + "20"}` }}>
                  {i < scanStep ? "✓ " : i === scanStep ? "◌ " : ""}{s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "9px", color: C.dim, marginRight: "4px" }}>powered by</span>
        {Object.keys(sponsorColors).map(n => <SponsorTag key={n} name={n} />)}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 56px 56px 56px 56px 90px 80px", padding: "9px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "9px", color: C.muted, letterSpacing: "0.1em", gap: "8px" }}>
          <span>COMPANY</span><span>INDUSTRY</span><span>VOID</span><span>COMPL.</span><span>PAIN</span><span>CONV.</span><span>STATUS</span><span></span>
        </div>
        {accounts.map((a, idx) => (
          <div key={a.id} onClick={() => { setSelectedAccount(a); setView("intel"); }}
            style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 56px 56px 56px 56px 90px 80px", padding: "11px 16px", gap: "8px",
              borderBottom: idx < accounts.length - 1 ? `1px solid ${C.border}` : "none",
              cursor: "pointer", background: selectedAccount?.id === a.id ? C.surface2 : "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
            onMouseLeave={e => (e.currentTarget.style.background = selectedAccount?.id === a.id ? C.surface2 : "transparent")}>
            <div style={{ alignSelf: "center" }}>
              <div style={{ fontSize: "12px", color: C.text, fontWeight: 500 }}>{a.name}</div>
              <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{a.employees} · {a.location}</div>
            </div>
            <div style={{ fontSize: "10px", color: C.muted, alignSelf: "center" }}>{a.industry}</div>

            {[{v: a.voidScore, c: C.void}, {v: a.complianceScore, c: C.compliance}, {v: a.painScore, c: C.pain}].map(({v, c}, i) => (
              <div key={i} style={{ alignSelf: "center" }}>
                <div style={{ fontSize: "11px", color: c, fontWeight: 600, marginBottom: "4px" }}>{v}</div>
                <Bar v={v} color={c} />
              </div>
            ))}

            <div style={{ alignSelf: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: a.convergence >= 75 ? C.void : a.convergence >= 55 ? C.compliance : C.muted }}>{a.convergence}</div>
            </div>
            <div style={{ alignSelf: "center" }}><StatusBadge status={a.status} /></div>

            <div style={{ alignSelf: "center" }}>
              <button onClick={e => { e.stopPropagation(); setSelectedAccount(a); setView("brief"); setBrief(""); }}
                style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: "3px", padding: "4px 8px", fontSize: "9px", fontFamily: "inherit", color: C.muted, cursor: "pointer", letterSpacing: "0.05em" }}>
                BRIEF ↗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SignalsView = () => (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: "ALL SIGNALS", count: VOID_SIGNALS.length + COMPLIANCE_SIGNALS.length + PAIN_SIGNALS.length },
          { key: "void", label: "VOID SCANNER", count: VOID_SIGNALS.length, color: C.void },
          { key: "compliance", label: "COMPLIANCE RADAR", count: COMPLIANCE_SIGNALS.length, color: C.compliance },
          { key: "pain", label: "PAIN LISTENER", count: PAIN_SIGNALS.length, color: C.pain },
        ].map((filter) => (
          <button key={filter.key} onClick={() => setSignalFilter(filter.key as typeof signalFilter)} style={{
            background: signalFilter === filter.key ? `${filter.color || C.conv}18` : "transparent",
            border: `1px solid ${signalFilter === filter.key ? (filter.color || C.conv) + "50" : C.border}`,
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 9,
            color: signalFilter === filter.key ? (filter.color || C.white) : C.muted,
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}>
            {filter.label} <span style={{ opacity: 0.7 }}>({filter.count})</span>
          </button>
        ))}
      </div>

      {(signalFilter === "all" || signalFilter === "void") && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: C.void, letterSpacing: "0.1em", fontWeight: 600 }}>VOID SCANNER</span>
            <SponsorTag name="BrightData" />
            <span style={{ fontSize: 9, color: C.muted }}>Semantic deletions via Scraping Browser + Web Unlocker</span>
          </div>
          {VOID_SIGNALS.map((signal) => (
            <div key={signal.id} style={{
              background: C.surface,
              borderTop: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.void}`,
              borderRadius: 6,
              padding: "12px 14px",
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.void, fontWeight: 600 }}>{signal.company}</span>
                    <SevBadge s={signal.severity} />
                    <span style={{ fontSize: 9, color: C.muted }}>{signal.ago}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text, marginBottom: 6 }}>{signal.event}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: C.muted }}>Affects:</span>
                    {signal.affected.map((account) => <span key={account} style={{ fontSize: 9, padding: "1px 6px", background: `${C.void}15`, color: C.void, borderRadius: 2 }}>{account}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}><SponsorTag name="BrightData" /><div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{signal.bdTool}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(signalFilter === "all" || signalFilter === "compliance") && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: C.compliance, letterSpacing: "0.1em", fontWeight: 600 }}>COMPLIANCE RADAR</span>
            <SponsorTag name="BrightData" />
            <span style={{ fontSize: 9, color: C.muted }}>Regulatory feed discovery via SERP API</span>
          </div>
          {COMPLIANCE_SIGNALS.map((signal) => (
            <div key={signal.id} style={{
              background: C.surface,
              borderTop: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.compliance}`,
              borderRadius: 6,
              padding: "12px 14px",
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.compliance, fontWeight: 600 }}>{signal.regulation}</span>
                    <SevBadge s={signal.severity} />
                    <span style={{ fontSize: 9, color: C.muted }}>via {signal.body}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
                    <span style={{ color: C.text }}>Deadline: <span style={{ color: C.compliance }}>{signal.deadline}</span></span>
                    <span style={{ color: C.muted }}>Affects {signal.affected} accounts in TAM</span>
                    <span style={{ color: C.muted }}>detected {signal.ago}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}><SponsorTag name="BrightData" /><div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{signal.bdTool}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(signalFilter === "all" || signalFilter === "pain") && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: C.pain, letterSpacing: "0.1em", fontWeight: 600 }}>PAIN LISTENER</span>
            <SponsorTag name="BrightData" />
            <SponsorTag name="Speechmatics" />
            <SponsorTag name="Featherless AI" />
            <span style={{ fontSize: 9, color: C.muted }}>Community and audio signals classified by open models</span>
          </div>
          {PAIN_SIGNALS.map((signal) => (
            <div key={signal.id} style={{
              background: C.surface,
              borderTop: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `3px solid ${signal.isAudio ? C.compliance : C.pain}`,
              borderRadius: 6,
              padding: "12px 14px",
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: signal.isAudio ? C.compliance : C.pain, fontWeight: 600 }}>{signal.source}</span>
                    {signal.isAudio && <SponsorTag name="Speechmatics" />}
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 2, background: `${C.pain}15`, color: C.pain }}>{signal.type}</span>
                    <span style={{ fontSize: 9, color: C.muted }}>{signal.ago}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>{signal.snippet}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>Company: <span style={{ color: C.pain }}>{signal.company}</span></div>
                </div>
                <div style={{ textAlign: "right" }}><SponsorTag name={signal.engine} /><div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>via {signal.bdTool}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const IntelView = () => {
    const a = selectedAccount;
    const memoryProfile = a.id === 1 ? profile : null;
    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {accounts.map(acc => (
            <button key={acc.id} onClick={() => setSelectedAccount(acc)} style={{
              background: selectedAccount.id === acc.id ? `${C.conv}20` : "transparent",
              border: `1px solid ${selectedAccount.id === acc.id ? C.conv : C.border}`,
              borderRadius: 4, padding: "5px 12px", fontSize: 10, color: selectedAccount.id === acc.id ? C.conv : C.muted, cursor: "pointer"
            }}>{acc.name}</button>
          ))}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 18, color: C.white, fontWeight: 600 }}>{a.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{a.industry} · {a.employees} employees · {a.location}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Competitor: <span style={{ color: C.void }}>{a.competitor}</span> · Contact: <span style={{ color: C.text }}>{a.contact}</span></div>
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>{a.stack.map(t => <span key={t} style={{ fontSize: 9, padding: "2px 7px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 3, color: C.muted }}>{t}</span>)}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
          {[
            { label: "VOID SCANNER", score: a.voidScore, color: C.void, event: a.voidEvent, sponsor: "BrightData" },
            { label: "COMPLIANCE RADAR", score: a.complianceScore, color: C.compliance, event: a.complianceEvent, sponsor: "BrightData" },
            { label: "PAIN LISTENER", score: a.painScore, color: C.pain, event: a.painEvent, sponsor: "Featherless AI" },
          ].map(({ label, score, color, event, sponsor }) => (
            <div key={label} style={{
              background: C.surface,
              borderTop: `2px solid ${color}`,
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color }}>{score}</span>
              </div>
              <Bar v={score} color={color} />
              <div style={{ fontSize: 10, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>{event}</div>
              <div style={{ marginTop: 8 }}><SponsorTag name={sponsor} /></div>
            </div>
          ))}
        </div>

        {a.id === 1 && (
          <div style={{
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.void}`,
            borderRadius: 6,
            padding: 14,
            marginBottom: 12,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: C.void, fontWeight: 600 }}>VOID DIFF — PRICING TIER REMOVED</span>
              <SponsorTag name="BrightData" />
              <SponsorTag name="Cognee" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>BEFORE</div>
                {((voidPricingRemoval.rawEvidence?.beforeTiers as string[]) || []).map((tier) => <div key={tier} style={{ fontSize: 10, color: C.text, marginBottom: 3 }}>{tier}</div>)}
              </div>
              <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>AFTER</div>
                {((voidPricingRemoval.rawEvidence?.afterTiers as string[]) || []).map((tier) => <div key={tier} style={{ fontSize: 10, color: C.text, marginBottom: 3 }}>{tier}</div>)}
                <div style={{ fontSize: 10, color: C.void, marginTop: 6 }}>Removed: {String(voidPricingRemoval.rawEvidence?.removed || "SMB tier")}</div>
              </div>
            </div>
          </div>
        )}

        {a.audioSignal && (
          <div style={{
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.compliance}`,
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, color: C.compliance, fontWeight: 600, marginBottom: 6 }}>♪ AUDIO SIGNAL — SPEECHMATICS <SponsorTag name="Speechmatics" /></div>
            <div style={{ fontSize: 11, color: C.text }}>{a.audioSignal}</div>
          </div>
        )}

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.conv, fontWeight: 600, marginBottom: 8 }}>COGNEE — ACCOUNT MEMORY <SponsorTag name="Cognee" /></div>
          {memoryProfile ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "last scanned", value: new Date(memoryProfile.lastUpdated).toLocaleTimeString() },
                { label: "convergence (stored)", value: memoryProfile.convergenceScore + "/100" },
                { label: "signals in memory", value: memoryProfile.void.signals.length + memoryProfile.compliance.signals.length + memoryProfile.pain.signals.length },
                { label: "memory updated", value: "✓ active" },
              ].map(x => (
                <div key={x.label} style={{ background: C.surface2, borderRadius: 4, padding: 10 }}>
                  <div style={{ fontSize: 9, color: C.muted }}>{x.label}</div>
                  <div style={{ fontSize: 12, color: C.conv }}>{x.value}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 10, color: C.muted }}>No profile yet. Run the full scan to populate Cognee memory.</div>}
        </div>

        {triggerWorkflow.fired && a.id === 1 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#ff8800", fontWeight: 600, marginBottom: 10 }}>TRIGGERWARE — WORKFLOW FIRED <SponsorTag name="TriggerWare" /></div>
            <div style={{ display: "flex", gap: 0 }}>
              {triggerWorkflow.steps.map((step, i) => {
                const colors = [C.void, C.blue, C.compliance, C.conv];
                const c = colors[i] || C.conv;
                return (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ background: `${c}18`, border: `1px solid ${c}50`, borderRadius: 4, padding: "8px 10px", flex: 1 }}>
                    <div style={{ fontSize: 10, color: c, fontWeight: 600 }}>{step.label}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{step.detail}</div>
                  </div>
                  {i < triggerWorkflow.steps.length - 1 && <div style={{ padding: "0 6px", color: C.muted }}>→</div>}
                </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: "right" }}>
          <button onClick={() => { setView("brief"); setBrief(""); }} style={{ background: C.conv, color: C.white, border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>
            GENERATE INTEL BRIEF ↗
          </button>
        </div>
      </div>
    );
  };

  const BriefView = () => (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {accounts.map(acc => (
          <button key={acc.id} onClick={() => { setSelectedAccount(acc); setBrief(""); setBriefError(""); }} style={{
            background: selectedAccount.id === acc.id ? `${C.conv}20` : "transparent",
            border: `1px solid ${selectedAccount.id === acc.id ? C.conv : C.border}`,
            borderRadius: 4, padding: "5px 12px", fontSize: 10, color: selectedAccount.id === acc.id ? C.conv : C.muted, cursor: "pointer"
          }}>{acc.name}</button>
        ))}
      </div>

      <div style={{ background: `${C.compliance}10`, border: `1px solid ${C.compliance}30`, borderRadius: 6, padding: 12, marginBottom: 14, fontSize: 10 }}>
        AI/ML API runs server-side only. Set <span style={{ color: C.compliance }}>AI_ML_MODE=real</span> and <span style={{ color: C.compliance }}>AI_ML_API_KEY</span> in <span style={{ color: C.text }}>.env.local</span> for live generation; otherwise this uses the zero-cost mock path.
      </div>

      {!brief && !briefLoading && (
        <button onClick={generateBrief} style={{ background: C.conv, color: C.white, border: "none", borderRadius: 4, padding: "10px 24px", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", marginBottom: 14 }}>
          ▶ GENERATE INTEL BRIEF <SponsorTag name="AI/ML API" />
        </button>
      )}

      {briefLoading && <div style={{ color: C.muted, fontSize: 11 }}>AI/ML API generating via {model}...</div>}
      {briefError && <div style={{ color: C.void, fontSize: 10, marginBottom: 10 }}>{briefError}</div>}

      {brief && (
        <div>
          <div style={{ fontSize: 10, color: C.conv, fontWeight: 600, marginBottom: 8 }}>INTEL BRIEF <SponsorTag name="AI/ML API" /> {selectedAccount.audioSignal && <SponsorTag name="Speechmatics" />}</div>
          <pre style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 20, fontSize: 11, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{brief}</pre>
          <div style={{ marginTop: 10, fontSize: 9, color: C.muted }}>→ TriggerWare would push this to CRM + AE Slack <SponsorTag name="TriggerWare" /></div>
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 500, marginBottom: 8 }}>Sponsor Mode Configuration</div>
        <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
          Real API keys are never entered in the browser. Configure <span style={{ color: C.text }}>.env.local</span> and use <span style={{ color: C.compliance }}>AI_ML_MODE=real</span> for live brief generation. All other integrations keep zero-cost mock mode unless their corresponding server-side mode and key are configured.
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: C.muted }}>
        All other sponsors (Bright Data, Speechmatics, Featherless, Cognee, TriggerWare) run in zero-cost demo mode with clear attribution badges.
      </div>

      {integrationStatuses.length > 0 && (
        <div style={{ marginTop: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text, fontWeight: 500, marginBottom: 10 }}>Integration Health</div>
          {integrationStatuses.map((status) => (
            <div key={status.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 10, color: C.text }}>{status.name}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{status.detail}</div>
              </div>
              <div style={{ fontSize: 9, color: status.status === "live" || status.status === "healthy" ? C.pain : status.status === "disabled" ? C.dim : C.compliance, whiteSpace: "nowrap" }}>
                {status.mode} · {status.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; }
        input::placeholder { color: #2a3a4a; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1a2332; }
      `}</style>
      {Nav()}
      <div style={{ maxHeight: "calc(100vh - 48px)", overflowY: "auto" }}>
        {view === "dashboard" && DashboardView()}
        {view === "signals" && SignalsView()}
        {view === "intel" && IntelView()}
        {view === "brief" && BriefView()}
        {view === "settings" && SettingsView()}
      </div>
    </div>
  );
}
