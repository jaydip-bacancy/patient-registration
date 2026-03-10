import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-testing';

/**
 * Generates a signed JWT for use in E2E test Authorization headers.
 * Mirrors the payload shape used by JwtStrategy.validate().
 */
export function generateTestToken(
  userId: string,
  email: string,
  role: Role,
  expiresIn = '15m',
): string {
  return jwt.sign({ sub: userId, email, role }, TEST_JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export { TEST_JWT_SECRET };
