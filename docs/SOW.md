# Statement of Work (SOW)
## Patient Registration System

**Document Version:** 1.0  
**Date:** March 12, 2025  
**Project:** Patient Registration System — Healthcare Management Platform

---

## 1. Executive Summary

This Statement of Work defines the scope, deliverables, and technical specifications for the **Patient Registration System** — a production-ready healthcare management platform for hospitals and clinics. The system supports the full patient journey from first registration through clinical encounters, prescriptions, and lab workflows. It is built with **NestJS**, **Prisma ORM**, **PostgreSQL**, and **JWT Authentication**, inspired by platforms such as Practo, Apollo 24|7, and Tata 1mg.

---

## 2. Project Objectives

- Provide a secure, scalable backend for managing patient records, appointments, and clinical workflows
- Enable role-based access for Patient, Staff, Doctor, and Admin users
- Support OPD, IPD, emergency, teleconsult, and follow-up visit types
- Maintain an audit trail of all critical operations for compliance
- Deliver a RESTful API with Swagger documentation for integration with frontend or third-party clients

---

## 3. Scope of Work

### 3.1 In Scope

| # | Module | Description |
|---|--------|-------------|
| 1 | **Authentication** | OTP-based phone authentication; JWT access (15m) and refresh (7d) tokens |
| 2 | **Patient Registration** | Create and manage patient records with unique UHID; no duplicate registration per phone |
| 3 | **Emergency Contacts** | Add, view, and manage one or more emergency contacts per patient |
| 4 | **Insurance** | Store multiple insurance policies per patient (provider, policy number, validity) |
| 5 | **Medical Snapshot** | Capture allergies, chronic conditions, medications, past surgeries (upsert model) |
| 6 | **Consent Management** | One-time, immutable consent capture (data privacy, treatment, communication) |
| 7 | **Doctor Profiles** | Doctor profiles with specialization, qualification, experience, fee, languages, bio |
| 8 | **Doctor Schedules** | Weekly availability slots (day, start/end time, slot duration); conflict-free availability |
| 9 | **Appointment Booking** | Book in-clinic, teleconsult, or home-visit appointments with conflict checking |
| 10 | **Visit Records** | Record OPD, IPD, emergency, teleconsult, follow-up visits linked to patient |
| 11 | **Vital Signs** | Record BP, pulse, temperature, weight, height, SpO2, respiratory rate; auto-calculate BMI |
| 12 | **Digital Prescriptions** | Issue prescriptions with diagnosis, medicine line items, dosage, frequency, duration |
| 13 | **Lab Reports** | Order labs; lifecycle: Ordered → Sample Collected → Processing → Completed/Cancelled |
| 14 | **Audit Trail** | Immutable logs of CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW actions |
| 15 | **Role-Based Access Control** | PATIENT, STAFF, DOCTOR, ADMIN roles with endpoint-level permissions |

### 3.2 Out of Scope

- Frontend/mobile application development
- Real SMS/OTP provider integration (currently mock; production requires Twilio/MSG91 or similar)
- Billing, payments, or invoicing
- Pharmacy or inventory management
- Imaging/PACS integration
- Video/telehealth integration
- HL7/FHIR interoperability
- Multi-tenant or multi-facility support beyond single deployment

---

## 4. Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| D1 | **REST API** | All endpoints under `/api/v1` with uniform response envelope |
| D2 | **Swagger Documentation** | Interactive API docs at `/docs` |
| D3 | **Database Schema** | PostgreSQL schema via Prisma; migrations and seed script |
| D4 | **Unit Tests** | Jest-based unit tests |
| D5 | **Integration Tests** | Integration tests with test database |
| D6 | **Docker Support** | Dockerfile and docker-compose for deployment |
| D7 | **README** | Setup, environment, API reference, role matrix |
| D8 | **FEATURES.md** | Non-technical feature overview for stakeholders |

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js >= 18 |
| Framework | NestJS 10.x |
| ORM | Prisma 5.x |
| Database | PostgreSQL >= 14 |
| Auth | Passport + JWT; OTP-based login |
| Validation | class-validator, class-transformer |
| API Docs | Swagger / OpenAPI |
| Testing | Jest, Supertest |

