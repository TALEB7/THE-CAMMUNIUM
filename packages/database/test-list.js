const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mentors = await prisma.mentorProfile.findMany({
    include: {
      user: true
    }
  });
  console.log(`Total mentors in DB: ${mentors.length}`);

  const embeddings = await prisma.$queryRawUnsafe(`
    SELECT "mentorProfileId" FROM mentor_embeddings
  `);
  const embeddedIds = new Set(embeddings.map(e => e.mentorProfileId));

  mentors.forEach(m => {
    console.log(`- ${m.user.firstName} ${m.user.lastName} (Email: ${m.user.email}, ProfileID: ${m.id}, UserID: ${m.userId})`);
    console.log(`  Has Embedding: ${embeddedIds.has(m.id)}`);
    console.log(`  isAvailable: ${m.isAvailable}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
