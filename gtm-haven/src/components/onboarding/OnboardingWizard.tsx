"use client";

import { useState } from "react";
import type { CompanyKnowledgeDoc, CompanyOnboardingData } from "@/lib/company-knowledge";

const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#111820",
  border: "#18232f",
  border2: "#1e2d3e",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#243040",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
  conv: "#9060ff",
  blue: "#2070ff",
  white: "#ddeeff",
};

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Company", title: "Tell us about your company" },
  { id: 2, label: "GTM Context", title: "Your GTM context" },
  { id: 3, label: "Stack & Goals", title: "Tech stack & goals" },
  { id: 4, label: "Intelligence", title: "Building your intelligence doc" },
];

const INDUSTRIES = [
  "FinTech / Payments", "HealthTech", "B2B SaaS", "Developer Tools",
  "Supply Chain", "HR Tech", "Cybersecurity", "MarTech", "EdTech",
  "Legal Tech", "PropTech", "InsurTech", "Other",
];

const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

const CRM_OPTIONS = ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM", "Monday Sales", "Outreach", "None / Custom"];

const COMMON_TOOLS = [
  "Slack", "Notion", "Jira", "LinkedIn Sales Nav", "Apollo", "ZoomInfo",
  "Gong", "Chorus", "Marketo", "Pardot", "Segment", "Mixpanel",
];

// ─── Form field components ────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "11px", color: C.muted, marginBottom: "7px", letterSpacing: "0.08em", fontWeight: 600 }}>
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "#07090f",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "11px 14px",
        fontSize: "14px",
        color: C.text,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
        fontFamily: "inherit",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.conv)}
      onBlur={(e) => (e.target.style.borderColor = C.border)}
    />
  );
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "#07090f",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "11px 14px",
        fontSize: "14px",
        color: C.text,
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        transition: "border-color 0.2s",
        fontFamily: "inherit",
        lineHeight: 1.6,
      }}
      onFocus={(e) => (e.target.style.borderColor = C.conv)}
      onBlur={(e) => (e.target.style.borderColor = C.border)}
    />
  );
}

