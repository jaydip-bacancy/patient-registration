import { EMAIL_BRAND, EMAIL_FONT } from './email.constants';

/**
 * Base wrapper for all transactional emails.
 * Uses table-based layout and inline styles for email client compatibility.
 */
export function getBaseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Registration</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_BRAND.primary}; font-family: ${EMAIL_FONT}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${EMAIL_BRAND.primary}; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 480px; width: 100%; background-color: ${EMAIL_BRAND.white}; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);">
          <tr>
            <td style="padding: 32px 40px;">
              <!-- Logo area -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, ${EMAIL_BRAND.purple} 0%, ${EMAIL_BRAND.pink} 100%); border-radius: 10px; line-height: 48px; font-size: 24px; color: white;">&#10010;</div>
                <h1 style="margin: 12px 0 4px; font-size: 20px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">
                  Patient Registration
                </h1>
                <p style="margin: 0; font-size: 13px; color: ${EMAIL_BRAND.textSecondary}; font-family: ${EMAIL_FONT};">
                  Healthcare Management System
                </p>
              </div>
              ${content}
              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${EMAIL_BRAND.border}; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">
                  If you didn't request this, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
