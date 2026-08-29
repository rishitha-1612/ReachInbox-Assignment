"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  getSentEmails,
  type EmailJob,
} from "@/services/email.service";

export default function SentPage() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSentEmails() {
    try {
      setLoading(true);
      setError("");

      const response = await getSentEmails();

      setJobs(response.data);
    } catch (error) {
      console.error(
        "Failed to load sent emails:",
        error,
      );

      setError(
        "Unable to load sent emails. Please make sure you are logged in.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSentEmails();
  }, []);

  return (
    <DashboardShell title="Sent Emails">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Sent Emails
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            View emails that have already been sent.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            Loading sent emails...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          jobs.length === 0 && (
            <div className="rounded-xl border p-10 text-center">
              <p className="font-medium">
                No sent emails
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Emails will appear here after they are successfully sent.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          jobs.length > 0 && (
            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="p-4 text-left font-medium">
                        Recipient
                      </th>

                      <th className="p-4 text-left font-medium">
                        Subject
                      </th>

                      <th className="p-4 text-left font-medium">
                        Sent At
                      </th>

                      <th className="p-4 text-left font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b last:border-0"
                      >
                        <td className="p-4">
                          {job.recipientEmail}
                        </td>

                        <td className="p-4">
                          {job.subject}
                        </td>

                        <td className="p-4">
                          {job.sentAt
                            ? new Date(
                                job.sentAt,
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </DashboardShell>
  );
}