"use client";

import { useState, useTransition, useEffect } from "react";

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
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if supabase is configured on client
    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
    setSupabaseConfigured(hasSupabase);
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
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
              email,
              password,
              options: { data: { name } },
            });
            if (error) throw error;
            
            if (data.session) {
              onSuccess?.();
              window.location.href = "/onboarding";
            } else {
              setError("Check your email for the confirmation link.");
            }
          } else {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) throw error;
            
            onSuccess?.();
            window.location.href = "/onboarding";
          }
        } else {
          // Mock Sign In path
          const { mockSignIn } = await import("@/lib/auth");
          const result = await mockSignIn(email, password);

          if (!result.success) {
            setError(result.error ?? "Authentication failed");
            return;
          }

          onSuccess?.();
          window.location.href = "/onboarding";
        }
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

      {supabaseConfigured && (
        <div style={{ marginBottom: "24px" }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              background: "#18232f",
              border: "1px solid #243040",
              borderRadius: "10px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ddeeff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2d3e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#18232f"; }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "#4a6070", fontSize: "11px" }}>
            <div style={{ flex: 1, height: "1px", background: "#18232f" }} />
            <span style={{ padding: "0 10px" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#18232f" }} />
          </div>
        </div>
      )}

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

      {!supabaseConfigured && (
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
      )}
    </div>
  );
}
