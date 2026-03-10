import { getBaseLayout } from './base.template';
import { EMAIL_BRAND, EMAIL_FONT } from './email.constants';

export interface OtpTemplateData {
  otp: string;
  expiresInMinutes: number;
}

export function getOtpTemplate(data: OtpTemplateData): string {
  const { otp, expiresInMinutes } = data;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">
      Verification Code
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_BRAND.textSecondary}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      Your one-time password (OTP) for login is:
    </p>
    <div style="background-color: ${EMAIL_BRAND.bgLight}; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: ${EMAIL_BRAND.primary}; font-family: ${EMAIL_FONT};">${otp}</span>
    </div>
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      This code expires in <strong>${expiresInMinutes} minutes</strong>.
    </p>
  `;

  return getBaseLayout(content);
}
