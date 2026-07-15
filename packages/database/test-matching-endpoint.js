const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get a test user (mentee)
  const user = await prisma.user.findFirst({
    where: {
      email: { not: { in: [
        'youssef.benmoussa@communium.ma',
        'sara.benali@communium.ma',
        'karim.idrissi@communium.ma',
        'amina.cherkaoui@communium.ma',
        'tariq.elmadi@communium.ma',
        'layla.radi@communium.ma'
      ] } }
    }
  });

  if (!user) {
    console.error('No test user found for matching');
    return;
  }

  console.log(`Matching for mentee User ID: ${user.id} (${user.firstName} ${user.lastName})`);

  // Set Sara Ben Ali to unavailable to test the 0.6 penalty
  const sara = await prisma.mentorProfile.findFirst({
    where: { user: { email: 'sara.benali@communium.ma' } }
  });
  if (sara) {
    await prisma.mentorProfile.update({
      where: { id: sara.id },
      data: { isAvailable: false }
    });
    console.log(`Set Sara Ben Ali to unavailable (isAvailable = false) to test penalty.`);
  }

  // 2. Fetch the matched mentors by calling the mentorship service via REST API
  // Put Math.random() at the beginning to guarantee cache key variation
  const goals = Math.random() + ' I want to learn web development and fiscal accounting';
  const url = `http://localhost:4000/api/mentorship/mentors/match?menteeId=${user.id}&goals=${encodeURIComponent(goals)}&limit=10`;
  
  console.log(`Sending query request to NestJS backend: ${url}`);
  const res = await fetch(url);
  console.log(`Response status: ${res.status} ${res.statusText}`);
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`NestJS backend returned ${res.status}: ${text}`);
  }

  const results = JSON.parse(text);
  console.log(`Matched Mentors count: ${results.length}`);
  results.forEach((mentor, idx) => {
    console.log(`\nRank ${idx + 1}: ${mentor.user.firstName} ${mentor.user.lastName}`);
    console.log(`- Headline: ${mentor.headline}`);
    console.log(`- Available: ${mentor.isAvailable}`);
    console.log(`- Experience: ${mentor.yearsExp} yrs`);
    console.log(`- Rating: ${mentor.rating}`);
    console.log(`- Sessions: ${mentor.totalSessions}`);
    console.log(`- Match Metadata:`, mentor._match);
  });

  // Re-enable Sara
  if (sara) {
    await prisma.mentorProfile.update({
      where: { id: sara.id },
      data: { isAvailable: true }
    });
    console.log(`\nRestored Sara Ben Ali to available (isAvailable = true).`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
