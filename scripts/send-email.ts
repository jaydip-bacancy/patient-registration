/**
 * Standalone script to send a test email via Gmail (EmailJS SMTP).
 * Usage: npm run send-email
 *    or: npx ts-node scripts/send-email.ts
 *    or: npx ts-node scripts/send-email.ts your@email.com
 */

import 'dotenv/config';
import { SMTPClient } from 'emailjs';

const user = process.env.GMAIL_USER;
const password = process.env.GMAIL_APP_PASSWORD;
const from =
  process.env.GMAIL_FROM ||
  `Patient Registration <${user || 'noreply@gmail.com'}>`;
const to = process.argv[2] || process.env.GMAIL_TEST_TO || 'your@email.com';

async function main() {
  if (!user || !password) {
    console.error(
      'Error: GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env',
    );
    console.error(
      'Create an App Password at https://myaccount.google.com/apppasswords',
    );
    process.exit(1);
  }

  const client = new SMTPClient({
    user,
    password,
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
  });

  try {
    await client.sendAsync({
      from,
      to,
      subject: 'Test Email - Patient Registration System',
      attachment: [
        {
          data: `
            <h2>Test Email</h2>
            <p>This is a test email sent from the Patient Registration System via Gmail.</p>
            <p>Sent at: ${new Date().toISOString()}</p>
            <p>If you received this, email delivery is working.</p>
          `,
          alternative: true,
          contentType: 'text/html',
        },
      ],
    });
    console.log('Email sent successfully to', to);
  } catch (err) {
    console.error('Failed to send email:', err);
    process.exit(1);
  } finally {
    client.smtp.close();
  }
}

main();
