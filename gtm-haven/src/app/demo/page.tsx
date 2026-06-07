import type { Metadata } from "next";
import Link from "next/link";
import DemoDashboard from "@/components/DemoDashboard";

export const metadata: Metadata = {
  title: "Live Demo | PreIntent  -  Convergent GTM Intelligence",
  description:
    "Try the full PreIntent dashboard  -  no sign-up required. See how we detect competitor retreats, regulatory signals, and community pain signals before anyone else.",
};

export default function DemoPage() {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      {/* Demo bar  -  introduces the interactive demo and routes to sign-up */}
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(124,58,237,0.16), rgba(32,112,255,0.10) 60%, rgba(36,192,56,0.08))",
          borderBottom: "1px solid rgba(144,96,255,0.22)",
          padding: "9px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "3px 9px",
              borderRadius: "999px",
              background: "rgba(144,96,255,0.16)",
              color: "#b794ff",
              border: "1px solid rgba(144,96,255,0.34)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#24c038",
                boxShadow: "0 0 0 3px rgba(36,192,56,0.22)",
                animation: "dot-blink 2s ease-in-out infinite",
              }}
            />
            LIVE DEMO
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#8aa0b4",
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Fully interactive  -  no sign-up.{" "}
            <span className="hide-on-mobile" style={{ color: "#5a7286" }}>
              Try{" "}
              <kbd
                style={{
                  fontFamily: "inherit",
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  border: "1px solid rgba(144,96,255,0.3)",
                  color: "#b794ff",
                  background: "rgba(144,96,255,0.1)",
                }}
              >
                Guided Tour
              </kbd>{" "}
              or{" "}
              <kbd
                style={{
                  fontFamily: "inherit",
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  border: "1px solid rgba(32,112,255,0.3)",
                  color: "#7fb0ff",
                  background: "rgba(32,112,255,0.1)",
                }}
              >
                Autoplay
              </kbd>{" "}
              in the top bar, or run a full scan.
            </span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <Link
            href="/sign-in"
            style={{
              fontSize: "10px",
              color: "#8aa0b4",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #7c3aed, #9060ff)",
              color: "#fff",
              textDecoration: "none",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              boxShadow: "0 4px 14px rgba(144,96,255,0.32)",
              whiteSpace: "nowrap",
            }}
          >
            Start free →
          </Link>
        </div>
      </div>

      {/* The actual dashboard  -  identical to the authenticated experience */}
      <DemoDashboard demoMode />
    </div>
  );
}
