"use client";

import { motion } from "framer-motion";

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
};

// ─── SHIMMER EFFECT ─────────────────────────────────────────────────────────

function ShimmerLine({ width = "100%", height = 12, delay = 0 }: { width?: string; height?: number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={{
        width,
        height,
        background: `linear-gradient(90deg, ${C.surface2} 0%, ${C.border2} 50%, ${C.surface2} 100%)`,
        backgroundSize: "200% 100%",
        borderRadius: "3px",
      }}
    />
  );
}

// ─── SKELETON COMPONENTS ────────────────────────────────────────────────────

export function DashboardCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "14px 16px",
      }}
    >
      <ShimmerLine width="60%" height={10} delay={delay} />
      <div style={{ marginTop: "12px" }}>
        <ShimmerLine width="40%" height={28} delay={delay + 0.1} />
      </div>
      <div style={{ marginTop: "8px" }}>
        <ShimmerLine width="50%" height={10} delay={delay + 0.2} />
      </div>
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "18px" }}>
      {[0, 0.1, 0.2, 0.3].map((delay, i) => (
        <DashboardCardSkeleton key={i} delay={delay} />
      ))}
    </div>
  );
}

export function AccountRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr 56px 56px 56px 56px 90px 80px",
        padding: "11px 16px",
        gap: "8px",
        borderBottom: `1px solid ${C.border}`,
        alignItems: "center",
      }}
    >
      <div>
        <ShimmerLine width="70%" height={12} delay={delay} />
        <div style={{ marginTop: "4px" }}>
          <ShimmerLine width="50%" height={9} delay={delay + 0.05} />
        </div>
      </div>
      <ShimmerLine width="80%" height={10} delay={delay + 0.1} />
      <ShimmerLine width="60%" height={10} delay={delay + 0.15} />
      <ShimmerLine width="60%" height={10} delay={delay + 0.2} />
      <ShimmerLine width="60%" height={10} delay={delay + 0.25} />
      <ShimmerLine width="70%" height={14} delay={delay + 0.3} />
      <ShimmerLine width="50%" height={14} delay={delay + 0.35} />
      <ShimmerLine width="60%" height={10} delay={delay + 0.4} />
    </div>
  );
}

export function AccountTableSkeleton() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 56px 56px 56px 56px 90px 80px",
          padding: "9px 16px",
          borderBottom: `1px solid ${C.border}`,
          gap: "8px",
        }}
      >
        {["COMPANY", "INDUSTRY", "VOID", "COMPL.", "PAIN", "CONV.", "STATUS", ""].map((label, i) => (
          <div key={label} style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em" }}>
            {label}
          </div>
        ))}
      </div>
      {/* Rows */}
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
        <AccountRowSkeleton key={i} delay={delay} />
      ))}
    </div>
  );
}

