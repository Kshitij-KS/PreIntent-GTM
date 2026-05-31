"use client";

import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

function AuthPageContent({ initialTab }: { initialTab: "signin" | "signup" }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07090f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(32,112,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(32,112,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "-180px", right: "-120px",
        width: "620px", height: "620px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-160px", left: "-80px",
        width: "520px", height: "520px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(32,112,255,0.09) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "25%",
        transform: "translate(-50%, -50%)",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(36,192,56,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        <AuthForm initialTab={initialTab} />

        <div style={{ textAlign: "center", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <Link href="/" style={{ fontSize: "10px", color: "#4a6070", textDecoration: "none", letterSpacing: "0.04em" }}>
            ← Homepage
          </Link>
          <span style={{ color: "#18232f", fontSize: "10px" }}>·</span>
          <Link href="/demo" style={{ fontSize: "10px", color: "#4a6070", textDecoration: "none", letterSpacing: "0.04em" }}>
            Try free demo →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage({ initialTab }: { initialTab: "signin" | "signup" }) {
  return (
    <Suspense>
      <AuthPageContent initialTab={initialTab} />
    </Suspense>
  );
}
