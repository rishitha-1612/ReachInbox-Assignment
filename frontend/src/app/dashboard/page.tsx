"use client";

import {
  useEffect,
  useState,
} from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

import {
  getDashboardStats,
  type DashboardStats,
} from "@/services/dashboard.service";

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const data =
          await getDashboardStats();

        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        console.error(
          "Failed to load dashboard stats:",
          err,
        );

        if (mounted) {
          setError(
            "Unable to load dashboard statistics.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your email activity.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            Loading dashboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">
                  Total Emails
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">
                  Scheduled
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {stats.scheduled}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">
                  Sent
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {stats.sent}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">
                  Failed
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {stats.failed}
                </p>
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          stats && (
            <div className="rounded-xl border p-6">
              <h2 className="text-lg font-medium">
                System Status
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Email scheduling
                  </span>

                  <span>
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Queue
                  </span>

                  <span>
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    SMTP
                  </span>

                  <span>
                    Operational
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </DashboardShell>
  );
}