export function SignalCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.dim}`,
        borderRadius: "6px",
        padding: "12px 14px",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <ShimmerLine width="30%" height={12} delay={delay} />
        <ShimmerLine width="20%" height={9} delay={delay + 0.1} />
      </div>
      <ShimmerLine width="90%" height={10} delay={delay + 0.2} />
      <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
        <ShimmerLine width="15%" height={9} delay={delay + 0.3} />
        <ShimmerLine width="20%" height={9} delay={delay + 0.4} />
      </div>
    </div>
  );
}

export function IntelCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <ShimmerLine width="40%" height={10} delay={delay} />
        <ShimmerLine width="15%" height={18} delay={delay + 0.1} />
      </div>
      <ShimmerLine width="100%" height={3} delay={delay + 0.2} />
      <div style={{ marginTop: "10px" }}>
        <ShimmerLine width="85%" height={10} delay={delay + 0.3} />
      </div>
      <div style={{ marginTop: "4px" }}>
        <ShimmerLine width="70%" height={10} delay={delay + 0.4} />
      </div>
    </div>
  );
}

export function BriefSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <ShimmerLine width="25%" height={12} delay={0} />
      </div>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "6px",
          padding: "20px",
        }}
      >
        <ShimmerLine width="60%" height={14} delay={0.1} />
        <div style={{ marginTop: "16px" }}>
          <ShimmerLine width="100%" height={10} delay={0.2} />
          <div style={{ marginTop: "6px" }}>
            <ShimmerLine width="95%" height={10} delay={0.25} />
          </div>
          <div style={{ marginTop: "6px" }}>
            <ShimmerLine width="90%" height={10} delay={0.3} />
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <ShimmerLine width="50%" height={14} delay={0.35} />
          <div style={{ marginTop: "12px" }}>
            <ShimmerLine width="100%" height={10} delay={0.4} />
            <div style={{ marginTop: "6px" }}>
              <ShimmerLine width="85%" height={10} delay={0.45} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <ShimmerLine width="40%" height={14} delay={0.5} />
          <div style={{ marginTop: "12px" }}>
            <ShimmerLine width="30%" height={10} delay={0.55} />
            <div style={{ marginTop: "6px" }}>
              <ShimmerLine width="50%" height={10} delay={0.6} />
            </div>
            <div style={{ marginTop: "6px" }}>
              <ShimmerLine width="45%" height={10} delay={0.65} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BRANDED LOADING STATES ───────────────────────────────────────────────────

export function ScanLoadingState({ step, totalSteps, messages }: { step: number; totalSteps: number; messages: string[] }) {
  const progress = ((step + 1) / totalSteps) * 100;
  
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "14px 16px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "14px",
            height: "14px",
            border: `2px solid ${C.border}`,
            borderTop: `2px solid ${C.conv}`,
            borderRadius: "50%",
          }}
        />
        <span style={{ fontSize: "11px", color: C.text, fontWeight: 500 }}>
          {messages[step] || "Processing..."}
        </span>
      </div>
      
      {/* Progress bar */}
      <div
        style={{
          background: C.border,
          borderRadius: "2px",
          height: "3px",
          marginBottom: "12px",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${C.conv}, ${C.pain})`,
            borderRadius: "2px",
          }}
        />
      </div>
      
      {/* Step indicators */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {messages.map((msg, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{
              opacity: i < step ? 0.7 : i === step ? 1 : 0.4,
              scale: i === step ? 1.02 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              fontSize: "9px",
              padding: "2px 7px",
              borderRadius: "2px",
              background: i < step ? `${C.pain}15` : i === step ? `${C.conv}20` : `${C.dim}20`,
              color: i < step ? C.pain : i === step ? C.conv : C.dim,
              border: `1px solid ${i < step ? `${C.pain}30` : i === step ? `${C.conv}40` : `${C.dim}20`}`,
            }}
          >
            {i < step ? "✓ " : i === step ? "◌ " : ""}
            {msg}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export function BriefGeneratingState() {
  const loadingTexts = [
    "Analyzing convergence patterns...",
    "Cross-referencing account intelligence...",
    "Generating narrative context...",
    "Crafting opening line...",
    "Finalizing Intel Brief...",
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0px rgba(144, 96, 255, 0)",
              "0 0 20px rgba(144, 96, 255, 0.4)",
              "0 0 0px rgba(144, 96, 255, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "12px",
            height: "12px",
            background: C.conv,
            borderRadius: "50%",
          }}
        />
        <motion.span
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: "11px", color: C.text }}
        >
          AI/ML API generating Intel Brief...
        </motion.span>
      </div>
      
      {loadingTexts.map((text, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: i === 0 ? [0.3, 1, 0.3] : i === 1 ? [0.2, 0.8, 0.2] : 0.2,
            x: 0,
          }}
          transition={{
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
            x: { duration: 0.3, delay: i * 0.1 },
          }}
          style={{
            fontSize: "10px",
            color: C.muted,
            marginBottom: "6px",
            paddingLeft: "24px",
          }}
        >
          {i === 0 && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ marginRight: "6px" }}
            >
              ▶
            </motion.span>
          )}
          {text}
        </motion.div>
      ))}
    </div>
  );
}

// ─── FULL PAGE SKELETONS ──────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div style={{ padding: "20px" }}>
      <StatsGridSkeleton />
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: "100px",
              height: "28px",
              background: C.border2,
              borderRadius: "4px",
            }}
          />
          <ShimmerLine width="40%" height={10} delay={0.2} />
        </div>
      </div>
      <AccountTableSkeleton />
    </div>
  );
}

export function SignalsSkeleton() {
  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[0, 0.1, 0.2, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
            style={{
              width: "100px",
              height: "28px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "4px",
            }}
          />
        ))}
      </div>
      {[0, 0.15, 0.3, 0.45].map((delay, i) => (
        <SignalCardSkeleton key={i} delay={delay} />
      ))}
    </div>
  );
}

export function IntelSkeleton() {
  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {[0, 0.1, 0.2].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
            style={{
              width: "80px",
              height: "26px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "4px",
            }}
          />
        ))}
      </div>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "12px",
        }}
      >
        <ShimmerLine width="50%" height={18} delay={0} />
        <div style={{ marginTop: "8px" }}>
          <ShimmerLine width="70%" height={11} delay={0.1} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "12px" }}>
        {[0, 0.1, 0.2].map((delay, i) => (
          <IntelCardSkeleton key={i} delay={delay} />
        ))}
      </div>
      <BriefSkeleton />
    </div>
  );
}
