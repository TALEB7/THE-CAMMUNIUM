const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from local and root environment files
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Starting pgvector migration...');
  console.log('Database URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':****@') : 'undefined');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  try {
    // 1. Enable extension
    console.log('Enabling pgvector extension...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('pgvector extension enabled.');

    // 2. Alter listing_embeddings
    console.log('Altering listing_embeddings table...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE listing_embeddings ALTER COLUMN embedding TYPE vector(384) USING embedding::text::vector(384);'
    );
    console.log('listing_embeddings table altered successfully.');

    // 3. Alter mentor_embeddings
    console.log('Altering mentor_embeddings table...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE mentor_embeddings ALTER COLUMN embedding TYPE vector(384) USING embedding::text::vector(384);'
    );
    console.log('mentor_embeddings table altered successfully.');

    console.log('pgvector migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
