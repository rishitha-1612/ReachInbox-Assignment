import nodemailer, {
  type SentMessageInfo,
  type Transporter,
} from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from: string;
  messageId: string;
}

export class SmtpService {
  private readonly transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        "SMTP configuration is incomplete",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async send(
    input: SendEmailInput,
  ): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      messageId: input.messageId,
    });
  }
}

export const smtpService = new SmtpService();