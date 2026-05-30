import DemoDashboard from "@/components/DemoDashboard";

export default function Home() {
  // Undertow MVP: fully self-contained demo (localStorage + in-memory fixtures).
  // No external data or Supabase required for the hackathon zero-cost build.
  return <DemoDashboard />;
}
