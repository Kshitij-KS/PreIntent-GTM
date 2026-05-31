"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Clock, Target, Calculator } from "lucide-react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#111820",
  border: "#18232f",
  border2: "#1e2d3e",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#243040",
  conv: "#9060ff",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
  blue: "#2070ff",
  white: "#ddeeff",
};

// ─── ROI CALCULATOR COMPONENT ────────────────────────────────────────────────

interface ROICalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  accountName?: string;
  accountConvergence?: number;
}

export function ROICalculator({ isOpen, onClose, accountName, accountConvergence }: ROICalculatorProps) {
  const [acv, setAcv] = useState(50000);
  const [winRate, setWinRate] = useState(25);
  const [salesCycle, setSalesCycle] = useState(90);
  const [timeAdvantage, setTimeAdvantage] = useState(3);
  const [results, setResults] = useState<{
    pipelineValue: number;
    expectedValue: number;
    dailyValue: number;
    advantageValue: number;
    roi: number;
    paybackDeals: number;
  } | null>(null);

  useEffect(() => {
    calculateResults();
  }, [acv, winRate, salesCycle, timeAdvantage]);

  function calculateResults() {
    const preintentCost = 1000;
    const pipelineValue = acv;
    const expectedValue = acv * (winRate / 100);
    const dailyValue = expectedValue / salesCycle;
    const advantageValue = dailyValue * timeAdvantage;
    const roi = (advantageValue / preintentCost) * 100;
    const paybackDeals = Math.ceil(preintentCost / expectedValue);

    setResults({
      pipelineValue,
      expectedValue,
      dailyValue,
      advantageValue,
      roi,
      paybackDeals,
    });
  }

  function formatCurrency(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(7, 9, 15, 0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  background: `linear-gradient(135deg, ${C.conv}30, ${C.conv}10)`,
                  border: `1px solid ${C.conv}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Calculator size={18} color={C.conv} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: C.white }}>
                  ROI Calculator
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>
                  Preintent pays for itself when...
                </div>
              </div>
              {accountName && (
                <div
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    padding: "4px 10px",
                    background: `${C.conv}15`,
                    color: C.conv,
                    borderRadius: "4px",
                    border: `1px solid ${C.conv}30`,
                  }}
                >
                  {accountName} {accountConvergence && `(${accountConvergence}/100)`}
                </div>
              )}
            </div>

            {/* Inputs */}
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gap: "16px" }}>
                {/* ACV Input */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <DollarSign size={12} color={C.muted} />
                    <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Average Contract Value
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="10000"
                      max="500000"
                      step="5000"
                      value={acv}
                      onChange={(e) => setAcv(Number(e.target.value))}
                      style={{
                        flex: 1,
                        height: "4px",
                        background: C.border,
                        borderRadius: "2px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                    <input
                      type="number"
                      value={acv}
                      onChange={(e) => setAcv(Number(e.target.value))}
                      style={{
                        width: "100px",
                        padding: "6px 10px",
                        background: C.surface2,
                        border: `1px solid ${C.border}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: C.text,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                {/* Win Rate */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Target size={12} color={C.muted} />
                    <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Win Rate %
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={winRate}
                      onChange={(e) => setWinRate(Number(e.target.value))}
                      style={{
                        flex: 1,
                        height: "4px",
                        background: C.border,
                        borderRadius: "2px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ width: "60px", fontSize: "12px", color: C.text, textAlign: "right" }}>
                      {winRate}%
                    </div>
                  </div>
                </div>

                {/* Sales Cycle */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Clock size={12} color={C.muted} />
                    <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Sales Cycle (days)
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="5"
                      value={salesCycle}
                      onChange={(e) => setSalesCycle(Number(e.target.value))}
                      style={{
                        flex: 1,
                        height: "4px",
                        background: C.border,
                        borderRadius: "2px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ width: "60px", fontSize: "12px", color: C.text, textAlign: "right" }}>
                      {salesCycle}d
                    </div>
                  </div>
                </div>

                {/* Time Advantage */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <TrendingUp size={12} color={C.conv} />
                    <label style={{ fontSize: "11px", color: C.conv, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Preintent Time Advantage (days)
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="0.5"
                      value={timeAdvantage}
                      onChange={(e) => setTimeAdvantage(Number(e.target.value))}
                      style={{
                        flex: 1,
                        height: "4px",
                        background: `linear-gradient(90deg, ${C.conv}40, ${C.conv})`,
                        borderRadius: "2px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ width: "60px", fontSize: "12px", color: C.conv, textAlign: "right", fontWeight: 600 }}>
                      {timeAdvantage}d
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "6px" }}>
                    Average head start Preintent provides vs traditional intent vendors
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  padding: "20px",
                  background: `linear-gradient(135deg, ${C.conv}08, transparent)`,
                  borderTop: `1px solid ${C.conv}20`,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Pipeline Value
                    </div>
                    <div style={{ fontSize: "18px", color: C.text, fontWeight: 600 }}>
                      {formatCurrency(results.pipelineValue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Expected Value
                    </div>
                    <div style={{ fontSize: "18px", color: C.pain, fontWeight: 600 }}>
                      {formatCurrency(results.expectedValue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Daily Pipeline Velocity
                    </div>
                    <div style={{ fontSize: "16px", color: C.text, fontWeight: 500 }}>
                      {formatCurrency(results.dailyValue)}/day
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      {timeAdvantage}-Day Advantage Value
                    </div>
                    <div style={{ fontSize: "16px", color: C.conv, fontWeight: 600 }}>
                      {formatCurrency(results.advantageValue)}
                    </div>
                  </div>
                </div>

                {/* ROI Highlight */}
                <div
                  style={{
                    background: C.surface2,
                    border: `1px solid ${C.conv}30`,
                    borderRadius: "6px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Monthly ROI on $1,000 Preintent Investment
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ fontSize: "42px", fontWeight: 700, color: C.conv, lineHeight: 1 }}
                  >
                    {results.roi.toFixed(0)}%
                  </motion.div>
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "12px" }}>
                    Preintent pays for itself after closing{" "}
                    <span style={{ color: C.conv, fontWeight: 600 }}>{results.paybackDeals}</span> deal
                    {results.paybackDeals !== 1 ? "s" : ""}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Reset to defaults
                  setAcv(50000);
                  setWinRate(25);
                  setSalesCycle(90);
                  setTimeAdvantage(3);
                }}
                style={{
                  padding: "8px 16px",
                  background: C.conv,
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: C.white,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 500,
                }}
              >
                Reset Defaults
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── COMPACT ROI PREVIEW ───────────────────────────────────────────────────────

export function ROIPreview({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      style={{
        background: `linear-gradient(135deg, ${C.conv}20, ${C.conv}08)`,
        border: `1px solid ${C.conv}40`,
        borderRadius: "6px",
        padding: "12px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          background: `${C.conv}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <TrendingUp size={16} color={C.conv} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", color: C.white, fontWeight: 500 }}>
          ROI Calculator
        </div>
        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
          See how Preintent pays for itself
        </div>
      </div>
      <div style={{ fontSize: "18px", color: C.conv, fontWeight: 700 }}>
        500%+
      </div>
    </motion.button>
  );
}
