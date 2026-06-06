"use client";

/**
 * /dashboard  -  Authenticated intelligence workspace.
 *
 * Loads:
 *  1. Supabase auth session (or mock cookie in dev)
 *  2. Company knowledge doc (from Supabase org → localStorage cache)
 *  3. Renders RealDashboard with live API wiring
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import type { CompanyKnowledgeDoc } from "@/lib/company-knowledge";

// Loading screen  -  matches app design language
function DashboardLoading() {
  return (
    <div style={{
      minHeight: "100vh", background: "#07090f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#c2d0de", gap: "20px",
    }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes rotate-logo {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes text-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ position: "relative", width: "56px", height: "56px" }}>
        {/* Pulse ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(144,96,255,0.4)",
          animation: "pulse-ring 1.8s ease-out infinite",
        }} />

        <svg width="56" height="56" viewBox="0 0 56 56" fill="none"
          style={{ animation: "rotate-logo 4s linear infinite" }}>
          <path d="M28 5L51 18.5V37.5L28 51L5 37.5V18.5L28 5Z"
            stroke="#9060ff" strokeWidth="1.5" fill="none" />
          <path d="M28 14L44 23.5V33.5L28 43L12 33.5V23.5L28 14Z"
            fill="rgba(144,96,255,0.12)" stroke="rgba(144,96,255,0.4)" strokeWidth="1" />
          <circle cx="28" cy="28" r="5" fill="#9060ff" opacity="0.9" />
          <circle cx="28" cy="28" r="9" fill="none" stroke="rgba(144,96,255,0.35)" strokeWidth="1" />
        </svg>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
        animation: "fade-in 0.6s ease-out forwards",
      }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.22em", color: "#9060ff",
          fontWeight: 700,
        }}>
          PREINTENT
        </div>
        <div style={{
          fontSize: "9px", color: "#4a6070", letterSpacing: "0.1em",
          animation: "text-blink 1.8s ease-in-out infinite",
        }}>
          Loading intelligence workspace...
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [knowledgeDoc, setKnowledgeDoc] = useState<CompanyKnowledgeDoc | null>(null);
  const [RealDashboard, setRealDashboard] = useState<React.FC<{
    userEmail?: string;
    knowledgeDoc?: CompanyKnowledgeDoc | null;
  }> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          // ── SUPABASE MODE ────────────────────────────────────────────────
          const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
          const supabase = createSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.user) {
            router.replace("/sign-in?next=/dashboard");
            return;
          }

          setUserEmail(session.user.email || undefined);

          // Try to load knowledge doc from Supabase and cache to localStorage
          try {
            const { data: orgMember } = await supabase
              .from("organization_members")
              .select("organization_id")
              .eq("user_id", session.user.id)
              .maybeSingle();

            if (orgMember?.organization_id) {
              const { data: org } = await supabase
                .from("organizations")
                .select("company_knowledge")
                .eq("id", orgMember.organization_id)
                .single();

              if (org?.company_knowledge) {
                const doc = org.company_knowledge as CompanyKnowledgeDoc;
                // Cache to localStorage for client-side access
                try {
                  localStorage.setItem("preintent_company_kdoc", JSON.stringify(doc));
                } catch { /* non-fatal */ }
                setKnowledgeDoc(doc);
              } else {
                // Check localStorage cache as fallback
                try {
                  const cached = localStorage.getItem("preintent_company_kdoc");
                  if (cached) {
                    const parsed = JSON.parse(cached);
                    if (typeof parsed === 'object' && parsed !== null && 'companyName' in parsed) {
                      setKnowledgeDoc(parsed);
                    }
                  }
                } catch { /* non-fatal */ }
              }
            } else {
              // No org yet  -  try localStorage cache
              try {
                const cached = localStorage.getItem("preintent_company_kdoc");
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (typeof parsed === 'object' && parsed !== null && 'companyName' in parsed) {
                    setKnowledgeDoc(parsed);
                  }
                }
              } catch { /* non-fatal */ }
            }
          } catch {
            // Non-fatal: knowledge doc load failed, dashboard still works
            try {
              const cached = localStorage.getItem("preintent_company_kdoc");
              if (cached) {
                const parsed = JSON.parse(cached);
                if (typeof parsed === 'object' && parsed !== null && 'companyName' in parsed) {
                  setKnowledgeDoc(parsed);
                }
              }
            } catch { /* non-fatal */ }
          }
        } else {
          // ── MOCK MODE (no Supabase keys) ─────────────────────────────────
          if (!document.cookie.includes("preintent_mock_session")) {
            router.replace("/sign-in?next=/dashboard");
            return;
          }
          setUserEmail("demo@preintent.com");

          // Load knowledge doc from localStorage
          try {
            const cached = localStorage.getItem("preintent_company_kdoc");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (typeof parsed === 'object' && parsed !== null && 'companyName' in parsed) {
                setKnowledgeDoc(parsed);
              }
            }
          } catch { /* non-fatal */ }
        }

        // Lazy-load the heavy RealDashboard component after auth check
        const mod = await import("@/components/RealDashboard");
        setRealDashboard(() => mod.default);
      } catch (e) {
        console.error("Dashboard init error:", e);
        // Still load dashboard in degraded state
        const mod = await import("@/components/RealDashboard");
        setRealDashboard(() => mod.default);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  if (loading) return <DashboardLoading />;

  if (!RealDashboard) return <DashboardLoading />;

  return (
    <ToastProvider>
      <RealDashboard userEmail={userEmail} knowledgeDoc={knowledgeDoc} />
    </ToastProvider>
  );
}
