import { getBaseLayout } from './base.template';
import { EMAIL_BRAND, EMAIL_FONT } from './email.constants';

export interface AppointmentConfirmationTemplateData {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  visitType?: string;
  location?: string;
}

export function getAppointmentConfirmationTemplate(
  data: AppointmentConfirmationTemplateData,
): string {
  const { patientName, doctorName, date, time, visitType, location } = data;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">
      Appointment Confirmed
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_BRAND.textSecondary}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      Dear ${patientName}, your appointment has been confirmed.
    </p>
    <div style="background-color: ${EMAIL_BRAND.bgLight}; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid ${EMAIL_BRAND.border};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">Doctor</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">${doctorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">Date</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">Time</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">${time}</td>
        </tr>
        ${visitType ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">Visit Type</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">${visitType}</td>
        </tr>
        ` : ''}
        ${location ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_FONT};">Location</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${EMAIL_BRAND.textPrimary}; font-family: ${EMAIL_FONT};">${location}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    <p style="margin: 0; font-size: 14px; color: ${EMAIL_BRAND.textMuted}; line-height: 1.6; font-family: ${EMAIL_FONT};">
      Please arrive 10 minutes before your scheduled time. If you need to reschedule, contact the clinic.
    </p>
  `;

  return getBaseLayout(content);
}
