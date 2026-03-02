# Patient Registration System — UI Flow Document

**Prepared for:** Frontend Developer  
**Backend Base URL:** `http://localhost:3008/api/v1`  
**Swagger UI:** `http://localhost:3008/docs`

---

## Roles Overview

| Role | Who uses it | Entry point after login |
|------|-------------|-------------------------|
| `STAFF` | Reception / nursing staff | Staff Dashboard |
| `ADMIN` | Hospital administrator | Admin Dashboard |
| `DOCTOR` | Treating physician | Doctor Dashboard |
| `PATIENT` | Registered patient | Patient Dashboard |

The `role` is returned inside the JWT response after OTP verification. Use it to decide which dashboard to render.

---

## 1. Authentication Flow

Every role uses the same login screen.

```
┌──────────────────────────────────────────┐
│             🏥 Login                     │
│                                          │
│   Mobile Number                          │
│   ┌──────────────────────────────────┐   │
│   │  +91  9876543210                 │   │
│   └──────────────────────────────────┘   │
│                                          │
│         [ Send OTP ]                     │
│                                          │
└──────────────────────────────────────────┘
                    │
                    │  POST /auth/send-otp
                    ▼
┌──────────────────────────────────────────┐
│          Enter OTP                       │
│                                          │
│   OTP sent to +91 9876543210             │
│                                          │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│   │ 4 │ │ 8 │ │ 2 │ │ 9 │ │ 1 │ │ 0 │  │
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  │
│                                          │
│         [ Verify OTP ]                   │
│   Resend OTP  00:28                      │
└──────────────────────────────────────────┘
                    │
                    │  POST /auth/verify-otp
                    │  ← returns { accessToken, refreshToken, user.role }
                    │
          ┌─────────┼──────────┬───────────┐
          ▼         ▼          ▼           ▼
       STAFF      ADMIN     DOCTOR     PATIENT
     Dashboard  Dashboard  Dashboard  Dashboard
```

---

## 2. Staff Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🏥 Patient Registration System              [Staff: Rahul] │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  + Register     │  │  🔍 Search      │                  │
│  │    New Patient  │  │     Patient     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  📅 Book        │  │  🏃 Today's     │                  │
│  │    Appointment  │  │    Check-ins    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  Recent Registrations                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Raj Sharma      UHID-26-482910   +919876543210  ›  │   │
│  │  Meera Iyer      UHID-26-112245   +919876100001  ›  │   │
│  │  Arun Kumar      UHID-26-334456   +919812345678  ›  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Patient Registration — 5-Step Wizard

Triggered by clicking **"Register New Patient"** on the Staff Dashboard.

A **progress bar** at the top tracks the current step. The `patient.id` returned in Step 1 is passed to all subsequent steps.

```
  ●──────────○──────────○──────────○──────────○
Step 1     Step 2     Step 3     Step 4     Step 5
Identity  Emergency  Insurance   Medical   Consent
```

---

### Step 1 — Patient Identity

```
┌──────────────────────────────────────────────────────────┐
│  New Patient Registration                   Step 1 of 5  │
│  ● ─────── ○ ─────── ○ ─────── ○ ─────── ○             │
│──────────────────────────────────────────────────────────│
│                                                          │
│  First Name *              Last Name *                   │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  Raj                │  │  Sharma                 │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  Date of Birth *           Gender *                      │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  15 / 05 / 1990     │  │  Male               ▼  │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  Phone Number *  (E.164 format — must be unique)         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  +91  9876543210                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Email                                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  raj.sharma@example.com                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ── Address (Optional) ───────────────────────────────── │
│  ┌────────────────────────────────────────────────────┐  │
│  │  12B, MG Road                                      │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐   │
│  │  Mumbai          │  │ Maharashtra  │  │  400001  │   │
│  │  City            │  │ State        │  │  Pincode │   │
│  └──────────────────┘  └──────────────┘  └──────────┘   │
│                                                          │
│  ── Identity (Optional) ─────────────────────────────── │
│  Marital Status        Occupation                        │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │  Married     ▼ │  │  Software Engineer          │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│                                                          │
│  Govt ID Type          Govt ID Number                    │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │  Aadhaar     ▼ │  │  1234-5678-9012             │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│                                                          │
│                        [ Cancel ]  [ Next Step → ]       │
└──────────────────────────────────────────────────────────┘
```

