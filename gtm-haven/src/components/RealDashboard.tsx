"use client";

/**
 * RealDashboard  -  the authenticated intelligence workspace.
 *
 * This is the production version of DemoDashboard, wired to:
 *   • /api/sweep       -  runs live 3-engine scan (BrightData + AI/ML + Featherless + Speechmatics)
 *   • /api/health      -  reads real integration status from env
 *   • /app/actions     -  generateRealIntelBrief (AI/ML API or mock)
 *   • localStorage     -  persists scanned accounts between sessions (Cognee MVP layer)
 *   • Supabase         -  reads company knowledge doc stored during onboarding
 *
 * Company context: loaded from localStorage `preintent_company_kdoc` (set by onboarding
 * wizard + Supabase sync in dashboard/page.tsx).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AccountIntelligenceProfile } from "@/lib/domain";
import { computeUrgency } from "@/lib/convergence";
import { useToast, createToastHelpers } from "@/components/ui/toast";
import { EvidenceModal } from "@/components/ui/evidence-panel";
import { BriefSharing } from "@/components/ui/brief-sharing";
import {
  formatRelativeTime,
  getConfidenceLevel,
  type PremiumAccount,
  type EvidencePanel,
} from "@/lib/premium-demo-data";
import type { CompanyKnowledgeDoc } from "@/lib/company-knowledge";

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

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = {
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2L16.93 6V14L10 18L3.07 14V6L10 2Z"
        stroke="#9060ff"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M10 5.2L14.2 7.6V12.4L10 14.8L5.8 12.4V7.6L10 5.2Z"
        fill="#9060ff"
        fillOpacity="0.3"
      />
      <circle cx="10" cy="10" r="2" fill="#9060ff" />
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
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7 13V8M4 13V10M10 13V5M1 13V12M13 13V3" />
    </svg>
  ),
  Intel: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 5v5M7 3.5v.5" strokeLinecap="round" />
    </svg>
  ),
  Brief: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="1" width="10" height="12" rx="1.5" />
      <path d="M4 5h6M4 7.5h6M4 10h4" strokeLinecap="round" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="2" />
      <path
        d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.24 2.76l-1.06 1.06M3.82 10.18l-1.06 1.06M11.24 11.24l-1.06-1.06M3.82 3.82L2.76 2.76"
        strokeLinecap="round"
      />
    </svg>
  ),
  Play: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2v8M2 6h8" strokeLinecap="round" />
    </svg>
  ),
  Check: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Zap: () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
      <path d="M6.5 1L2 6.5h3.5L4 10l5.5-6H6L6.5 1Z" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5 10 11 6.5 11 1 6.5 1 6.5Z" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <path d="M1 8V2a1 1 0 011-1h6" strokeLinecap="round" />
    </svg>
  ),
  Share: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="9.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="6" r="1.5" />
      <circle cx="9.5" cy="9.5" r="1.5" />
      <path d="M4 6.75l4 2.25M4 5.25l4-2.25" />
    </svg>
  ),
  Book: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 2h4.5c1.5 0 2.5 1 2.5 2.5V13c0-1-1-1.5-2-1.5H2V2Z" />
      <path d="M12 2H7.5C6 2 5 3 5 4.5V13c0-1 1-1.5 2-1.5H12V2Z" />
    </svg>
  ),
};

// ─── SCAN STEPS ───────────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { msg: "Initializing BrightData MCP Server...", tag: "BrightData", pct: 10 },
  {
    msg: "Void Scanner  -  crawling competitor pricing pages...",
    tag: "BrightData",
    pct: 22,
  },
  {
    msg: "Compliance Radar  -  scanning regulatory RSS feeds...",
    tag: "BrightData",
    pct: 35,
  },
  {
    msg: "Pain Listener  -  accessing community forums...",
    tag: "BrightData",
    pct: 47,
  },
  {
    msg: "Speechmatics  -  transcribing podcast audio signals...",
    tag: "Speechmatics",
    pct: 57,
  },
  {
    msg: "Featherless AI  -  classifying pain signals...",
    tag: "Featherless AI",
    pct: 68,
  },
  {
    msg: "AI/ML API  -  computing convergence vectors...",
    tag: "AI/ML API",
    pct: 80,
  },
  {
    msg: "Cognee  -  updating account intelligence profiles...",
    tag: "Cognee",
    pct: 90,
  },
  {
    msg: "TriggerWare  -  routing alert (threshold check)...",
    tag: "TriggerWare",
    pct: 97,
  },
];

const sponsorColors: Record<string, string> = {
  BrightData: "#00aaff",
  "AI/ML API": "#ff5a52",
  Speechmatics: "#f0a000",
  "Featherless AI": "#24c038",
  Cognee: "#9060ff",
  TriggerWare: "#ff8800",
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type View =
  | "dashboard"
  | "signals"
  | "intel"
  | "brief"
  | "settings"
  | "knowledge";

type SweepResult = {
  convergenceScore: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  voidScore: number;
  complianceScore: number;
  painScore: number;
  voidEvent: string;
  complianceEvent: string;
  painEvent: string;
  slackSent: boolean;
  hubspotSent: boolean;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function seedAccountToPremium(
  seed: {
    name: string;
    industry: string;
    employees: string;
    competitor: string;
    whyNow: string;
  },
  index: number,
  knowledgeDoc?: CompanyKnowledgeDoc | null,
): PremiumAccount {
  // Parse employee range to a midpoint number
  const empStr = seed.employees || "200–500";
  const empMatch = empStr.match(/(\d+)/);
  const employees = empMatch ? parseInt(empMatch[1]) * 3 : 300;

  const placeholder: EvidencePanel = {
    title: "Awaiting Scan",
    type: "document",
    source: "Run a sweep to populate evidence",
    capturedAt: new Date().toISOString(),
    details: ["Click 'Run Full Scan' to fetch live signals for this account"],
  };

  // Use resolved competitor URL if available, otherwise undefined (sweep will derive it)
  const resolvedCompetitor = knowledgeDoc?.resolvedCompetitors?.find(
    (rc) =>
      rc.originalName === seed.competitor ||
      rc.resolvedName === seed.competitor,
  );
  const competitorUrl = resolvedCompetitor?.website
    ? resolvedCompetitor.website.replace(/^https?:\/\//, "")
    : undefined;
  const competitorPricingUrl = resolvedCompetitor?.pricingUrl || undefined;

  return {
    id: 100 + index,
    name: seed.name,
    displayName: seed.name,
    industry: seed.industry,
    employees,
    location: "Unknown",
    website: undefined,
    linkedinUrl: undefined,
    competitor: seed.competitor,
    competitorUrl,
    competitorPricingUrl,
    voidScore: 0,
    voidConfidence: 0,
    complianceScore: 0,
    complianceConfidence: 0,
    painScore: 0,
    painConfidence: 0,
    convergence: 0,
    overallConfidence: 0,
    status: "MONITOR" as const,
    contact: { title: "Decision Maker", name: "", linkedin: "" },
    stack: [],
    voidEvent: seed.whyNow || `Monitor ${seed.competitor} pricing changes`,
    voidEvidence: placeholder,
    complianceEvent: "Regulatory window analysis pending",
    complianceEvidence: placeholder,
    painEvent: "Community signal analysis pending",
    painEvidence: placeholder,
    lastUpdated: new Date().toISOString(),
  };
}

function sweepResultToAccount(
  account: PremiumAccount,
  result: SweepResult,
): PremiumAccount {
  const now = new Date().toISOString();
  const urgencyToStatus = (u: string): "ALERT" | "WATCH" | "MONITOR" => {
    if (u === "CRITICAL" || u === "HIGH") return "ALERT";
    if (u === "MEDIUM") return "WATCH";
    return "MONITOR";
  };

  const mkEvidence = (title: string, event: string): EvidencePanel => ({
    title,
    type: "document",
    source: "PreIntent Live Sweep",
    capturedAt: now,
    details: [
      event,
      `Score: ${result.convergenceScore}/100`,
      `Urgency: ${result.urgency}`,
    ],
  });

  return {
    ...account,
    voidScore: result.voidScore,
    voidConfidence: result.voidScore / 100,
    complianceScore: result.complianceScore,
    complianceConfidence: result.complianceScore / 100,
    painScore: result.painScore,
    painConfidence: result.painScore / 100,
    convergence: result.convergenceScore,
    overallConfidence: result.convergenceScore / 100,
    status: urgencyToStatus(result.urgency),
    voidEvent: result.voidEvent || account.voidEvent,
    voidEvidence: mkEvidence(
      "Void Scanner  -  Live",
      result.voidEvent || account.voidEvent,
    ),
    complianceEvent: result.complianceEvent || account.complianceEvent,
    complianceEvidence: mkEvidence(
      "Compliance Radar  -  Live",
      result.complianceEvent || account.complianceEvent,
    ),
    painEvent: result.painEvent || account.painEvent,
    painEvidence: mkEvidence(
      "Pain Listener  -  Live",
      result.painEvent || account.painEvent,
    ),
    lastUpdated: now,
  };
}

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────

const SponsorPill = ({ name }: { name: string }) => {
  const c = sponsorColors[name] || "#888";
  return (
    <span
      style={{
        fontSize: "9px",
        padding: "2px 6px",
        borderRadius: "3px",
        background: `${c}15`,
        color: c,
        border: `1px solid ${c}30`,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
};

const LiveDot = ({
  color,
  pulse = true,
}: {
  color: string;
  pulse?: boolean;
}) => (
  <span
    style={{
      display: "inline-block",
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
      boxShadow: `0 0 0 2px ${color}30`,
      animation: pulse ? "dot-blink 2s ease-in-out infinite" : "none",
    }}
  />
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    ALERT: { bg: `${C.void}12`, color: C.void, dot: C.void },
    WATCH: { bg: `${C.compliance}12`, color: C.compliance, dot: C.compliance },
    MONITOR: { bg: `${C.muted}12`, color: C.muted, dot: C.muted },
  };
  const s = map[status] || map.MONITOR;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 7px",
        borderRadius: "3px",
        fontSize: "9px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}35`,
      }}
    >
      <LiveDot color={s.dot} pulse={status === "ALERT"} />
      {status}
    </span>
  );
};

const ScoreBar = ({
  value,
  color,
  delay = 0,
}: {
  value: number;
  color: string;
  delay?: number;
}) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 300 + delay * 100);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div
      style={{
        height: "3px",
        background: C.border,
        borderRadius: "99px",
        overflow: "hidden",
        minWidth: "40px",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${w}%`,
          background: color,
          borderRadius: "99px",
          transition: "width 0.9s cubic-bezier(.25,.1,.25,1)",
        }}
      />
    </div>
  );
};

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const level = getConfidenceLevel(confidence);
  return (
    <span
      style={{
        fontSize: "9px",
        padding: "2px 5px",
        borderRadius: "3px",
        background: `${level.color}15`,
        color: level.color,
        border: `1px solid ${level.color}35`,
      }}
    >
      {level.label} {Math.round(confidence * 100)}%
    </span>
  );
};

const ConvergenceGauge = ({
  value,
  size = 160,
}: {
  value: number;
  size?: number;
}) => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, value / 60);
    let animationFrameId: number;

    const animate = () => {
      cur = Math.min(cur + step, value);
      setScore(Math.round(cur));
      if (cur < value) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dashArr = `${(score / 100) * circ} ${circ}`;
  const color = score >= 75 ? C.void : score >= 55 ? C.compliance : C.conv;

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={`rg${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor={color} />
            <stop
              offset="100%"
              stopColor={color === C.void ? C.compliance : color}
            />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.border}
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#rg${value})`}
          strokeWidth="6"
          strokeDasharray={dashArr}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.04s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: size < 120 ? "24px" : "36px",
            fontWeight: 800,
            color: C.white,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: "9px",
            color: C.muted,
            marginTop: "2px",
            letterSpacing: "0.1em",
          }}
        >
          CONV.
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  sub,
  color,
  delay = 0,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay: delay * 0.08,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    }}
    whileHover={{ y: -3, boxShadow: `0 10px 32px ${color}18` }}
    onClick={onClick}
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "8px",
      padding: "14px 16px",
      cursor: onClick ? "pointer" : "default",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "80px",
        height: "80px",
        background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        fontSize: "9px",
        color: C.muted,
        letterSpacing: "0.1em",
        marginBottom: "10px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "26px",
        fontWeight: 700,
        color,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: "9px", color: C.muted, marginTop: "6px" }}>
      {sub}
    </div>
  </motion.div>
);

// ─── SCAN PANEL ──────────────────────────────────────────────────────────────
const ScanPanel = ({
  isScanning,
  step,
  done,
  onScan,
  result,
}: {
  isScanning: boolean;
  step: number;
  done: boolean;
  onScan: () => void;
  result: string;
}) => {
  const pct =
    step >= 0
      ? (SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)]?.pct ?? 0)
      : 0;
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          borderBottom: isScanning ? `1px solid ${C.border}` : "none",
        }}
      >
        <motion.button
          whileHover={
            isScanning
              ? {}
              : { scale: 1.04, boxShadow: `0 8px 24px ${C.blue}40` }
          }
          whileTap={isScanning ? {} : { scale: 0.96 }}
          onClick={onScan}
          disabled={isScanning}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            background: isScanning
              ? C.dim
              : `linear-gradient(135deg, #1560cc, ${C.blue})`,
            color: C.white,
            border: "none",
            borderRadius: "5px",
            padding: "5px 18px",
            fontSize: "10px",
            fontFamily: "inherit",
            letterSpacing: "0.1em",
            cursor: isScanning ? "not-allowed" : "pointer",
            flexShrink: 0,
            boxShadow: isScanning ? "none" : `0 6px 18px ${C.blue}30`,
          }}
        >
          {isScanning ? (
            <span
              style={{
                display: "inline-block",
                animation: "spin 0.9s linear infinite",
              }}
            >
              ◌
            </span>
          ) : (
            <Icon.Play />
          )}
          {isScanning ? "SCANNING..." : "RUN FULL SCAN"}
        </motion.button>

        {!isScanning && !done && (
          <span style={{ fontSize: "10px", color: C.muted }}>
            BrightData → Speechmatics → Featherless AI → AI/ML API → TriggerWare
          </span>
        )}

        {done && !isScanning && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "10px",
              color: C.pain,
            }}
          >
            <span
              style={{
                background: `${C.pain}20`,
                border: `1px solid ${C.pain}40`,
                borderRadius: "3px",
                padding: "1px 6px",
              }}
            >
              ✓ COMPLETE
            </span>
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
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    color: C.muted,
                    letterSpacing: "0.06em",
                  }}
                >
                  {SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)]?.msg}
                </span>
                <span style={{ fontSize: "9px", color: C.conv }}>{pct}%</span>
              </div>
              <div
                style={{
                  height: "3px",
                  background: C.border,
                  borderRadius: "99px",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: "99px",
                    background: `linear-gradient(90deg, ${C.conv}, ${C.pain})`,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                padding: "10px 16px",
                display: "flex",
                gap: "12px",
                overflowX: "auto",
              }}
            >
              {SCAN_STEPS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                    opacity: i <= step ? 1 : 0.25,
                    transition: "opacity 0.3s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: i < step ? C.pain : i === step ? C.conv : C.muted,
                    }}
                  >
                    {i < step ? "✓" : i === step ? "▷" : "○"}
                  </span>
                  <span style={{ fontSize: "9px", color: C.muted }}>
                    {s.tag}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── ADD ACCOUNT MODAL ───────────────────────────────────────────────────────
const AddAccountModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    industry: string;
    employees: number;
    competitor: string;
    competitorPricingUrl: string;
  }) => void;
}) => {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    employees: "500",
    competitor: "",
    competitorPricingUrl: "",
  });
  const [adding, setAdding] = useState(false);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.competitor.trim()) return;
    setAdding(true);
    onAdd({
      name: form.name.trim(),
      industry: form.industry.trim() || "B2B SaaS",
      employees: parseInt(form.employees) || 500,
      competitor: form.competitor.trim(),
      competitorPricingUrl: form.competitorPricingUrl.trim(),
    });
    setTimeout(() => {
      setAdding(false);
      onClose();
      setForm({
        name: "",
        industry: "",
        employees: "500",
        competitor: "",
        competitorPricingUrl: "",
      });
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(7,9,15,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.white }}>
              Add Account to Monitor
            </div>
            <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px" }}>
              Triggers a live sweep immediately
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {[
            { label: "COMPANY NAME *", key: "name", placeholder: "Acme Corp" },
            {
              label: "INDUSTRY",
              key: "industry",
              placeholder: "FinTech / Payments",
            },
            {
              label: "EMPLOYEE COUNT",
              key: "employees",
              placeholder: "500",
              type: "number",
            },
            {
              label: "PRIMARY COMPETITOR *",
              key: "competitor",
              placeholder: "Stripe",
            },
            {
              label: "COMPETITOR PRICING URL",
              key: "competitorPricingUrl",
              placeholder: "https://stripe.com/pricing",
            },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <div
                style={{
                  fontSize: "10px",
                  color: C.muted,
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                }}
              >
                {label}
              </div>
              <input
                type={type || "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                style={{
                  width: "100%",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: C.text,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.conv)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "11px",
              fontSize: "12px",
              color: C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={adding || !form.name.trim() || !form.competitor.trim()}
            style={{
              flex: 2,
              background: adding
                ? C.dim
                : `linear-gradient(135deg, #7c3aed, ${C.conv})`,
              border: "none",
              borderRadius: "8px",
              padding: "11px",
              fontSize: "12px",
              color: C.white,
              cursor: adding ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              letterSpacing: "0.06em",
              boxShadow: adding ? "none" : `0 6px 18px ${C.conv}30`,
            }}
          >
            {adding ? "Adding..." : "Add & Run Sweep →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── COMPETITOR INTEL PANEL ───────────────────────────────────────────────────
const CompetitorIntelPanel = ({ doc }: { doc: CompanyKnowledgeDoc }) => {
  type ResolvedCompetitor = NonNullable<
    CompanyKnowledgeDoc["resolvedCompetitors"]
  >[number];
  const [resolvedList, setResolvedList] = useState<ResolvedCompetitor[]>(
    doc.resolvedCompetitors ?? [],
  );
  const [resolutionStatus, setResolutionStatus] = useState<string>(
    doc.competitorResolutionStatus ??
      (doc.resolvedCompetitors?.length ? "resolved" : "pending"),
  );
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (
      resolutionStatus === "pending" &&
      doc.scanConfig.competitors.length > 0 &&
      resolvedList.length === 0
    ) {
      triggerResolution();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerResolution = async () => {
    if (resolving) return;
    setResolving(true);
    setResolutionStatus("resolving");
    try {
      const res = await fetch("/api/competitors/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors: doc.scanConfig.competitors.filter(Boolean),
          context: doc,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.resolved)) {
          setResolvedList(data.resolved);
          setResolutionStatus("resolved");
          try {
            const cached = localStorage.getItem("preintent_company_kdoc");
            if (cached) {
              const parsed = JSON.parse(cached);
              parsed.resolvedCompetitors = data.resolved;
              parsed.competitorResolutionStatus = "resolved";
              localStorage.setItem(
                "preintent_company_kdoc",
                JSON.stringify(parsed),
              );
            }
          } catch {
            /* non-fatal */
          }
        }
      } else {
        setResolutionStatus("failed");
      }
    } catch {
      setResolutionStatus("failed");
    } finally {
      setResolving(false);
    }
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? C.pain : c >= 0.5 ? C.compliance : C.muted;

  const statusIcon = (s: string) => {
    if (s === "resolved") return { icon: "✓", color: C.pain };
    if (s === "ambiguous") return { icon: "~", color: C.compliance };
    if (s === "mock") return { icon: "◎", color: C.conv };
    return { icon: "?", color: C.muted };
  };

  const isResolving = resolving || resolutionStatus === "resolving";

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              fontSize: "9px",
              color: "#00aaff",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            COMPETITOR INTELLIGENCE
          </div>
          {isResolving && (
            <span style={{ fontSize: "9px", color: C.conv }}>
              ◌ Resolving...
            </span>
          )}
          {resolutionStatus === "resolved" && !isResolving && (
            <span
              style={{
                fontSize: "8px",
                padding: "1px 6px",
                borderRadius: "3px",
                background: `${C.pain}15`,
                color: C.pain,
                border: `1px solid ${C.pain}30`,
              }}
            >
              ✓ VERIFIED
            </span>
          )}
          {resolutionStatus === "failed" && !isResolving && (
            <span
              style={{
                fontSize: "8px",
                padding: "1px 6px",
                borderRadius: "3px",
                background: `${C.void}15`,
                color: C.void,
                border: `1px solid ${C.void}30`,
              }}
            >
              ✗ FAILED
            </span>
          )}
        </div>
        <button
          onClick={triggerResolution}
          disabled={isResolving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: "5px",
            padding: "4px 10px",
            fontSize: "9px",
            color: isResolving ? C.muted : "#00aaff",
            cursor: isResolving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
        >
          {isResolving ? "◌" : "↻"} {isResolving ? "Resolving" : "Re-resolve"}
        </button>
      </div>

      <div
        style={{
          fontSize: "9px",
          color: C.muted,
          marginBottom: "12px",
          lineHeight: 1.6,
        }}
      >
        The AI Agent searches Bright Data SERP to find the exact company behind
        each competitor name, then uses your company context to disambiguate and
        verify the website URL.
      </div>

      {resolvedList.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {resolvedList.map((comp, i) => {
            const si = statusIcon(comp.status);
            const confColor = confidenceColor(comp.confidence);
            return (
              <motion.div
                key={comp.originalName}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "7px",
                  padding: "12px 14px",
                  borderLeft: `3px solid ${confColor}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        marginBottom: "3px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "8px",
                          width: "16px",
                          height: "16px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          background: `${si.color}20`,
                          color: si.color,
                          flexShrink: 0,
                        }}
                      >
                        {si.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: C.white,
                        }}
                      >
                        {comp.resolvedName}
                      </span>
                      {comp.resolvedName !== comp.originalName && (
                        <span style={{ fontSize: "9px", color: C.muted }}>
                          (entered as &quot;{comp.originalName}&quot;)
                        </span>
                      )}
                    </div>
                    {comp.website && (
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "10px",
                          color: "#00aaff",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginBottom: "4px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        ↗ {comp.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {comp.pricingUrl && comp.pricingUrl !== comp.website && (
                      <a
                        href={comp.pricingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "9px",
                          color: C.compliance,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginLeft: "10px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        $ Pricing
                      </a>
                    )}
                    {comp.description && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: C.muted,
                          marginTop: "4px",
                          lineHeight: 1.5,
                        }}
                      >
                        {comp.description.slice(0, 120)}
                        {comp.description.length > 120 ? "..." : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "8px",
                        padding: "2px 7px",
                        borderRadius: "3px",
                        background: `${confColor}15`,
                        color: confColor,
                        border: `1px solid ${confColor}30`,
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(comp.confidence * 100)}% conf.
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: C.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {comp.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {doc.scanConfig.competitors.map((c) => (
            <div
              key={c}
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: "7px",
                padding: "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {isResolving ? (
                <span style={{ fontSize: "9px", color: C.conv, flexShrink: 0 }}>
                  ◌
                </span>
              ) : (
                <span
                  style={{ fontSize: "9px", color: C.muted, flexShrink: 0 }}
                >
                  ▸
                </span>
              )}
              <span
                style={{
                  fontSize: "12px",
                  color: isResolving ? C.muted : C.void,
                }}
              >
                {c}
              </span>
              {isResolving && (
                <span
                  style={{
                    fontSize: "9px",
                    color: C.muted,
                    marginLeft: "auto",
                  }}
                >
                  searching...
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: "10px", fontSize: "9px", color: C.muted }}>
        Powered by Bright Data SERP + AI/ML API disambiguation · URLs verified
        and used as sweep targets
      </div>
    </div>
  );
};

// ─── KNOWLEDGE DOC PANEL ─────────────────────────────────────────────────────
const KnowledgeView = ({ doc }: { doc: CompanyKnowledgeDoc | null }) => {
  if (!doc) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}>
          ✦
        </div>
        <div style={{ fontSize: "12px" }}>No knowledge doc found.</div>
        <div style={{ fontSize: "11px", marginTop: "8px" }}>
          Complete onboarding to generate your company intelligence document.
        </div>
        <a
          href="/onboarding"
          style={{
            display: "inline-block",
            marginTop: "16px",
            color: C.conv,
            textDecoration: "none",
            border: `1px solid ${C.conv}`,
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "11px",
          }}
        >
          Complete Onboarding →
        </a>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: "18px" }}
    >
      {/* Header */}
      <div
        style={{
          background: `${C.conv}12`,
          border: `1px solid ${C.conv}30`,
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>✦</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: C.white }}>
              Company Knowledge Doc - {doc.companyName}
            </div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
              Generated {new Date(doc.generatedAt).toLocaleString()} ·{" "}
              {doc.generatedBy === "ai_ml_api"
                ? "AI/ML API (live)"
                : "Intelligence Engine (mock)"}
            </div>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: C.text,
            lineHeight: 1.8,
          }}
        >
          {doc.segmentSummary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        {/* ICP */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: C.conv,
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}
          >
            IDEAL CUSTOMER PROFILE
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            <div>
              <div
                style={{ fontSize: "9px", color: C.muted, marginBottom: "3px" }}
              >
                COMPANY SIZE
              </div>
              <div style={{ fontSize: "12px", color: C.text }}>
                {doc.icp.companySize}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: "9px", color: C.muted, marginBottom: "5px" }}
              >
                TARGET INDUSTRIES
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {doc.icp.industries.slice(0, 4).map((ind) => (
                  <span
                    key={ind}
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      background: `${C.blue}12`,
                      border: `1px solid ${C.blue}25`,
                      borderRadius: "4px",
                      color: C.blue,
                    }}
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: "9px", color: C.muted, marginBottom: "5px" }}
              >
                TRIGGER EVENTS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {doc.icp.triggerEvents.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      background: `${C.pain}12`,
                      border: `1px solid ${C.pain}25`,
                      borderRadius: "4px",
                      color: C.pain,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scan Config */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: C.void,
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}
          >
            SCAN CONFIGURATION
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <div>
              <div
                style={{ fontSize: "9px", color: C.muted, marginBottom: "5px" }}
              >
                COMPETITORS TRACKED
              </div>
              {doc.scanConfig.competitors.map((c) => (
                <div
                  key={c}
                  style={{
                    fontSize: "11px",
                    color: C.void,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "2px 0",
                  }}
                >
                  <span style={{ fontSize: "8px" }}>▸</span> {c}
                </div>
              ))}
            </div>
            <div>
              <div
                style={{ fontSize: "9px", color: C.muted, marginBottom: "5px" }}
              >
                REGULATORY KEYWORDS
              </div>
              {doc.scanConfig.regulatoryKeywords.slice(0, 3).map((k) => (
                <div
                  key={k}
                  style={{
                    fontSize: "10px",
                    color: C.compliance,
                    padding: "1px 0",
                  }}
                >
                  {k}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPETITOR INTELLIGENCE PANEL ─────────────────────────────────── */}
      <CompetitorIntelPanel doc={doc} />

      {/* Opportunities */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            color: C.compliance,
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: "14px",
          }}
        >
          TOP GTM OPPORTUNITIES
        </div>
        {doc.opportunities.map((opp, i) => {
          const urgColor =
            opp.urgency === "HIGH"
              ? C.void
              : opp.urgency === "MEDIUM"
                ? C.compliance
                : C.muted;
          return (
            <div
              key={i}
              style={{
                borderLeft: `3px solid ${urgColor}`,
                borderRadius: "0 6px 6px 0",
                background: `${urgColor}06`,
                padding: "12px 14px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span
                  style={{ fontSize: "12px", fontWeight: 600, color: C.white }}
                >
                  {opp.title}
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    letterSpacing: "0.08em",
                    background: `${urgColor}20`,
                    color: urgColor,
                  }}
                >
                  {opp.urgency}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "11px",
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                {opp.description}
              </p>
              <div style={{ fontSize: "10px", color: C.conv }}>
                → {opp.suggestedAction}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seed accounts */}
      {doc.seedAccounts.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: C.void,
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "14px",
            }}
          >
            SEED ACCOUNTS FROM ONBOARDING
          </div>
          {doc.seedAccounts.map((acc, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  i < doc.seedAccounts.length - 1
                    ? `1px solid ${C.border}`
                    : "none",
              }}
            >
              <div>
                <div
                  style={{ fontSize: "12px", color: C.white, fontWeight: 500 }}
                >
                  {acc.name}
                </div>
                <div
                  style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}
                >
                  {acc.industry} · {acc.employees}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", color: C.void }}>
                  {acc.competitor}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    maxWidth: "200px",
                    textAlign: "right",
                    marginTop: "2px",
                    lineHeight: 1.4,
                  }}
                >
                  {acc.whyNow}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── SIGNALS PANEL ─────────────────────────────────────────────────────────────
const SignalsView = ({
  accounts,
  onEvidence,
  filter,
  onFilterChange,
}: {
  accounts: PremiumAccount[];
  onEvidence: (
    acct: PremiumAccount,
    type: "void" | "compliance" | "pain",
  ) => void;
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
  const typeColor: Record<string, string> = {
    void: C.void,
    compliance: C.compliance,
    pain: C.pain,
  };
  const typeLabel: Record<string, string> = {
    void: "VOID",
    compliance: "COMPL.",
    pain: "PAIN",
  };

  const allSignals: SignalItem[] = accounts
    .flatMap((a) => [
      {
        account: a,
        type: "void" as const,
        score: a.voidScore,
        event: a.voidEvent,
        time: formatRelativeTime(a.voidEvidence?.capturedAt ?? a.lastUpdated),
        color: C.void,
      },
      {
        account: a,
        type: "compliance" as const,
        score: a.complianceScore,
        event: a.complianceEvent,
        time: formatRelativeTime(
          a.complianceEvidence?.capturedAt ?? a.lastUpdated,
        ),
        color: C.compliance,
      },
      {
        account: a,
        type: "pain" as const,
        score: a.painScore,
        event: a.painEvent,
        time: formatRelativeTime(a.painEvidence?.capturedAt ?? a.lastUpdated),
        color: C.pain,
      },
    ])
    .filter((s) => filter === "all" || s.type === filter)
    .sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: "18px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}
        >
          FILTER
        </span>
        {(["all", "void", "compliance", "pain"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            style={{
              background:
                filter === f
                  ? f === "all"
                    ? C.conv
                    : typeColor[f] || C.conv
                  : "transparent",
              color: filter === f ? C.white : C.muted,
              border: `1px solid ${filter === f ? (f === "all" ? C.conv : typeColor[f] || C.conv) : C.border}`,
              borderRadius: "4px",
              padding: "3px 10px",
              fontSize: "9px",
              fontFamily: "inherit",
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "9px", color: C.muted }}>
          {allSignals.length} signals
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {allSignals.map((s, i) => (
          <motion.div
            key={`${s.account.id}-${s.type}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: "7px",
              padding: "12px 14px",
              borderLeft: `3px solid ${s.color}`,
              cursor: "pointer",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: "12px",
              alignItems: "center",
              background: C.surface,
            }}
            whileHover={{ x: 3, background: C.surface2 }}
            onClick={() => onEvidence(s.account, s.type)}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: s.color,
                background: `${s.color}12`,
                border: `1px solid ${s.color}30`,
                borderRadius: "3px",
                padding: "2px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {typeLabel[s.type]}
            </span>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.white,
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                {s.account.name}
              </div>
              <div style={{ fontSize: "10px", color: C.muted }}>{s.event}</div>
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: s.color,
                textAlign: "right",
              }}
            >
              {s.score}
            </div>
            <div
              style={{ fontSize: "9px", color: C.muted, textAlign: "right" }}
            >
              {s.time}
            </div>
          </motion.div>
        ))}
        {allSignals.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: C.muted,
              fontSize: "12px",
            }}
          >
            No signals yet. Run a full scan to populate.
          </div>
        )}
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
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{ padding: "18px" }}
  >
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "16px 18px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${C.conv}30, ${C.blue}20)`,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          {account.name[0]}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: C.white }}>
            {account.name}
          </div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
            {account.industry} · {account.employees.toLocaleString()} employees
          </div>
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "5px",
              flexWrap: "wrap",
            }}
          >
            {account.stack.slice(0, 4).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  background: C.surface3,
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <ConvergenceGauge value={account.convergence} size={80} />
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={account.status} />
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "5px" }}>
            vs {account.competitor}
          </div>
        </div>
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: account.audioEvidence
          ? "1fr 1fr 1fr 1fr"
          : "1fr 1fr 1fr",
        gap: "8px",
        marginBottom: "12px",
      }}
    >
      {[
        {
          type: "void" as const,
          label: "VOID SCANNER",
          score: account.voidScore,
          event: account.voidEvent,
          time: account.voidEvidence?.capturedAt ?? account.lastUpdated,
          color: C.void,
          conf: account.voidConfidence,
        },
        {
          type: "compliance" as const,
          label: "COMPLIANCE RADAR",
          score: account.complianceScore,
          event: account.complianceEvent,
          time: account.complianceEvidence?.capturedAt ?? account.lastUpdated,
          color: C.compliance,
          conf: account.complianceConfidence,
        },
        {
          type: "pain" as const,
          label: "PAIN LISTENER",
          score: account.painScore,
          event: account.painEvent,
          time: account.painEvidence?.capturedAt ?? account.lastUpdated,
          color: C.pain,
          conf: account.painConfidence,
        },
        ...(account.audioEvidence
          ? [
              {
                type: "audio" as const,
                label: "AUDIO INTEL",
                score: 88,
                event: account.audioSignal ?? "Podcast signal detected",
                time: account.audioEvidence?.capturedAt ?? account.lastUpdated,
                color: "#c084fc",
                conf: 0.89,
              },
            ]
          : []),
      ].map((sig) => (
        <motion.div
          key={sig.type}
          whileHover={{ y: -2, boxShadow: `0 8px 24px ${sig.color}20` }}
          onClick={() => onEvidence(sig.type)}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "7px",
            padding: "12px 14px",
            cursor: "pointer",
            borderTop: `2px solid ${sig.color}`,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              color: sig.color,
              letterSpacing: "0.1em",
              marginBottom: "6px",
            }}
          >
            {sig.label}
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: sig.color,
              lineHeight: 1,
            }}
          >
            {sig.score}
          </div>
          <ScoreBar value={sig.score} color={sig.color} />
          <div
            style={{
              fontSize: "9px",
              color: C.muted,
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            {sig.event.slice(0, 60)}
            {sig.event.length > 60 ? "..." : ""}
          </div>
          <div
            style={{
              marginTop: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ConfidenceBadge confidence={sig.conf} />
            <span style={{ fontSize: "9px", color: C.muted }}>
              {formatRelativeTime(sig.time)}
            </span>
          </div>
        </motion.div>
      ))}
    </div>

    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "7px",
          padding: "12px 14px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            color: C.muted,
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          KEY CONTACT
        </div>
        <div style={{ fontSize: "12px", color: C.white, fontWeight: 500 }}>
          {account.contact.name}
        </div>
        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
          {account.contact.title}
        </div>
        <div
          style={{
            fontSize: "9px",
            color: C.muted,
            marginTop: "8px",
            lineHeight: 1.6,
          }}
        >
          {account.contact.linkedin
            ? `linkedin.com/in/${account.contact.linkedin.split("/").pop()}`
            : "Key decision-maker for vendor evaluation"}
        </div>
      </div>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "7px",
          padding: "12px 14px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            color: C.muted,
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          NEXT ACTION
        </div>
        <div style={{ fontSize: "10px", color: C.white, lineHeight: 1.6 }}>
          {account.status === "ALERT"
            ? `Reach out to ${account.contact.name}  -  urgency window is open now`
            : "Monitor for 14 more days before outreach"}
        </div>
        <button
          onClick={onGenerateBrief}
          style={{
            marginTop: "10px",
            background: `linear-gradient(135deg, #7c3aed, ${C.conv})`,
            border: "none",
            borderRadius: "4px",
            padding: "6px 14px",
            fontSize: "9px",
            color: C.white,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.08em",
            boxShadow: `0 4px 14px ${C.conv}35`,
          }}
          data-demo="generate-brief-btn"
        >
          ✦ GENERATE INTEL BRIEF
        </button>
      </div>
    </div>
  </motion.div>
);

