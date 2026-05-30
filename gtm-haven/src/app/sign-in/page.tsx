import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | Undertow — Convergent GTM Intelligence",
  description:
    "Sign in to Undertow and get AI-powered GTM intelligence on your target accounts.",
};

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "'Inter', 'IBM Plex Mono', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-200px",
          left: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(32, 112, 255, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        <AuthForm />

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12px",
            color: "#243040",
          }}
        >
          <Link href="/" style={{ color: "#4a6070", textDecoration: "none" }}>
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
