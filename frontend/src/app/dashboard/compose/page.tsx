"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

import {
  scheduleEmails,
  type ScheduleEmailsRequest,
} from "@/services/email.service";

import {
  getSenders,
  type Sender,
} from "@/services/sender.service";

interface ParseResult {
  valid: string[];
  invalid: string[];
  duplicates: string[];
}

function parseRecipients(
  text: string,
): ParseResult {
  const entries = text
    .split(/[\n,;]/)
    .map((value) =>
      value
        .trim()
        .replace(/^["']|["']$/g, "")
        .toLowerCase(),
    )
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  const seen = new Set<string>();

  for (const email of entries) {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      invalid.push(email);
      continue;
    }

    if (seen.has(email)) {
      duplicates.push(email);
      continue;
    }

    seen.add(email);
    valid.push(email);
  }

  return {
    valid,
    invalid,
    duplicates,
  };
}

function getDefaultScheduleValue(): string {
  const date = new Date(
    Date.now() + 5 * 60 * 1000,
  );

  const pad = (value: number) =>
    String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default function ComposePage() {
  const [senders, setSenders] =
    useState<Sender[]>([]);

  const [senderId, setSenderId] =
    useState("");

  const [recipientsText, setRecipientsText] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [body, setBody] =
    useState("");

  const [scheduledFor, setScheduledFor] =
    useState(getDefaultScheduleValue());

  const [
    delayBetweenEmailsMs,
    setDelayBetweenEmailsMs,
  ] = useState(2000);

  const [hourlyLimit, setHourlyLimit] =
    useState(200);

  const [loadingSenders, setLoadingSenders] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | ""
    >("");

  const parsed = useMemo(
    () =>
      parseRecipients(
        recipientsText,
      ),
    [recipientsText],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSenders() {
      try {
        const result =
          await getSenders();

        if (cancelled) {
          return;
        }

        setSenders(result);

        const defaultSender =
          result.find(
            (sender) =>
              sender.isDefault,
          ) ?? result[0];

        if (defaultSender) {
          setSenderId(
            defaultSender.id,
          );
        }
      } catch (error) {
        console.error(
          "Failed to load senders:",
          error,
        );

        if (!cancelled) {
          setMessage(
            "Unable to load sender accounts. Please log in again.",
          );
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoadingSenders(false);
        }
      }
    }

    void loadSenders();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCsvUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setMessage(
        "Please select a CSV file.",
      );
      setMessageType("error");
      return;
    }

    try {
      const text =
        await file.text();

      setRecipientsText(text);

      setMessage(
        `${file.name} loaded successfully.`,
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "CSV read error:",
        error,
      );

      setMessage(
        "Unable to read the CSV file.",
      );

      setMessageType("error");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!senderId) {
      setMessage(
        "Please select a sender.",
      );
      setMessageType("error");
      return;
    }

    if (parsed.valid.length === 0) {
      setMessage(
        "Please add at least one valid recipient.",
      );
      setMessageType("error");
      return;
    }

    if (!subject.trim()) {
      setMessage(
        "Subject is required.",
      );
      setMessageType("error");
      return;
    }

    if (!body.trim()) {
      setMessage(
        "Email body is required.",
      );
      setMessageType("error");
      return;
    }

    if (!scheduledFor) {
      setMessage(
        "Please select a schedule time.",
      );
      setMessageType("error");
      return;
    }

    const scheduleDate =
      new Date(scheduledFor);

    if (
      Number.isNaN(
        scheduleDate.getTime(),
      )
    ) {
      setMessage(
        "Invalid schedule time.",
      );
      setMessageType("error");
      return;
    }

    if (
      scheduleDate.getTime() <=
      Date.now()
    ) {
      setMessage(
        "Schedule time must be in the future.",
      );
      setMessageType("error");
      return;
    }

    if (
      delayBetweenEmailsMs < 2000
    ) {
      setMessage(
        "Delay must be at least 2000 ms.",
      );
      setMessageType("error");
      return;
    }

    if (hourlyLimit < 1) {
      setMessage(
        "Hourly limit must be at least 1.",
      );
      setMessageType("error");
      return;
    }

    const payload: ScheduleEmailsRequest =
      {
        senderId,
        recipients: parsed.valid,
        subject: subject.trim(),
        body: body.trim(),
        scheduledFor:
          scheduleDate.toISOString(),
        delayBetweenEmailsMs,
        hourlyLimit,
      };

    try {
      setSubmitting(true);

      const result =
        await scheduleEmails(
          payload,
        );

      setMessage(
        `Successfully scheduled ${
          result.data.total
        } email${
          result.data.total === 1
            ? ""
            : "s"
        }.`,
      );

      setMessageType("success");

      setRecipientsText("");
      setSubject("");
      setBody("");
      setScheduledFor(
        getDefaultScheduleValue(),
      );
    } catch (error) {
      console.error(
        "Schedule request failed:",
        error,
      );

      setMessage(
        "Unable to schedule emails. Please check your login and make sure the backend is running.",
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell title="Compose Email">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Compose Email
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create and schedule your next email batch.
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              messageType === "error"
                ? "border-red-500/30 bg-red-500/10"
                : "border-green-500/30 bg-green-500/10"
            }`}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-xl border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                Sender
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Select the email account that will send the campaign.
              </p>
            </div>

            <select
              value={senderId}
              onChange={(event) =>
                setSenderId(
                  event.target.value,
                )
              }
              disabled={
                loadingSenders ||
                senders.length === 0
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
            >
              {loadingSenders ? (
                <option>
                  Loading senders...
                </option>
              ) : senders.length === 0 ? (
                <option>
                  No senders available
                </option>
              ) : (
                <>
                  <option value="">
                    Select a sender
                  </option>

                  {senders.map(
                    (sender) => (
                      <option
                        key={sender.id}
                        value={
                          sender.id
                        }
                      >
                        {sender.displayName}{" "}
                        —{" "}
                        {sender.email}
                      </option>
                    ),
                  )}
                </>
              )}
            </select>
          </section>

          <section className="rounded-xl border p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  Recipients
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a CSV or enter one email address per line.
                </p>
              </div>

              <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
                Upload CSV

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={
                    handleCsvUpload
                  }
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={recipientsText}
              onChange={(event) =>
                setRecipientsText(
                  event.target.value,
                )
              }
              placeholder={
                "alice@example.com\nbob@example.com\ncharlie@example.com"
              }
              rows={7}
              className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Valid
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {parsed.valid.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Invalid
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {parsed.invalid.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Duplicates
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    parsed
                      .duplicates
                      .length
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                Message
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Write the message that will be sent to every recipient.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value,
                  )
                }
                placeholder="Email subject"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
              />

              <textarea
                value={body}
                onChange={(event) =>
                  setBody(
                    event.target.value,
                  )
                }
                placeholder="Write your email..."
                rows={12}
                className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2"
              />
            </div>
          </section>

          <section className="rounded-xl border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                Delivery
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure when and how quickly the emails are sent.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Schedule time
                </label>

                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) =>
                    setScheduledFor(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Delay between emails
                </label>

                <input
                  type="number"
                  min={2000}
                  step={100}
                  value={
                    delayBetweenEmailsMs
                  }
                  onChange={(event) =>
                    setDelayBetweenEmailsMs(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum: 2000 ms
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Hourly limit
                </label>

                <input
                  type="number"
                  min={1}
                  value={hourlyLimit}
                  onChange={(event) =>
                    setHourlyLimit(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Maximum sends allowed per hour.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {parsed.valid.length} valid recipient
              {parsed.valid.length === 1
                ? ""
                : "s"}
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingSenders ||
                senders.length === 0
              }
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Scheduling..."
                : "Schedule Emails"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}