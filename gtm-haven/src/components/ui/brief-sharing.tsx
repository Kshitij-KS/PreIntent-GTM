"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  FileText, 
  Hash, 
  Database, 
  Copy, 
  Check, 
  Share2, 
  Download,
  ExternalLink,
  X,
  QrCode
} from "lucide-react";
import type { PremiumAccount } from "@/lib/premium-demo-data";

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

// ─── SHARE OPTIONS ───────────────────────────────────────────────────────────

interface ShareOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  color: string;
  action: () => void;
}

// ─── BRIEF SHARING MODAL ───────────────────────────────────────────────────────

interface BriefSharingProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  briefContent: string;
  account?: PremiumAccount;
}

export function BriefSharing({ isOpen, onClose, accountName, briefContent, account }: BriefSharingProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"share" | "preview" | "export">("share");

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Dynamic values from account data (fall back to generic text if no account)
  const score = account?.convergence ?? 85;
  const status = account?.status ?? "ALERT";
  const contactName = account?.contact.name ?? "the key contact";
  const contactTitle = account?.contact.title ?? "Decision Maker";
  const voidEvent = account?.voidEvent ?? "Competitor product change detected";
  const complianceEvent = account?.complianceEvent ?? "Regulatory deadline approaching";
  const painEvent = account?.painEvent ?? "Active evaluation signal detected";
  const industry = account?.industry ?? "B2B SaaS";
  const employees = account?.employees?.toLocaleString() ?? "1,000+";
  const location = account?.location ?? "";
  const competitor = account?.competitor ?? "a key vendor";
  const contactFirstName = contactName.split(" ")[0];
  const linkedinHandle = account?.contact.linkedin ? account.contact.linkedin.split("/").pop() : contactName.toLowerCase().replace(/\s/g, "");

  const formatAsEmail = () => {
    return `Subject: Intel Brief: ${accountName} — Convergence Alert (${score}/100)

Hi [AE Name],

Preintent detected a high-priority convergence signal for ${accountName}.

${briefContent.split("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")[0]}

Full brief attached. Recommend outreach within 48 hours.

—
Preintent Intelligence Platform`;
  };

  const formatForSlack = () => {
    return `:rotating_light: *Convergence Alert: ${accountName}* :rotating_light:

*Score:* ${score}/100 (${status} status)
*Account:* ${accountName}
*Detected:* This week via Preintent

*Key Signals:*
• Competitor retreat: ${voidEvent.slice(0, 80)}
• Compliance pressure: ${complianceEvent.slice(0, 80)}
• Active evaluation: ${painEvent.slice(0, 80)}

*Suggested Opening:*
> "Hi ${contactFirstName} — I noticed ${competitor} made some changes recently, and given the regulatory tailwinds, the timing feels right for a quick conversation..."

*Next Steps:*
1. Review full brief in Preintent
2. Schedule outreach to ${contactTitle}
3. Update CRM with convergence context

cc: @sales-manager @sdr-team`;
  };

  const formatForCRM = () => {
    return `Lead Source: Preintent Convergence Platform
Lead Score: ${score}/100 (${status})
Account: ${accountName}
Industry: ${industry}
Employees: ${employees}${location ? `\nLocation: ${location}` : ""}
Competitor: ${competitor}

Signal Summary:
- Void Scanner: ${voidEvent.slice(0, 100)}
- Compliance Radar: ${complianceEvent.slice(0, 100)}
- Pain Listener: ${painEvent.slice(0, 100)}

Recommended Action:
Contact within ${status === "ALERT" ? "48 hours" : "7 days"}. Opening line and full context in attached Preintent brief.

Contact: ${contactTitle} (${contactName})${linkedinHandle ? `\nLinkedIn: linkedin.com/in/${linkedinHandle}` : ""}`;
  };

  const shareOptions: ShareOption[] = [
    {
      id: "email",
      label: "Copy as Email",
      description: "Formatted for Gmail/Outlook",
      icon: Mail,
      color: C.blue,
      action: () => handleCopy(formatAsEmail(), "email"),
    },
    {
      id: "slack",
      label: "Copy for Slack",
      description: "With emoji and formatting",
      icon: Hash,
      color: "#4A154B",
      action: () => handleCopy(formatForSlack(), "slack"),
    },
    {
      id: "crm",
      label: "Copy for HubSpot",
      description: "CRM-compatible format",
      icon: Database,
      color: "#FF7A59",
      action: () => handleCopy(formatForCRM(), "crm"),
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            maxWidth: "640px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
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
                background: `linear-gradient(135deg, ${C.conv}30, ${C.pain}10)`,
                border: `1px solid ${C.conv}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Share2 size={18} color={C.conv} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: C.white }}>
                Share Intel Brief
              </div>
              <div style={{ fontSize: "11px", color: C.muted }}>
                {accountName}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                marginLeft: "auto",
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
            {(["share", "preview", "export"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab ? C.conv : "transparent"}`,
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
              {activeTab === "share" && (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: C.muted,
                      marginBottom: "16px",
                    }}
                  >
                    Choose a format to copy and share with your team:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {shareOptions.map((option, i) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.01, backgroundColor: `${option.color}08` }}
                        whileTap={{ scale: 0.99 }}
                        onClick={option.action}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px",
                          background: C.surface2,
                          border: `1px solid ${copied === option.id ? option.color : C.border}`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                          transition: "border-color 0.2s",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            background: `${option.color}15`,
                            border: `1px solid ${option.color}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <option.icon size={20} color={option.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: C.text,
                              marginBottom: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {option.label}
                            {copied === option.id && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                  fontSize: "10px",
                                  color: option.color,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Check size={10} />
                                Copied!
                              </motion.span>
                            )}
                          </div>
                          <div style={{ fontSize: "10px", color: C.muted }}>
                            {option.description}
                          </div>
                        </div>
                        <div style={{ color: copied === option.id ? option.color : C.muted }}>
                          {copied === option.id ? <Check size={18} /> : <Copy size={18} />}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* QR Code hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      marginTop: "20px",
                      padding: "14px",
                      background: C.surface2,
                      border: `1px dashed ${C.border}`,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <QrCode size={20} color={C.muted} />
                    <div>
                      <div style={{ fontSize: "11px", color: C.text, fontWeight: 500 }}>
                        Mobile Handoff
                      </div>
                      <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
                        Scan QR to view brief on your phone for field reference
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      padding: "20px",
                      fontSize: "12px",
                      lineHeight: 1.7,
                      color: C.text,
                      whiteSpace: "pre-wrap",
                      maxHeight: "400px",
                      overflow: "auto",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {briefContent}
                  </div>
                </motion.div>
              )}

              {activeTab === "export" && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: C.muted,
                      marginBottom: "16px",
                    }}
                  >
                    Export options for documentation and archiving:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <motion.button
                      whileHover={{ scale: 1.01, backgroundColor: `${C.void}08` }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        // Open print dialog — browser will render as PDF
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`<html><head><title>Preintent Intel Brief — ${accountName}</title>
                            <style>body{font-family:monospace;padding:40px;max-width:800px;margin:auto;color:#111;line-height:1.7;}
                            h1{font-size:16px;margin-bottom:4px;}p{font-size:13px;}pre{white-space:pre-wrap;font-size:12px;}</style></head>
                            <body><h1>Preintent — Intel Brief</h1><p><strong>${accountName}</strong> · Convergence ${score}/100 · ${status}</p>
                            <hr/><pre>${briefContent}</pre></body></html>`);
                          win.document.close();
                          win.print();
                        }
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px", padding: "14px",
                        background: C.surface2, border: `1px solid ${C.border}`,
                        borderRadius: "6px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      }}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: `${C.void}15`, border: `1px solid ${C.void}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={20} color={C.void} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, color: C.text, marginBottom: "2px" }}>Export as PDF</div>
                        <div style={{ fontSize: "10px", color: C.muted }}>Opens print dialog — save as PDF from browser</div>
                      </div>
                      <Download size={18} color={C.muted} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.01, backgroundColor: `${C.pain}08` }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        const slug = accountName.toLowerCase().replace(/\s+/g, "-");
                        const link = `${window.location.origin}/brief/${slug}?ref=preintent&expires=${Date.now() + 7 * 86400 * 1000}`;
                        navigator.clipboard.writeText(link);
                        setCopied("link");
                        setTimeout(() => setCopied(null), 2500);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px", padding: "14px",
                        background: C.surface2, border: `1px solid ${copied === "link" ? C.pain : C.border}`,
                        borderRadius: "6px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: `${C.pain}15`, border: `1px solid ${C.pain}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {copied === "link" ? <Check size={20} color={C.pain} /> : <ExternalLink size={20} color={C.pain} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, color: C.text, marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                          {copied === "link" ? "Link copied!" : "Generate Shareable Link"}
                          {copied === "link" && <span style={{ fontSize: "10px", color: C.pain }}>✓</span>}
                        </div>
                        <div style={{ fontSize: "10px", color: C.muted }}>Secure 7-day link for external stakeholders</div>
                      </div>
                      {copied === "link" ? <Check size={18} color={C.pain} /> : <ExternalLink size={18} color={C.muted} />}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: `1px solid ${C.border}`,
              background: C.surface2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: C.muted }}>
              Brief will be available for 30 days in your archive
            </div>
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
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── SHARE TRIGGER BUTTON ──────────────────────────────────────────────────────

export function ShareTrigger({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: `linear-gradient(135deg, ${C.conv}20, ${C.conv}08)`,
        border: `1px solid ${C.conv}40`,
        borderRadius: "4px",
        fontSize: "10px",
        color: C.conv,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 500,
      }}
    >
      <Share2 size={12} />
      Share Brief
    </motion.button>
  );
}
