import 'dotenv/config';
// Ensure E2E tests use a known JWT secret for token validation
if (typeof process.env.JEST_WORKER_ID !== 'undefined') {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-testing';
}
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmailService } from '../../src/email/email.service';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { createPrismaMock, PrismaMock } from './prisma-mock';

/**
 * Bootstraps the full NestJS application with a mocked PrismaService.
 * Used by E2E tests — real HTTP server, real guards/pipes/interceptors,
 * but no real database connection.
 */
export async function createTestApp(prismaMock: PrismaMock): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideProvider(EmailService)
    .useValue({ sendOtpEmail: jest.fn().mockResolvedValue(undefined) })
    .compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  return app;
}

export { createPrismaMock };
