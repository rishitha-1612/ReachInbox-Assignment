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
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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