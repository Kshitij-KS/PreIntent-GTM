"use client";

import { useState, useTransition } from "react";

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const { mockSignIn } = await import("@/lib/auth");
        const result = await mockSignIn(email, password);

        if (!result.success) {
          setError(result.error ?? "Authentication failed");
          return;
        }

        onSuccess?.();
        // Redirect after successful auth
        window.location.href = "/onboarding";
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <div style={{
      background: "#0c1018",
      border: "1px solid #18232f",
      borderRadius: "16px",
      padding: "36px",
      width: "100%",
      maxWidth: "420px",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "22px",
          fontWeight: 700,
          color: "#ddeeff",
          letterSpacing: "0.12em",
        }}>
          <span style={{ color: "#9060ff", fontSize: "24px" }}>▼</span>
          UNDERTOW
        </div>
        <p style={{ margin: "8px 0 0", color: "#4a6070", fontSize: "13px" }}>
          Convergent GTM Intelligence
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "0",
        marginBottom: "28px",
        background: "#0a0e14",
        borderRadius: "10px",
        padding: "4px",
        border: "1px solid #18232f",
      }}>
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            style={{
              flex: 1,
              background: tab === t ? "#9060ff" : "transparent",
              border: "none",
              borderRadius: "7px",
              padding: "9px",
              fontSize: "12px",
              fontWeight: 600,
              color: tab === t ? "#fff" : "#4a6070",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.2s",
            }}
          >
            {t === "signin" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {tab === "signup" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#4a6070", marginBottom: "6px", letterSpacing: "0.08em" }}>
              YOUR NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              style={{
                width: "100%",
                background: "#07090f",
                border: "1px solid #18232f",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "14px",
                color: "#c2d0de",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#9060ff")}
              onBlur={(e) => (e.target.style.borderColor = "#18232f")}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#4a6070", marginBottom: "6px", letterSpacing: "0.08em" }}>
            WORK EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={{
              width: "100%",
              background: "#07090f",
              border: "1px solid #18232f",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "14px",
              color: "#c2d0de",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#9060ff")}
            onBlur={(e) => (e.target.style.borderColor = "#18232f")}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#4a6070", marginBottom: "6px", letterSpacing: "0.08em" }}>
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            style={{
              width: "100%",
              background: "#07090f",
              border: "1px solid #18232f",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "14px",
              color: "#c2d0de",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#9060ff")}
            onBlur={(e) => (e.target.style.borderColor = "#18232f")}
          />
        </div>

        {error && (
          <div style={{
            background: "#ff5a5218",
            border: "1px solid #ff5a5240",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#ff5a52",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: "100%",
            background: isPending ? "#1e2d3e" : "linear-gradient(135deg, #7c3aed, #9060ff)",
            border: "none",
            borderRadius: "10px",
            padding: "13px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
            cursor: isPending ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            transition: "all 0.2s",
            boxShadow: isPending ? "none" : "0 8px 24px rgba(144, 96, 255, 0.3)",
          }}
        >
          {isPending
            ? "Authenticating..."
            : tab === "signin"
            ? "Sign In to Undertow →"
            : "Create Account →"}
        </button>
      </form>

      {/* Mock mode notice */}
      <div style={{
        marginTop: "24px",
        padding: "12px",
        background: "#9060ff0d",
        border: "1px solid #9060ff20",
        borderRadius: "8px",
        fontSize: "11px",
        color: "#4a6070",
        textAlign: "center",
        lineHeight: 1.6,
      }}>
        🔒 Demo mode — any email & password works.{" "}
        <span style={{ color: "#9060ff" }}>No data is stored.</span>
      </div>
    </div>
  );
}
