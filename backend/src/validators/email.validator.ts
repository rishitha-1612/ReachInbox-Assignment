import { z } from "zod";

export const scheduleEmailsSchema =
  z
    .object({
      senderId: z
        .string()
        .min(1, "Sender is required"),

      recipients: z
        .array(z.email())
        .min(
          1,
          "At least one recipient is required",
        )
        .max(
          10_000,
          "Maximum 10,000 recipients per batch",
        ),

      subject: z
        .string()
        .trim()
        .min(1, "Subject is required")
        .max(
          998,
          "Subject is too long",
        ),

      body: z
        .string()
        .trim()
        .min(1, "Body is required"),

      scheduledFor: z.coerce.date(),

      delayBetweenEmailsMs: z
        .number()
        .int()
        .min(
          2_000,
          "Minimum delay is 2000ms",
        )
        .max(
          3_600_000,
          "Delay cannot exceed one hour",
        ),

      hourlyLimit: z
        .number()
        .int()
        .positive()
        .max(
          10_000,
          "Hourly limit is too high",
        ),
    })
    .superRefine(
      (value, ctx) => {
        if (
          value.scheduledFor.getTime() <=
          Date.now()
        ) {
          ctx.addIssue({
            code: "custom",
            path: [
              "scheduledFor",
            ],
            message:
              "Scheduled time must be in the future",
          });
        }
      },
    );

export type ScheduleEmailsInput =
  z.infer<
    typeof scheduleEmailsSchema
  >;