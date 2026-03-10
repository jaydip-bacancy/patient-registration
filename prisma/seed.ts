import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Must match src/common/constants.ts
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding database...');

  // System user for audit trails (e.g. public patient registration createdBy)
  const systemUser = await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      email: 'system@hospital.com',
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Use POST /auth/register/admin to create admins, then POST /doctors for doctors.

  const doctorUser = await prisma.user.upsert({
    where: { email: 'ananya.patel@hospital.com' },
    update: {},
    create: {
      email: 'ananya.patel@hospital.com',
      role: Role.DOCTOR,
      isVerified: true,
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { registrationNo: 'MCI-2024-00001' },
    update: {},
    create: {
      userId: doctorUser.id,
      firstName: 'Ananya',
      lastName: 'Patel',
      phone: '+910000000003',
      email: 'ananya.patel@hospital.com',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
      registrationNo: 'MCI-2024-00001',
      experienceYears: 10,
      consultationFee: 500,
      bio: 'Interventional cardiologist with 10+ years experience.',
      languages: ['Hindi', 'English', 'Gujarati'],
    },
  });

  await prisma.doctorSlot.createMany({
    skipDuplicates: true,
    data: [
      { doctorId: doctor.id, dayOfWeek: 'MONDAY',    startTime: '09:00', endTime: '13:00', slotDuration: 15 },
      { doctorId: doctor.id, dayOfWeek: 'WEDNESDAY',  startTime: '09:00', endTime: '13:00', slotDuration: 15 },
      { doctorId: doctor.id, dayOfWeek: 'FRIDAY',     startTime: '14:00', endTime: '18:00', slotDuration: 15 },
    ],
  });

  console.log(`System user   : ${systemUser.id} (${systemUser.email})`);
  console.log(`Doctor user   : ${doctorUser.id} (${doctorUser.email})`);
  console.log(`Doctor profile: ${doctor.id} — Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`);
  console.log('Use POST /auth/register/admin to create admins, then POST /doctors for doctors.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
