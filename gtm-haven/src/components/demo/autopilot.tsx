"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import type { PremiumAccount } from "@/lib/premium-demo-data";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = "dashboard" | "signals" | "intel" | "brief" | "settings";
type EvidenceType = "void" | "compliance" | "pain" | "audio";
type SignalFilter = "all" | "void" | "compliance" | "pain";

export interface AutopilotActions {
  setView: (v: View) => void;
  runScan: () => void;
  generateBrief: () => void;
  selectAccount: (a: PremiumAccount) => void;
  openEvidence: (acct: PremiumAccount, type: EvidenceType) => void;
  closeEvidence: () => void;
  openShare: () => void;
  closeShare: () => void;
  filterSignals: (f: SignalFilter) => void;
  getAccounts: () => PremiumAccount[];
}

interface AutopilotStep {
  at: number;
  type: "navigate" | "spotlight" | "action" | "narrate" | "clear";
  view?: View;
  target?: string;
  fn?: (actions: AutopilotActions) => void;
  narration?: string;
  ringColor?: string;
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  bg: "#07090f", surface: "#0c1018", surface2: "#111820",
  border: "#18232f", text: "#c2d0de", muted: "#4a6070",
  conv: "#9060ff", void: "#ff5a52", compliance: "#f0a000",
  pain: "#24c038", white: "#ddeeff",
};

// ─── VOICE NARRATOR ──────────────────────────────────────────────────────────

const NATURAL_VOICE_PATTERNS = [
  /Microsoft Aria/i,
  /Microsoft Jenny/i,
  /Microsoft Guy/i,
  /Microsoft Ryan/i,
  /Google US English/i,
  /Google UK English Female/i,
  /Samantha/i,
  /Daniel/i,
  /Karen/i,
  /Moira/i,
  /Natural/i,
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang.startsWith("en"));

  for (const pattern of NATURAL_VOICE_PATTERNS) {
    const match = en.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  return (
    en.find((v) => v.localService && v.lang === "en-US") ??
    en.find((v) => v.lang === "en-US") ??
    en[0] ??
    voices[0] ??
    null
  );
}

function useVoiceNarrator(enabled: boolean) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      voiceRef.current = pickVoice(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const processQueue = useCallback(function internalProcessQueue() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!enabledRef.current || speakingRef.current) return;

    const next = queueRef.current.shift();
    if (!next) return;

    speakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(next);
    utterance.rate = 0.88;
    utterance.pitch = 0.98;
    utterance.volume = 1;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    const advance = () => {
      speakingRef.current = false;
      internalProcessQueue();
    };

    utterance.onend = advance;
    utterance.onerror = advance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabledRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
      queueRef.current.push(text);
      if (!speakingRef.current) processQueue();
    },
    [processQueue],
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    speakingRef.current = false;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}

// ─── DEMO SCRIPT ─────────────────────────────────────────────────────────────
// Timing is calibrated so each narration finishes within its window before the
// next line begins (speech ≈ 2.3 words/sec at rate 0.88), and every spotlight /
// action coincides with the moment it is described. Non-spotlight steps auto-
// clear the previous highlight, so a ring never lingers on a changed screen.

