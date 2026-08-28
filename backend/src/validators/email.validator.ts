import { z } from "zod";

export const scheduleEmailsSchema = z
  .object({
    senderId: z.string().min(1),

    recipients: z
      .array(z.email())
      .min(1, "At least one recipient is required")
      .max(10_000),

    subject: z
      .string()
      .trim()
      .min(1, "Subject is required")
      .max(998),

    body: z
      .string()
      .trim()
      .min(1, "Body is required"),

    scheduledFor: z.coerce.date(),

    delayBetweenEmailsMs: z
      .number()
      .int()
      .min(2_000)
      .max(3_600_000),

    hourlyLimit: z
      .number()
      .int()
      .positive()
      .max(10_000),
  })
  .superRefine((value, ctx) => {
    if (value.scheduledFor.getTime() <= Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledFor"],
        message:
          "Scheduled time must be in the future",
      });
    }
  });

export type ScheduleEmailsInput =
  z.infer<typeof scheduleEmailsSchema>;