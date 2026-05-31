"use client";

import { useState, useTransition, useEffect } from "react";

interface AuthFormProps {
  onSuccess?: () => void;
  /** Where to send the user after a successful auth. Defaults to /onboarding */
  redirectTo?: string;
}

export default function AuthForm({ onSuccess, redirectTo = "/onboarding" }: AuthFormProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    setSupabaseConfigured(
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    );
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Sign In failed");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (supabaseConfigured) {
          const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
          const supabase = createSupabaseBrowserClient();
          if (tab === "signup") {
            const { data, error } = await supabase.auth.signUp({
              email, password, options: { data: { name } },
            });
            if (error) throw error;
            if (data.session) { onSuccess?.(); window.location.href = redirectTo; }
            else setError("Check your email for the confirmation link.");
          } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            onSuccess?.(); window.location.href = redirectTo;
          }
        } else {
          const { mockSignIn } = await import("@/lib/auth");
          const result = await mockSignIn(email, password);
          if (!result.success) { setError(result.error ?? "Authentication failed"); return; }
          onSuccess?.(); window.location.href = redirectTo;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(7,9,15,0.8)", border: "1px solid #18232f",
    borderRadius: "8px", padding: "12px 16px", fontSize: "13px",
    color: "#c2d0de", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "9px", color: "#4a6070",
    marginBottom: "6px", letterSpacing: "0.1em", fontWeight: 600,
  };

  return (
    <div style={{
      background: "rgba(12,16,24,0.9)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      padding: "36px",
      width: "100%",
      maxWidth: "420px",
      backdropFilter: "blur(24px)",
      boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Inner glow */}
      <div style={{
        position: "absolute", top: "-60px", right: "-60px",
        width: "200px", height: "200px",
        background: "radial-gradient(circle, rgba(144,96,255,0.12), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          fontSize: "18px", fontWeight: 800, color: "#ddeeff", letterSpacing: "0.2em",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#9060ff" strokeWidth="1.5" fill="none" />
            <path d="M10 5.5L14.5 8V13L10 15.5L5.5 13V8L10 5.5Z" fill="#9060ff" fillOpacity="0.25" />
            <circle cx="10" cy="10" r="2.5" fill="#9060ff" />
          </svg>
          PREINTENT
        </div>
        <p style={{ margin: "8px 0 0", color: "#4a6070", fontSize: "11px", letterSpacing: "0.06em" }}>
          Convergent GTM Intelligence
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", marginBottom: "26px",
        background: "rgba(7,9,15,0.7)", borderRadius: "9px",
        padding: "3px", border: "1px solid #18232f",
      }}>
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            style={{
              flex: 1, background: tab === t ? "linear-gradient(135deg, #7c3aed, #9060ff)" : "transparent",
              border: "none", borderRadius: "7px", padding: "9px",
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
              color: tab === t ? "#fff" : "#4a6070",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.2s",
              boxShadow: tab === t ? "0 4px 12px rgba(144,96,255,0.35)" : "none",
            }}
          >
            {t === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        ))}
      </div>

      {/* Google */}
      {supabaseConfigured && (
        <div style={{ marginBottom: "22px" }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%", background: "rgba(24,35,47,0.6)",
              border: "1px solid #1e2d3e", borderRadius: "8px",
              padding: "12px", fontSize: "12px", fontWeight: 600,
              color: "#c2d0de", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "10px", transition: "all 0.2s", letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2a3d52"; e.currentTarget.style.background = "rgba(30,45,62,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d3e"; e.currentTarget.style.background = "rgba(24,35,47,0.6)"; }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", margin: "18px 0", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "#18232f" }} />
            <span style={{ fontSize: "9px", color: "#1e2d3e", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#18232f" }} />
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {tab === "signup" && (
          <div>
            <label style={labelStyle}>YOUR NAME</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#9060ff"; e.target.style.boxShadow = "0 0 0 3px rgba(144,96,255,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#18232f"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>WORK EMAIL</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#9060ff"; e.target.style.boxShadow = "0 0 0 3px rgba(144,96,255,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#18232f"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label style={labelStyle}>PASSWORD</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" required minLength={6} style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#9060ff"; e.target.style.boxShadow = "0 0 0 3px rgba(144,96,255,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#18232f"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {error && (
          <div style={{
            background: "rgba(255,90,82,0.08)", border: "1px solid rgba(255,90,82,0.3)",
            borderRadius: "6px", padding: "10px 14px", fontSize: "11px", color: "#ff5a52",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: "100%", border: "none", borderRadius: "8px", padding: "13px",
            fontSize: "11px", fontWeight: 700, color: "#fff", cursor: isPending ? "not-allowed" : "pointer",
            letterSpacing: "0.1em", fontFamily: "inherit", marginTop: "4px",
            background: isPending
              ? "#1e2d3e"
              : "linear-gradient(135deg, #7c3aed 0%, #9060ff 50%, #6040cc 100%)",
            boxShadow: isPending ? "none" : "0 8px 24px rgba(144,96,255,0.35)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.transform = "translateY(-2px)"; if (!isPending) e.currentTarget.style.boxShadow = "0 12px 32px rgba(144,96,255,0.48)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isPending ? "none" : "0 8px 24px rgba(144,96,255,0.35)"; }}
        >
          {isPending ? "AUTHENTICATING..." : tab === "signin" ? "SIGN IN TO Preintent →" : "CREATE ACCOUNT →"}
        </button>
      </form>

      {!supabaseConfigured && (
        <div style={{
          marginTop: "20px", padding: "10px 14px",
          background: "rgba(144,96,255,0.06)", border: "1px solid rgba(144,96,255,0.15)",
          borderRadius: "6px", fontSize: "10px", color: "#4a6070",
          textAlign: "center", lineHeight: 1.7, letterSpacing: "0.02em",
        }}>
          Demo mode — any email & password works.{" "}
          <span style={{ color: "#9060ff" }}>No data is stored.</span>
        </div>
      )}
    </div>
  );
}
