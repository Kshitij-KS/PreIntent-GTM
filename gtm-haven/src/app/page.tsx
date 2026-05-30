import DemoDashboard from "@/components/DemoDashboard";
import { getDemoCommandCenterData } from "@/lib/demo-data";

export default function Home() {
  return <DemoDashboard initialData={getDemoCommandCenterData()} />;
}