**API call on "Next Step":**
```
POST /patients/register
← returns { patient.id, patient.uhid, ... }
  Save patient.id for all following steps
```

**If phone already exists — show inline error:**
```
┌────────────────────────────────────────────────────────┐
│  ⚠️  A patient with this phone number already exists.  │
│     [ View Existing Patient ]                          │
└────────────────────────────────────────────────────────┘
```

---

### Step 2 — Emergency Contact

```
┌──────────────────────────────────────────────────────────┐
│  Emergency Contacts                         Step 2 of 5  │
│  ● ─────── ● ─────── ○ ─────── ○ ─────── ○             │
│  Patient: Raj Sharma  │  UHID-26-482910                  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Contact Name *                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Priya Sharma                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Relation *                Phone *                       │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  Spouse             │  │  +91  9876543211        │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  [ + Add Contact ]                                       │
│                                                          │
│  Added Contacts                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Priya Sharma  ·  Spouse  ·  +919876543211    [✕] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│              [ ← Back ]  [ Skip ]  [ Next Step → ]       │
└──────────────────────────────────────────────────────────┘
```

**API call on "Add Contact":**
```
POST /patients/:id/emergency-contact
```

"Skip" moves to Step 3 without adding any contact.

---

### Step 3 — Insurance

```
┌──────────────────────────────────────────────────────────┐
│  Insurance Details                          Step 3 of 5  │
│  ● ─────── ● ─────── ● ─────── ○ ─────── ○             │
│  Patient: Raj Sharma  │  UHID-26-482910                  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Insurance Provider *                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Star Health Insurance                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Policy Number *           Policy Holder Name *          │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  SHI-2024-00123456  │  │  Raj Sharma             │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  Valid Till *                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  31 / 12 / 2027                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [ + Add Policy ]                                        │
│                                                          │
│  Added Policies                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Star Health  ·  SHI-2024-00123456  ·  Dec 2027  [✕]│ │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│              [ ← Back ]  [ Skip ]  [ Next Step → ]       │
└──────────────────────────────────────────────────────────┘
```

**API call on "Add Policy":**
```
POST /patients/:id/insurance
```

---

### Step 4 — Medical Snapshot

```
┌──────────────────────────────────────────────────────────┐
│  Medical Intake                             Step 4 of 5  │
│  ● ─────── ● ─────── ● ─────── ● ─────── ○             │
│  Patient: Raj Sharma  │  UHID-26-482910                  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Allergies                                               │
│  ┌──────────────────────────────────────┐  [ + Add ]    │
│  │  e.g. Penicillin                     │               │
│  └──────────────────────────────────────┘               │
│  ✕ Penicillin    ✕ Dust mites                           │
│                                                          │
│  Chronic Conditions                                      │
│  ┌──────────────────────────────────────┐  [ + Add ]    │
│  │  e.g. Diabetes                       │               │
│  └──────────────────────────────────────┘               │
│  ✕ Type 2 Diabetes    ✕ Hypertension                    │
│                                                          │
│  Current Medications                                     │
│  ┌──────────────────────────────────────┐  [ + Add ]    │
│  │  e.g. Metformin 500mg                │               │
│  └──────────────────────────────────────┘               │
│  ✕ Metformin 500mg    ✕ Amlodipine 5mg                  │
│                                                          │
│  Past Surgeries                                          │
│  ┌──────────────────────────────────────┐  [ + Add ]    │
│  │  e.g. Appendectomy 2015              │               │
│  └──────────────────────────────────────┘               │
│  ✕ Appendectomy (2015)                                  │
│                                                          │
│              [ ← Back ]  [ Skip ]  [ Next Step → ]       │
└──────────────────────────────────────────────────────────┘
```

**API call on "Next Step":**
```
POST /patients/:id/medical-snapshot
(upsert — safe to re-submit, updates the existing record)
```

---

### Step 5 — Consent Capture