### 5.2 Architecture Overview

```
Client / Frontend
        │ HTTP/REST
        ▼
NestJS Application
├── Guards (JWT, Role-based)
├── Pipes (Validation)
├── Interceptors (Response envelope)
├── Modules: Auth, Patient, Doctor, Appointment, Visit, Prescription, Lab, Audit, etc.
└── Prisma ORM
        │
        ▼
PostgreSQL
```

### 5.3 Key Design Decisions

| Concern | Decision |
|---------|----------|
| Patient vs Visit | Patient = permanent identity; Visit = transactional encounter |
| Auth | OTP → JWT; access token 15m, refresh 7d |
| Roles | PATIENT, ADMIN, DOCTOR (schema also supports STAFF via implementation) |
| Soft Delete | `isActive` flag; no hard delete |
| Audit | Immutable AuditLog for all create/update/delete events |
| Consent | One-time, immutable; no re-submission |
| Medical Snapshot | Upsert (idempotent) |
| Appointments | Conflict-checked; slots derived from weekly template |
| Lab Reports | Status lifecycle: ORDERED → SAMPLE_COLLECTED → PROCESSING → COMPLETED/CANCELLED |

---

## 6. Module Specifications

### 6.1 Auth Module

- `POST /auth/send-otp` — Send OTP to phone (public)
- `POST /auth/verify-otp` — Verify OTP, issue tokens (public)
- `POST /auth/refresh` — Exchange refresh token for access token (public)

### 6.2 Patient Module

- `POST /patients/register` — Register patient (Staff/Admin)
- `GET /patients/search?phone=` — Search by phone (Staff/Admin)
- `GET /patients/:id` — Full profile with contacts, insurance, snapshot, consent
- `DELETE /patients/:id` — Soft delete (Admin only)

### 6.3 Sub-Resources (per patient)

- Emergency contacts: `POST` / `GET` / `DELETE`
- Insurance: `POST` / `GET` / `DELETE`
- Medical snapshot: `POST` (upsert) / `GET`
- Consent: `POST` (one-time) / `GET`

### 6.4 Doctor Module

- `POST /doctors` — Create doctor (Admin)
- `GET /doctors?specialization=` — List with optional filter
- `GET /doctors/:id` — Profile + slots
- `POST /doctors/:id/slots` — Add weekly availability (Admin)
- `GET /doctors/:id/available-slots?date=` — Unbooked slots for date

### 6.5 Appointment Module

- `POST /appointments` — Book appointment (conflict-checked)
- `GET /appointments/:id` — Appointment details
- `PATCH /appointments/:id/status` — Confirm, cancel, reschedule (Staff/Doctor/Admin)
- `GET /patients/:id/appointments` — Patient appointments
- `GET /doctors/:id/appointments?date=` — Doctor schedule

### 6.6 Visit Module

- `POST /visits` — Create visit (Staff/Admin)
- `GET /visits/:id` — Visit details
- `GET /patients/:id/visits` — Patient visit history

### 6.7 Vital Signs Module

- `POST /visits/:visitId/vital-signs` — Record vitals (Staff/Doctor/Admin)
- `GET` / `PATCH` — Retrieve and update vitals

### 6.8 Prescription Module

- `POST /prescriptions` — Issue prescription (Doctor/Admin)
- `GET /prescriptions/:id` — Prescription with medicines
- `GET /visits/:id/prescriptions` — Prescriptions for visit
- `GET /patients/:id/prescriptions` — Patient prescription history

### 6.9 Lab Report Module

- `POST /lab-reports` — Order lab (Doctor/Staff/Admin)
- `GET /lab-reports/:id` — Report details
- `PATCH /lab-reports/:id` — Update status, report URL, notes (Staff/Admin)
- `GET /patients/:id/lab-reports` — Patient lab history
- `GET /visits/:id/lab-reports` — Visit lab orders

