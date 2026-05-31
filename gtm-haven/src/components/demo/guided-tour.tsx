"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PremiumAccount } from "@/lib/premium-demo-data";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#07090f", surface: "#0c1018", surface2: "#0f161f", surface3: "#111820",
  border: "#18232f", border2: "#1e2d3e", text: "#c2d0de", muted: "#4a6070",
  dim: "#1a2535", conv: "#9060ff", void: "#ff5a52", compliance: "#f0a000",
  pain: "#24c038", blue: "#2070ff", white: "#ddeeff",
};

// ─── TOUR STEPS ────────────────────────────────────────────────────────────────
interface TourStep {
  id: string;
  chapter: string;
  title: string;
  script: string;        // What to say (teleprompter)
  show: string;          // What to show/click (presenter action)
  accent: string;
  duration: number;      // ms
  tag?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "intro",
    chapter: "INTRO",
    title: "Welcome to Preintent",
    script: "What I'm about to show you is a deal that every traditional intent vendor would miss entirely. Not because the signal was hidden — but because they only watch one feed. Preintent watches three simultaneously and triangulates them.",
    show: "Point at the OVERVIEW tab and the live signal ticker at the top",
    accent: C.conv,
    duration: 6000,
    tag: "CONVERGENT GTM",
  },
  {
    id: "account",
    chapter: "THE TARGET",
    title: "Brex — $50K Deal Waiting",
    script: "This is Brex. 1,200 employees. $12.3B valuation. They process over $2 billion in card volume monthly. They've been using Stripe Atlas for subsidiary formation. Three days ago, something changed.",
    show: "Click on the Brex row in the accounts table",
    accent: C.blue,
    duration: 6000,
    tag: "ACCOUNT PROFILE",
  },
  {
    id: "void",
    chapter: "SIGNAL 1",
    title: "Void Scanner — Competitor Retreats",
    script: "Stripe Atlas silently removed their SMB fast-track tier. No email, no migration path, no announcement. Brex has 12 subsidiaries formed through Atlas. They're suddenly orphaned customers with no support path. BrightData detected this change within 4 hours.",
    show: "Click 'VOID' filter in Signals view — show the Brex void signal",
    accent: C.void,
    duration: 7000,
    tag: "VOID SCANNER",
  },
  {
    id: "compliance",
    chapter: "SIGNAL 2",
    title: "Compliance Radar — 74/100 Pressure Score",
    script: "PCI-DSS 4.0 enforcement begins in 89 days. Brex processes $2.1 billion monthly. Preintent scanned their compliance disclosures and found zero activity — no vendor assessments, no audit logs, no infrastructure changes. A 74 out of 100 compliance pressure score. They're behind schedule and they know it.",
    show: "Click 'COMPL.' filter — show the Brex compliance signal at 74/100",
    accent: C.compliance,
    duration: 7000,
    tag: "COMPLIANCE RADAR",
  },
  {
    id: "pain",
    chapter: "SIGNAL 3",
    title: "Pain Listener — Active Evaluation",
    script: "Here's the clincher. Brex's Head of Treasury posted this on r/fintech three days ago: 'Evaluating alternatives to Stripe Atlas — support has gone completely silent.' Sixty-seven upvotes. Eleven replies from other Brex employees. This isn't frustration — this is an active buying process.",
    show: "Click 'PAIN' filter — click the signal to open evidence panel",
    accent: C.pain,
    duration: 8000,
    tag: "PAIN LISTENER",
  },
  {
    id: "convergence",
    chapter: "CONVERGENCE",
    title: "85/100 — Perfect Storm",
    script: "Now watch what happens when you overlay all three. Competitor retreat. Regulatory pressure. Active community evaluation. All three signals pointing at the same account, on the same timeline. This is an 85 out of 100 convergence score. Traditional intent vendors detected zero of this. We detected it 3 days ago.",
    show: "Go to INTEL tab — show the Brex convergence gauge spinning up",
    accent: C.conv,
    duration: 8000,
    tag: "CONVERGENCE ENGINE",
  },
  {
    id: "brief",
    chapter: "INTEL BRIEF",
    title: "AI Brief — Ready to Send",
    script: "One click. The AI reads all three signals, cross-references the account context, and writes a personalized opening line. 'Hi Sarah — I noticed Stripe made some changes to their Atlas plans recently, and with PCI-DSS 4.0 coming in August, I thought the timing might be worth a conversation.' That email gets a reply. We've measured it.",
    show: "Go to BRIEF tab — click 'Generate Brief' and watch it stream",
    accent: C.conv,
    duration: 8000,
    tag: "AI/ML API",
  },
  {
    id: "triggerware",
    chapter: "AUTOMATION",
    title: "TriggerWare — Zero-Lag Action",
    script: "The moment convergence crosses 80, TriggerWare fires automatically. Your AE gets a Slack DM with the full brief. HubSpot creates a task with all three signals attached. A 48-hour follow-up is scheduled. The deal is captured before Brex even visits your website. That's the unfair advantage.",
    show: "Run a full scan — watch TriggerWare fire in the top nav",
    accent: "#ff8800",
    duration: 7000,
    tag: "TRIGGERWARE",
  },
  {
    id: "roi",
    chapter: "THE MATH",
    title: "$1,000/Month → 5,000% ROI",
    script: "One deal like Brex — average ACV fifty thousand dollars — pays for Preintent for over four years. But this isn't about one deal. Our customers average eleven convergence alerts per month. At a 30% win rate, that's three deals per month from signals that didn't exist in any other tool.",
    show: "Click the EST. ROI stat card to open the calculator",
    accent: C.pain,
    duration: 7000,
    tag: "ROI CALCULATOR",
  },
  {
    id: "close",
    chapter: "CLOSE",
    title: "Your Competitors Are Already Behind",
    script: "While you were watching this demo, Preintent ran three more scans. It found two new signals across your watchlist. The deals you're missing right now are your competitors' best customers. Preintent gives you the intelligence to get there first. Every time.",
    show: "Return to OVERVIEW — let the live ticker run. End the presentation.",
    accent: C.conv,
    duration: 6000,
    tag: "PREINTENT",
  },
];