```
┌──────────────────────────────────────────────────────────┐
│  Patient Consent                            Step 5 of 5  │
│  ● ─────── ● ─────── ● ─────── ● ─────── ●             │
│  Patient: Raj Sharma  │  UHID-26-482910                  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Please read each statement aloud to the patient         │
│  and check the box when they agree.                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ☑  I consent to the collection and processing    │  │
│  │     of my personal health data for treatment       │  │
│  │     purposes.                    (Data Privacy)    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ☑  I consent to receive medical treatment,       │  │
│  │     procedures, and medications as recommended     │  │
│  │     by the care team.          (Treatment Consent) │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ☐  I consent to receive health updates and       │  │
│  │     appointment reminders via SMS / email.         │  │
│  │                           (Communication Consent)  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ⚠️  Once submitted, consent cannot be changed without  │
│     admin intervention.                                  │
│                                                          │
│           [ ← Back ]  [ Submit & Complete Registration ] │
└──────────────────────────────────────────────────────────┘
```

**API call on "Submit":**
```
POST /patients/:id/consent
```

---

### Registration Complete

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              ✅  Patient Registered!                     │
│                                                          │
│   Name    Raj Sharma                                     │
│   UHID    UHID-26-482910                                 │
│   Phone   +919876543210                                  │
│                                                          │
│   ┌────────────────────┐   ┌────────────────────────┐   │
│   │   View Profile     │   │   Book Appointment     │   │
│   └────────────────────┘   └────────────────────────┘   │
│                                                          │
│          [ Register Another Patient ]                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Search & Patient Profile

### Search Screen

```
┌──────────────────────────────────────────────────────────┐
│  Search Patients                                         │
│──────────────────────────────────────────────────────────│
│                                                          │
│  ┌──────────────────────────────────────┐  [ Search ]   │
│  │  🔍  +91 98765                       │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  2 results found                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Raj Sharma     UHID-26-482910   +919876543210  ›  │  │
│  │  Rajan Sharma   UHID-26-112244   +919876123456  ›  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET /patients/search?phone=+9198765`

---

### Patient Profile Screen

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back     Patient Profile            [ Edit ]  [ ⋮ More ] │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  👤  Raj Sharma                   UHID-26-482910  ✅ Active  │
│  📞  +919876543210                ✉️  raj.sharma@example.com │
│  🎂  15 May 1990  (35 yrs)        ⚧  Male  💍  Married      │
│  📍  12B MG Road, Mumbai, Maharashtra — 400001               │
│  💼  Software Engineer            🪪  Aadhaar: 1234-5678-9012│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Overview │ Emergency │ Insurance │ Medical │ Consent  │   │
│  │ Appts    │ Visits    │ Rx        │ Labs               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Emergency Contacts                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Priya Sharma  ·  Spouse  ·  +919876543211           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Insurance                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Star Health  ·  SHI-2024-00123456  ·  Till Dec 2027 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Medical Snapshot                                            │
│  Allergies       Penicillin, Dust mites                      │
│  Conditions      Type 2 Diabetes, Hypertension               │
│  Medications     Metformin 500mg, Amlodipine 5mg             │
│  Surgeries       Appendectomy (2015)                         │
│                                                              │
│  Consent         ✅ Data Privacy  ✅ Treatment  ☐ Comms      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**API:** `GET /patients/:id`

---

## 5. Appointment Booking Flow

Triggered by "Book Appointment" from anywhere in the app.

```
┌──────────────────────────────────────────────────────────┐
│  ← Back     Book Appointment                             │
│──────────────────────────────────────────────────────────│
│  Patient: Raj Sharma  (UHID-26-482910)                   │
│                                                          │
│  Step 1 — Find a Doctor                                  │
│  Specialization                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Cardiology                                   ▼ │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓ GET /doctors?specialization=  │
│  Select Doctor                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Dr. Ananya Patel                             ▼ │   │
│  │  Cardiology · 10 yrs experience · ₹500 / visit  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Step 2 — Pick a Date & Slot                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ‹  March 2026  ›                               │   │
│  │  Mo  Tu  We  Th  Fr  Sa  Su                     │   │
│  │   2   3   4   5   6   7   8                     │   │
│  │   9  10  11  12  13  14  15 ←                   │   │
│  └──────────────────────────────────────────────────┘   │
│             ↓ GET /doctors/:id/available-slots?date=     │
│  Available Slots — Mon 15 Mar                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [09:00]  [09:15]  ░09:30░  [09:45]  [10:00]  ... │ │
│  │           (09:30 = already booked, greyed out)     │ │
│  └────────────────────────────────────────────────────┘ │
│  Selected: 09:45                                         │
│                                                          │
│  Step 3 — Appointment Details                            │
│  Type        ● In-Clinic  ○ Teleconsult  ○ Home Visit   │
│                                                          │
│  Reason for visit  (optional)                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Chest pain and shortness of breath since 2 days │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Consultation Fee:  ₹500                                 │
│                                                          │
│                      [ Confirm Booking ]                 │
└──────────────────────────────────────────────────────────┘
```

