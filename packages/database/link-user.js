const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Linking seeded data to active user 'samital2@gmail.com'...");

  // 1. Find the source user (seeded account) and destination user (logged in account)
  const samiSrc = await prisma.user.findUnique({
    where: { email: 'sami.taleb@communium.ma' }
  });

  const samiDest = await prisma.user.findUnique({
    where: { email: 'samital2@gmail.com' }
  });

  if (!samiSrc || !samiDest) {
    console.error("❌ Could not find sami.taleb@communium.ma or samital2@gmail.com in database.");
    return;
  }

  console.log(`Source user ID: ${samiSrc.id}`);
  console.log(`Destination user ID: ${samiDest.id}`);

  // 2. Promote samital2@gmail.com to ADMIN and verify
  await prisma.user.update({
    where: { id: samiDest.id },
    data: {
      role: 'ADMIN',
      isVerified: true,
      firstName: 'Sami',
      lastName: 'Taleb'
    }
  });
  console.log("✓ Promoted destination user to ADMIN");

  // 3. Move conversations participants
  const updatedParticipants = await prisma.conversationParticipant.updateMany({
    where: { userId: samiSrc.id },
    data: { userId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedParticipants.count} conversation participants`);

  // 4. Move messages sent by Sami
  const updatedMessages = await prisma.message.updateMany({
    where: { senderId: samiSrc.id },
    data: { senderId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedMessages.count} messages`);

  // 5. Move bids placed by Sami
  const updatedBids = await prisma.bid.updateMany({
    where: { bidderId: samiSrc.id },
    data: { bidderId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedBids.count} bids`);

  // 6. Move admin logs
  const updatedLogs = await prisma.adminLog.updateMany({
    where: { adminId: samiSrc.id },
    data: { adminId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedLogs.count} admin logs`);

  // 7. Move reports resolved by or made by Sami
  const updatedReportsMade = await prisma.report.updateMany({
    where: { reporterId: samiSrc.id },
    data: { reporterId: samiDest.id }
  });
  const updatedReportsResolved = await prisma.report.updateMany({
    where: { resolvedBy: samiSrc.id },
    data: { resolvedBy: samiDest.id }
  });
  console.log(`✓ Updated reports (${updatedReportsMade.count} made, ${updatedReportsResolved.count} resolved)`);

  // 8. Move notifications
  const updatedNotifs = await prisma.notification.updateMany({
    where: { userId: samiSrc.id },
    data: { userId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedNotifs.count} notifications`);

  // 9. Move activity feed items
  const updatedFeed = await prisma.activityFeedItem.updateMany({
    where: { userId: samiSrc.id },
    data: { userId: samiDest.id }
  });
  console.log(`✓ Updated ${updatedFeed.count} feed items`);

  // 10. Mentor Profile
  // Check if destination user already has a mentor profile, otherwise transfer
  const destMentor = await prisma.mentorProfile.findUnique({
    where: { userId: samiDest.id }
  });
  if (!destMentor) {
    await prisma.mentorProfile.updateMany({
      where: { userId: samiSrc.id },
      data: { userId: samiDest.id }
    });
    console.log("✓ Transferred mentor profile");
  } else {
    console.log("✓ Destination user already has a mentor profile");
  }

  // 11. Personal Profile - copy details if missing
  const destPersonalProfile = await prisma.personalProfile.findUnique({
    where: { userId: samiDest.id }
  });
  if (!destPersonalProfile) {
    await prisma.personalProfile.updateMany({
      where: { userId: samiSrc.id },
      data: { userId: samiDest.id }
    });
    console.log("✓ Transferred personal profile details");
  } else {
    // Ensure contact phone is matched
    await prisma.personalProfile.update({
      where: { userId: samiDest.id },
      data: {
        profession: 'Ingénieur Data Science & IA',
        interests: ['Technologie','IA','Data Science','Business']
      }
    });
    console.log("✓ Updated active personal profile interests");
  }

  // 12. Wallet balance transfer
  const srcWallet = await prisma.tksWallet.findUnique({ where: { userId: samiSrc.id } });
  const destWallet = await prisma.tksWallet.findUnique({ where: { userId: samiDest.id } });
  if (srcWallet && destWallet) {
    await prisma.tksWallet.update({
      where: { userId: samiDest.id },
      data: { balance: srcWallet.balance }
    });
    console.log(`✓ Transferred ${srcWallet.balance} Tks tokens to active wallet`);
  }

  console.log("\n🎉 Data successfully linked to samital2@gmail.com!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
