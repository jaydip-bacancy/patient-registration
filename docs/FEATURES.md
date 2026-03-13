# Patient Registration System — Features Overview

This document describes the features of the Patient Registration System in plain language for administrators, staff, and stakeholders. It focuses on what the system does and what value it provides, not on technical implementation.

---

## What Is This System?

The Patient Registration System is a healthcare management platform that helps hospitals and clinics manage patient records, appointments, and clinical workflows. It supports staff, doctors, and patients through the full journey—from first registration to follow-up care.

---

## 1. Secure Sign-In

**What it does:** Staff and patients sign in using their phone number. The system sends a one-time code (OTP) to verify their identity. No passwords to remember.

**Benefits:**
- Fast, simple login
- Works well on mobile
- Secure, time-limited verification

---

## 2. Patient Registration

**What it does:** Staff register new patients with basic details: name, date of birth, gender, contact information, address, and optional information such as marital status, occupation, and government ID (e.g., Aadhaar, PAN).

**Benefits:**
- Each patient gets a unique hospital ID (UHID)
- No duplicate records for the same phone
- Central record for all future visits and treatments

---

## 3. Emergency Contacts

**What it does:** For each patient, staff can add one or more emergency contacts: name, relationship, and phone number.

**Benefits:**
- Easier to reach family in emergencies
- Contact details are kept together in the patient record

---

## 4. Insurance Information

**What it does:** Staff can record patient insurance details: provider name, policy number, policyholder name, and validity.

**Benefits:**
- Insurance details are readily available during visits
- Multiple policies can be stored per patient
- Supports smoother billing and claims

---

## 5. Medical Snapshot

**What it does:** Captures important health information in one place: allergies, chronic conditions, current medications, past surgeries, and similar details. This can be updated over time.

**Benefits:**
- Doctors see relevant history before treatment
- Reduces risk of harmful drug interactions
- Helps in better, informed care

---

## 6. Consent Management

**What it does:** Patients give consent for data privacy, treatment, and communications. Once recorded, it remains on file and cannot be changed without admin help.

**Benefits:**
- Clear record of what the patient has agreed to
- Helps with compliance and legal requirements
- Ensures informed consent is documented

---

## 7. Doctor Profiles and Schedules

**What it does:**
- Maintains doctor profiles: specialization, qualifications, experience, consultation fee, languages, bio
- Allows admins to define when doctors are available (e.g., “Dr. Patel is available every Monday 9 AM–5 PM with 15‑minute slots”)
- Patients and staff can browse doctors, filter by specialization, and see availability

**Benefits:**
- Easy to find suitable doctors
- Clear, structured schedules
- Flexible setup for different patterns of work

---

## 8. Appointment Booking

**What it does:** Patients or staff can book appointments by choosing a doctor and a date. The system shows only free time slots and avoids double-booking.

**Benefits:**
- No conflicts for the same doctor and time
- Supports in-clinic, teleconsult, and home visits
- Appointments can be confirmed, rescheduled, or cancelled with a reason

---

## 9. Visit Records

**What it does:** Each visit (OPD, IPD, emergency, teleconsult, follow-up) is recorded separately and linked to the patient. Staff capture department, doctor, date, and notes.

**Benefits:**
- Clear history of every encounter
- Visit data is separate from patient identity
- Easier to track follow-ups and referrals

---

## 10. Vital Signs Recording

**What it does:** For each visit, staff or doctors can record vital signs: blood pressure, pulse, temperature, weight, height, oxygen saturation, and respiratory rate. The system calculates BMI from weight and height.

**Benefits:**
- Quick snapshot of the patient’s condition at each visit
- Trends visible over time
- Less manual calculation for BMI and similar values

---

## 11. Digital Prescriptions

**What it does:** Doctors issue prescriptions linked to a specific visit. Each prescription can include diagnosis, multiple medicines (name, dosage, frequency, duration, instructions), and follow-up date.

**Benefits:**
- Digital, readable prescriptions
- Structured medicine information for dispensing and records
- Prescription history available for the patient

---

## 12. Lab Reports and Orders

**What it does:** Staff or doctors order lab tests for a patient and optionally link them to a visit. Each lab report moves through stages: ordered → sample collected → processing → completed (or cancelled). Report URL and notes can be added when results are ready.

**Benefits:**
- Clear tracking of lab workflow
- Easy access to results
- Reports tied to patient and visit

---

## 13. Audit Trail

**What it does:** The system keeps a log of important actions: who created or updated records, when, and on what (e.g., patients, doctors, prescriptions). Admins can view these logs.

**Benefits:**
- Accountability and traceability
- Easier investigation of issues
- Supports compliance and audits

---

## 14. Role-Based Access

**What it does:** Different user roles (Patient, Doctor, Staff, Admin) have different permissions. For example:
- Patients can book appointments and view their own records
- Staff can register patients and manage visits
- Doctors can issue prescriptions and order labs
- Admins can manage doctors, slots, and system settings

**Benefits:**
- Sensitive actions are restricted
- Each role sees only what they need
- Safer and more controlled use of the system

---

## Summary

The Patient Registration System supports:

| Feature            | Purpose                                      |
|--------------------|----------------------------------------------|
| Secure sign-in     | Fast, phone-based authentication             |
| Patient registration | Central patient records with unique ID     |
| Emergency contacts | Quick access to family in emergencies        |
| Insurance          | Store and use insurance details              |
| Medical snapshot   | Capture allergies, conditions, medications   |
| Consent            | Document and manage patient consent          |
| Doctors and slots  | Manage availability and schedules            |
| Appointments       | Conflict-free appointment booking            |
| Visits             | Record each clinical encounter               |
| Vital signs        | Record and track basic health metrics        |
| Prescriptions      | Issue and store digital prescriptions        |
| Lab reports        | Order and track lab tests and results        |
| Audit trail        | Log and review system activity               |
| Role-based access  | Restrict actions by user role                |

Together, these features support a full patient journey from registration and booking to clinical care and follow-up, while keeping records organized, secure, and compliant.
