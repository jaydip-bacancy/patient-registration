import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Must match src/common/constants.ts
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding database...');

  const systemUser = await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      phone: '+910000000000',
      role: Role.STAFF,
      isVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: '+910000000001' },
    update: {},
    create: { phone: '+910000000001', role: Role.ADMIN, isVerified: true },
  });

  const staff = await prisma.user.upsert({
    where: { phone: '+910000000002' },
    update: {},
    create: { phone: '+910000000002', role: Role.STAFF, isVerified: true },
  });

  const doctorUser = await prisma.user.upsert({
    where: { phone: '+910000000003' },
    update: {},
    create: { phone: '+910000000003', role: Role.DOCTOR, isVerified: true },
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

  console.log(`System user  : ${systemUser.id} (${systemUser.phone})`);
  console.log(`Admin user   : ${admin.id} (${admin.phone})`);
  console.log(`Staff user   : ${staff.id} (${staff.phone})`);
  console.log(`Doctor user  : ${doctorUser.id} (${doctorUser.phone})`);
  console.log(`Doctor profile: ${doctor.id} — Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`);
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
