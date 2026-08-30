import nodemailer, {
  type SentMessageInfo,
  type Transporter,
} from "nodemailer";

import {
  decryptSecret,
} from "../utils/crypto.js";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from: string;
  messageId: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  encryptedPassword: string;
}

const smtpTimeoutMs = Number(
  process.env.SMTP_TIMEOUT_MS ?? 15_000,
);

export class SmtpService {
  private createTransport(
    config: SmtpConfig,
  ): Transporter {
    const password =
      decryptSecret(
        config.encryptedPassword,
      );

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      connectionTimeout: smtpTimeoutMs,
      greetingTimeout: smtpTimeoutMs,
      socketTimeout: smtpTimeoutMs,
      auth: {
        user: config.user,
        pass: password,
      },
    });
  }

  async verify(
    config?: SmtpConfig,
  ): Promise<void> {
    if (!config) {
      const host =
        process.env.SMTP_HOST;

      const user =
        process.env.SMTP_USER;

      const pass =
        process.env.SMTP_PASS;

      const port = Number(
        process.env.SMTP_PORT ?? 587,
      );

      if (!host || !user || !pass) {
        throw new Error(
          "SMTP configuration is incomplete",
        );
      }

      const transporter =
        nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          connectionTimeout: smtpTimeoutMs,
          greetingTimeout: smtpTimeoutMs,
          socketTimeout: smtpTimeoutMs,
          auth: {
            user,
            pass,
          },
        });

      await transporter.verify();
      return;
    }

    await this
      .createTransport(config)
      .verify();
  }

  async send(
    config: SmtpConfig,
    input: SendEmailInput,
  ): Promise<SentMessageInfo> {
    const transporter =
      this.createTransport(config);

    return transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      messageId: input.messageId,
    });
  }
}

export const smtpService =
  new SmtpService();