**API:** `POST /appointments`

---

### Appointment Booked Confirmation

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            ✅  Appointment Booked!                       │
│                                                          │
│  Dr. Ananya Patel  ·  Cardiology                        │
│  Mon, 15 March 2026  ·  09:45 AM                        │
│  In-Clinic  ·  Status: PENDING                          │
│                                                          │
│       [ View Appointment ]   [ Back to Patient ]        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Appointment Card (in list view)

```
┌──────────────────────────────────────────────────────────┐
│  📅  Mon, 15 Mar 2026 · 09:45 AM        ● CONFIRMED      │
│  Dr. Ananya Patel  —  Cardiology                         │
│  🏥  In-Clinic  ·  Chest pain                            │
│                                                          │
│  [ View Details ]   [ Cancel ]   [ Reschedule ]          │
└──────────────────────────────────────────────────────────┘
```

**Status badge colours (suggested):**

| Status | Colour |
|--------|--------|
| PENDING | Yellow |
| CONFIRMED | Blue |
| COMPLETED | Green |
| CANCELLED | Red |
| NO_SHOW | Grey |
| RESCHEDULED | Orange |

---

## 6. Clinical Encounter Flow (Visit Day)

After the patient arrives at the clinic, STAFF walks through this flow.

```
┌──────────────────────────────────────────────────────────┐
│  Today's Check-ins  —  Mon 15 Mar 2026                   │
│──────────────────────────────────────────────────────────│
│  09:00  Raj Sharma    UHID-26-482910  CONFIRMED  [ → ]   │
│  09:15  Meera Iyer    UHID-26-112245  CONFIRMED  [ → ]   │
│  09:30  — Slot free —                                    │
│  09:45  Arun Kumar    UHID-26-334456  PENDING    [ → ]   │
└──────────────────────────────────────────────────────────┘
```

Clicking **→** on Raj Sharma opens the encounter flow:

---

### 6a. Create Visit

```
┌──────────────────────────────────────────────────────────┐
│  New Visit  —  Raj Sharma  (UHID-26-482910)              │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Visit Type *              Department *                  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  OPD             ▼ │  │  Cardiology              │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                          │
│  Doctor Name *             Visit Date *                  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Dr. Ananya Patel   │  │  15/03/2026  09:45       │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                          │
│  Clinical Notes (optional)                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Patient presents with chest pain and            │   │
│  │  shortness of breath since 2 days.               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│                        [ Create Visit & Continue → ]     │
└──────────────────────────────────────────────────────────┘
```

**API:** `POST /visits` → save `visit.id`

---

### 6b. Record Vital Signs

```
┌──────────────────────────────────────────────────────────┐
│  Vital Signs  —  Raj Sharma                              │
│  Visit: OPD  ·  15 Mar 2026  ·  Dr. Ananya Patel        │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Blood Pressure          Pulse Rate                      │
│  ┌──────────┐ / ┌──────┐ ┌─────────────────────────┐   │
│  │  120     │   │  80  │ │  78          bpm         │   │
│  │ Systolic │   │Diast.│ └─────────────────────────┘   │
│  └──────────┘   └──────┘                                │
│                                                          │
│  Temperature             SpO2                            │
│  ┌─────────────────────┐ ┌─────────────────────────┐   │
│  │  98.6          °F   │ │  98             %        │   │
│  └─────────────────────┘ └─────────────────────────┘   │
│                                                          │
│  Weight                  Height                          │
│  ┌─────────────────────┐ ┌─────────────────────────┐   │
│  │  72.5          kg   │ │  170           cm        │   │
│  └─────────────────────┘ └─────────────────────────┘   │
│                                                          │
│  BMI: 25.1  (auto-calculated ✓)                         │
│                                                          │
│  Respiratory Rate                                        │
│  ┌─────────────────────┐                                │
│  │  16     breaths/min │                                │
│  └─────────────────────┘                                │
│                                                          │
│                        [ Save Vitals & Continue → ]      │
└──────────────────────────────────────────────────────────┘
```

