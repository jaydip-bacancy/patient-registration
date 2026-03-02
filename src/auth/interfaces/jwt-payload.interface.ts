import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
  iat?: number;
  exp?: number;
}
