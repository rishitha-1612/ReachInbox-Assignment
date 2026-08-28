import { DashboardShell } from "@/components/layout/DashboardShell";
import DashboardContent from "@/components/dashboard/page";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <DashboardContent />
    </DashboardShell>
  );
}