// ─── COUNTDOWN RING ──────────────────────────────────────────────────────────
function CountdownRing({ duration, accent, playing }: { duration: number; accent: string; playing: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setElapsed(0);
    startRef.current = Date.now();
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 50);
    return () => clearInterval(id);
  }, [playing, duration]);

  const pct = Math.min(elapsed / duration, 1);
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);

  return (
    <svg width="40" height="40" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke={C.border} strokeWidth="2.5" />
      <circle
        cx="20" cy="20" r={r}
        fill="none" stroke={accent} strokeWidth="2.5"
        strokeDasharray={`${circ - dash} ${dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.1s linear" }}
      />
    </svg>
  );
}

// ─── CHAPTER PILL ─────────────────────────────────────────────────────────────
function ChapterPill({ step, total, accent }: { step: number; total: number; accent: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: "3px",
            width: i === step ? "20px" : "6px",
            borderRadius: "99px",
            background: i === step ? accent : i < step ? `${accent}60` : C.border,
            transition: "all 0.35s cubic-bezier(.25,.1,.25,1)",
          }}
        />
      ))}
    </div>
  );
}

// ─── MAIN TOUR COMPONENT ──────────────────────────────────────────────────────
interface GuidedTourProps {
  isActive: boolean;
  onClose: () => void;
  onStepChange?: (step: number, stepData: TourStep) => void;
  accounts: PremiumAccount[];
}

export function GuidedTour({ isActive, onClose, onStepChange, accounts }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showScript, setShowScript] = useState(true);

  const step = TOUR_STEPS[currentStep];

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  }, [currentStep]);

  // Auto-advance
  useEffect(() => {
    if (!isActive || !isPlaying) return;
    const id = setTimeout(nextStep, step?.duration ?? 6000);
    return () => clearTimeout(id);
  }, [currentStep, isActive, isPlaying, step, nextStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") nextStep();
      if (e.key === "ArrowLeft" || e.key === "h") prevStep();
      if (e.key === " ") { e.preventDefault(); setIsPlaying((v) => !v); }
      if (e.key === "Escape") onClose();
      if (e.key === "s") setShowScript((v) => !v);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isActive, nextStep, prevStep, onClose]);

  // Notify parent
  useEffect(() => {
    if (onStepChange && step) onStepChange(currentStep, step);
  }, [currentStep, step, onStepChange]);

  // Reset on open
  useEffect(() => {
    if (isActive) { setCurrentStep(0); setIsPlaying(true); }
  }, [isActive]);

  if (!isActive || !step) return null;

  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* ── OVERLAY ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(7,9,15,0.75)",
          backdropFilter: "blur(3px)",
          zIndex: 900,
          pointerEvents: "none",
        }}
      />

      {/* ── NARRATION CARD ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(700px, calc(100vw - 32px))",
            zIndex: 1000,
          }}
        >
          <div style={{
            background: "rgba(12,16,24,0.97)",
            border: `1px solid ${step.accent}45`,
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${step.accent}20, 0 0 60px ${step.accent}12`,
          }}>
            {/* Top accent stripe */}
            <div style={{
              height: "2px",
              background: `linear-gradient(90deg, ${step.accent}, ${step.accent}00)`,
            }} />

            <div style={{ padding: "20px 22px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                {/* Countdown ring */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <CountdownRing duration={step.duration} accent={step.accent} playing={isPlaying} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", color: step.accent, fontWeight: 700,
                  }}>
                    {currentStep + 1}
                  </div>
                </div>

                {/* Title block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, letterSpacing: "0.14em",
                      color: step.accent, padding: "1px 6px", borderRadius: "3px",
                      background: `${step.accent}15`, border: `1px solid ${step.accent}30`,
                    }}>
                      {step.chapter}
                    </span>
                    {step.tag && (
                      <span style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.06em" }}>
                        via {step.tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: C.white, lineHeight: 1.3 }}>
                    {step.title}
                  </div>
                </div>

                {/* Controls right */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => setShowScript((v) => !v)}
                    title="Toggle script (S)"
                    style={{
                      background: showScript ? `${step.accent}15` : "transparent",
                      border: `1px solid ${showScript ? step.accent + "40" : C.border}`,
                      borderRadius: "5px", padding: "4px 8px",
                      fontSize: "9px", color: showScript ? step.accent : C.muted,
                      cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em",
                    }}
                  >
                    SCRIPT
                  </button>
                  <button
                    onClick={onClose}
                    title="Close (Esc)"
                    style={{
                      background: "transparent", border: `1px solid ${C.border}`,
                      borderRadius: "5px", padding: "4px 8px",
                      fontSize: "9px", color: C.muted, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    ✕ ESC
                  </button>
                </div>
              </div>

              {/* Progress track */}
              <ChapterPill step={currentStep} total={TOUR_STEPS.length} accent={step.accent} />

              {/* Script */}
              <AnimatePresence>
                {showScript && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      marginTop: "14px",
                      padding: "14px 16px",
                      background: "rgba(7,9,15,0.6)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      borderLeft: `3px solid ${step.accent}`,
                    }}>
                      <div style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.1em", marginBottom: "7px" }}>
                        NARRATOR SCRIPT
                      </div>
                      <div style={{
                        fontSize: "13px", color: C.text, lineHeight: 1.75,
                        fontStyle: "normal",
                      }}>
                        &ldquo;{step.script}&rdquo;
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action callout */}
              <div style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: `${step.accent}08`,
                border: `1px solid ${step.accent}25`,
                borderRadius: "6px",
                display: "flex", alignItems: "flex-start", gap: "10px",
              }}>
                <span style={{ fontSize: "10px", color: step.accent, flexShrink: 0, marginTop: "1px" }}>▶</span>
                <div>
                  <div style={{ fontSize: "8px", color: step.accent, letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 700 }}>
                    WHAT TO SHOW
                  </div>
                  <div style={{ fontSize: "11px", color: C.text, lineHeight: 1.6 }}>
                    {step.show}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px" }}>
                {/* Back */}
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  title="Previous (←)"
                  style={{
                    padding: "8px 14px", background: "transparent",
                    border: `1px solid ${C.border}`, borderRadius: "6px",
                    fontSize: "10px", color: currentStep === 0 ? C.dim : C.muted,
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (currentStep > 0) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = currentStep === 0 ? C.dim : C.muted; }}
                >
                  ← Back
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => setIsPlaying((v) => !v)}
                  title="Play/Pause (Space)"
                  style={{
                    padding: "8px 14px",
                    background: isPlaying ? `${step.accent}15` : "transparent",
                    border: `1px solid ${isPlaying ? step.accent + "40" : C.border}`,
                    borderRadius: "6px", fontSize: "10px",
                    color: isPlaying ? step.accent : C.muted,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "5px",
                    transition: "all 0.15s",
                  }}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Step counter */}
                <span style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.06em" }}>
                  {currentStep + 1} / {TOUR_STEPS.length}
                </span>

                {/* Next */}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: `0 8px 24px ${step.accent}40` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={nextStep}
                  title="Next (→)"
                  style={{
                    padding: "9px 22px",
                    background: `linear-gradient(135deg, ${step.accent}cc, ${step.accent})`,
                    border: "none", borderRadius: "6px",
                    fontSize: "11px", color: "#fff", fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: `0 4px 16px ${step.accent}30`,
                  }}
                >
                  {isLast ? "FINISH" : "NEXT"} →
                </motion.button>
              </div>

              {/* Keyboard hints */}
              <div style={{
                display: "flex", gap: "12px", justifyContent: "center",
                marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}`,
              }}>
                {[
                  ["←", "prev"],
                  ["→", "next"],
                  ["SPACE", "pause"],
                  ["S", "script"],
                  ["ESC", "exit"],
                ].map(([key, label]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{
                      fontSize: "8px", padding: "1px 5px", borderRadius: "3px",
                      background: C.surface3, border: `1px solid ${C.border}`,
                      color: C.muted, fontFamily: "inherit",
                    }}>
                      {key}
                    </kbd>
                    <span style={{ fontSize: "8px", color: C.dim }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── CHAPTER PROGRESS STRIP (top of screen) ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: "3px", zIndex: 1001, pointerEvents: "none",
          background: C.border,
        }}
      >
        <motion.div
          animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${step.accent}, ${step.accent}aa)`,
          }}
        />
      </motion.div>

      {/* ── CHAPTER LABEL (top-right corner) ── */}
      <motion.div
        key={`label-${currentStep}`}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", top: "14px", right: "16px",
          zIndex: 1001, pointerEvents: "none",
          display: "flex", alignItems: "center", gap: "8px",
          padding: "5px 12px",
          background: "rgba(12,16,24,0.9)",
          border: `1px solid ${step.accent}35`,
          borderRadius: "6px",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: "9px", color: step.accent, fontWeight: 700, letterSpacing: "0.12em" }}>
          {step.chapter}
        </span>
        <span style={{ width: "1px", height: "10px", background: C.border }} />
        <span style={{ fontSize: "9px", color: C.muted }}>
          {currentStep + 1} of {TOUR_STEPS.length}
        </span>
      </motion.div>
    </>
  );
}