### 6.10 Audit Module

- `GET /audit?limit=&offset=` — Paginated audit logs (Admin)
- `GET /audit/entity/:entityType/:entityId` — Entity audit trail
- `GET /audit/user/:userId` — User action history

---

## 7. Data Models (Summary)

| Entity | Purpose |
|--------|---------|
| User | Auth identity; links to Doctor when applicable |
| Otp | OTP codes for phone verification |
| Patient | Permanent identity; UHID, demographics, govt ID |
| EmergencyContact | 1:N with Patient |
| Insurance | 1:N with Patient |
| MedicalSnapshot | 1:1 with Patient |
| Consent | 1:1 with Patient |
| Doctor | Practitioner profile; linked to User |
| DoctorSlot | Weekly availability template |
| Appointment | Booking; links Patient, Doctor, optional Slot |
| Visit | Transactional encounter; links Patient, optional Doctor/Appointment |
| VitalSigns | 1:1 with Visit |
| Prescription | Per Visit; links Patient, Doctor |
| PrescribedMedicine | Line items in Prescription |
| LabReport | Ordered for Patient; optional Visit link |
| AuditLog | System-wide audit trail |

---

## 8. Assumptions

1. Client will provide PostgreSQL database or connection string
2. Client will integrate a real OTP/SMS provider for production (e.g., Twilio, MSG91)
3. JWT secrets will be provided and managed by client (min 32 characters)
4. API will be consumed by a separate frontend or third-party application
5. Single-tenant deployment per environment
6. All dates/times in ISO 8601 format; timezone handling as per client requirements
7. No PII in logs in production
8. CORS and allowed origins configured per client deployment

---

## 9. Dependencies

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `OTP_EXPIRY_MINUTES`, `OTP_LENGTH`, `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`

---

## 10. Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | All API endpoints documented in README and Swagger are implemented and functional |
| AC2 | Role-based access enforced per Role Matrix |
| AC3 | Patient registration produces unique UHID; duplicate phone rejected |
| AC4 | Appointment booking prevents double-booking for same doctor/slot |
| AC5 | Consent cannot be resubmitted once captured |
| AC6 | Lab reports follow status lifecycle (Ordered → … → Completed/Cancelled) |
| AC7 | Audit logs record CREATE, UPDATE, DELETE for key entities |
| AC8 | Unit and integration tests pass |
| AC9 | Application starts successfully with valid `.env` and database |
| AC10 | Swagger UI loads at `/docs` |

---

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **Client / Stakeholder** | Provide requirements, database, OTP provider; acceptance testing |
| **Development Team** | Implement backend API, tests, documentation, deployment configuration |
| **Admin** | Manage doctors, slots, users; view audit logs; soft-delete patients |

---

## 12. Timeline and Milestones

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Auth, Patient, Emergency Contact, Insurance, Medical Snapshot, Consent | Completed |
| Phase 2 | Doctor, Slots, Appointments | Completed |
| Phase 3 | Visits, Vital Signs, Prescriptions, Lab Reports | Completed |
| Phase 4 | Audit, RBAC, Tests, Documentation | Completed |
| Phase 5 | Production hardening (real OTP, rate limiting, logging, health check) | Pending |

---

## 13. Appendices

### A. Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing (32+ chars) |
| `JWT_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `OTP_EXPIRY_MINUTES` | OTP validity |
| `OTP_LENGTH` | OTP digits |
| `PORT` | Server port |
| `NODE_ENV` | `development` / `production` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |

### B. References

- [README.md](./README.md) — Technical setup, API reference, role matrix
- [FEATURES.md](./FEATURES.md) — Feature overview for non-technical stakeholders
- [prisma/schema.prisma](./prisma/schema.prisma) — Data model definitions

---

*This SOW is based on the Patient Registration System codebase as of March 2025 and reflects the implemented scope.*
