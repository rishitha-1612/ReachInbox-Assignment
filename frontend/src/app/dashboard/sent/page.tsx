import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SentPage() {
  return (
    <DashboardShell title="Sent Emails">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Sent Emails
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View emails that have already been sent.
        </p>
      </div>
    </DashboardShell>
  );
}