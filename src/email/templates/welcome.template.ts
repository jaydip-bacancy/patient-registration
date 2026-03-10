import { getBaseLayout } from './base.template';
import { EMAIL_BRAND, EMAIL_FONT } from './email.constants';

export interface WelcomeTemplateData {
  recipientName?: string;
}

export function getWelcomeTemplate(data: WelcomeTemplateData = {}): string {
  const greeting = data.recipientName
    ? `Hello ${data.recipientName},`
    : 'Hello,';

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">
      Welcome to Patient Registration
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; color: ${EMAIL_BRAND.textSecondary}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      ${greeting}
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_BRAND.textSecondary}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      Your account has been created successfully. You can now log in using your email address and the OTP we send you.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius: 8px; background-color: ${EMAIL_BRAND.primary};">
          <a href="#" style="display: inline-block; padding: 12px 24px; color: ${EMAIL_BRAND.white}; text-decoration: none; font-size: 15px; font-weight: bold; font-family: ${EMAIL_FONT};">
            Get Started
          </a>
        </td>
      </tr>
    </table>
  `;

  return getBaseLayout(content);
}
