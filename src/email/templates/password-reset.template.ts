import { getBaseLayout } from './base.template';
import { EMAIL_BRAND, EMAIL_FONT } from './email.constants';

export interface PasswordResetTemplateData {
  resetLink: string;
  expiresInMinutes?: number;
}

export function getPasswordResetTemplate(data: PasswordResetTemplateData): string {
  const { resetLink, expiresInMinutes = 30 } = data;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">
      Reset Your Password
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_BRAND.textSecondary}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="border-radius: 8px; background-color: ${EMAIL_BRAND.primary};">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; color: ${EMAIL_BRAND.white}; text-decoration: none; font-size: 15px; font-weight: bold; font-family: ${EMAIL_FONT};">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      This link expires in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    <p style="margin: 0; font-size: 13px; color: ${EMAIL_BRAND.textMuted}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      If you didn't request this, please ignore this email. Your password will remain unchanged.
    </p>
  `;

  return getBaseLayout(content);
}
