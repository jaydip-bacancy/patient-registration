/**
 * E2E test setup
 * - Sets JWT_SECRET for consistent token validation
 * - Mocks EmailService to avoid loading emailjs (ESM) which breaks Jest
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-testing';

jest.mock('../src/email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  })),
}));
