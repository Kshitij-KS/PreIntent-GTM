"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, Zap, Crown } from "lucide-react";
import { COMPETITIVE_COMPARISONS } from "@/lib/premium-demo-data";

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

// ─── COMPETITIVE COMPARISON WIDGET ─────────────────────────────────────────────

interface CompetitiveComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  acv?: number;
}

export function CompetitiveComparison({ isOpen, onClose, acv = 50000 }: CompetitiveComparisonProps) {
  if (!isOpen) return null;

  const calculateDailyValue = (days: number, hours: number) => {
    const dailyValue = acv / 90; // Assuming 90-day sales cycle
    const hoursFraction = hours / 24;
    return dailyValue * (days + hoursFraction);
  };

  return (
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
          maxWidth: "680px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
              background: `linear-gradient(135deg, ${C.conv}30, ${C.pain}10)`,
              border: `1px solid ${C.conv}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown size={18} color={C.conv} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: C.white }}>
              Competitive Advantage
            </div>
            <div style={{ fontSize: "11px", color: C.muted }}>
              PreIntent vs traditional intent vendors
            </div>
          </div>
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
            ACV: ${(acv / 1000).toFixed(0)}K
          </div>
        </div>

        {/* Comparison Cards */}
        <div style={{ padding: "20px" }}>
          {COMPETITIVE_COMPARISONS.map((comparison, i) => {
            const advantageValue = calculateDailyValue(comparison.advantageDays, comparison.advantageHours);

            return (
              <motion.div
                key={comparison.account}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                {/* Account Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: `${C.conv}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.conv,
                    }}
                  >
                    {comparison.account[0]}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                    {comparison.account}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "10px", color: C.muted }}>
                    {comparison.signal}
                  </div>
                </div>

                {/* Timeline */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  {/* PreIntent */}
                  <div
                    style={{
                      background: `${C.conv}10`,
                      border: `1px solid ${C.conv}30`,
                      borderRadius: "6px",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "10px",
                        color: C.conv,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "6px",
                      }}
                    >
                      <Zap size={12} />
                      PREINTENT
                    </div>
                    <div style={{ fontSize: "12px", color: C.text, fontWeight: 500 }}>
                      {new Date(comparison.preintentDetected).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Advantage */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: C.pain,
                      }}
                    >
                      <Clock size={12} />
                      +{comparison.advantageDays}d {comparison.advantageHours}h
                    </div>
                    <div
                      style={{
                        height: "2px",
                        width: "40px",
                        background: `linear-gradient(90deg, ${C.conv}, ${C.pain})`,
                      }}
                    />
                  </div>

                  {/* Competitor */}
                  <div
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      padding: "12px",
                      opacity: 0.8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "10px",
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "6px",
                      }}
                    >
                      <Clock size={12} />
                      Intent Vendors
                    </div>
                    <div style={{ fontSize: "12px", color: C.text }}>
                      {new Date(comparison.competitorDetected).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* Value Calculation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={14} color={C.pain} />
                    <span style={{ fontSize: "11px", color: C.muted }}>Time Advantage Value</span>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: C.pain }}>
                    ${advantageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div
          style={{
            padding: "20px",
            background: `linear-gradient(135deg, ${C.conv}08, transparent)`,
            borderTop: `1px solid ${C.conv}20`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "12px", color: C.text }}>Average Time Advantage</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.conv }}>2.3 days</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "12px", color: C.text }}>Average Value per Signal</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: C.pain }}>
              ${calculateDailyValue(2.3, 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: C.muted,
              marginTop: "12px",
              padding: "12px",
              background: C.surface2,
              borderRadius: "6px",
              border: `1px solid ${C.border}`,
            }}
          >
            At ${(acv / 1000).toFixed(0)}K ACV with a 90-day sales cycle, every day of head start is worth{" "}
            <span style={{ color: C.pain, fontWeight: 600 }}>
              ${(acv / 90).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>{" "}
            in pipeline velocity. PreIntent&apos;s 2-3 day advantage compounds to{" "}
            <span style={{ color: C.conv, fontWeight: 600 }}>significant ROI</span>.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: C.conv,
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              color: C.white,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── COMPACT COMPARISON TRIGGER ─────────────────────────────────────────────────

export function ComparisonTrigger({ onOpen }: { onOpen: () => void }) {
  const firstComparison = COMPETITIVE_COMPARISONS[0];
  const days = firstComparison?.advantageDays || 3;
  const hours = firstComparison?.advantageHours || 6;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        background: C.surface2,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          background: `${C.conv}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Clock size={16} color={C.conv} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: C.text, fontWeight: 500 }}>
          PreIntent detected {days}d {hours}h earlier
        </div>
        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
          vs traditional intent vendors
        </div>
      </div>
      <div style={{ fontSize: "10px", color: C.conv }}>
        View details →
      </div>
    </motion.button>
  );
}