**API:** `POST /visits/:id/vital-signs`

---

### 6c. Issue Prescription (Doctor screen)

```
┌──────────────────────────────────────────────────────────┐
│  Issue Prescription  —  Raj Sharma                       │
│  Visit: OPD  ·  15 Mar 2026                              │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Diagnosis                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Type 2 Diabetes Mellitus with Hypertension      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Medicines                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Medicine Name      Dosage   Frequency  Duration │   │
│  │  ┌──────────────┐  ┌──────┐ ┌─────────┐ ┌─────┐ │   │
│  │  │ Metformin    │  │500mg │ │Twice/day│ │30 d │ │   │
│  │  └──────────────┘  └──────┘ └─────────┘ └─────┘ │   │
│  │  Instructions: Take with warm water.         [✕] │   │
│  │  ─────────────────────────────────────────────── │   │
│  │  ┌──────────────┐  ┌──────┐ ┌─────────┐ ┌─────┐ │   │
│  │  │ Amlodipine   │  │  5mg │ │Once/day │ │30 d │ │   │
│  │  └──────────────┘  └──────┘ └─────────┘ └─────┘ │   │
│  │  Instructions:                               [✕] │   │
│  └──────────────────────────────────────────────────┘   │
│  [ + Add Medicine Row ]                                  │
│                                                          │
│  Advice / Notes                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Low-sodium diet. Exercise 30 min daily.         │   │
│  │  Monitor BP weekly.                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Follow-up Date                                          │
│  ┌──────────────────┐                                   │
│  │  15 / 04 / 2026  │                                   │
│  └──────────────────┘                                   │
│                                                          │
│                        [ Issue Prescription ]            │
└──────────────────────────────────────────────────────────┘
```

**API:** `POST /prescriptions`

---

### 6d. Order Lab Tests

```
┌──────────────────────────────────────────────────────────┐
│  Order Lab Tests  —  Raj Sharma                          │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Test Name *                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  HbA1c                                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Lab Name  (optional)                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Metropolis Healthcare                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [ + Order Another Test ]                               │
│                                                          │
│  Tests Ordered                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  HbA1c  ·  Metropolis Healthcare  ·  ORDERED [✕]│   │
│  │  CBC    ·  Metropolis Healthcare  ·  ORDERED [✕]│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│                    [ Done — Complete Visit ]             │
└──────────────────────────────────────────────────────────┘
```

**API:** `POST /lab-reports` (once per test)

---

### Visit Summary Card

After all steps are done, show a read-only summary.

```
┌──────────────────────────────────────────────────────────┐
│  ✅  Visit Complete  —  Raj Sharma  ·  UHID-26-482910    │
│──────────────────────────────────────────────────────────│
│  OPD  ·  Cardiology  ·  Dr. Ananya Patel  ·  15 Mar 2026│
│                                                          │
│  Vitals    BP 120/80  ·  Pulse 78  ·  Temp 98.6°F       │
│            SpO2 98%  ·  BMI 25.1                         │
│                                                          │
│  Rx        Metformin 500mg  ·  Amlodipine 5mg            │
│            Follow-up: 15 Apr 2026                        │
│                                                          │
│  Labs      HbA1c  ·  CBC  →  ORDERED                    │
│                                                          │
│   [ Print Summary ]     [ Back to Dashboard ]            │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Lab Report Status Tracking (Staff)

```
┌──────────────────────────────────────────────────────────┐
│  Lab Reports  —  Raj Sharma  (UHID-26-482910)            │
│──────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  HbA1c                         🔴  ORDERED         │  │
│  │  Ordered: 15 Mar 2026  ·  Metropolis Healthcare    │  │
│  │  [ Mark: Sample Collected ▼ ]                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  CBC                           🟡  PROCESSING      │  │
│  │  Sample Collected: 15 Mar 2026                     │  │
│  │  [ Mark: Completed ▼ ]                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Lipid Profile                 🟢  COMPLETED       │  │
│  │  Completed: 14 Mar 2026                            │  │
│  │  LDL 145 mg/dL — Borderline high.                  │  │
│  │  [ 🔗 View Report PDF ]                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status pipeline** (left to right):
```
🔴 ORDERED  →  🟠 SAMPLE COLLECTED  →  🟡 PROCESSING  →  🟢 COMPLETED
                                                        →  ⛔ CANCELLED
```

