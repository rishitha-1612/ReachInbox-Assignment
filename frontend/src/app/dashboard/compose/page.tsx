import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ComposePage() {
  return (
    <DashboardShell title="Compose Email">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Compose Email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and schedule your next email batch.
        </p>
      </div>
    </DashboardShell>
  );
}