const SCRIPT: AutopilotStep[] = [
  // ── OPEN ──────────────────────────────────────────────────────────────────
  { at: 0, type: "navigate", view: "dashboard" },
  { at: 900, type: "narrate",
    narration: "Welcome to PreIntent  -  intelligence that catches buying windows before anyone else." },
  { at: 8000, type: "spotlight", target: "stat-cards", ringColor: C.conv,
    narration: "Six target accounts, three live engines, every one scored in real time." },

  // ── SCAN ──────────────────────────────────────────────────────────────────
  { at: 15000, type: "spotlight", target: "scan-panel", ringColor: C.conv,
    narration: "Watch one click launch a full intelligence sweep across all of them." },
  { at: 18500, type: "action", fn: (a) => a.runScan() },
  { at: 21500, type: "narrate",
    narration: "Bright Data is crawling competitor pricing pages right now." },
  { at: 27000, type: "narrate",
    narration: "Compliance Radar sweeps regulatory feeds while Speechmatics transcribes audio." },
  { at: 32500, type: "narrate",
    narration: "Featherless AI classifies the pain signals, and convergence scores update live." },

  // ── SIGNALS ───────────────────────────────────────────────────────────────
  { at: 39000, type: "navigate", view: "signals",
    narration: "Here is the live signal stream. Let's isolate the competitor retreats." },
  { at: 42500, type: "spotlight", target: "void-filter", ringColor: C.void },
  { at: 44000, type: "action", fn: (a) => a.filterSignals("void") },
  { at: 45500, type: "spotlight", target: "brex-void-row", ringColor: C.void,
    narration: "Stripe Atlas pulled its SMB tier three days ago, and Brex has twelve subsidiaries stranded on it." },
  { at: 54500, type: "action",
    fn: (a) => {
      const brex = a.getAccounts().find((acc) => acc.name === "Brex");
      if (brex) a.openEvidence(brex, "void");
    },
    narration: "Every signal links to hard evidence: source, timestamp, and a confidence score." },

  // ── INTEL ─────────────────────────────────────────────────────────────────
  { at: 62000, type: "action",
    fn: (a) => {
      a.closeEvidence();
      const brex = a.getAccounts().find((acc) => acc.name === "Brex");
      if (brex) a.selectAccount(brex);
      a.setView("intel");
    },
    narration: "Three independent signals, one account, one timeline  -  convergence hits eighty-nine." },
  { at: 65000, type: "spotlight", target: "convergence-gauge", ringColor: C.conv },
  { at: 69000, type: "spotlight", target: "audio-card", ringColor: "#c084fc",
    narration: "Speechmatics caught it in a podcast too  -  Brex's own team, on record, two weeks earlier." },
  { at: 77500, type: "spotlight", target: "generate-brief-btn", ringColor: C.conv,
    narration: "One click fuses all three signals into a ready-to-send brief." },
  { at: 81500, type: "action", fn: (a) => { a.setView("brief"); a.generateBrief(); } },

  // ── BRIEF ─────────────────────────────────────────────────────────────────
  { at: 83500, type: "narrate",
    narration: "The brief writes itself: why now, the evidence, and a tailored opening line." },
  { at: 91000, type: "spotlight", target: "brief-share-btn", ringColor: C.conv,
    narration: "Formatted for Slack, HubSpot, or email, ready to copy or export." },
  { at: 94500, type: "action", fn: (a) => a.openShare() },

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  { at: 99500, type: "action", fn: (a) => { a.closeShare(); a.setView("settings"); },
    narration: "Every engine here runs on a live API, not a mock." },
  { at: 102500, type: "spotlight", target: "integration-list", ringColor: C.pain },

  // ── CLOSE ─────────────────────────────────────────────────────────────────
  { at: 107000, type: "navigate", view: "dashboard",
    narration: "That's a single account. PreIntent watches your entire market, around the clock." },
];

const TOTAL_DURATION = 116000;

// ─── SPOTLIGHT CURSOR ─────────────────────────────────────────────────────────

function SpotlightCursor({ target, ringColor }: { target: string | null; ringColor: string }) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [ringRect, setRingRect] = useState<DOMRect | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!target) {
      setTimeout(() => {
        setRingRect(null);
        setSettled(false);
      }, 0);
      return;
    }

    const el = document.querySelector(`[data-demo="${target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setTimeout(() => {
      setSettled(false);
      setRingRect(null);
    }, 0);

    const ctrl = animate(cursorX, centerX, { duration: 0.6, ease: [0.32, 0, 0.67, 0] });
    const ctrl2 = animate(cursorY, centerY, { duration: 0.6, ease: [0.32, 0, 0.67, 0] });

    const t = setTimeout(() => {
      setRingRect(el.getBoundingClientRect());
      setSettled(true);
    }, 650);

    return () => {
      ctrl.stop();
      ctrl2.stop();
      clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <>
      <motion.div
        style={{
          position: "fixed",
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 1100,
          pointerEvents: "none",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "rgba(144,96,255,0.9)",
          boxShadow: "0 0 0 4px rgba(144,96,255,0.25), 0 0 20px rgba(144,96,255,0.5)",
          filter: "blur(0.5px)",
        }}
      />

      <AnimatePresence>
        {settled && ringRect && (
          <motion.div
            key={target}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: ringRect.top - 6,
              left: ringRect.left - 6,
              width: ringRect.width + 12,
              height: ringRect.height + 12,
              borderRadius: "10px",
              border: `2px solid ${ringColor}`,
              boxShadow: `0 0 0 4px ${ringColor}18, 0 0 30px ${ringColor}30`,
              zIndex: 1050,
              pointerEvents: "none",
              animation: "ring-pulse 2s ease-in-out infinite",
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 0 4px ${ringColor}18, 0 0 30px ${ringColor}30; }
          50% { box-shadow: 0 0 0 8px ${ringColor}10, 0 0 50px ${ringColor}40; }
        }
      `}</style>
    </>
  );
}

