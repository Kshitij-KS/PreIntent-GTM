"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AccountIntelligenceProfile } from "@/lib/domain";
import { computeUrgency } from "@/lib/convergence";
import { useToast, createToastHelpers } from "@/components/ui/toast";
import { ROICalculator, ROIPreview } from "@/components/ui/roi-calculator";
import { EvidenceModal } from "@/components/ui/evidence-panel";
import { BriefSharing } from "@/components/ui/brief-sharing";
import { CompetitiveComparison, ComparisonTrigger } from "@/components/ui/competitive-comparison";
import { GuidedTour, TourTrigger, TourShortcut } from "@/components/demo/guided-tour";
import { DemoAutopilot, AutoplayTrigger, type AutopilotActions } from "@/components/demo/autopilot";
import {
  PREMIUM_ACCOUNTS,
  formatRelativeTime,
  getConfidenceLevel,
  type PremiumAccount,
} from "@/lib/premium-demo-data";
import {
  DEMO_INTEGRATION_STATUSES,
  streamDemoBrief,
} from "@/lib/demo-mode";

// ─── ICONS (inline SVG to avoid extra deps) ──────────────────────────────────
const Icon = {
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="#9060ff" strokeWidth="1.5" fill="none" />
      <path d="M9 5L13 7.5V12.5L9 15L5 12.5V7.5L9 5Z" fill="#9060ff" fillOpacity="0.3" />
      <circle cx="9" cy="9" r="2" fill="#9060ff" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1.5" opacity="0.8" />
      <rect x="8" y="0" width="6" height="6" rx="1.5" opacity="0.8" />
      <rect x="0" y="8" width="6" height="6" rx="1.5" opacity="0.8" />
      <rect x="8" y="8" width="6" height="6" rx="1.5" opacity="0.8" />
    </svg>
  ),
  Signal: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 13V8M4 13V10M10 13V5M1 13V12M13 13V3" />
    </svg>
  ),
  Intel: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 5v5M7 3.5v.5" strokeLinecap="round" />
    </svg>
  ),
  Brief: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="1" width="10" height="12" rx="1.5" />
      <path d="M4 5h6M4 7.5h6M4 10h4" strokeLinecap="round" />
    </svg>
  ),
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="2" />
      <path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.24 2.76l-1.06 1.06M3.82 10.18l-1.06 1.06M11.24 11.24l-1.06-1.06M3.82 3.82L2.76 2.76" strokeLinecap="round" />
    </svg>
  ),
  Play: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Zap: () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
      <path d="M6.5 1L2 6.5h3.5L4 10l5.5-6H6L6.5 1Z" />
    </svg>
  ),
  Eye: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5 10 11 6.5 11 1 6.5 1 6.5Z" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  External: () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M9 2H7m2 0v2m0-2L5.5 5.5" strokeLinecap="round" />
    </svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <path d="M1 8V2a1 1 0 011-1h6" strokeLinecap="round" />
    </svg>
  ),
  Share: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="6" r="1.5" />
      <circle cx="9.5" cy="9.5" r="1.5" />
      <path d="M4 6.75l4 2.25M4 5.25l4-2.25" />
    </svg>
  ),
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#0f161f",
  surface3: "#111820",
  border: "#18232f",
  border2: "#1e2d3e",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#1e2d3e",
  conv: "#9060ff",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
  blue: "#2070ff",
  white: "#ddeeff",
};

// ─── SCAN STEPS ───────────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { msg: "Initializing BrightData MCP Server...", tag: "BrightData", pct: 10 },
  { msg: "Void Scanner — crawling competitor pricing pages...", tag: "BrightData", pct: 22 },
  { msg: "Compliance Radar — scanning regulatory RSS feeds...", tag: "BrightData", pct: 35 },
  { msg: "Pain Listener — accessing community forums...", tag: "BrightData", pct: 47 },
  { msg: "Speechmatics — transcribing podcast audio signals...", tag: "Speechmatics", pct: 57 },
  { msg: "Featherless AI — classifying pain signals (Mistral-7B)...", tag: "Featherless AI", pct: 68 },
  { msg: "AI/ML API — computing convergence vectors...", tag: "AI/ML API", pct: 80 },
  { msg: "Cognee — updating account intelligence profiles...", tag: "Cognee", pct: 90 },
  { msg: "TriggerWare — routing alert for Brex (threshold crossed)...", tag: "TriggerWare", pct: 97 },
];

const sponsorColors: Record<string, string> = {
  BrightData: "#00aaff",
  "AI/ML API": "#ff5a52",
  Speechmatics: "#f0a000",
  "Featherless AI": "#24c038",
  Cognee: "#9060ff",
  TriggerWare: "#ff8800",
};

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────

const SponsorPill = ({ name }: { name: string }) => {
  const c = sponsorColors[name] || "#888";
  return (
    <span style={{
      fontSize: "9px", padding: "2px 6px", borderRadius: "3px",
      background: `${c}15`, color: c, border: `1px solid ${c}30`,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {name}
    </span>
  );
};

const LiveDot = ({ color, pulse = true }: { color: string; pulse?: boolean }) => (
  <span style={{
    display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
    background: color, flexShrink: 0,
    boxShadow: `0 0 0 2px ${color}30`,
    animation: pulse ? "dot-blink 2s ease-in-out infinite" : "none",
  }} />
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    ALERT: { bg: `${C.void}12`, color: C.void, dot: C.void },
    WATCH: { bg: `${C.compliance}12`, color: C.compliance, dot: C.compliance },
    MONITOR: { bg: `${C.muted}12`, color: C.muted, dot: C.muted },
  };
  const s = map[status] || map.MONITOR;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 7px", borderRadius: "3px", fontSize: "9px", fontWeight: 600,
      letterSpacing: "0.08em", background: s.bg, color: s.color,
      border: `1px solid ${s.color}35`,
    }}>
      <LiveDot color={s.dot} pulse={status === "ALERT"} />
      {status}
    </span>
  );
};

