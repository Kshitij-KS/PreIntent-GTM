"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DemoDashboard from "@/components/DemoDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

          // Fetch org knowledge and store in localStorage for the dashboard
          try {
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
        }
      } catch (e) {
        console.error("Dashboard init error:", e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

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
        <div style={{ width: "120px", height: "2px", background: "#18232f", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "99px",
            background: "linear-gradient(90deg, #9060ff, #24c038)",
            animation: "loading 1.4s ease-in-out infinite",
            width: "60%",
          }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { margin-left: 0%; width: 30%; }
            50% { margin-left: 40%; width: 50%; }
            100% { margin-left: 100%; width: 10%; }
          }
        `}</style>
      </div>
    );
  }

  return <DemoDashboard />;
}
