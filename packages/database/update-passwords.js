const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.'; // Demo1234!
  await prisma.user.updateMany({
    data: {
      passwordHash: hash
    }
  });
  console.log('Password hashes updated successfully to correct bcrypt hash!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