const ScoreBar = ({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 300 + delay * 100); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ height: "3px", background: C.border, borderRadius: "99px", overflow: "hidden", minWidth: "40px" }}>
      <div style={{
        height: "100%", width: `${w}%`, background: color,
        borderRadius: "99px", transition: "width 0.9s cubic-bezier(.25,.1,.25,1)",
      }} />
    </div>
  );
};

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const level = getConfidenceLevel(confidence);
  return (
    <span style={{
      fontSize: "9px", padding: "2px 5px", borderRadius: "3px",
      background: `${level.color}15`, color: level.color,
      border: `1px solid ${level.color}35`,
    }}>
      {level.label} {Math.round(confidence * 100)}%
    </span>
  );
};

// ─── ANIMATED GAUGE ──────────────────────────────────────────────────────────
const ConvergenceGauge = ({ value, size = 160 }: { value: number; size?: number }) => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = value / 60;
    const id = setInterval(() => {
      cur = Math.min(cur + step, value);
      setScore(Math.round(cur));
      if (cur >= value) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [value]);

  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dashArr = `${(score / 100) * circ} ${circ}`;
  const color = score >= 75 ? C.void : score >= 55 ? C.compliance : C.conv;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={`g${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={color === C.void ? C.compliance : color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#g${value})`} strokeWidth="6"
          strokeDasharray={dashArr} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.04s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: size < 120 ? "24px" : "36px", fontWeight: 800, color: C.white, lineHeight: 1, letterSpacing: "-0.04em" }}>
          {score}
        </div>
        <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", letterSpacing: "0.1em" }}>CONV.</div>
      </div>
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, color, delay = 0, onClick,
}: {
  label: string; value: string; sub: string; color: string; delay?: number; onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ y: -3, boxShadow: `0 10px 32px ${color}18` }}
    onClick={onClick}
    style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px",
      padding: "14px 16px", cursor: onClick ? "pointer" : "default",
      position: "relative", overflow: "hidden",
    }}
  >
    <div style={{
      position: "absolute", top: 0, right: 0, width: "80px", height: "80px",
      background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
      pointerEvents: "none",
    }} />
    <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>{label}</div>
    <div style={{ fontSize: "26px", fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: "9px", color: C.muted, marginTop: "6px" }}>{sub}</div>
  </motion.div>
);

// ─── SCAN PANEL ──────────────────────────────────────────────────────────────
const ScanPanel = ({ isScanning, step, done, onScan, result }: {
  isScanning: boolean; step: number; done: boolean; onScan: () => void; result: string;
}) => {
  const pct = step >= 0 ? SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)]?.pct ?? 0 : 0;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "14px", borderBottom: isScanning ? `1px solid ${C.border}` : "none" }}>
        <motion.button
          whileHover={isScanning ? {} : { scale: 1.04, boxShadow: `0 8px 24px ${C.blue}40` }}
          whileTap={isScanning ? {} : { scale: 0.96 }}
          onClick={onScan}
          disabled={isScanning}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: isScanning ? C.dim : `linear-gradient(135deg, #1560cc, ${C.blue})`,
            color: C.white, border: "none", borderRadius: "5px",
            padding: "7px 18px", fontSize: "10px", fontFamily: "inherit",
            letterSpacing: "0.1em", cursor: isScanning ? "not-allowed" : "pointer", flexShrink: 0,
            boxShadow: isScanning ? "none" : `0 6px 18px ${C.blue}30`,
          }}
        >
          {isScanning
            ? <span style={{ display: "inline-block", animation: "spin 0.9s linear infinite" }}>◌</span>
            : <Icon.Play />
          }
          {isScanning ? "SCANNING..." : "RUN FULL SCAN"}
        </motion.button>

        {!isScanning && !done && (
          <span style={{ fontSize: "10px", color: C.muted }}>
            BrightData → Speechmatics → Featherless AI → Cognee → TriggerWare
          </span>
        )}

        {done && !isScanning && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: C.pain }}
          >
            <span style={{ background: `${C.pain}20`, border: `1px solid ${C.pain}40`, borderRadius: "3px", padding: "1px 6px" }}>✓ COMPLETE</span>
            {result}
          </motion.span>
        )}
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}>
                  {SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)]?.msg}
                </span>
                <span style={{ fontSize: "9px", color: C.conv }}>{pct}%</span>
              </div>
              <div style={{ height: "3px", background: C.border, borderRadius: "99px", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: "99px",
                    background: `linear-gradient(90deg, ${C.conv}, ${C.pain})`,
                    position: "relative",
                  }}
                />
              </div>
            </div>
            <div style={{ padding: "10px 16px", display: "flex", gap: "12px", overflowX: "auto" }}>
              {SCAN_STEPS.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "4px", flexShrink: 0,
                  opacity: i <= step ? 1 : 0.25, transition: "opacity 0.3s",
                }}>
                  <span style={{ fontSize: "9px", color: i < step ? C.pain : i === step ? C.conv : C.muted }}>
                    {i < step ? "✓" : i === step ? "▷" : "○"}
                  </span>
                  <span style={{ fontSize: "9px", color: C.muted }}>{s.tag}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── SIGNAL TICKER ───────────────────────────────────────────────────────────
const LIVE_SIGNALS = [
  { engine: "VOID",   company: "Brex",     event: "Stripe Atlas SMB fast-track tier silently removed", time: "3d", color: "#ff5a52" },
  { engine: "PAIN",   company: "Notion",   event: "r/saas: 'HubSpot pricing opaque — evaluating alternatives'", time: "1d", color: "#24c038" },
  { engine: "COMPL.", company: "Rippling", event: "SOC 2 Type II renewal window opens — 6 accounts affected", time: "6h", color: "#f0a000" },
  { engine: "VOID",   company: "Vercel",   event: "Datadog removed enterprise observability bundle", time: "2d", color: "#ff5a52" },
  { engine: "PAIN",   company: "Mercury",  event: "CFO posted LinkedIn: 'fintech consolidation — open to demos'", time: "23m", color: "#24c038" },
];