function Select({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#07090f",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "11px 14px",
        fontSize: "14px",
        color: value ? C.text : C.muted,
        outline: "none",
        boxSizing: "border-box",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <option value="" disabled>Select...</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TagPicker({
  label, options, selected, onChange,
}: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            style={{
              background: selected.includes(o) ? `${C.conv}20` : "transparent",
              border: `1px solid ${selected.includes(o) ? C.conv : C.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              color: selected.includes(o) ? C.conv : C.muted,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// A text input that builds an array (comma-separated or add-button)
function MultiInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");
  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputVal("");
    }
  };
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          style={{
            flex: 1,
            background: "#07090f",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            color: C.text,
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = C.conv)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        <button
          type="button"
          onClick={add}
          style={{
            background: C.conv,
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontSize: "13px",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {value.map((v) => (
          <span
            key={v}
            style={{
              background: `${C.conv}18`,
              border: `1px solid ${C.conv}40`,
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "12px",
              color: C.conv,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Knowledge Doc Display ────────────────────────────────────────────────────

function KnowledgeDocView({ doc, onProceed }: { doc: CompanyKnowledgeDoc; onProceed: () => void | Promise<void> }) {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      await onProceed();
    } catch {
      setLaunching(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.6s ease" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{
        background: `${C.conv}12`,
        border: `1px solid ${C.conv}30`,
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "20px" }}>✦</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.white }}>
              Company Knowledge Doc — {doc.companyName}
            </div>
            <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
              Generated {new Date(doc.generatedAt).toLocaleString()} · {doc.generatedBy === "ai_ml_api" ? "AI/ML API (live)" : "Intelligence Engine (mock)"}
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: "14px", color: C.text, lineHeight: 1.7 }}>
          {doc.segmentSummary}
        </p>
      </div>

      {/* ICP */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", color: C.conv, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "14px" }}>IDEAL CUSTOMER PROFILE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {[
            { label: "Company Size", value: doc.icp.companySize },
            { label: "Target Industries", value: doc.icp.industries.join(", ") },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.surface2, borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "13px", color: C.text }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "8px" }}>TRIGGER EVENTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {doc.icp.triggerEvents.map((t) => (
              <span key={t} style={{ fontSize: "11px", padding: "4px 10px", background: `${C.pain}12`, border: `1px solid ${C.pain}30`, borderRadius: "6px", color: C.pain }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", color: C.compliance, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "14px" }}>TOP GTM OPPORTUNITIES</div>
        {doc.opportunities.map((opp, i) => (
          <div key={i} style={{
            borderTop: `1px solid ${opp.urgency === "HIGH" ? C.void + "40" : opp.urgency === "MEDIUM" ? C.compliance + "40" : C.border}`,
            borderRight: `1px solid ${opp.urgency === "HIGH" ? C.void + "40" : opp.urgency === "MEDIUM" ? C.compliance + "40" : C.border}`,
            borderBottom: `1px solid ${opp.urgency === "HIGH" ? C.void + "40" : opp.urgency === "MEDIUM" ? C.compliance + "40" : C.border}`,
            borderLeft: `3px solid ${opp.urgency === "HIGH" ? C.void : opp.urgency === "MEDIUM" ? C.compliance : C.muted}`,
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: C.white }}>{opp.title}</span>
              <span style={{
                fontSize: "9px",
                padding: "2px 8px",
                borderRadius: "4px",
                background: opp.urgency === "HIGH" ? `${C.void}20` : opp.urgency === "MEDIUM" ? `${C.compliance}20` : `${C.muted}20`,
                color: opp.urgency === "HIGH" ? C.void : opp.urgency === "MEDIUM" ? C.compliance : C.muted,
                letterSpacing: "0.08em",
              }}>{opp.urgency}</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>{opp.description}</p>
            <div style={{ fontSize: "11px", color: C.conv }}>→ {opp.suggestedAction}</div>
          </div>
        ))}
      </div>

      {/* Seed accounts */}
      {doc.seedAccounts.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: C.void, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "14px" }}>SEED ACCOUNTS TO MONITOR</div>
          {doc.seedAccounts.map((acc, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < doc.seedAccounts.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontSize: "13px", color: C.white, fontWeight: 500 }}>{acc.name}</div>
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{acc.industry} · {acc.employees}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: C.void }}>{acc.competitor}</div>
                <div style={{ fontSize: "10px", color: C.muted, maxWidth: "200px", textAlign: "right", marginTop: "2px" }}>{acc.whyNow}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleLaunch}
        disabled={launching}
        style={{
          width: "100%",
          background: launching ? "#1e2d3e" : "linear-gradient(135deg, #7c3aed, #9060ff)",
          border: "none",
          borderRadius: "10px",
          padding: "14px",
          fontSize: "14px",
          fontWeight: 700,
          color: "#fff",
          cursor: launching ? "not-allowed" : "pointer",
          letterSpacing: "0.05em",
          boxShadow: launching ? "none" : "0 8px 24px rgba(144, 96, 255, 0.35)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {launching ? (
          <>
            <span style={{
              width: "14px", height: "14px", borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "#9060ff",
              animation: "spin 0.8s linear infinite",
              display: "inline-block",
            }} />
            Activating workspace...
          </>
        ) : (
          "Launch PreIntent Dashboard →"
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    </div>
  );
}

// ─── AI Processing Animation ─────────────────────────────────────────────────

function AIProcessingScreen({ companyName, onComplete }: { companyName: string; onComplete: (doc: CompanyKnowledgeDoc) => void }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const processingSteps = [
    "Analyzing company segment and ICP...",
    "Mapping competitive landscape...",
    "Identifying regulatory exposure...",
    "Detecting community buying signals...",
    "Generating GTM opportunities...",
    "Building scan configuration...",
    "Finalizing knowledge document...",
  ];

  // Run the API call on mount
  useState(() => {
    let cancelled = false;
    let stepIndex = 0;

    const interval = setInterval(() => {
      stepIndex++;
      if (!cancelled) setStep(stepIndex);
      if (stepIndex >= processingSteps.length - 1) clearInterval(interval);
    }, 800);

    // Get data from sessionStorage
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("preintent_onboarding") : null;
    const data = raw ? JSON.parse(raw) : null;

    if (!data) {
      clearInterval(interval);
      setError("Onboarding data not found. Please restart.");
      return;
    }

    fetch("/api/onboarding/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((result) => {
        if (!cancelled) {
          clearInterval(interval);
          setStep(processingSteps.length);
          if (result.success) {
            // Save to localStorage for dashboard to consume
            localStorage.setItem("preintent_company_kdoc", JSON.stringify(result.doc));
            setTimeout(() => onComplete(result.doc), 600);
          } else {
            setError(result.error ?? "Failed to generate knowledge doc");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          clearInterval(interval);
          setError(String(err));
        }
      });

    return () => { cancelled = true; clearInterval(interval); };
  });

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      {/* Animated orb */}
      <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 32px" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.conv}30, transparent)`,
          animation: "orb-pulse 2s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          inset: "10px",
          borderRadius: "50%",
          border: `2px solid ${C.conv}60`,
          animation: "orb-spin 3s linear infinite",
        }} />
        <div style={{
          position: "absolute",
          inset: "20px",
          borderRadius: "50%",
          background: `${C.conv}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
        }}>
          ✦
        </div>
      </div>

      <style>{`
        @keyframes orb-pulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.1);opacity:1} }
        @keyframes orb-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ fontSize: "20px", fontWeight: 700, color: C.white, marginBottom: "8px" }}>
        Building Your Intelligence
      </div>
      <div style={{ fontSize: "13px", color: C.muted, marginBottom: "40px" }}>
        AI is analyzing {companyName} and generating your GTM knowledge doc
      </div>

      {error ? (
        <div style={{ background: `${C.void}18`, border: `1px solid ${C.void}40`, borderRadius: "8px", padding: "14px", color: C.void, fontSize: "13px" }}>
          ⚠ {error}
        </div>
      ) : (
        <div style={{ maxWidth: "380px", margin: "0 auto" }}>
          {processingSteps.map((s, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              borderBottom: i < processingSteps.length - 1 ? `1px solid ${C.border}` : "none",
              opacity: i <= step ? 1 : 0.3,
              transition: "opacity 0.4s",
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: i < step ? C.pain : i === step ? C.conv : C.dim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#fff",
                flexShrink: 0,
                transition: "background 0.4s",
              }}>
                {i < step ? "✓" : i === step ? "◌" : ""}
              </div>
              <span style={{ fontSize: "13px", color: i < step ? C.pain : i === step ? C.white : C.muted, textAlign: "left" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Wizard ───────────────────────────────────────────────────

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDoc, setShowDoc] = useState(false);
  const [knowledgeDoc, setKnowledgeDoc] = useState<CompanyKnowledgeDoc | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CompanyOnboardingData>({
    companyName: "",
    website: "",
    industry: "",
    teamSize: "",
    hq: "",
    icpDescription: "",
    targetVerticals: [],
    topCompetitors: [],
    mainPainPoints: "",
    crm: "None",
    existingTools: [],
    gtmGoals: "",
    revenueTarget: "",
  });

  const set = (field: keyof CompanyOnboardingData) => (value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.companyName) newErrors.companyName = "Required";
      if (!form.industry) newErrors.industry = "Required";
      if (!form.teamSize) newErrors.teamSize = "Required";
      if (!form.hq) newErrors.hq = "Required";
    }
    if (step === 2) {
      if (!form.icpDescription) newErrors.icpDescription = "Required";
      if (form.topCompetitors.length === 0) newErrors.topCompetitors = "Add at least one competitor";
    }
    if (step === 3) {
      if (!form.gtmGoals) newErrors.gtmGoals = "Required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 3) {
      // Save to sessionStorage before triggering AI
      sessionStorage.setItem("preintent_onboarding", JSON.stringify(form));
    }
    setCurrentStep((s) => s + 1);
  };

  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleDocGenerated = (doc: CompanyKnowledgeDoc) => {
    setKnowledgeDoc(doc);
    setShowDoc(true);
  };

  const handleProceed = async () => {
    window.location.href = "/dashboard";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Inter', 'IBM Plex Mono', system-ui, sans-serif",
      color: C.text,
      display: "flex",
    }}>
      {/* Sidebar */}
      <div style={{
        width: "280px",
        flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        background: C.surface,
        padding: "40px 28px",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
          <span style={{ color: C.conv, fontSize: "22px", fontWeight: 700 }}>▼</span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: C.white, letterSpacing: "0.12em" }}>PREINTENT</span>
        </div>

        {/* Steps */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", marginBottom: "20px" }}>
            ONBOARDING STEPS
          </div>
          {STEPS.map((step) => {
            const isDone = currentStep > step.id || showDoc;
            const isCurrent = currentStep === step.id && !showDoc;
            return (
              <div key={step.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: isDone ? C.pain : isCurrent ? C.conv : C.dim,
                  border: `2px solid ${isDone ? C.pain : isCurrent ? C.conv : C.dim}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}>
                  {isDone ? "✓" : step.id}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: isCurrent ? 600 : 400, color: isCurrent ? C.white : isDone ? C.pain : C.muted }}>
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: "11px", color: C.dim, lineHeight: 1.6, marginTop: "auto" }}>
          Your data is used only to configure your PreIntent intelligence workspace.
          <div style={{ marginTop: "16px" }}>
            <button 
              onClick={async () => {
                await fetch('/api/auth/signout', { method: 'POST' });
                window.location.href = '/sign-in';
              }}
              style={{
                background: 'transparent', border: 'none',
                color: C.muted, fontSize: '11px', cursor: 'pointer',
                textDecoration: 'underline', padding: 0
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "48px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Step indicator */}
          {!showDoc && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.1em" }}>
                STEP {currentStep} OF {STEPS.length}
              </div>
              <div style={{ height: "3px", background: C.border, borderRadius: "2px", marginTop: "10px" }}>
                <div style={{
                  height: "100%",
                  background: C.conv,
                  borderRadius: "2px",
                  width: showDoc ? "100%" : `${(currentStep / STEPS.length) * 100}%`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}

          {!showDoc && currentStep < 4 && (
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: C.white, margin: "24px 0 32px", letterSpacing: "-0.02em" }}>
              {STEPS[currentStep - 1].title}
            </h1>
          )}

          {/* ── STEP 1: Company Basics ── */}
          {currentStep === 1 && !showDoc && (
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <Label>COMPANY NAME *</Label>
                <Input value={form.companyName} onChange={set("companyName")} placeholder="Acme Corp" />
                {errors.companyName && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.companyName}</div>}
              </div>
              <div>
                <Label>COMPANY WEBSITE</Label>
                <Input value={form.website ?? ""} onChange={set("website")} placeholder="https://acmecorp.com" type="url" />
              </div>
              <div>
                <Label>INDUSTRY *</Label>
                <Select value={form.industry} onChange={set("industry")} options={INDUSTRIES} />
                {errors.industry && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.industry}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <Label>TEAM SIZE *</Label>
                  <Select value={form.teamSize} onChange={set("teamSize")} options={TEAM_SIZES} />
                  {errors.teamSize && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.teamSize}</div>}
                </div>
                <div>
                  <Label>HEADQUARTERS *</Label>
                  <Input value={form.hq} onChange={set("hq")} placeholder="San Francisco, CA" />
                  {errors.hq && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.hq}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: GTM Context ── */}
          {currentStep === 2 && !showDoc && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <Label>DESCRIBE YOUR IDEAL CUSTOMER *</Label>
                <Textarea
                  value={form.icpDescription}
                  onChange={set("icpDescription")}
                  placeholder="e.g. Mid-market B2B SaaS companies with 50-500 employees who rely on a legacy payment processor and are approaching contract renewal..."
                  rows={4}
                />
                {errors.icpDescription && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.icpDescription}</div>}
              </div>
              <TagPicker
                label="TARGET VERTICALS"
                options={INDUSTRIES.filter((i) => i !== "Other")}
                selected={form.targetVerticals}
                onChange={(v) => set("targetVerticals")(v)}
              />
              <MultiInput
                label="TOP COMPETITORS (ADD THEM ONE BY ONE) *"
                value={form.topCompetitors}
                onChange={(v) => set("topCompetitors")(v)}
                placeholder="e.g. Stripe, HubSpot, Salesforce..."
              />
              {errors.topCompetitors && <div style={{ fontSize: "11px", color: C.void }}>{errors.topCompetitors}</div>}
              <div>
                <Label>YOUR TEAM&apos;S MAIN PAIN POINTS IN GTM</Label>
                <Textarea
                  value={form.mainPainPoints}
                  onChange={set("mainPainPoints")}
                  placeholder="e.g. We're always reacting to competitor moves too late. Manual research takes 10+ hours per week per rep..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Stack + Goals ── */}
          {currentStep === 3 && !showDoc && (
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <Label>PRIMARY CRM</Label>
                <Select value={form.crm} onChange={set("crm")} options={CRM_OPTIONS} />
              </div>
              <TagPicker
                label="EXISTING GTM TOOLS"
                options={COMMON_TOOLS}
                selected={form.existingTools}
                onChange={(v) => set("existingTools")(v)}
              />
              <div>
                <Label>YOUR PRIMARY GTM GOAL *</Label>
                <Textarea
                  value={form.gtmGoals}
                  onChange={set("gtmGoals")}
                  placeholder="e.g. Increase win rate against Stripe by 20% in H2. Identify competitor-displaced accounts 30 days before they start an RFP..."
                  rows={3}
                />
                {errors.gtmGoals && <div style={{ fontSize: "11px", color: C.void, marginTop: "4px" }}>{errors.gtmGoals}</div>}
              </div>
              <div>
                <Label>ANNUAL REVENUE TARGET (OPTIONAL)</Label>
                <Input value={form.revenueTarget ?? ""} onChange={set("revenueTarget")} placeholder="e.g. $5M ARR" />
              </div>
            </div>
          )}

          {/* ── STEP 4: AI Processing ── */}
          {currentStep === 4 && !showDoc && (
            <AIProcessingScreen
              companyName={form.companyName || "your company"}
              onComplete={handleDocGenerated}
            />
          )}

          {/* ── Knowledge Doc Display ── */}
          {showDoc && knowledgeDoc && (
            <KnowledgeDocView doc={knowledgeDoc} onProceed={handleProceed} />
          )}

          {/* Navigation buttons */}
          {!showDoc && currentStep < 4 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: `1px solid ${C.border}`,
            }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: "11px 24px",
                  fontSize: "14px",
                  color: currentStep === 1 ? C.dim : C.muted,
                  cursor: currentStep === 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #9060ff)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 6px 20px rgba(144, 96, 255, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {currentStep === 3 ? "Generate Intelligence →" : "Continue →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
