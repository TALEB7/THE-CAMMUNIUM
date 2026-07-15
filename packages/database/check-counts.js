const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conversations = await prisma.conversation.findMany({
    include: {
      participants: {
        include: {
          user: true
        }
      },
      messages: true
    }
  });

  console.log("Total conversations:", conversations.length);
  conversations.forEach((c, idx) => {
    console.log(`\nConversation ${idx + 1} (ID: ${c.id}, Type: ${c.type}):`);
    console.log("Participants:");
    c.participants.forEach(p => {
      console.log(`  - User ID: ${p.userId}, Email: ${p.user.email}, Role: ${p.role}`);
    });
    console.log(`Messages (${c.messages.length}):`);
    c.messages.forEach(m => {
      console.log(`  - Sender: ${m.senderId}, Content: "${m.content.slice(0, 30)}..."`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
