import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ScheduledPage() {
  return (
    <DashboardShell title="Scheduled Emails">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Scheduled Emails
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Emails waiting to be sent.
        </p>
      </div>
    </DashboardShell>
  );
}