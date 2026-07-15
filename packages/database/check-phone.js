const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Search in PersonalProfile for the phone number
  const profiles = await prisma.personalProfile.findMany({
    where: {
      phone: {
        contains: '713368237'
      }
    },
    include: {
      user: true
    }
  });
  console.log("PROFILES FOUND:", JSON.stringify(profiles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