// ─── SIGNALS VIEW ─────────────────────────────────────────────────────────────
const SignalsView = ({ accounts, onEvidence, filter, onFilterChange }: {
  accounts: PremiumAccount[];
  onEvidence: (acct: PremiumAccount, type: "void" | "compliance" | "pain") => void;
  filter: "all" | "void" | "compliance" | "pain";
  onFilterChange: (f: "all" | "void" | "compliance" | "pain") => void;
}) => {

  type SignalItem = {
    account: PremiumAccount;
    type: "void" | "compliance" | "pain";
    score: number;
    event: string;
    time: string;
    color: string;
  };

  const allSignals: SignalItem[] = accounts.flatMap((a) => [
    { account: a, type: "void" as const, score: a.voidScore, event: a.voidEvent, time: formatRelativeTime(a.voidEvidence?.capturedAt ?? a.lastUpdated), color: C.void },
    { account: a, type: "compliance" as const, score: a.complianceScore, event: a.complianceEvent, time: formatRelativeTime(a.complianceEvidence?.capturedAt ?? a.lastUpdated), color: C.compliance },
    { account: a, type: "pain" as const, score: a.painScore, event: a.painEvent, time: formatRelativeTime(a.painEvidence?.capturedAt ?? a.lastUpdated), color: C.pain },
  ]).filter((s) => filter === "all" || s.type === filter)
    .sort((a, b) => b.score - a.score);

  const typeLabel: Record<string, string> = { void: "VOID", compliance: "COMPL.", pain: "PAIN" };
  const typeColor: Record<string, string> = { void: C.void, compliance: C.compliance, pain: C.pain };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "18px" }}>
      {/* Filter row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}>FILTER</span>
        {(["all", "void", "compliance", "pain"] as const).map((f) => (
          <button
            key={f}
            data-demo={f === "void" ? "void-filter" : undefined}
            onClick={() => onFilterChange(f)}
            style={{
              background: filter === f ? (f === "all" ? C.conv : typeColor[f] || C.conv) : "transparent",
              color: filter === f ? C.white : C.muted,
              border: `1px solid ${filter === f ? (f === "all" ? C.conv : typeColor[f] || C.conv) : C.border}`,
              borderRadius: "4px", padding: "3px 10px", fontSize: "9px",
              fontFamily: "inherit", letterSpacing: "0.08em", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "9px", color: C.muted }}>{allSignals.length} signals</span>
      </div>

      {/* Signal list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {allSignals.map((s, i) => (
          <motion.div
            key={`${s.account.id}-${s.type}`}
            data-demo={s.account.name === "Brex" && s.type === "void" ? "brex-void-row" : undefined}
            initial={{ opacity: 0, x: -10, background: C.surface }}
            animate={{ opacity: 1, x: 0, background: C.surface }}
            transition={{ delay: i * 0.03 }}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: "7px", padding: "12px 14px",
              borderLeft: `3px solid ${s.color}`,
              cursor: "pointer",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: "12px", alignItems: "center",
            }}
            whileHover={{ x: 3, background: C.surface2 }}
            onClick={() => onEvidence(s.account, s.type)}
          >
            <span style={{
              fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em",
              color: s.color, background: `${s.color}12`,
              border: `1px solid ${s.color}30`, borderRadius: "3px",
              padding: "2px 6px", whiteSpace: "nowrap",
            }}>
              {typeLabel[s.type]}
            </span>
            <div>
              <div style={{ fontSize: "11px", color: C.white, fontWeight: 500, marginBottom: "2px" }}>
                {s.account.name}
              </div>
              <div style={{ fontSize: "10px", color: C.muted }}>{s.event}</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, textAlign: "right" }}>
              {s.score}
            </div>
            <div style={{ fontSize: "9px", color: C.muted, textAlign: "right" }}>{s.time}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── INTEL VIEW ───────────────────────────────────────────────────────────────
const IntelView = ({
  account,
  onGenerateBrief,
  onEvidence,
}: {
  account: PremiumAccount;
  onGenerateBrief: () => void;
  onEvidence: (type: "void" | "compliance" | "pain" | "audio") => void;
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "18px" }}>
    {/* Account header */}
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px",
      padding: "16px 18px", marginBottom: "12px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "10px",
          background: `linear-gradient(135deg, ${C.conv}30, ${C.blue}20)`,
          border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "16px", flexShrink: 0,
        }}>
          {account.name[0]}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: C.white }}>{account.name}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
            {account.industry} · {account.employees.toLocaleString()} employees · {account.location}
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "5px", flexWrap: "wrap" }}>
            {account.stack.slice(0, 4).map((s) => (
              <span key={s} style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: C.surface3, border: `1px solid ${C.border}`, color: C.muted }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div data-demo="convergence-gauge">
          <ConvergenceGauge value={account.convergence} size={80} />
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={account.status} />
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "5px" }}>
            vs {account.competitor}
          </div>
        </div>
      </div>
    </div>

    {/* Signal breakdown */}
    <div style={{ display: "grid", gridTemplateColumns: account.audioEvidence ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
      {([
        { type: "void" as const, label: "VOID SCANNER", score: account.voidScore, event: account.voidEvent, time: account.voidEvidence?.capturedAt ?? account.lastUpdated, color: C.void, conf: account.voidConfidence },
        { type: "compliance" as const, label: "COMPLIANCE RADAR", score: account.complianceScore, event: account.complianceEvent, time: account.complianceEvidence?.capturedAt ?? account.lastUpdated, color: C.compliance, conf: account.complianceConfidence },
        { type: "pain" as const, label: "PAIN LISTENER", score: account.painScore, event: account.painEvent, time: account.painEvidence?.capturedAt ?? account.lastUpdated, color: C.pain, conf: account.painConfidence },
        ...(account.audioEvidence ? [{ type: "audio" as const, label: "AUDIO INTELLIGENCE", score: 88, event: account.audioSignal ?? "Podcast signal detected", time: account.audioEvidence.capturedAt ?? account.lastUpdated, color: "#c084fc", conf: 0.89 }] : []),
      ]).map((sig) => (
        <motion.div
          key={sig.type}
          data-demo={sig.type === "audio" ? "audio-card" : undefined}
          whileHover={{ y: -2, boxShadow: `0 8px 24px ${sig.color}20` }}
          onClick={() => onEvidence(sig.type)}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: "7px", padding: "12px 14px", cursor: "pointer",
            borderTop: `2px solid ${sig.color}`,
          }}
        >
          <div style={{ fontSize: "8px", color: sig.color, letterSpacing: "0.1em", marginBottom: "6px" }}>{sig.label}</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: sig.color, lineHeight: 1 }}>{sig.score}</div>
          <ScoreBar value={sig.score} color={sig.color} />
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "8px", lineHeight: 1.5 }}>
            {sig.event.slice(0, 60)}{sig.event.length > 60 ? "..." : ""}
          </div>
          <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <ConfidenceBadge confidence={sig.conf} />
            <span style={{ fontSize: "9px", color: C.muted }}>{formatRelativeTime(sig.time)}</span>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Contact + action */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "12px 14px" }}>
        <div style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.1em", marginBottom: "8px" }}>KEY CONTACT</div>
        <div style={{ fontSize: "12px", color: C.white, fontWeight: 500 }}>{account.contact.name}</div>
        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>{account.contact.title}</div>
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "8px", lineHeight: 1.6 }}>
            {account.contact.linkedin ? `linkedin.com/in/${account.contact.linkedin.split("/").pop()}` : "Key decision-maker for vendor evaluation"}
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "12px 14px" }}>
          <div style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.1em", marginBottom: "8px" }}>NEXT ACTION</div>
          <div style={{ fontSize: "10px", color: C.white, lineHeight: 1.6 }}>
            Reach out to {account.contact.name} — {account.status === "ALERT" ? "urgency window is open now" : "monitor for 14 more days before outreach"}
          </div>
        <button
          data-demo="generate-brief-btn"
          onClick={onGenerateBrief}
          style={{
            marginTop: "10px", background: `linear-gradient(135deg, #7c3aed, ${C.conv})`,
            border: "none", borderRadius: "4px", padding: "6px 14px",
            fontSize: "9px", color: C.white, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "0.08em", boxShadow: `0 4px 14px ${C.conv}35`,
          }}
        >
          ✦ GENERATE INTEL BRIEF
        </button>
      </div>
    </div>
  </motion.div>
);