// ─── NARRATION STRIP ─────────────────────────────────────────────────────────

function NarrationStrip({ text, voiceOn }: { text: string | null; voiceOn: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: "96px", left: "50%", transform: "translateX(-50%)",
      zIndex: 1080, pointerEvents: "none", width: "min(520px, calc(100vw - 40px))",
    }}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              background: "rgba(12,16,24,0.94)",
              border: `1px solid rgba(144,96,255,0.3)`,
              borderRadius: "10px",
              padding: "11px 18px",
              display: "flex", alignItems: "center", gap: "10px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(144,96,255,0.1)",
            }}
          >
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: voiceOn ? C.pain : C.conv, flexShrink: 0,
              boxShadow: voiceOn ? "0 0 0 3px rgba(36,192,56,0.2)" : "0 0 0 3px rgba(144,96,255,0.2)",
              animation: "dot-blink 1.6s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "12px", color: C.text, lineHeight: 1.5, letterSpacing: "0.01em",
            }}>
              {text}
            </span>
            {voiceOn && (
              <span style={{
                marginLeft: "auto", fontSize: "8px", color: C.pain,
                letterSpacing: "0.1em", flexShrink: 0, opacity: 0.85,
              }}>
                🔊 LIVE
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function AutopilotProgress({ elapsed, total }: { elapsed: number; total: number }) {
  const remaining = Math.max(0, Math.ceil((total - elapsed) / 1000));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: "2px", zIndex: 1090, pointerEvents: "none",
        background: C.border,
      }}
    >
      <motion.div
        style={{
          height: "100%",
          width: `${Math.min((elapsed / total) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${C.conv}, ${C.pain})`,
          transition: "width 0.5s linear",
        }}
      />
      <div style={{
        position: "fixed", top: "6px", left: "50%", transform: "translateX(-50%)",
        fontSize: "8px", color: C.muted, letterSpacing: "0.12em", pointerEvents: "none",
      }}>
        AUTOPLAY · {remaining}s
      </div>
    </motion.div>
  );
}

// ─── MAIN AUTOPILOT COMPONENT ─────────────────────────────────────────────────

interface DemoAutopilotProps {
  isActive: boolean;
  onEnd: () => void;
  actions: AutopilotActions;
}

