import Link from "next/link";
import { ArrowRight, MailPlus } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  ["Scheduled", "0"],
  ["Queued", "0"],
  ["Sending", "0"],
  ["Sent", "0"],
  ["Failed", "0"],
] as const;

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">
              Email overview
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Dashboard
            </h2>
          </div>

    <Link
  href="/dashboard/compose"
  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  <MailPlus className="mr-2 size-4" />
  Compose New Email
</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <MailPlus className="size-5" />
            </div>

            <h3 className="mt-4 font-medium">
              No emails scheduled yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upload your recipient list and schedule your first
              campaign.
            </p>
<Link
  href="/dashboard/compose"
  className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  Start composing
  <ArrowRight className="ml-2 size-4" />
</Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}