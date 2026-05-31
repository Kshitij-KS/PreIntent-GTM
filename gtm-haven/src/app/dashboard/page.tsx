"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [setupComplete, setSetupComplete] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
          const supabase = createSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.user) {
            router.replace("/sign-in?next=/dashboard");
            return;
          }
          
          setUser({ email: session.user.email || "" });

          // Fetch org knowledge and store in localStorage for the dashboard
          try {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("setup_status")
              .eq("user_id", session.user.id)
              .maybeSingle();

            setSetupComplete(profile?.setup_status === "complete");

            const { data: orgMember } = await supabase
              .from("organization_members")
              .select("organization_id")
              .eq("user_id", session.user.id)
              .single();

            if (orgMember?.organization_id) {
              const { data: org } = await supabase
                .from("organizations")
                .select("company_knowledge")
                .eq("id", orgMember.organization_id)
                .single();

              if (org?.company_knowledge) {
                localStorage.setItem("preintent_company_kdoc", JSON.stringify(org.company_knowledge));
              }
            }
          } catch {
            // Non-fatal: org data unavailable, dashboard still works
          }
        } else {
          // Mock mode: check cookie
          if (!document.cookie.includes("preintent_mock_session")) {
            router.replace("/sign-in?next=/dashboard");
            return;
          }
          setUser({ email: "mock@preintent.com" });
          setSetupComplete(document.cookie.includes("preintent_onboarding_done=1"));
        }
      } catch (e) {
        console.error("Dashboard init error:", e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/sign-in");
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#07090f",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: "#c2d0de", gap: "20px",
      }}>
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#9060ff" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="10" r="2.5" fill="#9060ff" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#9060ff" }}>PREINTENT</div>
          <div style={{ fontSize: "9px", color: "#4a6070", letterSpacing: "0.06em" }}>Loading your intelligence workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", color: "#c2d0de", fontFamily: "'IBM Plex Mono', monospace", padding: "40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 8px 0" }}>Dashboard</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#4a6070" }}>Welcome, {user?.email}</p>
        </div>
        
        <button 
          onClick={handleSignOut}
          style={{
            background: "transparent", border: "1px solid #18232f", color: "#c2d0de",
            padding: "8px 16px", borderRadius: "6px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px", fontSize: "12px",
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </header>

      <main>
        {!setupComplete && (
          <div style={{
            background: "rgba(144,96,255,0.08)",
            border: "1px solid rgba(144,96,255,0.35)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: "15px", margin: "0 0 8px" }}>
                Complete your company intelligence setup
              </h2>
              <p style={{ color: "#7f91a3", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>
                Finish onboarding to generate and save your intelligence workspace.
              </p>
            </div>
            <a href="/onboarding" style={{
              color: "#fff", textDecoration: "none", fontSize: "12px",
              background: "linear-gradient(135deg, #7c3aed, #9060ff)",
              padding: "10px 16px", borderRadius: "6px", fontWeight: 700,
            }}>
              Complete setup →
            </a>
          </div>
        )}

        <div style={{ background: "#0c1018", border: "1px solid #18232f", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px", color: "#9060ff" }}>✧</div>
          <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 12px 0" }}>Your Intelligence Hub</h2>
          <p style={{ color: "#4a6070", maxWidth: "400px", margin: "0 auto", fontSize: "12px", lineHeight: 1.6 }}>
            Company intelligence will be populated here based on your onboarding. 
            To view the interactive GTM agent simulation, check out the Live Demo.
          </p>
          <br/>
          <a href="/demo" style={{ color: "#9060ff", textDecoration: "none", fontSize: "12px", border: "1px solid #9060ff", padding: "8px 16px", borderRadius: "4px", display: "inline-block" }}>
            View Live Demo →
          </a>
        </div>
      </main>
    </div>
  );
}