**API:** `PATCH /lab-reports/:id`  
When marking COMPLETED — show an additional field for uploading the report URL and adding notes.

---

## 8. Doctor Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Dr. Ananya Patel  ·  Cardiology                  [Logout]   │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  Today  —  Monday, 2 March 2026                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  09:00  Raj Sharma     UHID-26-482910  OPD  ✅       │   │
│  │  09:15  Meera Iyer     UHID-26-112245  OPD  ⏳       │   │
│  │  09:30  — Free slot —                                │   │
│  │  09:45  Arun Kumar     UHID-26-334456  OPD  ⏳       │   │
│  │  10:00  Sita Devi      UHID-26-445566  OPD  ⏳       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  On clicking a patient row:                                  │
│  [ View Patient ]  [ Issue Rx ]  [ Mark Complete ]           │
│                                                              │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │  📅 My Schedule    │  │  💊 Prescriptions Issued     │   │
│  │  This Week: 28     │  │  This Week: 14               │   │
│  └────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**API:** `GET /doctors/:id/appointments?date=2026-03-02`

---

## 9. Patient Self-Service Dashboard

When a patient logs in with their own phone number.

```
┌──────────────────────────────────────────────────────────┐
│  Hi, Raj 👋                                   [Logout]   │
│  UHID: UHID-26-482910                                    │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Upcoming Appointment                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  📅  Mon 15 Mar 2026  ·  09:45 AM  ● CONFIRMED   │   │
│  │  Dr. Ananya Patel  ·  Cardiology  ·  In-Clinic   │   │
│  │  [ View ]                        [ Cancel ]      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │  📅 My         │  │  💊 My         │                 │
│  │  Appointments  │  │  Prescriptions │                 │
│  └────────────────┘  └────────────────┘                 │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │  🧪 Lab        │  │  👤 My         │                 │
│  │  Reports       │  │  Profile       │                 │
│  └────────────────┘  └────────────────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Patient — My Prescriptions

```
┌──────────────────────────────────────────────────────────┐
│  ← Back     My Prescriptions                             │
│──────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  15 Mar 2026  ·  Dr. Ananya Patel  ·  Cardiology  │  │
│  │  Type 2 Diabetes Mellitus with Hypertension        │  │
│  │                                                    │  │
│  │  💊  Metformin 500mg  ·  Twice daily  ·  30 days  │  │
│  │  💊  Amlodipine 5mg   ·  Once daily   ·  30 days  │  │
│  │                                                    │  │
│  │  Follow-up: 15 Apr 2026                            │  │
│  │                          [ View Full Rx ]          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  01 Jan 2026  ·  Dr. Ramesh Gupta  ·  General     │  │
│  │  ...                               [ View Full Rx ]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET /patients/:id/prescriptions`

---

### Patient — My Lab Reports

```
┌──────────────────────────────────────────────────────────┐
│  ← Back     My Lab Reports                               │
│──────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  HbA1c                             🟢  COMPLETED   │  │
│  │  Ordered: 15 Mar 2026  ·  Metropolis Healthcare    │  │
│  │  HbA1c: 7.8% — Elevated.                          │  │
│  │                          [ 🔗 Download Report ]    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  CBC                               🟡  PROCESSING  │  │
│  │  Ordered: 15 Mar 2026                              │  │
│  │  Results pending...                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET /patients/:id/lab-reports`

---

## 10. Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Admin Panel                                      [Logout]   │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  👨‍⚕️ Manage   │ │  👥 All      │ │  📋 Audit Logs       │ │
│  │  Doctors     │ │  Patients    │ │                      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  Add Doctor Profile                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Name, Specialization, Qualification, Reg. No.       │   │
│  │  Phone, Consultation Fee, Languages, Bio             │   │
│  │                             [ Create Doctor Profile ] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Set Doctor Availability Slots                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Select Doctor  [ Dr. Ananya Patel           ▼ ]     │   │
│  │  Day     [ Monday    ▼ ]                             │   │
│  │  From    [ 09:00 ]   To  [ 13:00 ]   Every [ 15 ] min│   │
│  │                                     [ Add Slot ]     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**APIs:**  
- `POST /doctors`  
- `POST /doctors/:id/slots`

---

### Audit Logs Screen (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  Audit Logs                                    Admin Only    │
│──────────────────────────────────────────────────────────────│
│  Filter: [ Entity ▼ ]  [ Action ▼ ]  [ User ▼ ]  [ Search ] │
│                                                              │
│  Timestamp            Entity        Action    Performed By   │
│  ──────────────────────────────────────────────────────────  │
│  02 Mar  10:32 AM     Patient       CREATE    Staff Rahul     │
│  02 Mar  10:33 AM     Consent       CREATE    Staff Rahul     │
│  02 Mar  10:45 AM     Visit         CREATE    Staff Rahul     │
│  02 Mar  11:00 AM     Prescription  CREATE    Dr. Patel       │
│  02 Mar  11:05 AM     LabReport     CREATE    Dr. Patel       │
│  02 Mar  11:20 AM     Appointment   UPDATE    Staff Rahul     │
│                                                              │
│                                         [ Load More ]        │
└──────────────────────────────────────────────────────────────┘
```

