import { Injectable, Logger } from '@nestjs/common';
import { SMTPClient } from 'emailjs';
import {
  getOtpTemplate,
  getWelcomeTemplate,
  getAppointmentConfirmationTemplate,
  getPasswordResetTemplate,
} from './templates';
import type {
  AppointmentConfirmationTemplateData,
  WelcomeTemplateData,
  PasswordResetTemplateData,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor() {
    const user = process.env.GMAIL_USER;
    this.from =
      process.env.GMAIL_FROM ||
      `Patient Registration <${user || 'noreply@gmail.com'}>`;

    if (!user || !process.env.GMAIL_APP_PASSWORD) {
      this.logger.warn(
        'GMAIL_USER and GMAIL_APP_PASSWORD not set - emails will be logged but not sent',
      );
    }
  }

  private createClient(): SMTPClient | null {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;
    if (!user || !password) return null;
    return new SMTPClient({
      user,
      password,
      host: 'smtp.gmail.com',
      port: 587,
      tls: true,
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const client = this.createClient();
    if (!client) {
      this.logger.log(
        '[DEV] Email not sent (GMAIL_USER/GMAIL_APP_PASSWORD not configured)',
      );
      return;
    }
    try {
      await client.sendAsync({
        from: this.from,
        to,
        subject,
        attachment: [
          {
            data: html,
            alternative: true,
            contentType: 'text/html',
          },
        ],
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email: ${JSON.stringify(err)}`);
      throw err;
    } finally {
      client.smtp.close();
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const expiresInMinutes =
      parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10) || 5;
    const html = getOtpTemplate({ otp, expiresInMinutes });

    if (this.createClient()) {
      try {
        await this.send(to, 'Your login verification code', html);
      } catch (err) {
        this.logger.error(`Gmail send failed for ${to}`, err);
        throw err;
      }
    } else {
      this.logger.log(
        `[DEV] OTP for ${to}: ${otp} (not sent - Gmail not configured)`,
      );
    }
  }

  async sendWelcomeEmail(to: string, data?: WelcomeTemplateData): Promise<void> {
    const html = getWelcomeTemplate(data);
    await this.send(to, 'Welcome to Patient Registration', html);
  }

  async sendAppointmentConfirmationEmail(
    to: string,
    data: AppointmentConfirmationTemplateData,
  ): Promise<void> {
    const html = getAppointmentConfirmationTemplate(data);
    await this.send(to, 'Appointment Confirmed', html);
  }

  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetTemplateData,
  ): Promise<void> {
    const html = getPasswordResetTemplate(data);
    await this.send(to, 'Reset Your Password', html);
  }
}
