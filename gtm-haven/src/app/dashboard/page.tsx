"use client";

import { useEffect, useState } from "react";
import DemoDashboard from "@/components/DemoDashboard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKnowledge() {
      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch org
          const { data: orgMember } = await supabase.from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .single();
            
          if (orgMember?.organization_id) {
            const { data: org } = await supabase.from('organizations')
              .select('company_knowledge')
              .eq('id', orgMember.organization_id)
              .single();
              
            if (org?.company_knowledge) {
              // Populate local storage so DemoDashboard picks it up
              localStorage.setItem('undertow_company_kdoc', JSON.stringify(org.company_knowledge));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load knowledge from Supabase", e);
      } finally {
        setLoading(false);
      }
    }
    loadKnowledge();
  }, []);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#07090f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c2d0de" }}>Loading dashboard...</div>;
  }

  return <DemoDashboard />;
}
