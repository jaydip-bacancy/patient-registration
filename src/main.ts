import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(globalValidationPipe);

  app.enableCors({
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Swagger / OpenAPI ────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Patient Registration System API')
    .setDescription(
      `
## Overview

Production-ready backend for a **Patient Registration System** built with NestJS, Prisma ORM, and PostgreSQL.

## Architecture

The system separates two core domains:

- **PATIENT** — Permanent identity record (UHID-based)
- **VISIT** — Transactional clinical encounter (separate lifecycle)

## Authentication Flow

1. \`POST /auth/send-otp\` → Receive OTP on phone
2. \`POST /auth/verify-otp\` → Receive \`accessToken\` + \`refreshToken\`
3. Include \`Authorization: Bearer <accessToken>\` on all protected routes
4. \`POST /auth/refresh\` → Get new access token using refresh token

## Registration Flow

1. \`POST /patients/register\` → Create patient identity
2. \`POST /patients/:id/emergency-contact\` → Add emergency contact(s)
3. \`POST /patients/:id/insurance\` → Add insurance (optional)
4. \`POST /patients/:id/medical-snapshot\` → Record medical history
5. \`POST /patients/:id/consent\` → Capture consent (immutable)

Visit creation is independent: \`POST /visits\`

## Roles

| Role    | Permissions |
|---------|-------------|
| ADMIN   | Full access including soft-delete and audit logs |
| STAFF   | Register patients, create visits, add records |
| PATIENT | Read-only access to own records |

## Response Format

All responses follow a uniform envelope:
\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [ { "field": "phone", "constraints": ["must be a valid phone number"] } ],
  "path": "/api/v1/patients/register",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Bearer token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'OTP-based authentication and JWT token management')
    .addTag('Patients', 'Patient identity management (permanent records)')
    .addTag('Emergency Contacts', 'Emergency contact records per patient')
    .addTag('Insurance', 'Patient insurance policy records')
    .addTag('Medical Snapshot', 'Light medical intake data per patient')
    .addTag('Consent', 'Patient consent capture (immutable)')
    .addTag('Visits', 'Clinical encounters (transactional, separate from identity)')
    .addTag('Audit Logs', 'System-wide audit trail (Admin only)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Patient Registration API Docs',
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  console.log(`\n==========================================`);
  console.log(`  Patient Registration System`);
  console.log(`==========================================`);
  console.log(`  App:     http://localhost:${port}/${apiPrefix}`);
  console.log(`  Docs:    http://localhost:${port}/docs`);
  console.log(`  Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`==========================================\n`);
}

bootstrap();