// ─── BRIEF VIEW ───────────────────────────────────────────────────────────────
const BriefView = ({
  brief, loading, account, onGenerate, onShare,
}: {
  brief: string; loading: boolean; account: PremiumAccount;
  onGenerate: () => void; onShare: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(brief).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: C.white, fontWeight: 600 }}>Intel Brief — {account.name}</div>
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>AI-generated convergence analysis</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {brief && (
            <>
              <button onClick={handleCopy} style={ghostBtnStyle}>
                <Icon.Copy /> {copied ? "Copied!" : "Copy"}
              </button>
              <button data-demo="brief-share-btn" onClick={onShare} style={ghostBtnStyle}>
                <Icon.Share /> Share
              </button>
            </>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: `linear-gradient(135deg, #7c3aed, ${C.conv})`,
              border: "none", borderRadius: "5px", padding: "7px 16px",
              fontSize: "10px", color: C.white, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", letterSpacing: "0.08em", opacity: loading ? 0.6 : 1,
              boxShadow: `0 4px 14px ${C.conv}30`,
            }}
          >
            {loading
              ? <span style={{ animation: "spin 0.8s linear infinite" }}>◌</span>
              : "✦"}
            {loading ? "Generating..." : "Generate Brief"}
          </button>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden", minHeight: "360px" }}>
        {loading && (
          <div style={{ padding: "28px 22px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", color: C.conv, letterSpacing: "0.1em", marginBottom: "10px" }}>✦ GENERATING INTEL BRIEF</div>
              {[100, 70, 85, 50].map((w, i) => (
                <div key={i} style={{
                  height: "10px", width: `${w}%`, marginBottom: "8px", borderRadius: "4px",
                  background: `linear-gradient(90deg, ${C.surface} 0px, ${C.border2} 200px, ${C.surface} 400px)`,
                  backgroundSize: "600px", animation: "shimmer 1.6s linear infinite",
                }} />
              ))}
            </div>
          </div>
        )}

        {!loading && !brief && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", color: C.muted, textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>✦</div>
            <div style={{ fontSize: "11px" }}>Click &quot;Generate Brief&quot; to produce an AI-powered</div>
            <div style={{ fontSize: "11px" }}>convergence analysis for {account.name}</div>
          </div>
        )}

        {!loading && brief && (
          <pre style={{
            margin: 0, padding: "20px 22px", fontFamily: "inherit",
            fontSize: "11px", lineHeight: 1.9, color: C.text,
            whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto",
          }}>
            {brief}
          </pre>
        )}
      </div>
    </motion.div>
  );
};

const ghostBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "5px",
  background: "transparent", border: `1px solid ${C.border}`, borderRadius: "5px",
  padding: "6px 12px", fontSize: "10px", color: C.muted, cursor: "pointer",
  fontFamily: "inherit", letterSpacing: "0.04em", transition: "all 0.15s",
};