**API:** `GET /audit?limit=50&offset=0`

---

## 11. Complete Screen → API Map

| Screen | Method | Endpoint |
|--------|--------|----------|
| Login — Send OTP | POST | `/auth/send-otp` |
| Login — Verify OTP | POST | `/auth/verify-otp` |
| Login — Refresh token | POST | `/auth/refresh` |
| Register Step 1 — Identity | POST | `/patients/register` |
| Register Step 2 — Emergency | POST | `/patients/:id/emergency-contact` |
| Register Step 3 — Insurance | POST | `/patients/:id/insurance` |
| Register Step 4 — Medical | POST | `/patients/:id/medical-snapshot` |
| Register Step 5 — Consent | POST | `/patients/:id/consent` |
| Search patients | GET | `/patients/search?phone=` |
| View patient profile | GET | `/patients/:id` |
| View emergency contacts | GET | `/patients/:id/emergency-contact` |
| View insurance records | GET | `/patients/:id/insurance` |
| View medical snapshot | GET | `/patients/:id/medical-snapshot` |
| View consent | GET | `/patients/:id/consent` |
| Browse doctors | GET | `/doctors?specialization=` |
| Doctor profile + slots | GET | `/doctors/:id` |
| Available slots for a date | GET | `/doctors/:id/available-slots?date=` |
| Book appointment | POST | `/appointments` |
| Update appointment status | PATCH | `/appointments/:id/status` |
| Patient's appointments | GET | `/patients/:id/appointments` |
| Doctor's schedule | GET | `/doctors/:id/appointments?date=` |
| Create visit | POST | `/visits` |
| View visit | GET | `/visits/:id` |
| Patient's visit history | GET | `/patients/:id/visits` |
| Record vital signs | POST | `/visits/:id/vital-signs` |
| Update vital signs | PATCH | `/visits/:id/vital-signs` |
| View vital signs | GET | `/visits/:id/vital-signs` |
| Issue prescription | POST | `/prescriptions` |
| View prescription | GET | `/prescriptions/:id` |
| Prescriptions for a visit | GET | `/visits/:id/prescriptions` |
| Patient's Rx history | GET | `/patients/:id/prescriptions` |
| Order lab test | POST | `/lab-reports` |
| Update lab report status | PATCH | `/lab-reports/:id` |
| View lab report | GET | `/lab-reports/:id` |
| Patient's lab history | GET | `/patients/:id/lab-reports` |
| Visit's lab reports | GET | `/visits/:id/lab-reports` |
| Create doctor | POST | `/doctors` |
| Add doctor slot | POST | `/doctors/:id/slots` |
| Soft delete patient | DELETE | `/patients/:id` |
| Audit logs | GET | `/audit` |

---

*Swagger UI with live, interactive API documentation: `http://localhost:3008/docs`*
