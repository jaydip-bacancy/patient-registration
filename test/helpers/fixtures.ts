import { Role, Gender, AppointmentStatus, AppointmentType, OtpStatus } from '@prisma/client';

// ── Users ────────────────────────────────────────────────────────────────────

export const mockAdminUser = {
  id: 'admin-user-uuid-0001',
  email: 'admin@example.com',
  role: Role.ADMIN,
  isVerified: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockPatientUser = {
  id: 'patient-user-uuid-001',
  email: 'user@example.com',
  role: Role.PATIENT,
  isVerified: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

export const mockOtp = {
  id: 'otp-uuid-0001',
  userId: mockPatientUser.id,
  code: '482910',
  status: OtpStatus.PENDING,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  createdAt: new Date(),
};

// ── Patient ───────────────────────────────────────────────────────────────────

export const mockPatient = {
  id: 'patient-uuid-0001',
  uhid: 'UHID-26-482910',
  firstName: 'Raj',
  lastName: 'Sharma',
  dob: new Date('1990-05-15'),
  gender: Gender.MALE,
  phone: '+919876543210',
  email: 'raj.sharma@example.com',
  address: '12B, MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  maritalStatus: null,
  occupation: 'Software Engineer',
  govtIdType: null,
  govtIdNumber: null,
  createdBy: mockAdminUser.id,
  isActive: true,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

export const mockPatientFull = {
  ...mockPatient,
  emergencyContacts: [
    { id: 'ec-uuid-001', patientId: mockPatient.id, name: 'Priya Sharma', relation: 'Spouse', phone: '+919876543211' },
  ],
  insurances: [],
  medicalSnapshot: null,
  consent: null,
};

// ── Doctor ────────────────────────────────────────────────────────────────────

export const mockDoctor = {
  id: 'doctor-uuid-0001',
  userId: 'doctor-user-uuid-001',
  registrationNo: 'MCI-2024-00001',
  firstName: 'Ananya',
  lastName: 'Patel',
  specialization: 'Cardiology',
  qualification: 'MBBS, MD (Cardiology)',
  experienceYears: 10,
  phone: '+910000000003',
  email: 'ananya.patel@hospital.com',
  consultationFee: 500,
  isActive: true,
  bio: 'Interventional cardiologist',
  languages: ['Hindi', 'English'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ── Appointment ───────────────────────────────────────────────────────────────

export const mockAppointment = {
  id: 'appointment-uuid-001',
  patientId: mockPatient.id,
  doctorId: mockDoctor.id,
  slotId: null,
  appointmentDate: new Date('2026-03-15'),
  startTime: '09:00',
  endTime: '09:15',
  type: AppointmentType.IN_CLINIC,
  status: AppointmentStatus.PENDING,
  reasonForVisit: 'Chest pain',
  notes: null,
  cancelReason: null,
  createdAt: new Date('2026-03-02'),
  updatedAt: new Date('2026-03-02'),
};

export const mockAppointmentWithRelations = {
  ...mockAppointment,
  patient: { uhid: mockPatient.uhid, firstName: mockPatient.firstName, lastName: mockPatient.lastName, phone: mockPatient.phone },
  doctor: { firstName: mockDoctor.firstName, lastName: mockDoctor.lastName, specialization: mockDoctor.specialization },
};

// ── Register Patient DTO ──────────────────────────────────────────────────────

export const registerPatientDto = {
  firstName: 'Raj',
  lastName: 'Sharma',
  dob: '1990-05-15',
  gender: Gender.MALE,
  phone: '+919876543210',
  email: 'raj.sharma@example.com',
};

// ── Create Appointment DTO ────────────────────────────────────────────────────

export const createAppointmentDto = {
  patientId: mockPatient.id,
  doctorId: mockDoctor.id,
  appointmentDate: '2026-03-15',
  startTime: '09:00',
  endTime: '09:15',
  type: AppointmentType.IN_CLINIC,
  reasonForVisit: 'Chest pain',
};