export function DemoAutopilot({ isActive, onEnd, actions }: DemoAutopilotProps) {
  const [spotlight, setSpotlight] = useState<{ target: string; color: string } | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);
  const actionsRef = useRef(actions);
  const onEndRef = useRef(onEnd);
  const { speak, stop: stopVoice } = useVoiceNarrator(voiceEnabled);
  const speakRef = useRef(speak);
  const stopVoiceRef = useRef(stopVoice);

  useEffect(() => {
    actionsRef.current = actions;
    onEndRef.current = onEnd;
    speakRef.current = speak;
    stopVoiceRef.current = stopVoice;
  }, [actions, onEnd, speak, stopVoice]);

  const narrate = (text: string) => {
    setNarration(text);
    speakRef.current(text);
  };

  const cleanup = (resetElapsed = true) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    stopVoiceRef.current();
    setSpotlight(null);
    setNarration(null);
    if (resetElapsed) setElapsed(0);
    mountedRef.current = false;
  };

  // Run script exactly once per mount  -  never restart on parent re-renders
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    startRef.current = Date.now();

    tickRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 500);

    SCRIPT.forEach((step) => {
      const t = setTimeout(() => {
        const currentActions = actionsRef.current;

        // Any non-spotlight step clears the active highlight first, so a ring
        // can never linger on a stale element after the view/state changes.
        if (step.type !== "spotlight") {
          setSpotlight(null);
        }

        if (step.type === "navigate" && step.view) {
          currentActions.setView(step.view);
          if (step.narration) narrate(step.narration);
        }
        if (step.type === "spotlight" && step.target) {
          setSpotlight({ target: step.target, color: step.ringColor ?? C.conv });
          if (step.narration) narrate(step.narration);
        }
        if (step.type === "narrate" && step.narration) {
          narrate(step.narration);
        }
        if (step.type === "action" && step.fn) {
          step.fn(currentActions);
          if (step.narration) narrate(step.narration);
        }
        if (step.type === "clear") {
          setSpotlight(null);
        }
      }, step.at);
      timersRef.current.push(t);
    });

    const endTimer = setTimeout(() => {
      cleanup(false);
      onEndRef.current();
    }, TOTAL_DURATION);
    timersRef.current.push(endTimer);

    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        onEndRef.current();
      }
      if (e.key === "m" || e.key === "M") setVoiceEnabled((v) => !v);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isActive) return null;

  return (
    <>
      <AutopilotProgress elapsed={elapsed} total={TOTAL_DURATION} />
      <SpotlightCursor
        target={spotlight?.target ?? null}
        ringColor={spotlight?.color ?? C.conv}
      />
      <NarrationStrip text={narration} voiceOn={voiceEnabled} />

      <div style={{
        position: "fixed", top: "10px", right: "16px", zIndex: 1100,
        display: "flex", gap: "6px", alignItems: "center",
      }}>
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: voiceEnabled ? "rgba(36,192,56,0.12)" : "rgba(12,16,24,0.92)",
            border: `1px solid ${voiceEnabled ? "rgba(36,192,56,0.4)" : C.border}`,
            borderRadius: "6px", padding: "5px 12px",
            fontSize: "9px", color: voiceEnabled ? C.pain : C.muted,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
            backdropFilter: "blur(12px)",
          }}
          onClick={() => {
            setVoiceEnabled((v) => {
              if (v) stopVoice();
              return !v;
            });
          }}
          whileHover={{ borderColor: voiceEnabled ? C.pain : C.text }}
        >
          {voiceEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(12,16,24,0.92)", border: `1px solid ${C.border}`,
            borderRadius: "6px", padding: "5px 12px",
            fontSize: "9px", color: C.muted, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.08em",
            backdropFilter: "blur(12px)",
          }}
          onClick={() => { cleanup(); onEndRef.current(); }}
          whileHover={{ color: C.void, borderColor: C.void }}
        >
          ✕ STOP
        </motion.button>
      </div>
    </>
  );
}

// ─── AUTOPLAY TRIGGER BUTTON ─────────────────────────────────────────────────

interface AutoplayTriggerProps {
  onStart: () => void;
  disabled?: boolean;
}

export function AutoplayTrigger({ onStart, disabled }: AutoplayTriggerProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : {
        scale: 1.03,
        boxShadow: "0 6px 20px rgba(36,192,56,0.3)",
      }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onStart}
      title="Start voice-enabled autoplay (A)"
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "6px 14px",
        background: disabled
          ? "transparent"
          : "linear-gradient(135deg, rgba(36,192,56,0.18), rgba(36,192,56,0.06))",
        border: `1px solid ${disabled ? C.border : "rgba(36,192,56,0.4)"}`,
        borderRadius: "6px", fontSize: "10px",
        color: disabled ? C.muted : "#24c038",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.08em",
        transition: "all 0.2s",
      }}
    >
      {!disabled && (
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#24c038",
          boxShadow: "0 0 0 3px rgba(36,192,56,0.2)",
          animation: "dot-blink 2s ease-in-out infinite",
          flexShrink: 0,
        }} />
      )}
      ▶ Autoplay · 115s
    </motion.button>
  );
}