// ─── TOUR TRIGGER ─────────────────────────────────────────────────────────────
interface TourTriggerProps {
  onStart: () => void;
  disabled?: boolean;
}

export function TourTrigger({ onStart, disabled }: TourTriggerProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, boxShadow: `0 6px 20px rgba(144,96,255,0.35)` }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onStart}
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "6px 14px",
        background: disabled ? "transparent" : "linear-gradient(135deg, rgba(144,96,255,0.2), rgba(144,96,255,0.08))",
        border: `1px solid ${disabled ? C.border : "rgba(144,96,255,0.45)"}`,
        borderRadius: "6px", fontSize: "10px",
        color: disabled ? C.dim : "#9060ff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.08em",
        transition: "all 0.2s",
      }}
    >
      {/* Pulsing dot */}
      {!disabled && (
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#9060ff",
          boxShadow: "0 0 0 3px rgba(144,96,255,0.2)",
          animation: "dot-blink 2s ease-in-out infinite",
          flexShrink: 0,
        }} />
      )}
      ▶ Present
    </motion.button>
  );
}

// ─── SHORTCUT HINT ────────────────────────────────────────────────────────────
export function TourShortcut() {
  return (
    <div style={{
      position: "fixed", bottom: "12px", left: "14px",
      fontSize: "9px", color: C.dim, fontFamily: "inherit",
      pointerEvents: "none", display: "flex", alignItems: "center", gap: "6px",
      letterSpacing: "0.04em",
    }}>
      Press{" "}
      <kbd style={{
        background: C.surface2, padding: "1px 6px", borderRadius: "3px",
        border: `1px solid ${C.border}`, color: C.muted, fontSize: "9px",
      }}>
        T
      </kbd>
      {" "}to present
    </div>
  );
}
