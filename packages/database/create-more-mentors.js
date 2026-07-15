const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getEmbedding(mentor) {
  try {
    const res = await fetch('http://localhost:8000/embeddings/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentor_profile_id: mentor.profileId,
        headline: mentor.headline,
        bio: mentor.bio,
        expertise: mentor.expertise,
        industries: mentor.industries,
      }),
    });
    if (!res.ok) {
      throw new Error(`AI Service returned ${res.status}`);
    }
    const data = await res.json();
    return data.embedding;
  } catch (err) {
    console.error(`Error getting embedding for ${mentor.email}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🌱 Starting to create more mentors and generate AI embeddings...');

  // Use the pre-computed hash for 'Demo1234!' from seed.ts
  const passwordHash = '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.';

  const mentorsData = [
    {
      email: 'youssef.benmoussa@communium.ma',
      firstName: 'Youssef',
      lastName: 'Ben Moussa',
      headline: 'Développeur Full Stack Next.js & NestJS | Spécialiste WebRTC',
      bio: 'Passionné par l\'architecture logicielle et les technologies web modernes. J\'aide les startups à construire des applications évolutives et performantes.',
      expertise: ['Web Development', 'Next.js', 'NestJS', 'WebRTC'],
      industries: ['Technologie', 'E-commerce', 'Education'],
      hourlyRate: 150,
      yearsExp: 3,
    },
    {
      email: 'sara.benali@communium.ma',
      firstName: 'Sara',
      lastName: 'Ben Ali',
      headline: 'Expert Comptable & Fiscaliste des Entreprises',
      bio: 'Accompagnement fiscal, audits comptables et optimisation financière pour les PME et startups au Maroc.',
      expertise: ['Fiscalité', 'Comptabilité', 'Création d\'entreprise', 'Finance'],
      industries: ['Finance', 'Conseil', 'PME'],
      hourlyRate: 300,
      yearsExp: 6,
    },
    {
      email: 'karim.idrissi@communium.ma',
      firstName: 'Karim',
      lastName: 'Idrissi',
      headline: 'Spécialiste Logistique & Import-Export International',
      bio: 'Plus de 8 ans d\'expérience dans le transit de marchandises, le dédouanement et la supply chain internationale.',
      expertise: ['Logistique', 'Import-Export', 'Transport', 'Supply Chain'],
      industries: ['Logistique', 'Commerce', 'Agriculture'],
      hourlyRate: 200,
      yearsExp: 8,
    },
    {
      email: 'amina.cherkaoui@communium.ma',
      firstName: 'Amina',
      lastName: 'Cherkaoui',
      headline: 'Senior Designer UX/UI & Product Strategy',
      bio: 'Conception d\'interfaces utilisateurs premium et centrées sur l\'utilisateur pour le web et les applications mobiles.',
      expertise: ['UX/UI Design', 'Figma', 'Product Design', 'Branding'],
      industries: ['Design', 'Technologie', 'Marketing'],
      hourlyRate: 250,
      yearsExp: 5,
    },
    {
      email: 'tariq.elmadi@communium.ma',
      firstName: 'Tariq',
      lastName: 'Elmadi',
      headline: 'Expert Growth Marketing & E-commerce',
      bio: 'Génération de leads, acquisition d\'utilisateurs et scaling de boutiques e-commerce via Facebook Ads, Google Ads et SEO.',
      expertise: ['Growth Marketing', 'E-commerce', 'SEO', 'Facebook Ads'],
      industries: ['Marketing', 'E-commerce', 'Tech'],
      hourlyRate: 180,
      yearsExp: 4,
    },
    {
      email: 'layla.radi@communium.ma',
      firstName: 'Layla',
      lastName: 'Radi',
      headline: 'Avocate en Droit des Affaires & Droit du Travail',
      bio: 'Conseil juridique pour la structuration de sociétés, la rédaction de contrats et la conformité au Code du Travail marocain.',
      expertise: ['Droit des Affaires', 'Contrats', 'Code du Travail', 'Juridique'],
      industries: ['Juridique', 'Conseil', 'PME'],
      hourlyRate: 400,
      yearsExp: 7,
    },
  ];

  for (const m of mentorsData) {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        firstName: m.firstName,
        lastName: m.lastName,
      },
      create: {
        email: m.email,
        passwordHash,
        firstName: m.firstName,
        lastName: m.lastName,
        accountType: 'personal',
        isVerified: true,
      },
    });

    // 2. Upsert Mentor Profile
    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: m.headline,
        bio: m.bio,
        expertise: m.expertise,
        industries: m.industries,
        hourlyRate: m.hourlyRate,
        yearsExp: m.yearsExp,
        isAvailable: true,
      },
      create: {
        userId: user.id,
        headline: m.headline,
        bio: m.bio,
        expertise: m.expertise,
        industries: m.industries,
        hourlyRate: m.hourlyRate,
        yearsExp: m.yearsExp,
        isAvailable: true,
        rating: 4.5 + Math.random() * 0.5,
        totalReviews: Math.floor(Math.random() * 10),
      },
    });

    console.log(`- Created/Updated mentor profile for: ${m.firstName} ${m.lastName} (ID: ${profile.id})`);

    // 3. Generate and Store Embedding
    const embedding = await getEmbedding({ ...m, profileId: profile.id });
    if (embedding) {
      const embeddingString = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "mentor_embeddings" ("id", "mentorProfileId", "embedding", "model", "createdAt", "updatedAt")
        VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
        ON CONFLICT ("mentorProfileId") DO UPDATE SET "embedding" = $3::vector, "updatedAt" = NOW()
      `,
        `emb_${profile.id}`,
        profile.id,
        embeddingString,
        'paraphrase-multilingual-MiniLM-L12-v2'
      );
      console.log(`  ✓ Generated and saved AI embedding vector for ${m.firstName}`);
    } else {
      console.log(`  ✗ Could not generate embedding for ${m.firstName}`);
    }
  }

  console.log('🌱 All mentors and embeddings seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
  })
  .finally(() => prisma.$disconnect());
