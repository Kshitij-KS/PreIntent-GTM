import type { Metadata } from "next";
import Link from "next/link";
import DemoDashboard from "@/components/DemoDashboard";

export const metadata: Metadata = {
  title: "Live Demo | PreIntent — Convergent GTM Intelligence",
  description:
    "Try the full PreIntent dashboard — no sign-up required. See how we detect competitor retreats, regulatory signals, and community pain signals before anyone else.",
};

export default function DemoPage() {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      {/* Demo banner */}
      <div style={{
        background: "linear-gradient(90deg, rgba(144,96,255,0.12), rgba(32,112,255,0.08))",
        borderBottom: "1px solid rgba(144,96,255,0.2)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em",
            padding: "2px 8px", borderRadius: "3px",
            background: "rgba(144,96,255,0.15)", color: "#9060ff",
            border: "1px solid rgba(144,96,255,0.3)",
          }}>
            LIVE DEMO
          </span>
          <span style={{ fontSize: "10px", color: "#4a6070", letterSpacing: "0.04em" }}>
            You&apos;re viewing a live demo with real signal data — no account required.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/sign-in"
            style={{
              fontSize: "10px", color: "#4a6070", textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
              background: "linear-gradient(135deg, #7c3aed, #9060ff)",
              color: "#fff", textDecoration: "none",
              padding: "4px 14px", borderRadius: "5px",
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
              boxShadow: "0 4px 14px rgba(144,96,255,0.3)",
            }}
          >
            Get full access →
          </Link>
        </div>
      </div>

      {/* The actual dashboard — identical to authenticated experience */}
      <DemoDashboard demoMode />
    </div>
  );
}
