"use client";

import { motion } from "framer-motion";
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  Zap,
  Globe,
  Mic,
  Brain,
  Database,
  Share2,
  Cog
} from "lucide-react";
import type { IntegrationStatus } from "@/lib/domain";

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

// ─── INTEGRATION ICONS ──────────────────────────────────────────────────────

const integrationIcons: Record<string, typeof Wifi> = {
  bright_data: Globe,
  ai_ml_api: Brain,
  speechmatics: Mic,
  cognee: Database,
  triggerware: Zap,
  slack: Share2,
  hubspot: Cog,
};

const integrationColors: Record<string, string> = {
  bright_data: "#00aaff",
  ai_ml_api: "#ff5a52",
  speechmatics: "#f0a000",
  featherless: "#24c038",
  cognee: "#9060ff",
  triggerware: "#ff8800",
  slack: "#4A154B",
  hubspot: "#FF7A59",
};

// ─── STATUS BADGE COMPONENT ─────────────────────────────────────────────────

function StatusBadge({ status, mode }: { status: string; mode: string }) {
  const getStatusConfig = () => {
    if (mode === "mock") {
      return {
        icon: CheckCircle,
        color: C.compliance,
        label: "DEMO MODE",
        pulse: false,
      };
    }
    if (mode === "real") {
      if (status === "healthy" || status === "live") {
        return {
          icon: CheckCircle,
          color: C.pain,
          label: "LIVE",
          pulse: true,
        };
      }
      if (status === "degraded") {
        return {
          icon: AlertCircle,
          color: C.compliance,
          label: "DEGRADED",
          pulse: false,
        };
      }
      return {
        icon: WifiOff,
        color: C.void,
        label: "OFFLINE",
        pulse: false,
      };
    }
    return {
      icon: Activity,
      color: C.muted,
      label: "UNKNOWN",
      pulse: false,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <motion.div
        animate={config.pulse ? {
          boxShadow: [
            `0 0 0px ${config.color}00`,
            `0 0 8px ${config.color}60`,
            `0 0 0px ${config.color}00`,
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: config.color,
        }}
      />
      <span
        style={{
          fontSize: "9px",
          color: config.color,
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

// ─── INTEGRATION CARD COMPONENT ─────────────────────────────────────────────

interface IntegrationCardProps {
  status: IntegrationStatus;
  index: number;
}

function IntegrationCard({ status, index }: IntegrationCardProps) {
  const Icon = integrationIcons[status.id] || Activity;
  const color = integrationColors[status.id] || C.conv;
  const isLive = status.mode === "real" && (status.status === "healthy" || status.status === "live");

  // Simulate metrics based on integration type
  const getMetrics = () => {
    const metrics: Record<string, { label: string; value: string }> = {
      bright_data: { label: "Last crawl", value: "14m ago" },
      ai_ml_api: { label: "Avg response", value: "1.2s" },
      speechmatics: { label: "Queue depth", value: "0 pending" },
      cognee: { label: "Profiles", value: "6 indexed" },
      triggerware: { label: "Workflows", value: "3 active" },
      slack: { label: "Connected", value: "#gtm-intel" },
      hubspot: { label: "API status", value: "Rate: 8%" },
    };
    return metrics[status.id] || { label: "Status", value: status.status };
  };

  const metrics = getMetrics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2, boxShadow: `0 8px 30px ${color}10` }}
      style={{
        background: C.surface2,
        border: `1px solid ${isLive ? `${color}40` : C.border}`,
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
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
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "2px" }}>
            {status.name}
          </div>
          <div style={{ fontSize: "10px", color: C.muted, lineHeight: 1.4 }}>
            {status.detail || "Enterprise integration"}
          </div>
        </div>

        <StatusBadge status={status.status} mode={status.mode} />
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: C.surface,
          borderRadius: "6px",
          border: `1px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: "10px", color: C.muted }}>{metrics.label}</span>
        <span style={{ fontSize: "11px", color: isLive ? color : C.muted, fontWeight: 500 }}>
          {metrics.value}
        </span>
      </div>

      {/* Tool info */}
      {status.mode === "mock" && (
        <div
          style={{
            fontSize: "9px",
            color: C.compliance,
            background: `${C.compliance}08`,
            padding: "6px 10px",
            borderRadius: "4px",
            border: `1px dashed ${C.compliance}30`,
          }}
        >
          Running in demo mode with sample data
        </div>
      )}
    </motion.div>
  );
}

// ─── MAIN DASHBOARD COMPONENT ───────────────────────────────────────────────

interface IntegrationStatusDashboardProps {
  integrations: IntegrationStatus[];
}

export function IntegrationStatusDashboard({ integrations }: IntegrationStatusDashboardProps) {
  const liveCount = integrations.filter(
    (i) => i.mode === "real" && (i.status === "healthy" || i.status === "live")
  ).length;
  const mockCount = integrations.filter((i) => i.mode === "mock").length;
  const totalCount = integrations.length;

  return (
    <div style={{ padding: "20px" }}>
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, ${C.surface}, ${C.surface2})`,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${C.conv}30, ${C.pain}10)`,
              border: `1px solid ${C.conv}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={24} color={C.conv} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: C.white }}>
              Integration Health
            </div>
            <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
              Real-time status of all connected services
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: C.pain }}>
              {liveCount}
            </div>
            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Live Connections
            </div>
          </div>
          
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: C.compliance }}>
              {mockCount}
            </div>
            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Demo Mode
            </div>
          </div>
          
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: C.conv }}>
              {totalCount}
            </div>
            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Services
            </div>
          </div>
        </div>
      </motion.div>

      {/* Integration Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {integrations.map((status, index) => (
          <IntegrationCard key={status.id} status={status} index={index} />
        ))}
      </div>

      {/* Configuration Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: "20px",
          padding: "16px",
          background: C.surface2,
          border: `1px dashed ${C.border}`,
          borderRadius: "6px",
        }}
      >
        <div style={{ fontSize: "11px", color: C.muted, lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>Configuration:</strong>{" "}
          Set <code style={{ background: C.surface, padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace" }}>AI_ML_MODE=real</code> and{" "}
          <code style={{ background: C.surface, padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace" }}>AI_ML_API_KEY</code> in{" "}
          <code style={{ background: C.surface, padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace" }}>.env.local</code> for live brief generation.
          All other integrations can run in zero-cost demo mode with realistic data.
        </div>
      </motion.div>
    </div>
  );
}

// ─── COMPACT STATUS INDICATOR ───────────────────────────────────────────────

export function IntegrationStatusCompact({ count }: { count: number }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        background: C.surface2,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: C.pain,
          boxShadow: `0 0 8px ${C.pain}60`,
        }}
      />
      <span style={{ fontSize: "11px", color: C.text }}>
        {count} services connected
      </span>
    </motion.button>
  );
}