// ─── BRIEF VIEW ───────────────────────────────────────────────────────────────
const BriefView = ({
  brief,
  loading,
  account,
  onGenerate,
  onShare,
}: {
  brief: string;
  loading: boolean;
  account: PremiumAccount;
  onGenerate: () => void;
  onShare: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: "18px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: C.white, fontWeight: 600 }}>
            Intel Brief - {account.name}
          </div>
          <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>
            AI-generated convergence analysis
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {brief && (
            <>
              <button onClick={handleCopy} style={ghostBtnStyle}>
                <Icon.Copy /> {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={onShare} style={ghostBtnStyle}>
                <Icon.Share /> Share
              </button>
            </>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: `linear-gradient(135deg, #7c3aed, ${C.conv})`,
              border: "none",
              borderRadius: "5px",
              padding: "7px 16px",
              fontSize: "10px",
              color: C.white,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.08em",
              opacity: loading ? 0.6 : 1,
              boxShadow: `0 4px 14px ${C.conv}30`,
            }}
          >
            {loading ? (
              <span style={{ animation: "spin 0.8s linear infinite" }}>◌</span>
            ) : (
              "✦"
            )}
            {loading ? "Generating..." : "Generate Brief"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          minHeight: "360px",
        }}
      >
        {loading && (
          <div style={{ padding: "28px 22px" }}>
            <div
              style={{
                fontSize: "9px",
                color: C.conv,
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              ✦ GENERATING INTEL BRIEF
            </div>
            {[100, 70, 85, 50].map((w, i) => (
              <div
                key={i}
                style={{
                  height: "10px",
                  width: `${w}%`,
                  marginBottom: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(90deg, ${C.surface} 0px, ${C.border2} 200px, ${C.surface} 400px)`,
                  backgroundSize: "600px",
                  animation: "shimmer 1.6s linear infinite",
                }}
              />
            ))}
          </div>
        )}
        {!loading && !brief && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 24px",
              color: C.muted,
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}
            >
              ✦
            </div>
            <div style={{ fontSize: "11px" }}>
              Click &quot;Generate Brief&quot; to produce an AI-powered
            </div>
            <div style={{ fontSize: "11px" }}>
              convergence analysis for {account.name}
            </div>
          </div>
        )}
        {!loading && brief && (
          <pre
            style={{
              margin: 0,
              padding: "20px 22px",
              fontFamily: "inherit",
              fontSize: "11px",
              lineHeight: 1.9,
              color: C.text,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
          >
            {brief}
          </pre>
        )}
      </div>
    </motion.div>
  );
};

const ghostBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  background: "transparent",
  border: `1px solid ${C.border}`,
  borderRadius: "5px",
  padding: "6px 12px",
  fontSize: "10px",
  color: C.muted,
  cursor: "pointer",
  fontFamily: "inherit",
  letterSpacing: "0.04em",
  transition: "all 0.15s",
};

// ─── ENGINE META ───────────────────────────────────────────────────────────────
const ENGINE_META: Record<string, { tag: string; color: string }> = {
  bright_data: {
    tag: "Void Scanner · Compliance Radar · Pain Listener",
    color: "#00aaff",
  },
  ai_ml_api: {
    tag: "Signal scoring + Intel Brief generation",
    color: "#ff5a52",
  },
  featherless: {
    tag: "Pain signal classification (Mistral-7B)",
    color: "#24c038",
  },
  speechmatics: { tag: "Podcast & audio transcription", color: "#f0a000" },
  cognee: {
    tag: "Account memory graph (knowledge persistence)",
    color: "#9060ff",
  },
  triggerware: { tag: "Workflow routing to Slack + HubSpot", color: "#ff8800" },
  slack: {
    tag: "Real-time Slack alerts on convergence threshold",
    color: "#4A154B",
  },
  hubspot: { tag: "CRM lead creation on convergence breach", color: "#FF7A59" },
};

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
const SettingsView = ({
  integrationStatuses,
  onSignOut,
  userEmail,
}: {
  integrationStatuses: {
    id?: string;
    name: string;
    status: string;
    mode?: string;
    detail?: string;
  }[];
  onSignOut: () => void;
  userEmail?: string;
}) => {
  const engineStatus =
    integrationStatuses.length > 0
      ? integrationStatuses.map((s) => {
          const meta = ENGINE_META[s.id ?? ""] ?? {
            tag: s.detail ?? "Integration",
            color: C.muted,
          };
          return {
            name: s.name,
            tag: meta.tag,
            color: meta.color,
            live: s.status === "live",
            mode: s.mode ?? "mock",
            detail: s.detail ?? "",
          };
        })
      : [
          {
            name: "Bright Data",
            tag: "Void Scanner · Compliance Radar · Pain Listener",
            color: "#00aaff",
            live: false,
            mode: "mock",
            detail: "Set BRIGHT_DATA_MODE=real + BRIGHT_DATA_API_KEY",
          },
          {
            name: "AI/ML API",
            tag: "Signal scoring + Intel Brief generation",
            color: "#ff5a52",
            live: false,
            mode: "mock",
            detail: "Set AI_ML_MODE=real + AI_ML_API_KEY",
          },
          {
            name: "Featherless AI",
            tag: "Pain signal classification (Mistral-7B)",
            color: "#24c038",
            live: false,
            mode: "mock",
            detail: "Set FEATHERLESS_MODE=real + FEATHERLESS_API_KEY",
          },
          {
            name: "Speechmatics",
            tag: "Podcast & audio transcription",
            color: "#f0a000",
            live: false,
            mode: "mock",
            detail: "Set SPEECHMATICS_MODE=real + SPEECHMATICS_API_KEY",
          },
          {
            name: "Cognee",
            tag: "Account memory graph (knowledge persistence)",
            color: "#9060ff",
            live: true,
            mode: "real",
            detail: "Browser localStorage (zero-config)",
          },
          {
            name: "TriggerWare",
            tag: "Workflow routing to Slack + HubSpot",
            color: "#ff8800",
            live: false,
            mode: "mock",
            detail: "Set TRIGGERWARE_MODE=real + TRIGGERWARE_WEBHOOK_URL",
          },
          {
            name: "Slack",
            tag: "Real-time Slack alerts on convergence threshold",
            color: "#4A154B",
            live: false,
            mode: "mock",
            detail: "Set SLACK_MODE=real + SLACK_WEBHOOK_URL",
          },
          {
            name: "HubSpot",
            tag: "CRM lead creation on convergence breach",
            color: "#FF7A59",
            live: false,
            mode: "mock",
            detail: "Set HUBSPOT_MODE=real + HUBSPOT_WEBHOOK_URL",
          },
        ];

  const liveCount = engineStatus.filter((e) => e.live).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: "18px" }}
    >
      {/* Account info */}
      {userEmail && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                color: C.muted,
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              SIGNED IN AS
            </div>
            <div style={{ fontSize: "12px", color: C.white }}>{userEmail}</div>
          </div>
          <LiveDot color={C.pain} pulse />
        </div>
      )}

      {/* Integration list */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "9px",
            color: C.muted,
            letterSpacing: "0.1em",
            marginBottom: "10px",
          }}
        >
          INTEGRATION STATUS
        </div>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {engineStatus.map((e, i) => (
            <div
              key={e.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                gap: "14px",
                borderBottom:
                  i < engineStatus.length - 1
                    ? `1px solid ${C.border}`
                    : "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <LiveDot color={e.live ? C.pain : C.muted} pulse={e.live} />
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: C.white,
                      fontWeight: 500,
                    }}
                  >
                    {e.name}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: C.muted,
                      marginTop: "1px",
                    }}
                  >
                    {e.tag}
                  </div>
                  {!e.live && e.detail && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: C.dim,
                        marginTop: "2px",
                      }}
                    >
                      {e.detail}
                    </div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  letterSpacing: "0.06em",
                  background: e.live ? `${C.pain}12` : `${C.muted}10`,
                  color: e.live ? C.pain : C.muted,
                  border: `1px solid ${e.live ? C.pain : C.muted}28`,
                  whiteSpace: "nowrap",
                }}
              >
                {e.live ? "● LIVE" : "○ MOCK"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {[
          {
            label: "LIVE APIS",
            value: `${liveCount}`,
            sub: `of ${engineStatus.length}`,
            color: C.pain,
          },
          {
            label: "PRICING",
            value: "$1,000",
            sub: "/month · Elite",
            color: C.conv,
          },
          {
            label: "PLAN",
            value: "Elite",
            sub: "All 3 engines",
            color: C.blue,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "7px",
              padding: "13px 15px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: C.muted,
                letterSpacing: "0.1em",
                marginBottom: "7px",
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSignOut}
        style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: "7px",
          padding: "11px",
          fontSize: "10px",
          color: C.muted,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.06em",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.void;
          e.currentTarget.style.color = C.void;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.color = C.muted;
        }}
      >
        Sign out of PreIntent
      </button>
    </motion.div>
  );
};

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: View; label: string; Icon: React.FC }[] = [
  { id: "dashboard", label: "OVERVIEW", Icon: Icon.Dashboard },
  { id: "signals", label: "SIGNALS", Icon: Icon.Signal },
  { id: "intel", label: "INTEL", Icon: Icon.Intel },
  { id: "brief", label: "BRIEF", Icon: Icon.Brief },
  { id: "knowledge", label: "KNOWLEDGE", Icon: Icon.Book },
  { id: "settings", label: "SETTINGS", Icon: Icon.Settings },
];

// Dynamic ticker signals will be computed inside the component

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RealDashboard({
  userEmail,
  knowledgeDoc: initialKnowledgeDoc,
}: {
  userEmail?: string;
  knowledgeDoc?: CompanyKnowledgeDoc | null;
}) {
  const { addToast } = useToast();
  const toast = createToastHelpers(addToast);

  const [view, setView] = useState<View>("dashboard");
  const [accounts, setAccounts] = useState<PremiumAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PremiumAccount | null>(
    null,
  );
  const [knowledgeDoc, setKnowledgeDoc] = useState<CompanyKnowledgeDoc | null>(
    initialKnowledgeDoc ?? null,
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [scanDone, setScanDone] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [triggerFired, setTriggerFired] = useState(false);
  const [liveIntegrations, setLiveIntegrations] = useState<
    {
      id?: string;
      name: string;
      status: string;
      mode?: string;
      detail?: string;
    }[]
  >([]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<
    "void" | "compliance" | "pain" | "audio"
  >("void");
  const [evidenceAccount, setEvidenceAccount] = useState<PremiumAccount | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [signalFilter, setSignalFilter] = useState<
    "all" | "void" | "compliance" | "pain"
  >("all");
  const [tickerIdx, setTickerIdx] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [setupComplete, setSetupComplete] = useState(true);
  const [scanningIds, setScanningIds] = useState<Set<number>>(new Set());
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load persisted accounts + knowledge doc from localStorage ─────────────
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem("preintent_accounts");
      if (storedAccounts) {
        try {
          const parsed = JSON.parse(storedAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // A simple structural check to ensure it loosely matches PremiumAccount shape
            const isValid = parsed.every(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                "id" in item &&
                "name" in item &&
                "convergence" in item,
            );
            if (isValid) {
              // eslint-disable-next-line react-hooks/set-state-in-effect
              setAccounts(parsed as PremiumAccount[]);
            } else {
              console.warn(
                "Invalid preintent_accounts structure in localStorage",
              );
            }
          }
        } catch (err) {
          console.error("Failed to parse preintent_accounts:", err);
        }
      }

      // Load knowledge doc if not passed from server
      if (!initialKnowledgeDoc) {
        const stored = localStorage.getItem("preintent_company_kdoc");
        if (stored) {
          try {
            const doc = JSON.parse(stored) as CompanyKnowledgeDoc;
            if (
              typeof doc === "object" &&
              doc !== null &&
              "companyName" in doc &&
              "icp" in doc
            ) {
              setKnowledgeDoc(doc);

              // Check setup status from knowledge doc
              if (
                Array.isArray(doc.seedAccounts) &&
                doc.seedAccounts.length > 0
              ) {
                setSetupComplete(true);
                // Convert seed accounts  -  pass doc so resolved URLs can be used
                const seedPremium = doc.seedAccounts.map((s, i) =>
                  seedAccountToPremium(s, i, doc),
                );
                if (seedPremium.length > 0) {
                  setAccounts((prev) => {
                    const prevIds = new Set(prev.map((a) => a.id));
                    return [
                      ...prev,
                      ...seedPremium.filter((a) => !prevIds.has(a.id)),
                    ];
                  });
                }
              }
            } else {
              console.warn(
                "Invalid preintent_company_kdoc structure in localStorage",
              );
              setSetupComplete(false);
            }
          } catch (err) {
            console.error("Failed to parse preintent_company_kdoc:", err);
            setSetupComplete(false);
          }
        } else {
          // No knowledge doc = onboarding incomplete
          setSetupComplete(false);
        }
      } else {
        setSetupComplete(true);
        // Add seed accounts from knowledge doc, passing doc for resolved URLs
        if (initialKnowledgeDoc.seedAccounts?.length > 0) {
          const seedPremium = initialKnowledgeDoc.seedAccounts.map((s, i) =>
            seedAccountToPremium(s, i, initialKnowledgeDoc),
          );
          if (seedPremium.length > 0) {
            setAccounts((prev) => {
              const prevIds = new Set(prev.map((a) => a.id));
              return [
                ...prev,
                ...seedPremium.filter((a) => !prevIds.has(a.id)),
              ];
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to load persisted accounts:", e);
    }
  }, [initialKnowledgeDoc]);

  // Persist custom accounts to localStorage whenever they change
  useEffect(() => {
    try {
      if (accounts.length > 0) {
        localStorage.setItem("preintent_accounts", JSON.stringify(accounts));
      }
    } catch {
      // non-fatal
    }
  }, [accounts]);

  // ── Fetch real integration health ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setLiveIntegrations(d.integrations || []))
      .catch(() => {});
  }, []);

  // ── Ticker ────────────────────────────────────────────────────────────────
  const dynamicTickerSignals = useMemo(() => {
    return accounts
      .filter((a) => a.convergence > 0 && a.lastUpdated)
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      )
      .flatMap((a) => {
        const sigs = [];
        if (a.voidEvent)
          sigs.push({
            engine: "VOID",
            company: a.name,
            event: a.voidEvent,
            time: formatRelativeTime(a.lastUpdated),
            color: C.void,
          });
        if (a.complianceEvent)
          sigs.push({
            engine: "COMPL.",
            company: a.name,
            event: a.complianceEvent,
            time: formatRelativeTime(a.lastUpdated),
            color: C.compliance,
          });
        if (a.painEvent)
          sigs.push({
            engine: "PAIN",
            company: a.name,
            event: a.painEvent,
            time: formatRelativeTime(a.lastUpdated),
            color: C.pain,
          });
        return sigs;
      })
      .slice(0, 5);
  }, [accounts]);

  useEffect(() => {
    if (dynamicTickerSignals.length === 0) return;
    const int = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % dynamicTickerSignals.length);
    }, 4000);
    return () => clearInterval(int);
  }, [dynamicTickerSignals.length]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "+") setAddModalOpen(true);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handleSignOut = async () => {
    const { handleSignOutClient } = await import("@/lib/signout-helper");
    await handleSignOutClient();
  };

  // ── LIVE SWEEP  -  calls real /api/sweep ─────────────────────────────────────
  const runScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    setScanDone(false);
    setTriggerFired(false);
    toast.info(
      "Full scan initiated",
      `Monitoring ${accounts.length} accounts across 3 engines`,
    );

    // Animate scan steps in parallel with real API call
    let step = 0;
    scanRef.current = setInterval(() => {
      step = Math.min(step + 1, SCAN_STEPS.length - 1);
      setScanStep(step);
    }, 900);

    // Run real sweep for each account (with concurrency limit = 2)
    const runAccountSweep = async (account: PremiumAccount) => {
      const doc = knowledgeDoc;
      // Use account-level competitor if set; fall back to first resolved competitor from knowledge doc
      const competitor =
        account.competitor ||
        doc?.resolvedCompetitors?.[0]?.originalName ||
        doc?.scanConfig.competitors[0] ||
        undefined;

      // Use resolved pricing URL if available
      const resolvedComp = doc?.resolvedCompetitors?.find(
        (rc) =>
          rc.originalName === competitor || rc.resolvedName === competitor,
      );
      const competitorPricingUrl =
        account.competitorPricingUrl ||
        resolvedComp?.pricingUrl ||
        (account.competitorUrl
          ? `https://${account.competitorUrl}`
          : undefined);

      try {
        setScanningIds((prev) => {
          const next = new Set(prev);
          next.add(account.id);
          return next;
        });
        const res = await fetch("/api/sweep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: account.name,
            industry: account.industry,
            employees: account.employees,
            competitor,
            competitorPricingUrl,
            regulatoryQuery: doc?.scanConfig.regulatoryKeywords[0],
            crmStage: "Not in pipeline",
            selfCompany: doc?.companyName,
            selfContext: doc?.segmentSummary,
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data.success || !data.profile) return null;

        const profile = data.profile;
        return {
          accountId: account.id,
          result: {
            convergenceScore: profile.convergenceScore,
            urgency: profile.urgency,
            voidScore: profile.void?.subScore ?? 0,
            complianceScore: profile.compliance?.subScore ?? 0,
            painScore: profile.pain?.subScore ?? 0,
            voidEvent: profile.void?.signals?.[0]?.title ?? account.voidEvent,
            complianceEvent:
              profile.compliance?.signals?.[0]?.title ??
              account.complianceEvent,
            painEvent: profile.pain?.signals?.[0]?.title ?? account.painEvent,
            slackSent: data.slackSent,
            hubspotSent: data.hubspotSent,
          } as SweepResult,
        };
      } catch {
        return null;
      } finally {
        setScanningIds((prev) => {
          const next = new Set(prev);
          next.delete(account.id);
          return next;
        });
      }
    };

    const results = [];
    const concurrencyLimit = 2;
    for (let i = 0; i < accounts.length; i += concurrencyLimit) {
      const batch = accounts.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch.map(runAccountSweep));
      results.push(...batchResults);
    }

    // Apply results to accounts
    const resultMap = new Map<number, SweepResult>();
    for (const r of results) {
      if (r) resultMap.set(r.accountId, r.result);
    }

    if (scanRef.current) clearInterval(scanRef.current);
    setScanStep(SCAN_STEPS.length - 1);

    setAccounts((prev) =>
      prev.map((a) => {
        const r = resultMap.get(a.id);
        return r ? sweepResultToAccount(a, r) : a;
      }),
    );

    // Check threshold triggers
    const topResult = Array.from(resultMap.values()).sort(
      (a, b) => b.convergenceScore - a.convergenceScore,
    )[0];
    const slackSent = Array.from(resultMap.values()).some((r) => r.slackSent);
    const hubspotSent = Array.from(resultMap.values()).some(
      (r) => r.hubspotSent,
    );

    const highAlerts = Array.from(resultMap.values()).filter(
      (r) => r.convergenceScore >= 85,
    ).length;
    if (highAlerts > 0) {
      setTriggerFired(true);
      toast.convergenceAlert(
        accounts[0]?.name ?? "Account",
        topResult?.convergenceScore ?? 85,
      );
      if (slackSent)
        setTimeout(
          () => toast.triggerWareFired(accounts[0]?.name ?? "Account"),
          900,
        );
    }

    setIsScanning(false);
    setScanDone(true);
    setScanningIds(new Set());
    setScanResult(
      highAlerts > 0
        ? `${highAlerts} account${highAlerts > 1 ? "s" : ""} at threshold  -  TriggerWare fired${slackSent ? "  -  Slack delivered" : ""}${hubspotSent ? "  -  HubSpot updated" : ""}`
        : `Scan complete  -  ${accounts.length} accounts updated`,
    );
  }, [isScanning, accounts, knowledgeDoc, toast]);

  // ── ADD CUSTOM ACCOUNT ────────────────────────────────────────────────────
  const handleAddAccount = useCallback(
    async (data: {
      name: string;
      industry: string;
      employees: number;
      competitor: string;
      competitorPricingUrl: string;
    }) => {
      const newId = Math.max(...accounts.map((a) => a.id), 200) + 1;
      const newAccount: PremiumAccount = {
        id: newId,
        name: data.name,
        displayName: data.name,
        industry: data.industry,
        employees: data.employees,
        location: "Unknown",
        website: data.name.toLowerCase().replace(/\s+/g, "") + ".com",
        linkedinUrl: "",
        competitor: data.competitor,
        competitorUrl: data.competitorPricingUrl,
        voidScore: 0,
        voidConfidence: 0,
        complianceScore: 0,
        complianceConfidence: 0,
        painScore: 0,
        painConfidence: 0,
        convergence: 0,
        overallConfidence: 0,
        status: "MONITOR" as const,
        contact: {
          title: "Decision Maker",
          name: data.name + " Contact",
          linkedin: "",
        },
        stack: [],
        voidEvent: `Monitor ${data.competitor} pricing changes`,
        voidEvidence: {
          title: "Awaiting Scan",
          type: "document",
          source: "Run a sweep to populate evidence",
          capturedAt: new Date().toISOString(),
          details: ["Account just added  -  run a scan to get live signals"],
        },
        complianceEvent: "Regulatory window analysis pending",
        complianceEvidence: {
          title: "Awaiting Scan",
          type: "document",
          source: "Run a sweep to populate evidence",
          capturedAt: new Date().toISOString(),
          details: ["Account just added  -  run a scan to get live signals"],
        },
        painEvent: "Community signal analysis pending",
        painEvidence: {
          title: "Awaiting Scan",
          type: "document",
          source: "Run a sweep to populate evidence",
          capturedAt: new Date().toISOString(),
          details: ["Account just added  -  run a scan to get live signals"],
        },
        lastUpdated: new Date().toISOString(),
      };

      setAccounts((prev) => [...prev, newAccount]);
      toast.info(`${data.name} added`, "Running sweep...");

      // Immediately sweep the new account
      try {
        const res = await fetch("/api/sweep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: data.name,
            industry: data.industry,
            employees: data.employees,
            competitor: data.competitor,
            competitorPricingUrl: data.competitorPricingUrl || undefined,
            crmStage: "Not in pipeline",
            selfCompany: knowledgeDoc?.companyName,
            selfContext: knowledgeDoc?.segmentSummary,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.profile) {
            const profile = result.profile;
            const sweepRes: SweepResult = {
              convergenceScore: profile.convergenceScore,
              urgency: profile.urgency,
              voidScore: profile.void?.subScore ?? 0,
              complianceScore: profile.compliance?.subScore ?? 0,
              painScore: profile.pain?.subScore ?? 0,
              voidEvent:
                profile.void?.signals?.[0]?.title ?? newAccount.voidEvent,
              complianceEvent:
                profile.compliance?.signals?.[0]?.title ??
                newAccount.complianceEvent,
              painEvent:
                profile.pain?.signals?.[0]?.title ?? newAccount.painEvent,
              slackSent: result.slackSent,
              hubspotSent: result.hubspotSent,
            };
            setAccounts((prev) =>
              prev.map((a) =>
                a.id === newId ? sweepResultToAccount(a, sweepRes) : a,
              ),
            );
            toast.info(
              `${data.name} sweep complete`,
              `Convergence: ${profile.convergenceScore}/100`,
            );
            if (profile.convergenceScore >= 85) {
              setTriggerFired(true);
              toast.convergenceAlert(data.name, profile.convergenceScore);
            }
          }
        }
      } catch (err) {
        console.error("Individual account sweep failed:", err);
      }
    },
    [accounts, toast],
  );

  // ── GENERATE BRIEF  -  uses real AI/ML API ─────────────────────────────────
  const generateBrief = useCallback(async () => {
    const acc = selectedAccount;
    if (!acc) return;
    setBriefLoading(true);
    setBrief("");
    toast.info("Generating Intel Brief", `Analyzing ${acc.name}...`);

    try {
      const { generateRealIntelBrief } = await import("@/app/actions");
      const mockProfile = {
        account: acc.name,
        industry: acc.industry,
        employees: acc.employees,
        crmStage: "Not in pipeline",
        lastUpdated: new Date().toISOString(),
        void: {
          signals: [
            {
              text: acc.voidEvent,
              source: "Void Scanner",
              score: acc.voidScore,
              id: "v1",
              engine: "void" as const,
              title: acc.voidEvent,
              description: acc.voidEvent,
              eventTime: acc.lastUpdated,
              subScore: acc.voidScore,
              confidence: acc.voidConfidence,
              provenance: {
                sponsor: "bright_data" as const,
                capturedAt: acc.lastUpdated,
              },
            },
          ],
          subScore: acc.voidScore,
        },
        compliance: {
          signals: [
            {
              text: acc.complianceEvent,
              source: "Compliance Radar",
              score: acc.complianceScore,
              id: "c1",
              engine: "compliance" as const,
              title: acc.complianceEvent,
              description: acc.complianceEvent,
              eventTime: acc.lastUpdated,
              subScore: acc.complianceScore,
              confidence: acc.complianceConfidence,
              provenance: {
                sponsor: "bright_data" as const,
                capturedAt: acc.lastUpdated,
              },
            },
          ],
          subScore: acc.complianceScore,
        },
        pain: {
          signals: [
            {
              text: acc.painEvent,
              source: "Pain Listener",
              score: acc.painScore,
              id: "p1",
              engine: "pain" as const,
              title: acc.painEvent,
              description: acc.painEvent,
              eventTime: acc.lastUpdated,
              subScore: acc.painScore,
              confidence: acc.painConfidence,
              provenance: {
                sponsor: "featherless" as const,
                capturedAt: acc.lastUpdated,
              },
            },
          ],
          subScore: acc.painScore,
        },
        convergenceScore: acc.convergence,
        urgency: computeUrgency(
          acc.convergence,
          Math.max(acc.voidScore, acc.complianceScore, acc.painScore),
        ),
      };

      const realBrief = await generateRealIntelBrief(
        mockProfile as unknown as AccountIntelligenceProfile,
        {
          company: knowledgeDoc?.companyName,
          context: knowledgeDoc?.segmentSummary,
        },
      );
      const formatted = `WHY NOW  -  3 CONVERGING SIGNALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① COMPETITOR RETREAT  [${acc.voidScore}/100]  ${Math.round(acc.voidConfidence * 100)}% confidence
${acc.voidEvent}
Detected: ${formatRelativeTime(acc.voidEvidence?.capturedAt ?? acc.lastUpdated)}

② REGULATORY PRESSURE  [${acc.complianceScore}/100]  ${Math.round(acc.complianceConfidence * 100)}% confidence
${acc.complianceEvent}
Detected: ${formatRelativeTime(acc.complianceEvidence?.capturedAt ?? acc.lastUpdated)}

③ ACTIVE EVALUATION  [${acc.painScore}/100]  ${Math.round(acc.painConfidence * 100)}% confidence
${acc.painEvent}
Detected: ${formatRelativeTime(acc.painEvidence?.capturedAt ?? acc.lastUpdated)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED OPENING LINE

"${realBrief.suggestedOpeningLine || `Hi [Name]  -  I noticed ${acc.competitor} made some changes recently. Given that and the regulatory tailwinds, the timing feels right for a quick conversation.`}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CONTEXT
  Company    : ${acc.name}
  Industry   : ${acc.industry}
  Employees  : ${acc.employees.toLocaleString()}
  Competitor : ${acc.competitor}
  Convergence: ${acc.convergence}/100
  Urgency    : ${mockProfile.urgency}
  Status     : ${acc.status}

${realBrief.whyNow?.map((w, i) => `[${["VOID", "COMPLIANCE", "PAIN"][i] || w.engine.toUpperCase()}] Sub-score ${w.subScore}/100\n${w.narrative}`).join("\n\n") ?? ""}`;

      let i = 0;
      let lastTime = performance.now();

      const animateBrief = (time: number) => {
        if (time - lastTime >= 8) {
          i += 6;
          setBrief(formatted.slice(0, i));
          lastTime = time;
        }

        if (i < formatted.length) {
          requestAnimationFrame(animateBrief);
        } else {
          setBriefLoading(false);
          toast.briefGenerated(acc.name);
        }
      };

      requestAnimationFrame(animateBrief);
    } catch {
      setBriefLoading(false);
      toast.error("Brief generation failed", "Using fallback");
    }
  }, [selectedAccount, toast]);

  const openEvidence = (
    acct: PremiumAccount,
    type: "void" | "compliance" | "pain" | "audio",
  ) => {
    setEvidenceAccount(acct);
    setEvidenceType(type);
    setEvidenceOpen(true);
  };

  const autopilotActions = useMemo(
    () => ({
      setView,
      runScan,
      generateBrief,
      selectAccount: (a: PremiumAccount) => setSelectedAccount(a),
      openEvidence,
      closeEvidence: () => setEvidenceOpen(false),
      openShare: () => setShareOpen(true),
      closeShare: () => setShareOpen(false),
      filterSignals: setSignalFilter,
      getAccounts: () => accounts,
    }),
    [accounts, runScan, generateBrief],
  );

  const selectAccountAndView = (a: PremiumAccount, v: View = "intel") => {
    setSelectedAccount(a);
    setView(v);
  };

  const alertCount = accounts.filter((a) => a.status === "ALERT").length;
  const signalCount = accounts.length * 3;
  const liveApisCount = liveIntegrations.filter(
    (i) => i.status === "live",
  ).length;

  // ── DASHBOARD OVERVIEW ─────────────────────────────────────────────────────
  const renderDashboardView = () => (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: "18px" }}
    >
      {/* Setup banner if onboarding incomplete */}
      {!setupComplete && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `${C.conv}10`,
            border: `1px solid ${C.conv}35`,
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: C.white,
                marginBottom: "3px",
              }}
            >
              Complete your intelligence setup
            </div>
            <div style={{ fontSize: "10px", color: C.muted }}>
              Finish onboarding to generate your company knowledge doc and
              configure your scan targets.
            </div>
          </div>
          <Link
            href="/onboarding"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, #7c3aed, ${C.conv})`,
              color: C.white,
              textDecoration: "none",
              fontSize: "11px",
              padding: "6px 16px",
              borderRadius: "6px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: `0 4px 14px ${C.conv}30`,
            }}
          >
            Complete Setup →
          </Link>
        </motion.div>
      )}

      {/* Live ticker */}
      {dynamicTickerSignals.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tickerIdx}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              marginBottom: "14px",
              padding: "8px 14px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <LiveDot color={dynamicTickerSignals[tickerIdx]?.color} pulse />
            <span
              style={{
                fontSize: "9px",
                fontWeight: 600,
                color: dynamicTickerSignals[tickerIdx]?.color,
                letterSpacing: "0.08em",
              }}
            >
              {dynamicTickerSignals[tickerIdx]?.engine}
            </span>
            <span style={{ fontSize: "10px", color: C.text }}>
              <span style={{ color: C.white }}>
                {dynamicTickerSignals[tickerIdx]?.company}
              </span>
              {"  -  "}
              {dynamicTickerSignals[tickerIdx]?.event}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: "9px",
                color: C.muted,
                flexShrink: 0,
              }}
            >
              {dynamicTickerSignals[tickerIdx]?.time}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Stat cards */}
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <StatCard
          label="ACCOUNTS"
          value={`${accounts.length}`}
          sub="monitored"
          color={C.blue}
          delay={0}
        />
        <StatCard
          label="ALERTS"
          value={`${alertCount}`}
          sub="act now"
          color={C.void}
          delay={1}
        />
        <StatCard
          label="SIGNALS"
          value={`${signalCount}`}
          sub="3 engines"
          color={C.pain}
          delay={2}
        />
        <StatCard
          label="LIVE APIs"
          value={`${liveApisCount}`}
          sub="of 8 integrations"
          color={C.conv}
          delay={3}
          onClick={() => setView("settings")}
        />
      </div>

      {/* Company context ribbon (if knowledge doc exists) */}
      {knowledgeDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: C.surface,
            border: `1px solid ${C.conv}25`,
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: C.conv,
              letterSpacing: "0.1em",
              flexShrink: 0,
            }}
          >
            YOUR COMPANY
          </div>
          <div style={{ fontSize: "12px", color: C.white, fontWeight: 600 }}>
            {knowledgeDoc.companyName}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {knowledgeDoc.scanConfig.competitors.slice(0, 3).map((c) => (
              <span
                key={c}
                style={{
                  fontSize: "9px",
                  padding: "2px 7px",
                  background: `${C.void}12`,
                  border: `1px solid ${C.void}25`,
                  borderRadius: "3px",
                  color: C.void,
                }}
              >
                vs {c}
              </span>
            ))}
          </div>
          <button
            onClick={() => setView("knowledge")}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "5px",
              padding: "4px 12px",
              fontSize: "10px",
              color: C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            View Knowledge Doc →
          </button>
        </motion.div>
      )}

      {/* Scan panel */}
      <div style={{ marginBottom: "14px" }}>
        <ScanPanel
          isScanning={isScanning}
          step={scanStep}
          done={scanDone}
          onScan={runScan}
          result={scanResult}
        />
      </div>

      {/* Sponsor row */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            color: C.muted,
            letterSpacing: "0.04em",
            marginRight: "2px",
          }}
        >
          powered by
        </span>
        {Object.keys(sponsorColors).map((n) => (
          <SponsorPill key={n} name={n} />
        ))}
      </div>

      {/* Accounts table */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 0.9fr 60px 60px 60px 64px 90px 90px",
            padding: "8px 16px",
            borderBottom: `1px solid ${C.border}`,
            fontSize: "8px",
            color: C.muted,
            letterSpacing: "0.1em",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <span>COMPANY</span>
          <span>INDUSTRY</span>
          <span>VOID</span>
          <span>COMPL.</span>
          <span>PAIN</span>
          <span>CONV.</span>
          <span>STATUS</span>
          <span>CONFIDENCE</span>
        </div>

        {accounts.length === 0 ? (
          <div style={{ padding: "44px 24px", textAlign: "center" }}>
            <div
              style={{ fontSize: "26px", marginBottom: "12px", opacity: 0.5 }}
            >
              ✦
            </div>
            <div
              style={{
                fontSize: "13px",
                color: C.white,
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              No accounts yet
            </div>
            <div
              style={{
                fontSize: "11px",
                color: C.muted,
                lineHeight: 1.6,
                maxWidth: "420px",
                margin: "0 auto 16px",
              }}
            >
              {knowledgeDoc
                ? "Add a target account to start monitoring competitor retreats, regulatory pressure, and community buying signals."
                : "Complete onboarding to auto-seed target accounts from your company profile, or add one manually to get started."}
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setAddModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #7c3aed, #9060ff)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(144,96,255,0.3)",
                }}
              >
                <Icon.Plus /> Add your first account
              </button>
              {!knowledgeDoc && (
                <a
                  href="/onboarding"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "10px",
                    color: C.muted,
                    textDecoration: "none",
                    fontFamily: "inherit",
                  }}
                >
                  Complete onboarding →
                </a>
              )}
            </div>
          </div>
        ) : (
          accounts.map((a, idx) => {
            const isRowScanning = scanningIds.has(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  background:
                    selectedAccount?.id === a.id ? `${C.conv}06` : C.surface,
                }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => selectAccountAndView(a)}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.8fr 0.9fr 60px 60px 60px 64px 90px 90px",
                  padding: "11px 16px",
                  gap: "8px",
                  alignItems: "center",
                  borderBottom:
                    idx < accounts.length - 1
                      ? `1px solid ${C.border}`
                      : "none",
                  borderLeft: isRowScanning
                    ? `2px solid ${C.conv}`
                    : "2px solid transparent",
                  cursor: "pointer",
                }}
                whileHover={{ background: C.surface2 }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: C.white,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    {a.name}
                    {isRowScanning && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "8px",
                          color: C.conv,
                          letterSpacing: "0.08em",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            animation: "spin 0.9s linear infinite",
                          }}
                        >
                          ◌
                        </span>
                        SCANNING
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: C.muted,
                      marginTop: "2px",
                    }}
                  >
                    {a.employees.toLocaleString()} · {a.location}
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: C.muted }}>
                  {a.industry}
                </div>
                {[
                  [a.voidScore, C.void],
                  [a.complianceScore, C.compliance],
                  [a.painScore, C.pain],
                ].map(([score, color], i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: color as string,
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {isRowScanning ? "·" : score}
                    </div>
                    <ScoreBar
                      value={isRowScanning ? 0 : (score as number)}
                      color={color as string}
                      delay={idx}
                    />
                  </div>
                ))}
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color:
                      a.convergence >= 75
                        ? C.void
                        : a.convergence >= 55
                          ? C.compliance
                          : C.muted,
                  }}
                >
                  {isRowScanning ? (
                    <span
                      style={{
                        fontSize: "12px",
                        color: C.conv,
                        display: "inline-block",
                        animation: "spin 0.9s linear infinite",
                      }}
                    >
                      ◌
                    </span>
                  ) : (
                    a.convergence
                  )}
                </div>
                <div>
                  <StatusBadge status={a.status} />
                </div>
                <div>
                  <ConfidenceBadge confidence={a.overallConfidence} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add account button */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button
          onClick={() => setAddModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "transparent",
            border: `1px dashed ${C.border}`,
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "10px",
            color: C.muted,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.conv;
            e.currentTarget.style.color = C.conv;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
          }}
        >
          <Icon.Plus /> Add Account to Monitor
        </button>
      </div>
    </motion.div>
  );

  const evidenceData =
    evidenceType === "void"
      ? evidenceAccount?.voidEvidence
      : evidenceType === "compliance"
        ? evidenceAccount?.complianceEvidence
        : evidenceType === "pain"
          ? evidenceAccount?.painEvidence
          : evidenceAccount?.audioEvidence;

  return (
    <div
      className="dashboard-container"
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { from{background-position:-600px 0} to{background-position:600px 0} }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── TOP NAV ── */}
      <div
        className="sidebar-nav"
        style={{
          display: "flex",
          alignItems: "center",
          height: "52px",
          background: `rgba(12,16,24,0.95)`,
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "0 18px",
          gap: "0",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <a
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            fontSize: "13px",
            color: C.white,
            letterSpacing: "0.18em",
            marginRight: "28px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Icon.Logo />
          PREINTENT
        </a>

        <div
          className="hide-on-mobile"
          style={{
            width: "1px",
            height: "24px",
            background: C.border,
            marginRight: "18px",
          }}
        />

        {/* Nav tabs */}
        <div className="nav-tabs" style={{ display: "flex", height: "100%" }}>
          {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                position: "relative",
                height: "52px",
                padding: "0 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "9px",
                fontFamily: "inherit",
                letterSpacing: "0.12em",
                color: view === id ? C.white : C.muted,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderBottom:
                  view === id ? `2px solid ${C.conv}` : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (view !== id) e.currentTarget.style.color = C.text;
              }}
              onMouseLeave={(e) => {
                if (view !== id) e.currentTarget.style.color = C.muted;
              }}
            >
              <NavIcon />
              {label}
              {id === "signals" && alertCount > 0 && (
                <span
                  style={{
                    background: C.void,
                    color: C.white,
                    borderRadius: "99px",
                    fontSize: "8px",
                    padding: "0px 5px",
                    minWidth: "16px",
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <AnimatePresence>
            {triggerFired && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: "9px",
                  color: C.compliance,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Icon.Zap /> TriggerWare fired
              </motion.span>
            )}
          </AnimatePresence>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "9px",
              color: C.muted,
            }}
          >
            <LiveDot color={C.pain} pulse />
            LIVE
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: `${C.conv}15`,
              border: `1px solid ${C.conv}35`,
              borderRadius: "5px",
              padding: "4px 10px",
              fontSize: "9px",
              color: C.conv,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon.Plus /> Add Account
          </button>

          <button
            onClick={handleSignOut}
            style={{ ...ghostBtnStyle, fontSize: "9px", padding: "4px 10px" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        className="main-content"
        style={{
          flex: 1,
          overflowY: "auto",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          paddingBottom: "40px",
        }}
      >
        {/* Account selector sub-bar */}
        {(view === "intel" || view === "brief") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderBottom: `1px solid ${C.border}`,
              overflowX: "auto",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: C.muted,
                marginRight: "6px",
                flexShrink: 0,
                letterSpacing: "0.06em",
              }}
            >
              ACCOUNT
            </span>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAccount(a)}
                style={{
                  background:
                    selectedAccount?.id === a.id
                      ? `${C.conv}15`
                      : "transparent",
                  border: `1px solid ${selectedAccount?.id === a.id ? C.conv : C.border}`,
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: "10px",
                  color: selectedAccount?.id === a.id ? C.conv : C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {a.name}
                {a.status === "ALERT" && (
                  <span
                    style={{
                      marginLeft: "5px",
                      color: C.void,
                      fontSize: "8px",
                    }}
                  >
                    ●
                  </span>
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
          {view === "intel" && selectedAccount && (
            <IntelView
              key="intel"
              account={selectedAccount}
              onGenerateBrief={() => {
                setView("brief");
                generateBrief();
              }}
              onEvidence={(type) => openEvidence(selectedAccount, type)}
            />
          )}
          {view === "brief" && selectedAccount && (
            <BriefView
              key="brief"
              brief={brief}
              loading={briefLoading}
              account={selectedAccount}
              onGenerate={generateBrief}
              onShare={() => setShareOpen(true)}
            />
          )}
          {view === "knowledge" && (
            <KnowledgeView key="knowledge" doc={knowledgeDoc} />
          )}
          {view === "settings" && (
            <SettingsView
              key="settings"
              integrationStatuses={liveIntegrations}
              onSignOut={handleSignOut}
              userEmail={userEmail}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── MODALS ── */}
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
        account={selectedAccount ?? undefined}
      />

      {/* Add Account Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <AddAccountModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdd={handleAddAccount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
