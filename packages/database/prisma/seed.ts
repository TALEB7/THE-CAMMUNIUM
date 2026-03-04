import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo personal user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@communium.ma' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id_001',
      email: 'demo@communium.ma',
      firstName: 'Ahmed',
      lastName: 'Bennani',
      accountType: 'personal',
      isVerified: true,
    },
  });

  // Create personal profile
  await prisma.personalProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      firstName: 'Ahmed',
      lastName: 'Bennani',
      birthday: '1990-01-15',
      identityType: 'cin',
      identityNumber: 'AB123456',
      phone: '+212 612 345 678',
      email: 'demo@communium.ma',
      country: 'Maroc',
      city: 'Tanger',
      address: '123 Boulevard Mohammed V, Tanger',
      profession: 'Ingénieur Logiciel',
      interests: ['Technologie', 'Business', 'Club'],
      workHistory: [
        {
          title: 'Développeur Full Stack',
          company: 'TechMa Solutions',
          startDate: '2020-03',
          endDate: '',
        },
        {
          title: 'Développeur Junior',
          company: 'StartUp Maroc',
          startDate: '2018-06',
          endDate: '2020-02',
        },
      ],
    },
  });

  // Create Tks wallet
  await prisma.tksWallet.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      balance: 50,
      totalEarned: 50,
    },
  });

  // Create a demo business user
  const bizUser = await prisma.user.upsert({
    where: { email: 'contact@techma.ma' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id_002',
      email: 'contact@techma.ma',
      firstName: 'Fatima',
      lastName: 'El Amrani',
      accountType: 'business',
      isVerified: true,
    },
  });

  // Create business profile
  await prisma.businessProfile.upsert({
    where: { userId: bizUser.id },
    update: {},
    create: {
      userId: bizUser.id,
      companyName: 'TechMa Solutions SARL',
      rc: '12345-TNG',
      creationDate: '2019-01-10',
      phone: '+212 539 123 456',
      email: 'contact@techma.ma',
      country: 'Maroc',
      city: 'Tanger',
      address: 'Zone Franche, Tanger, Maroc',
      activities: 'Développement logiciel, Consulting IT',
      ice: '001234567000089',
      ifNumber: '12345678',
      interests: ['Technologie', 'Business', 'Import/Export'],
    },
  });

  // Create Tks wallet for business
  await prisma.tksWallet.upsert({
    where: { userId: bizUser.id },
    update: {},
    create: {
      userId: bizUser.id,
      balance: 150,
      totalEarned: 150,
    },
  });

  console.log('✅ Database seeded successfully');
  console.log(`   - Demo personal user: ${demoUser.email}`);
  console.log(`   - Demo business user: ${bizUser.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