// ─── ENGINE META (id → display config) ───────────────────────────────────────
const ENGINE_META: Record<string, { tag: string; color: string }> = {
  bright_data:  { tag: "Void Scanner · Compliance Radar · Pain Listener", color: "#00aaff" },
  ai_ml_api:    { tag: "Signal scoring + Intel Brief generation", color: "#ff5a52" },
  featherless:  { tag: "Pain signal classification (Mistral-7B)", color: "#24c038" },
  speechmatics: { tag: "Podcast & audio transcription", color: "#f0a000" },
  cognee:       { tag: "Account memory graph (knowledge persistence)", color: "#9060ff" },
  triggerware:  { tag: "Workflow routing to Slack + HubSpot", color: "#ff8800" },
  slack:        { tag: "Real-time Slack alerts on convergence threshold", color: "#4A154B" },
  hubspot:      { tag: "CRM lead creation on convergence breach", color: "#FF7A59" },
};

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
const SettingsView = ({
  integrationStatuses,
  onSignOut,
  isDemoPage = false,
}: {
  integrationStatuses: { id?: string; name: string; status: string; mode?: string; detail?: string }[];
  onSignOut: () => void;
  isDemoPage?: boolean;
}) => {
  const engineStatus = integrationStatuses.length > 0
    ? integrationStatuses.map((s) => {
        const meta = ENGINE_META[s.id ?? ""] ?? { tag: s.detail ?? "Integration", color: C.muted };
        return { name: s.name, tag: meta.tag, color: meta.color, live: s.status === "live", mode: s.mode ?? "real" };
      })
    : [
        { name: "Bright Data",    tag: "Void Scanner · Compliance Radar · Pain Listener", color: "#00aaff", live: true,  mode: "real" },
        { name: "AI/ML API",      tag: "Signal scoring + Intel Brief generation", color: "#ff5a52", live: true,  mode: "real" },
        { name: "Featherless AI", tag: "Pain signal classification (Mistral-7B)", color: "#24c038", live: true,  mode: "real" },
        { name: "Speechmatics",   tag: "Podcast & audio transcription", color: "#f0a000", live: true,  mode: "real" },
        { name: "Cognee",         tag: "Account memory graph (knowledge persistence)", color: "#9060ff", live: true,  mode: "real" },
        { name: "TriggerWare",    tag: "Workflow routing to Slack + HubSpot", color: "#ff8800", live: true,  mode: "real" },
      ];
  const liveCount = engineStatus.filter((e) => e.live).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "18px" }}>
      {/* Integration list */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>INTEGRATION STATUS</div>
        <div data-demo="integration-list" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
          {engineStatus.map((e, i) => (
            <div key={e.name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 16px", gap: "14px",
              borderBottom: i < engineStatus.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <LiveDot color={e.live ? C.pain : C.muted} pulse={e.live} />
                <div>
                  <div style={{ fontSize: "11px", color: C.white, fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: "9px", color: C.muted, marginTop: "1px" }}>{e.tag}</div>
                </div>
              </div>
              <span style={{
                fontSize: "9px", padding: "2px 8px", borderRadius: "3px", letterSpacing: "0.06em",
                background: e.live ? `${C.pain}12` : `${C.muted}10`,
                color: e.live ? C.pain : C.muted,
                border: `1px solid ${e.live ? C.pain : C.muted}28`,
              }}>
                {e.live ? "● LIVE" : "○ MOCK"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[
          { label: "LIVE APIS", value: `${liveCount}`, sub: `of ${engineStatus.length}`, color: C.pain },
          { label: "PRICING", value: "$1,000", sub: "/month · Elite", color: C.conv },
          { label: "ACCOUNTS", value: "6", sub: "monitored", color: C.blue },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "7px", padding: "13px 15px" }}>
            <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em", marginBottom: "7px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Env hint — hidden on public demo */}
      {!isDemoPage && (
        <div style={{
          background: `${C.conv}08`, border: `1px solid ${C.conv}20`, borderRadius: "7px",
          padding: "12px 14px", marginBottom: "12px",
          fontSize: "9px", color: C.muted, lineHeight: 1.8,
        }}>
          <div style={{ color: C.conv, fontWeight: 600, letterSpacing: "0.08em", marginBottom: "4px" }}>ACTIVATE REMAINING APIS</div>
          Add <span style={{ color: C.text }}>SPEECHMATICS_API_KEY</span>, <span style={{ color: C.text }}>COGNEE_API_KEY</span>, <span style={{ color: C.text }}>SLACK_BOT_TOKEN</span> to <span style={{ color: C.text }}>.env.local</span> and restart.
        </div>
      )}

      {!isDemoPage && (
        <button
          onClick={onSignOut}
          style={{
            width: "100%", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: "7px",
            padding: "11px", fontSize: "10px", color: C.muted, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.06em", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.void; e.currentTarget.style.color = C.void; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          Sign out of PreIntent
        </button>
      )}
    </motion.div>
  );
};

// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
type View = "dashboard" | "signals" | "intel" | "brief" | "settings";

const NAV_ITEMS: { id: View; label: string; Icon: React.FC }[] = [
  { id: "dashboard", label: "OVERVIEW", Icon: Icon.Dashboard },
  { id: "signals", label: "SIGNALS", Icon: Icon.Signal },
  { id: "intel", label: "INTEL", Icon: Icon.Intel },
  { id: "brief", label: "BRIEF", Icon: Icon.Brief },
  { id: "settings", label: "SETTINGS", Icon: Icon.Settings },
];

export default function PreIntentDashboard({ demoMode = false }: { demoMode?: boolean }) {
  const pathname = usePathname();
  const isDemoPage = demoMode || (pathname?.startsWith("/demo") ?? false);
  const homeHref = isDemoPage ? "/demo" : "/dashboard";

  const { addToast } = useToast();
  const toast = createToastHelpers(addToast);

  const [view, setView] = useState<View>("dashboard");
  const [accounts, setAccounts] = useState<PremiumAccount[]>(PREMIUM_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<PremiumAccount>(PREMIUM_ACCOUNTS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [scanDone, setScanDone] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [triggerFired, setTriggerFired] = useState(false);
  const [liveIntegrations, setLiveIntegrations] = useState<
    { id?: string; name: string; status: string; mode?: string }[]
  >([]);
  const integrationStatuses = isDemoPage ? DEMO_INTEGRATION_STATUSES : liveIntegrations;
  const [cleanMode, setCleanMode] = useState(false);
  const [roiOpen, setRoiOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<"void" | "compliance" | "pain" | "audio">("void");
  const [evidenceAccount, setEvidenceAccount] = useState<PremiumAccount>(PREMIUM_ACCOUNTS[0]);
  const [shareOpen, setShareOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [autopilotSession, setAutopilotSession] = useState(0);
  const [signalFilter, setSignalFilter] = useState<"all" | "void" | "compliance" | "pain">("all");
  const [tickerIdx, setTickerIdx] = useState(0);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isDemoPage) return;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setLiveIntegrations(d.integrations || []))
      .catch(() => {});
  }, [isDemoPage]);

  const startAutopilot = useCallback(() => {
    setAutopilotSession((s) => s + 1);
    setAutopilotActive(true);
  }, []);

  // Ticker
  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % LIVE_SIGNALS.length), 3800);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "t") setTourActive(true);
      if (e.key === "a" && !autopilotActive) startAutopilot();
      if (e.key === "c") setCleanMode((v) => !v);
      if (e.key === "r") setRoiOpen(true);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [autopilotActive, startAutopilot]);

  const handleSignOut = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
      // Clear mock session cookie too
      document.cookie = "preintent_mock_session=; path=/; max-age=0";
      document.cookie = "preintent_onboarding_done=; path=/; max-age=0";
    } catch {
      // best-effort
    }
    window.location.href = "/sign-in";
  };

  const runScan = () => {
    if (isScanning) return;
    setIsScanning(true); setScanStep(0); setScanDone(false); setTriggerFired(false);
    toast.info("Full scan initiated", "Monitoring 6 accounts across 3 engines");
    let step = 0;
    scanRef.current = setInterval(() => {
      step++;
      setScanStep(step);
      if (step === 2) toast.info("Void Scanner active", "Crawling competitor pricing pages");
      if (step === 4) toast.info("Pain Listener hit", "Active evaluation signal detected");
      if (step === 6) toast.success("Cognee updated", "Account intelligence profiles refreshed");
      if (step >= SCAN_STEPS.length - 1) {
        clearInterval(scanRef.current!);
        setTimeout(() => {
          const newConv = Math.min(95, accounts[0].convergence + 5);
          setAccounts((prev) => prev.map((a, i) => i === 0 ? { ...a, convergence: newConv, status: "ALERT" as const } : a));
          setTriggerFired(true); setIsScanning(false); setScanDone(true);
          setScanResult(`Brex at ${newConv}/100 — TriggerWare fired — Slack delivered`);
          toast.convergenceAlert("Brex", newConv);
          setTimeout(() => toast.triggerWareFired("Brex"), 900);
        }, 500);
      }
    }, 880);
  };

  const generateBrief = async () => {
    setBriefLoading(true); setBrief("");
    toast.info("Generating Intel Brief", `Analyzing ${selectedAccount.name}...`);

    if (isDemoPage) {
      streamDemoBrief(
        selectedAccount,
        (text) => setBrief(text),
        () => {
          setBriefLoading(false);
          toast.briefGenerated(selectedAccount.name);
        },
      );
      return;
    }

    try {
      const { generateRealIntelBrief } = await import("@/app/actions");
      const mockProfile = {
        account: selectedAccount.name, industry: selectedAccount.industry,
        employees: selectedAccount.employees, crmStage: "Not in pipeline",
        lastUpdated: new Date().toISOString(),
        void: { signals: [{ text: selectedAccount.voidEvent, source: selectedAccount.voidEvidence?.source ?? "Void Scanner", score: selectedAccount.voidScore }], subScore: selectedAccount.voidScore },
        compliance: { signals: [{ text: selectedAccount.complianceEvent, source: selectedAccount.complianceEvidence?.source ?? "Compliance Radar", score: selectedAccount.complianceScore }], subScore: selectedAccount.complianceScore },
        pain: { signals: [{ text: selectedAccount.painEvent, source: selectedAccount.painEvidence?.source ?? "Pain Listener", score: selectedAccount.painScore }], subScore: selectedAccount.painScore },
        convergenceScore: selectedAccount.convergence,
        urgency: computeUrgency(selectedAccount.convergence, Math.max(selectedAccount.voidScore, selectedAccount.complianceScore, selectedAccount.painScore)),
        competitor: selectedAccount.competitor,
        contact: selectedAccount.contact,
      };
      const realBrief = await generateRealIntelBrief(mockProfile as unknown as AccountIntelligenceProfile);
      const formatted = `WHY NOW — 3 CONVERGING SIGNALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① COMPETITOR RETREAT  [${selectedAccount.voidScore}/100]  ${Math.round(selectedAccount.voidConfidence * 100)}% confidence
${selectedAccount.voidEvent}
Detected: ${formatRelativeTime(selectedAccount.voidEvidence?.capturedAt ?? selectedAccount.lastUpdated)}

② REGULATORY PRESSURE  [${selectedAccount.complianceScore}/100]  ${Math.round(selectedAccount.complianceConfidence * 100)}% confidence
${selectedAccount.complianceEvent}
Detected: ${formatRelativeTime(selectedAccount.complianceEvidence?.capturedAt ?? selectedAccount.lastUpdated)}

③ ACTIVE EVALUATION  [${selectedAccount.painScore}/100]  ${Math.round(selectedAccount.painConfidence * 100)}% confidence
${selectedAccount.painEvent}${selectedAccount.audioSignal ? `\nAudio (Speechmatics): ${selectedAccount.audioSignal}` : ""}
Detected: ${formatRelativeTime(selectedAccount.painEvidence?.capturedAt ?? selectedAccount.lastUpdated)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED OPENING LINE

"${realBrief.suggestedOpeningLine || `Hi [Name] — I noticed ${selectedAccount.competitor} made some changes recently. Given that and the regulatory tailwinds, the timing feels right for a quick conversation about how we've helped companies like ${selectedAccount.name}.`}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CONTEXT
  Company : ${selectedAccount.name}
  Industry : ${selectedAccount.industry}
  Employees : ${selectedAccount.employees.toLocaleString()}
  Location : ${selectedAccount.location}
  Stack : ${selectedAccount.stack.join(" · ")}
  Contact : ${selectedAccount.contact.title} (${selectedAccount.contact.name})
  Competitor : ${selectedAccount.competitor}
  Convergence : ${selectedAccount.convergence}/100
  Confidence : ${Math.round(selectedAccount.overallConfidence * 100)}%  (${getConfidenceLevel(selectedAccount.overallConfidence).label})
  Status : ${selectedAccount.status}`;

      let i = 0;
      const id = setInterval(() => {
        i += 6;
        setBrief(formatted.slice(0, i));
        if (i >= formatted.length) {
          clearInterval(id); setBriefLoading(false); toast.briefGenerated(selectedAccount.name);
        }
      }, 8);
    } catch {
      setBriefLoading(false); toast.error("Brief generation failed", "Using fallback");
    }
  };

  const openEvidence = (acct: PremiumAccount, type: "void" | "compliance" | "pain" | "audio") => {
    setEvidenceAccount(acct); setEvidenceType(type); setEvidenceOpen(true);
  };

  const handleAutopilotEnd = useCallback(() => {
    setAutopilotActive(false);
    setView("dashboard");
    setSelectedAccount(PREMIUM_ACCOUNTS[0]);
    setSignalFilter("all");
    setEvidenceOpen(false);
    setShareOpen(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autopilotActions = useMemo<AutopilotActions>(() => ({
    setView,
    runScan,
    generateBrief,
    selectAccount: (a) => setSelectedAccount(a),
    openEvidence,
    closeEvidence: () => setEvidenceOpen(false),
    openShare: () => setShareOpen(true),
    closeShare: () => setShareOpen(false),
    filterSignals: setSignalFilter,
    getAccounts: () => accounts,
  }), [accounts]);

  const selectAccountAndView = (a: PremiumAccount, v: View = "intel") => {
    setSelectedAccount(a); setView(v);
  };

  const alertCount = accounts.filter((a) => a.status === "ALERT").length;
  const signalCount = accounts.length * 3;

  // ─── DASHBOARD VIEW ───────────────────────────────────────────────────────
  const renderDashboardView = () => (
    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "18px" }}>
      {/* Live ticker */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tickerIdx}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          style={{
            marginBottom: "14px", padding: "8px 14px",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px",
            display: "flex", alignItems: "center", gap: "10px",
          }}
        >
          <LiveDot color={LIVE_SIGNALS[tickerIdx].color} pulse />
          <span style={{ fontSize: "9px", fontWeight: 600, color: LIVE_SIGNALS[tickerIdx].color, letterSpacing: "0.08em" }}>
            {LIVE_SIGNALS[tickerIdx].engine}
          </span>
          <span style={{ fontSize: "10px", color: C.text }}>
            <span style={{ color: C.white }}>{LIVE_SIGNALS[tickerIdx].company}</span>
            {" — "}
            {LIVE_SIGNALS[tickerIdx].event}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "9px", color: C.muted, flexShrink: 0 }}>
            {LIVE_SIGNALS[tickerIdx].time} ago
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Stat cards */}
      <div data-demo="stat-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }}>
        <StatCard label="ACCOUNTS" value={`${accounts.length}`} sub="real companies" color={C.blue} delay={0} />
        <StatCard label="ALERTS" value={`${alertCount}`} sub="act now" color={C.void} delay={1} />
        <StatCard label="SIGNALS TODAY" value={`${signalCount}`} sub="3 engines" color={C.pain} delay={2} />
        <StatCard label="EST. ROI" value="500%+" sub="click to model" color={C.conv} delay={3} onClick={() => setRoiOpen(true)} />
      </div>

      {/* Scan panel */}
      <div data-demo="scan-panel" style={{ marginBottom: "14px" }}>
        <ScanPanel isScanning={isScanning} step={scanStep} done={scanDone} onScan={runScan} result={scanResult} />
      </div>

      {/* ROI preview */}
      <div style={{ marginBottom: "14px" }}>
        <ROIPreview onOpen={() => setRoiOpen(true)} />
      </div>

      {/* Sponsor row */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.04em", marginRight: "2px" }}>powered by</span>
        {Object.keys(sponsorColors).map((n) => <SponsorPill key={n} name={n} />)}
      </div>

      {/* Accounts table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 0.9fr 60px 60px 60px 64px 90px 90px",
          padding: "8px 16px", borderBottom: `1px solid ${C.border}`,
          fontSize: "8px", color: C.muted, letterSpacing: "0.1em", gap: "8px", alignItems: "center",
        }}>
          <span>COMPANY</span><span>INDUSTRY</span>
          <span>VOID</span><span>COMPL.</span><span>PAIN</span>
          <span>CONV.</span><span>STATUS</span><span>CONFIDENCE</span>
        </div>

        {accounts.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0, background: selectedAccount.id === a.id ? `${C.conv}06` : C.surface }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => selectAccountAndView(a)}
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 0.9fr 60px 60px 60px 64px 90px 90px",
              padding: "11px 16px", gap: "8px", alignItems: "center",
              borderBottom: idx < accounts.length - 1 ? `1px solid ${C.border}` : "none",
              cursor: "pointer",
            }}
            whileHover={{ background: C.surface2 }}
          >
            <div>
              <div style={{ fontSize: "12px", color: C.white, fontWeight: 500 }}>{a.name}</div>
              <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>
                {a.employees.toLocaleString()} · {a.location}
              </div>
            </div>
            <div style={{ fontSize: "10px", color: C.muted }}>{a.industry}</div>
            {[
              [a.voidScore, C.void],
              [a.complianceScore, C.compliance],
              [a.painScore, C.pain],
            ].map(([score, color], i) => (
              <div key={i}>
                <div style={{ fontSize: "12px", color: color as string, fontWeight: 600, marginBottom: "4px" }}>
                  {score}
                </div>
                <ScoreBar value={score as number} color={color as string} delay={idx} />
              </div>
            ))}
            <div style={{ fontSize: "18px", fontWeight: 700, color: (a.convergence >= 75 ? C.void : a.convergence >= 55 ? C.compliance : C.muted) }}>
              {a.convergence}
            </div>
            <div><StatusBadge status={a.status} /></div>
            <div><ConfidenceBadge confidence={a.overallConfidence} /></div>
          </motion.div>
        ))}
      </div>

      {/* Competitive comparison link */}
      <div style={{ marginTop: "12px" }}>
        <ComparisonTrigger onOpen={() => setComparisonOpen(true)} />
      </div>
    </motion.div>
  );

  const evidenceData =
    evidenceType === "void" ? evidenceAccount?.voidEvidence :
    evidenceType === "compliance" ? evidenceAccount?.complianceEvidence :
    evidenceType === "pain" ? evidenceAccount?.painEvidence :
    evidenceAccount?.audioEvidence;

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      display: "flex", flexDirection: "column",
    }}>
      {/* ── TOP NAV ── */}
      {!cleanMode && (
        <div style={{
          display: "flex", alignItems: "center", height: "52px",
          background: `rgba(12,16,24,0.95)`, borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 40,
          padding: "0 18px", gap: "0", flexShrink: 0,
        }}>
          {/* Logo */}
          <a href={homeHref} style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontWeight: 700, fontSize: "13px", color: C.white, letterSpacing: "0.18em",
            marginRight: "28px", textDecoration: "none", flexShrink: 0,
          }}>
            <Icon.Logo />
            PREINTENT
          </a>

          {/* Separator */}
          <div style={{ width: "1px", height: "24px", background: C.border, marginRight: "18px" }} />

          {/* Nav tabs */}
          {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                position: "relative", height: "52px", padding: "0 14px",
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: "9px", fontFamily: "inherit", letterSpacing: "0.12em",
                color: view === id ? C.white : C.muted,
                display: "flex", alignItems: "center", gap: "6px",
                borderBottom: view === id ? `2px solid ${C.conv}` : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s", flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (view !== id) e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { if (view !== id) e.currentTarget.style.color = C.muted; }}
            >
              <NavIcon />
              {label}
              {id === "signals" && alertCount > 0 && (
                <span style={{
                  background: C.void, color: C.white, borderRadius: "99px",
                  fontSize: "8px", padding: "0px 5px", minWidth: "16px", textAlign: "center",
                  lineHeight: "16px",
                }}>
                  {alertCount}
                </span>
              )}
            </button>
          ))}

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <AnimatePresence>
              {triggerFired && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontSize: "9px", color: C.compliance, display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Icon.Zap /> TriggerWare fired
                </motion.span>
              )}
            </AnimatePresence>

            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: C.muted }}>
              <LiveDot color={C.pain} pulse />
              LIVE
            </div>

            <AutoplayTrigger onStart={startAutopilot} disabled={autopilotActive || tourActive} />
            <TourTrigger onStart={() => setTourActive(true)} disabled={tourActive || autopilotActive} />

            <button
              onClick={() => setCleanMode(true)}
              style={{ ...ghostBtnStyle, fontSize: "9px", padding: "4px 10px" }}
            >
              Clean Mode
            </button>

            {!isDemoPage && (
              <button
                onClick={handleSignOut}
                style={{ ...ghostBtnStyle, fontSize: "9px", padding: "4px 10px" }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clean mode exit banner */}
      {cleanMode && (
        <div style={{
          position: "fixed", top: "14px", right: "14px", zIndex: 50,
          background: `${C.conv}20`, border: `1px solid ${C.conv}40`,
          borderRadius: "6px", padding: "6px 14px", fontSize: "10px", color: C.conv,
          cursor: "pointer", backdropFilter: "blur(10px)",
        }}
          onClick={() => setCleanMode(false)}
        >
          Exit Clean Mode (C)
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto", maxWidth: "1400px", width: "100%", margin: "0 auto", paddingBottom: "40px" }}>
        {/* Account selector sub-bar (for intel + brief) */}
        {(view === "intel" || view === "brief") && !cleanMode && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "10px 18px", borderBottom: `1px solid ${C.border}`,
            overflowX: "auto",
          }}>
            <span style={{ fontSize: "9px", color: C.muted, marginRight: "6px", flexShrink: 0, letterSpacing: "0.06em" }}>
              ACCOUNT
            </span>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAccount(a)}
                style={{
                  background: selectedAccount.id === a.id ? `${C.conv}15` : "transparent",
                  border: `1px solid ${selectedAccount.id === a.id ? C.conv : C.border}`,
                  borderRadius: "4px", padding: "4px 10px", fontSize: "10px",
                  color: selectedAccount.id === a.id ? C.conv : C.muted,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s",
                }}
              >
                {a.name}
                {a.status === "ALERT" && (
                  <span style={{ marginLeft: "5px", color: C.void, fontSize: "8px" }}>●</span>
                )}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === "dashboard" && renderDashboardView()}
          {view === "signals" && (
            <SignalsView
              key="sig"
              accounts={accounts}
              onEvidence={(acct, type) => openEvidence(acct, type)}
              filter={signalFilter}
              onFilterChange={setSignalFilter}
            />
          )}
          {view === "intel" && (
            <IntelView
              key="intel"
              account={selectedAccount}
              onGenerateBrief={() => { setView("brief"); generateBrief(); }}
              onEvidence={(type) => openEvidence(selectedAccount, type)}
            />
          )}
          {view === "brief" && (
            <BriefView
              key="brief"
              brief={brief}
              loading={briefLoading}
              account={selectedAccount}
              onGenerate={generateBrief}
              onShare={() => setShareOpen(true)}
            />
          )}
          {view === "settings" && (
            <SettingsView
              key="settings"
              integrationStatuses={integrationStatuses}
              onSignOut={handleSignOut}
              isDemoPage={isDemoPage}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── MODALS ── */}
      <ROICalculator
        isOpen={roiOpen}
        onClose={() => setRoiOpen(false)}
        accountName={selectedAccount?.name}
        accountConvergence={selectedAccount?.convergence}
      />

      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData || null}
        accountName={evidenceAccount?.name || ""}
        signalType={evidenceType}
      />

      <BriefSharing
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        accountName={selectedAccount?.name || ""}
        briefContent={brief}
        account={selectedAccount}
      />

      <CompetitiveComparison
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        acv={50000}
      />

      <GuidedTour
        isActive={tourActive}
        onClose={() => setTourActive(false)}
        accounts={accounts}
      />

      {autopilotActive && (
        <DemoAutopilot
          key={autopilotSession}
          isActive={autopilotActive}
          onEnd={handleAutopilotEnd}
          actions={autopilotActions}
        />
      )}

      {!cleanMode && <TourShortcut />}
    </div>
  );
}
