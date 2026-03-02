# Patient Registration System

A production-ready healthcare backend built with **NestJS**, **Prisma ORM**, **PostgreSQL**, and **JWT Authentication** — inspired by platforms like Practo, Apollo 24|7, and Tata 1mg.

---

## Table of Contents

- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth](#auth-module)
  - [Patients](#patient-module)
  - [Emergency Contacts](#emergency-contact-module)
  - [Insurance](#insurance-module)
  - [Medical Snapshot](#medical-snapshot-module)
  - [Consent](#consent-module)
  - [Doctors](#doctor-module)
  - [Appointments](#appointment-module)
  - [Visits](#visit-module)
  - [Vital Signs](#vital-signs-module)
  - [Prescriptions](#prescription-module)
  - [Lab Reports](#lab-report-module)
  - [Audit Logs](#audit-module)
- [Data Models](#data-models)
- [Role Matrix](#role-matrix)
- [Registration Flow](#registration-flow)
- [Response Format](#response-format)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client / Frontend                   │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────┐
│              NestJS Application Layer                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Guards  │ │  Pipes   │ │Intercept.│            │
│  │ JWT/Role │ │Validation│ │ Response │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                      │
│  ┌──────┐ ┌─────────┐ ┌───────┐ ┌───────┐         │
│  │ Auth │ │ Patient │ │ Visit │ │ Audit │  ...     │
│  │Module│ │ Module  │ │Module │ │Module │          │
│  └──────┘ └─────────┘ └───────┘ └───────┘         │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │              Prisma ORM Layer               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   PostgreSQL                         │
└─────────────────────────────────────────────────────┘
```

### Core Design Decisions

| Concern | Decision |
|---------|----------|
| Patient vs Visit | Strictly separated — Patient is permanent identity, Visit is transactional |
| Auth | OTP-based (phone) → JWT access token (15m) + refresh token (7d) |
| Roles | PATIENT, STAFF, ADMIN, DOCTOR — role-based access on every endpoint |
| Soft Delete | `isActive` flag on Patient/Doctor — data never hard-deleted |
| Audit | Every creation/update event auto-writes an immutable `AuditLog` |
| Consent | One-time capture, immutable — cannot be re-submitted |
| Medical Snapshot | Upsert (idempotent) — can be updated |
| Appointments | Conflict-checked booking; slot availability pre-computed from weekly template |
| Prescriptions | Per-visit digital Rx with structured medicine line items |
| Vital Signs | Separate 1:1 record per Visit — BMI auto-calculated |
| Lab Reports | Ordered → Sample Collected → Processing → Completed lifecycle |
| Validation | `class-validator` + `class-transformer` on all DTOs |
| Response shape | Uniform envelope on every response (success + error) |

---

## Folder Structure

```
patient-registration-system/
├── prisma/
│   ├── schema.prisma          # All models, enums, relations
│   └── seed.ts                # Database seeder
├── src/
│   ├── main.ts                # Bootstrap, Swagger setup
│   ├── app.module.ts          # Root module — wires all modules
│   ├── prisma/
│   │   ├── prisma.service.ts  # PrismaClient singleton
│   │   └── prisma.module.ts   # Global Prisma module
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   # Global error handler
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts    # Uniform response envelope
│   │   └── pipes/
│   │       └── validation.pipe.ts         # Global DTO validation
│   ├── auth/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   │   ├── public.decorator.ts        # @Public()
│   │   │   └── roles.decorator.ts         # @Roles(...)
│   │   ├── dto/
│   │   │   ├── send-otp.dto.ts
│   │   │   └── verify-otp.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── patient/
│   │   ├── dto/
│   │   │   └── register-patient.dto.ts
│   │   ├── repository/
│   │   │   └── patient.repository.ts
│   │   ├── patient.controller.ts
│   │   ├── patient.service.ts
│   │   └── patient.module.ts
│   ├── emergency-contact/
│   │   ├── dto/create-emergency-contact.dto.ts
│   │   ├── emergency-contact.controller.ts
│   │   ├── emergency-contact.service.ts
│   │   └── emergency-contact.module.ts
│   ├── insurance/
│   │   ├── dto/create-insurance.dto.ts
│   │   ├── insurance.controller.ts
│   │   ├── insurance.service.ts
│   │   └── insurance.module.ts
│   ├── medical-snapshot/
│   │   ├── dto/create-medical-snapshot.dto.ts
│   │   ├── medical-snapshot.controller.ts
│   │   ├── medical-snapshot.service.ts
│   │   └── medical-snapshot.module.ts
│   ├── consent/
│   │   ├── dto/create-consent.dto.ts
│   │   ├── consent.controller.ts
│   │   ├── consent.service.ts
│   │   └── consent.module.ts
│   ├── visit/
│   │   ├── dto/create-visit.dto.ts
│   │   ├── visit.controller.ts
│   │   ├── visit.service.ts
│   │   └── visit.module.ts
│   └── audit/
│       ├── audit.controller.ts
│       ├── audit.service.ts
│       └── audit.module.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## Getting Started

```bash
# 1. Clone and install
cd patient-registration-system
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed initial users (optional)
npm run prisma:seed

# 6. Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`
Swagger docs at `http://localhost:3000/docs`

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for signing access tokens | Min 32 chars |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Min 32 chars |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `OTP_EXPIRY_MINUTES` | OTP validity window | `5` |
| `OTP_LENGTH` | OTP digit length | `6` |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:4200` |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### Auth Module

#### `POST /auth/send-otp`

Sends an OTP to the given phone number. Creates a new user if not registered.

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "message": "OTP sent to +919876543210",
    "otp": "123456"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

> `otp` field is only returned in non-production environments for testing.

---

#### `POST /auth/verify-otp`

Verifies OTP and issues JWT tokens.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "phone": "+919876543210",
      "role": "PATIENT"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired OTP",
  "details": null,
  "path": "/api/v1/auth/verify-otp",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `POST /auth/refresh`

Exchange refresh token for a new access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Patient Module

> Requires: `Authorization: Bearer <accessToken>`
> Roles: STAFF / ADMIN (write), STAFF / ADMIN / PATIENT (read)

#### `POST /patients/register`

Registers a new patient with a system-generated UHID.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "firstName": "Raj",
  "lastName": "Sharma",
  "dob": "1990-05-15",
  "gender": "MALE",
  "phone": "+919876543210",
  "email": "raj.sharma@example.com",
  "address": "12B, MG Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "maritalStatus": "MARRIED",
  "occupation": "Software Engineer",
  "govtIdType": "AADHAAR",
  "govtIdNumber": "1234-5678-9012"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request processed successfully",
  "data": {
    "message": "Patient registered successfully",
    "patient": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "uhid": "UHID-24-482910",
      "firstName": "Raj",
      "lastName": "Sharma",
      "dob": "1990-05-15T00:00:00.000Z",
      "gender": "MALE",
      "phone": "+919876543210",
      "email": "raj.sharma@example.com",
      "address": "12B, MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "maritalStatus": "MARRIED",
      "occupation": "Software Engineer",
      "govtIdType": "AADHAAR",
      "govtIdNumber": "1234-5678-9012",
      "createdBy": "staff-user-uuid",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (409) — Duplicate phone:**
```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "message": "Patient with phone +919876543210 already exists",
  "details": null,
  "path": "/api/v1/patients/register",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `GET /patients/search?phone=+9198765`

Search patients by partial phone match.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "patients": [ { "id": "...", "uhid": "UHID-24-482910", "firstName": "Raj", ... } ],
    "total": 1
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `GET /patients/:id`

Get full patient profile (includes emergency contacts, insurance, medical snapshot, consent).

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "uhid": "UHID-24-482910",
    "firstName": "Raj",
    "lastName": "Sharma",
    "emergencyContacts": [ { "id": "...", "name": "Priya", "relation": "Spouse", "phone": "+919876543211" } ],
    "insurances": [ { "id": "...", "provider": "Star Health", "policyNumber": "SHI-2024-001" } ],
    "medicalSnapshot": { "allergies": ["Penicillin"], "chronicConditions": ["Hypertension"] },
    "consent": { "dataPrivacyAccepted": true, "treatmentConsent": true }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `DELETE /patients/:id`

Soft-delete a patient (Admin only). Sets `isActive = false`.

---

### Emergency Contact Module

#### `POST /patients/:patientId/emergency-contact`

**Request Body:**
```json
{
  "name": "Priya Sharma",
  "relation": "Spouse",
  "phone": "+919876543211"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request processed successfully",
  "data": {
    "message": "Emergency contact added successfully",
    "contact": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "name": "Priya Sharma",
      "relation": "Spouse",
      "phone": "+919876543211"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /patients/:patientId/emergency-contact`

Returns all emergency contacts for the patient.

---

### Insurance Module

#### `POST /patients/:patientId/insurance`

**Request Body:**
```json
{
  "provider": "Star Health Insurance",
  "policyNumber": "SHI-2024-00123456",
  "policyHolderName": "Raj Sharma",
  "validTill": "2025-12-31"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request processed successfully",
  "data": {
    "message": "Insurance record added successfully",
    "insurance": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "provider": "Star Health Insurance",
      "policyNumber": "SHI-2024-00123456",
      "policyHolderName": "Raj Sharma",
      "validTill": "2025-12-31T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /patients/:patientId/insurance`

Returns all insurance policies linked to the patient.

---

### Medical Snapshot Module

#### `POST /patients/:patientId/medical-snapshot`

Upserts (create or update) the medical snapshot. 1:1 per patient.

**Request Body:**
```json
{
  "allergies": ["Penicillin", "Dust mites"],
  "chronicConditions": ["Type 2 Diabetes", "Hypertension"],
  "currentMedication": ["Metformin 500mg", "Amlodipine 5mg"],
  "pastSurgeries": ["Appendectomy (2015)"]
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "message": "Medical snapshot saved successfully",
    "snapshot": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "allergies": ["Penicillin", "Dust mites"],
      "chronicConditions": ["Type 2 Diabetes", "Hypertension"],
      "currentMedication": ["Metformin 500mg", "Amlodipine 5mg"],
      "pastSurgeries": ["Appendectomy (2015)"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /patients/:patientId/medical-snapshot`

---

### Consent Module

#### `POST /patients/:patientId/consent`

One-time consent capture. Cannot be resubmitted (returns 400 if already exists).

**Request Body:**
```json
{
  "dataPrivacyAccepted": true,
  "treatmentConsent": true,
  "communicationConsent": true
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request processed successfully",
  "data": {
    "message": "Consent captured successfully",
    "consent": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "dataPrivacyAccepted": true,
      "treatmentConsent": true,
      "communicationConsent": true,
      "acceptedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (400) — Already captured:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Consent has already been captured for this patient. Contact admin to update.",
  "details": null,
  "path": "/api/v1/patients/patient-uuid/consent",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Visit Module

#### `POST /visits`

Creates a new transactional encounter. Completely separate from patient identity.

**Request Body:**
```json
{
  "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "visitType": "OPD",
  "department": "Cardiology",
  "doctorName": "Dr. Ananya Patel",
  "visitDate": "2024-01-15T09:30:00.000Z",
  "notes": "Patient complains of chest pain. ECG ordered."
}
```

**Visit Types:** `OPD` | `IPD` | `EMERGENCY` | `TELECONSULT` | `FOLLOW_UP`

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request processed successfully",
  "data": {
    "message": "Visit created successfully",
    "visit": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "visitType": "OPD",
      "department": "Cardiology",
      "doctorName": "Dr. Ananya Patel",
      "visitDate": "2024-01-15T09:30:00.000Z",
      "notes": "Patient complains of chest pain. ECG ordered.",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "patient": {
        "uhid": "UHID-24-482910",
        "firstName": "Raj",
        "lastName": "Sharma"
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /visits/:id`

Get a single visit by ID.

#### `GET /patients/:patientId/visits`

Get all visits for a patient, ordered by most recent first.

---

### Doctor Module

> Create: Admin only | Read: All authenticated roles

#### `POST /doctors`

Create a doctor profile (linked to a User account with DOCTOR role).

**Request Body:**
```json
{
  "userId": "user-uuid",
  "firstName": "Ananya",
  "lastName": "Patel",
  "phone": "+919876500001",
  "email": "ananya.patel@hospital.com",
  "specialization": "Cardiology",
  "qualification": "MBBS, MD (Cardiology)",
  "registrationNo": "MCI-2024-12345",
  "experienceYears": 10,
  "consultationFee": 500,
  "bio": "Interventional cardiologist with 10+ years experience.",
  "languages": ["Hindi", "English", "Gujarati"]
}
```

#### `GET /doctors?specialization=Cardiology`

List all active doctors. Filter by specialization (partial match).

#### `GET /doctors/:id`

Get full doctor profile including weekly availability slots.

#### `POST /doctors/:id/slots`

Add a weekly availability slot (Admin only).

```json
{ "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "13:00", "slotDuration": 15 }
```

#### `GET /doctors/:id/slots`

Get all active availability slots for the doctor.

#### `GET /doctors/:id/available-slots?date=2026-03-15`

Returns unbooked time slots for the doctor on a specific date (conflict-aware).

---

### Appointment Module

#### `POST /appointments`

Book an appointment. Conflict-checked against existing bookings.

**Roles:** PATIENT, STAFF, ADMIN

```json
{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "appointmentDate": "2026-03-15",
  "startTime": "09:00",
  "endTime": "09:15",
  "type": "IN_CLINIC",
  "reasonForVisit": "Chest pain since 2 days"
}
```

**Appointment Types:** `IN_CLINIC` | `TELECONSULT` | `HOME_VISIT`

#### `GET /appointments/:id`

Get appointment details with patient and doctor summary.

#### `PATCH /appointments/:id/status`

Update status. Requires `cancelReason` when cancelling.

**Roles:** STAFF, ADMIN, DOCTOR

```json
{ "status": "CONFIRMED" }
```

**Statuses:** `PENDING` → `CONFIRMED` → `COMPLETED` / `NO_SHOW` / `RESCHEDULED` / `CANCELLED`

#### `GET /patients/:patientId/appointments`

All appointments for a patient (newest first).

#### `GET /doctors/:doctorId/appointments?date=2026-03-15`

Doctor's appointment schedule. Optional date filter.

---

### Vital Signs Module

> Roles: STAFF, DOCTOR, ADMIN (write) | All roles (read)

#### `POST /visits/:visitId/vital-signs`

Record vitals for a visit (one-time per visit).

```json
{
  "bloodPressure": "120/80",
  "pulseRate": 78,
  "temperature": 98.6,
  "weight": 72.5,
  "height": 170,
  "oxygenSaturation": 98,
  "respiratoryRate": 16
}
```

> BMI is auto-calculated from weight and height.

#### `GET /visits/:visitId/vital-signs`

Retrieve vitals recorded for a visit.

#### `PATCH /visits/:visitId/vital-signs`

Update any subset of vital signs (partial update).

---

### Prescription Module

> Write: DOCTOR, ADMIN | Read: All roles

#### `POST /prescriptions`

Issue a digital prescription for a visit with structured medicine line items.

```json
{
  "visitId": "visit-uuid",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "diagnosis": "Type 2 Diabetes Mellitus with Hypertension",
  "medicines": [
    {
      "medicineName": "Metformin 500mg",
      "dosage": "500mg",
      "frequency": "Twice daily (after meals)",
      "duration": "30 days",
      "instructions": "Take with warm water."
    }
  ],
  "notes": "Low-sodium diet. Exercise daily.",
  "followUpDate": "2026-04-15"
}
```

#### `GET /prescriptions/:id`

Get full prescription with all medicine line items.

#### `GET /visits/:visitId/prescriptions`

All prescriptions issued during a visit.

#### `GET /patients/:patientId/prescriptions`

Full prescription history for a patient.

---

### Lab Report Module

> Order: DOCTOR, STAFF, ADMIN | Update: STAFF, ADMIN | Read: All roles

#### `POST /lab-reports`

Order a lab test for a visit.

```json
{
  "patientId": "patient-uuid",
  "visitId": "visit-uuid",
  "testName": "HbA1c",
  "labName": "Metropolis Healthcare"
}
```

#### `GET /lab-reports/:id`

Get lab report details and status.

#### `PATCH /lab-reports/:id`

Update status or upload report URL/notes.

```json
{
  "status": "COMPLETED",
  "reportUrl": "https://reports.example.com/lab/report-12345.pdf",
  "reportNotes": "HbA1c: 7.8% — Elevated."
}
```

**Status flow:** `ORDERED` → `SAMPLE_COLLECTED` → `PROCESSING` → `COMPLETED` / `CANCELLED`

#### `GET /patients/:patientId/lab-reports`

Full lab report history for a patient.

#### `GET /visits/:visitId/lab-reports`

All lab reports ordered during a specific visit.

---

### Audit Module

> Admin only

#### `GET /audit?limit=100&offset=0`

Paginated list of all audit logs.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": {
    "logs": [
      {
        "id": "uuid",
        "entityType": "Patient",
        "entityId": "patient-uuid",
        "action": "CREATE",
        "performedBy": "staff-user-uuid",
        "metadata": { "uhid": "UHID-24-482910", "phone": "+919876543210" },
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 100,
    "offset": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /audit/entity/:entityType/:entityId`

Get audit trail for a specific entity (e.g., `Patient`, patient UUID).

#### `GET /audit/user/:userId?limit=50`

Get all actions performed by a specific user.

---

## Data Models

### Patient (Permanent Identity)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| uhid | String | Auto-generated, unique (e.g., `UHID-24-482910`) |
| firstName | String | Required |
| lastName | String | Required |
| dob | DateTime | Required |
| gender | Enum | `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY` |
| phone | String | Unique, E.164 format |
| email | String? | Optional |
| address | String? | Optional |
| city | String? | Optional |
| state | String? | Optional |
| pincode | String? | 6-digit |
| maritalStatus | Enum? | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED`, `SEPARATED` |
| occupation | String? | Optional |
| govtIdType | Enum? | `AADHAAR`, `PAN`, `PASSPORT`, `DRIVING_LICENSE`, `VOTER_ID` |
| govtIdNumber | String? | Optional |
| createdBy | String | User ID of registering staff |
| isActive | Boolean | Soft delete flag |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Visit (Transactional Encounter)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| patientId | UUID | FK to Patient |
| visitType | Enum | `OPD`, `IPD`, `EMERGENCY`, `TELECONSULT`, `FOLLOW_UP` |
| department | String | Required |
| doctorName | String | Required |
| visitDate | DateTime | Required |
| notes | String? | Optional clinical notes |
| createdAt | DateTime | Auto |

---

## Role Matrix

| Endpoint | PATIENT | STAFF | DOCTOR | ADMIN |
|----------|---------|-------|--------|-------|
| POST /auth/send-otp | Public | Public | Public | Public |
| POST /auth/verify-otp | Public | Public | Public | Public |
| POST /auth/refresh | Public | Public | Public | Public |
| POST /patients/register | — | Yes | — | Yes |
| GET /patients/search | — | Yes | — | Yes |
| GET /patients/:id | Yes | Yes | — | Yes |
| DELETE /patients/:id | — | — | — | Yes |
| POST /patients/:id/emergency-contact | — | Yes | — | Yes |
| GET /patients/:id/emergency-contact | Yes | Yes | — | Yes |
| POST /patients/:id/insurance | — | Yes | — | Yes |
| GET /patients/:id/insurance | Yes | Yes | — | Yes |
| POST /patients/:id/medical-snapshot | — | Yes | — | Yes |
| GET /patients/:id/medical-snapshot | Yes | Yes | — | Yes |
| POST /patients/:id/consent | — | Yes | — | Yes |
| GET /patients/:id/consent | Yes | Yes | — | Yes |
| POST /doctors | — | — | — | Yes |
| GET /doctors | Yes | Yes | Yes | Yes |
| GET /doctors/:id | Yes | Yes | Yes | Yes |
| POST /doctors/:id/slots | — | — | — | Yes |
| GET /doctors/:id/slots | Yes | Yes | Yes | Yes |
| GET /doctors/:id/available-slots | Yes | Yes | Yes | Yes |
| POST /appointments | Yes | Yes | — | Yes |
| GET /appointments/:id | Yes | Yes | Yes | Yes |
| PATCH /appointments/:id/status | — | Yes | Yes | Yes |
| GET /patients/:id/appointments | Yes | Yes | — | Yes |
| GET /doctors/:id/appointments | — | Yes | Yes | Yes |
| POST /visits | — | Yes | — | Yes |
| GET /visits/:id | Yes | Yes | Yes | Yes |
| GET /patients/:id/visits | Yes | Yes | Yes | Yes |
| POST /visits/:id/vital-signs | — | Yes | Yes | Yes |
| GET /visits/:id/vital-signs | Yes | Yes | Yes | Yes |
| PATCH /visits/:id/vital-signs | — | Yes | Yes | Yes |
| POST /prescriptions | — | — | Yes | Yes |
| GET /prescriptions/:id | Yes | Yes | Yes | Yes |
| GET /visits/:id/prescriptions | Yes | Yes | Yes | Yes |
| GET /patients/:id/prescriptions | Yes | Yes | Yes | Yes |
| POST /lab-reports | — | Yes | Yes | Yes |
| GET /lab-reports/:id | Yes | Yes | Yes | Yes |
| PATCH /lab-reports/:id | — | Yes | — | Yes |
| GET /patients/:id/lab-reports | Yes | Yes | Yes | Yes |
| GET /visits/:id/lab-reports | Yes | Yes | Yes | Yes |
| GET /audit/* | — | — | — | Yes |

---

## Registration Flow

```
── ONBOARDING ────────────────────────────────────────────────────
1. POST /auth/send-otp                ← Staff / Patient authenticates
2. POST /auth/verify-otp              ← Receive accessToken + refreshToken

── PATIENT SETUP ─────────────────────────────────────────────────
3. POST /patients/register            ← Create permanent identity (UHID auto-generated)
4. POST /patients/:id/emergency-contact  ← Add 1+ emergency contacts
5. POST /patients/:id/insurance          ← Optional insurance policy
6. POST /patients/:id/medical-snapshot   ← Allergies, medications, conditions
7. POST /patients/:id/consent            ← Immutable consent capture

── BOOKING ───────────────────────────────────────────────────────
8. GET  /doctors?specialization=       ← Browse doctors
9. GET  /doctors/:id/available-slots?date=  ← Check free slots
10. POST /appointments                 ← Book appointment (conflict-checked)
11. PATCH /appointments/:id/status     ← Confirm / Reschedule

── CLINICAL ENCOUNTER ────────────────────────────────────────────
12. POST /visits                       ← Record clinical encounter (linked to appointment)
13. POST /visits/:id/vital-signs       ← BP, pulse, temp, weight, SpO2, BMI
14. POST /prescriptions                ← Digital Rx with medicine line items
15. POST /lab-reports                  ← Order diagnostic tests

── RESULTS & FOLLOW-UP ──────────────────────────────────────────
16. PATCH /lab-reports/:id             ← Update status, upload report URL
17. GET /patients/:id/prescriptions    ← Patient views prescription history
18. GET /patients/:id/lab-reports      ← Patient views lab report history
```

---

## Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request processed successfully",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Error (400)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "phone",
      "constraints": ["phone must be a valid phone number"]
    },
    {
      "field": "dob",
      "constraints": ["dob must be a valid ISO 8601 date string"]
    }
  ],
  "path": "/api/v1/patients/register",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Access token is missing or invalid",
  "details": null,
  "path": "/api/v1/patients/register",
  "method": "POST",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Access denied. Required roles: ADMIN. Your role: STAFF",
  "details": null,
  "path": "/api/v1/patients/uuid/delete",
  "method": "DELETE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Seed the database
npx ts-node prisma/seed.ts
```

---

## Production Checklist

- [ ] Replace mock OTP service with real SMS provider (Twilio, MSG91)
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Set `NODE_ENV=production` (OTP hidden from responses)
- [ ] Configure SSL on PostgreSQL connection
- [ ] Set up database connection pooling (PgBouncer)
- [ ] Enable rate limiting on auth routes
- [ ] Set up structured logging (Winston/Pino)
- [ ] Configure health check endpoint
- [ ] Set up alerting on audit log anomalies
