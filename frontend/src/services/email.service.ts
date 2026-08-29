import { api } from "@/lib/api";

export interface ScheduleEmailsRequest {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledFor: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

export interface EmailJob {
  id: string;
  userId: string;
  senderId: string;
  batchId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status:
    | "PENDING"
    | "QUEUED"
    | "PROCESSING"
    | "SENT"
    | "FAILED";
  scheduledFor: string;
  sentAt: string | null;
  attempts: number;
  maxAttempts: number;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  bullJobId: string | null;
  messageId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function scheduleEmails(
  data: ScheduleEmailsRequest,
) {
  const response =
    await api.post(
      "/emails/schedule",
      data,
    );

  return response.data;
}

export async function getScheduledEmails(): Promise<{
  success: boolean;
  data: EmailJob[];
}> {
  const response =
    await api.get(
      "/emails/scheduled",
    );

  return response.data;
}

export async function getSentEmails(): Promise<{
  success: boolean;
  data: EmailJob[];
}> {
  const response =
    await api.get("/emails/sent");

  return response.data;
}

export async function getDashboardStats() {
  const response =
    await api.get(
      "/dashboard/stats",
    );

  return response.data;
}