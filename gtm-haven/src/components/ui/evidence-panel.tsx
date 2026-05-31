"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Image as ImageIcon, Eye, ExternalLink } from "lucide-react";
import type { EvidencePanel as EvidencePanelType } from "@/lib/premium-demo-data";

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
  white: "#ddeeff",
};

// ─── EVIDENCE ICON MAP ─────────────────────────────────────────────────────────

const evidenceIcons = {
  screenshot: ImageIcon,
  transcript: FileText,
  document: FileText,
  comparison: Eye,
};

const evidenceColors = {
  screenshot: C.void,
  transcript: C.pain,
  document: C.compliance,
  comparison: C.conv,
};

// ─── EVIDENCE PANEL MODAL ──────────────────────────────────────────────────────

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidencePanelType | null;
  accountName: string;
  signalType: "void" | "compliance" | "pain" | "audio";
}

export function EvidenceModal({ isOpen, onClose, evidence, accountName, signalType }: EvidenceModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "technical">("overview");

  if (!evidence) return null;

  const Icon = evidenceIcons[evidence.type];
  const color = evidenceColors[evidence.type];

  const signalLabels = {
    void: "Void Scanner Evidence",
    compliance: "Compliance Radar Evidence",
    pain: "Pain Listener Evidence",
    audio: "Speechmatics Audio Evidence",
  };

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
            background: "rgba(7, 9, 15, 0.9)",
            backdropFilter: "blur(8px)",
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
              maxWidth: "720px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", color: color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  {signalLabels[signalType]}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: C.white, marginBottom: "6px" }}>
                  {evidence.title}
                </div>
                <div style={{ fontSize: "11px", color: C.muted, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{accountName}</span>
                  <span style={{ color: C.dim }}>•</span>
                  <span>Captured {new Date(evidence.capturedAt).toLocaleString()}</span>
                  <span style={{ color: C.dim }}>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ExternalLink size={10} />
                    {evidence.source}
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: C.muted,
                }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                padding: "0 20px",
                borderBottom: `1px solid ${C.border}`,
                background: C.surface2,
              }}
            >
              {(["overview", "details", "technical"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${activeTab === tab ? color : "transparent"}`,
                    fontSize: "11px",
                    color: activeTab === tab ? C.white : C.muted,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "inherit",
                    fontWeight: activeTab === tab ? 500 : 400,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Evidence Display */}
                    {evidence.type === "comparison" && evidence.before && evidence.after && (
                      <div style={{ marginBottom: "20px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: C.surface2,
                              border: `1px solid ${C.border}`,
                              borderRadius: "6px",
                              padding: "16px",
                            }}
                          >
                            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                              BEFORE
                            </div>
                            <div style={{ fontSize: "12px", color: C.text, lineHeight: 1.6 }}>
                              {evidence.before.split("\n").map((line, i) => (
                                <div key={i} style={{ marginBottom: "4px" }}>{line}</div>
                              ))}
                            </div>
                          </div>
                          <div
                            style={{
                              background: C.surface2,
                              border: `1px solid ${C.border}`,
                              borderRadius: "6px",
                              padding: "16px",
                              position: "relative",
                            }}
                          >
                            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                              AFTER
                            </div>
                            <div style={{ fontSize: "12px", color: C.text, lineHeight: 1.6 }}>
                              {evidence.after.split("\n").map((line, i) => (
                                <div key={i} style={{ marginBottom: "4px" }}>{line}</div>
                              ))}
                            </div>
                            {evidence.highlight && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "12px",
                                  left: "16px",
                                  right: "16px",
                                  background: `${C.void}20`,
                                  border: `1px solid ${C.void}40`,
                                  borderRadius: "4px",
                                  padding: "8px 12px",
                                  fontSize: "10px",
                                  color: C.void,
                                }}
                              >
                                ⚠ {evidence.highlight}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(evidence.type === "screenshot" || evidence.type === "document" || evidence.type === "transcript") && (
                      <div
                        style={{
                          background: C.surface2,
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          padding: "20px",
                          marginBottom: "20px",
                          minHeight: "200px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <Icon size={48} color={`${color}40`} />
                        <div style={{ fontSize: "11px", color: C.muted, textAlign: "center" }}>
                          Simulated {evidence.type} evidence from {evidence.source}
                          <br />
                          <span style={{ fontSize: "10px" }}>Captured via Bright Data</span>
                        </div>
                      </div>
                    )}

                    {/* Key Details */}
                    <div>
                      <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                        Key Evidence Points
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {evidence.details.map((detail, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              background: C.surface2,
                              border: `1px solid ${C.border}`,
                              borderRadius: "4px",
                              padding: "10px 12px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: color,
                                marginTop: "6px",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ fontSize: "12px", color: C.text, lineHeight: 1.5 }}>
                              {detail}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        background: C.surface2,
                        border: `1px solid ${C.border}`,
                        borderRadius: "6px",
                        padding: "16px",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: C.muted, marginBottom: "12px" }}>
                        Source Information
                      </div>
                      <div style={{ display: "grid", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: C.muted }}>Source URL</span>
                          <span style={{ fontSize: "11px", color: C.text, fontFamily: "monospace" }}>
                            {evidence.source}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: C.muted }}>Captured At</span>
                          <span style={{ fontSize: "11px", color: C.text }}>
                            {new Date(evidence.capturedAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: C.muted }}>Evidence Type</span>
                          <span style={{ fontSize: "11px", color: C.text, textTransform: "capitalize" }}>
                            {evidence.type}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: C.muted }}>Collection Method</span>
                          <span style={{ fontSize: "11px", color: C.conv }}>
                            Bright Data Scraping Browser
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "technical" && (
                  <motion.div
                    key="technical"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        background: C.surface2,
                        border: `1px solid ${C.border}`,
                        borderRadius: "6px",
                        padding: "16px",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ color: C.muted, marginBottom: "8px" }}>{`// Detection Metadata`}</div>
                      <div style={{ color: C.text }}>
                        <span style={{ color: C.conv }}>detected_at</span>: &quot;{evidence.capturedAt}&quot;<br />
                        <span style={{ color: C.conv }}>source</span>: &quot;{evidence.source}&quot;<br />
                        <span style={{ color: C.conv }}>engine</span>: &quot;{signalType}_scanner&quot;<br />
                        <span style={{ color: C.conv }}>confidence</span>: 0.94<br />
                        <span style={{ color: C.conv }}>provenance</span>: {"{"}<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>tool</span>: &quot;Bright Data Scraping Browser&quot;,<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>region</span>: &quot;us-west-2&quot;,<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>fingerprint</span>: &quot;sha256:a3f2...&quot;<br />
                        {"}"}<br />
                        <span style={{ color: C.conv }}>semantic_diff</span>: {"{"}<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>removed</span>: [&quot;{evidence.highlight?.replace(/Removed: /, '') || 'content'}&quot;],<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>added</span>: [],<br />
                        &nbsp;&nbsp;<span style={{ color: C.pain }}>modified</span>: []<br />
                        {"}"}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${C.border}`,
                background: C.surface2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "10px", color: C.muted }}>
                Evidence captured by Bright Data Scraping Browser
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  background: color,
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: C.white,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close Evidence
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── EVIDENCE BADGE ─────────────────────────────────────────────────────────

interface EvidenceBadgeProps {
  count: number;
  onClick: () => void;
  type?: "void" | "compliance" | "pain" | "audio";
}

export function EvidenceBadge({ count, onClick, type = "void" }: EvidenceBadgeProps) {
  const color = type === "void" ? C.void : type === "compliance" ? C.compliance : type === "pain" ? C.pain : C.conv;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: "3px",
        fontSize: "9px",
        color,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <Eye size={10} />
      {count} evidence
    </motion.button>
  );
}
