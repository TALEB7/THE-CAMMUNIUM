import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding The Communium demo data...');

  // ── 1. USERS ────────────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sami.taleb@communium.ma' },
      update: { role: 'ADMIN' },
      create: {
        email: 'sami.taleb@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Sami', lastName: 'Taleb', accountType: 'personal',
        role: 'ADMIN', isVerified: true, profileViews: 147,
      },
    }),
    prisma.user.upsert({
      where: { email: 'fatima.elamrani@communium.ma' },
      update: {},
      create: {
        email: 'fatima.elamrani@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Fatima', lastName: 'El Amrani', accountType: 'business',
        isVerified: true, profileViews: 312,
      },
    }),
    prisma.user.upsert({
      where: { email: 'youssef.benmoussa@communium.ma' },
      update: {},
      create: {
        email: 'youssef.benmoussa@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Youssef', lastName: 'Ben Moussa', accountType: 'personal',
        isVerified: true, profileViews: 89,
      },
    }),
    prisma.user.upsert({
      where: { email: 'amina.cherkaoui@communium.ma' },
      update: {},
      create: {
        email: 'amina.cherkaoui@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Amina', lastName: 'Cherkaoui', accountType: 'personal',
        isVerified: false, profileViews: 54,
      },
    }),
    prisma.user.upsert({
      where: { email: 'karim.idrissi@communium.ma' },
      update: {},
      create: {
        email: 'karim.idrissi@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Karim', lastName: 'Idrissi', accountType: 'business',
        isVerified: true, profileViews: 201,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sara.benali@communium.ma' },
      update: {},
      create: {
        email: 'sara.benali@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Sara', lastName: 'Ben Ali', accountType: 'personal',
        isVerified: true, profileViews: 76,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mehdi.ziani@communium.ma' },
      update: {},
      create: {
        email: 'mehdi.ziani@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Mehdi', lastName: 'Ziani', accountType: 'personal',
        isVerified: false, profileViews: 32,
      },
    }),
    prisma.user.upsert({
      where: { email: 'nadia.tazi@communium.ma' },
      update: {},
      create: {
        email: 'nadia.tazi@communium.ma', passwordHash: '$2b$10$C0cleD4GB62mqLtPIsFAfuzrluUM4vd.VgCh/acNnIH6xpdDoPO/.',
        firstName: 'Nadia', lastName: 'Tazi', accountType: 'business',
        isVerified: true, profileViews: 445,
      },
    }),
  ]);

  const [sami, fatima, youssef, amina, karim, sara, mehdi, nadia] = users;
  console.log(`✓ ${users.length} users created`);

  // ── 2. PROFILES ─────────────────────────────────────────────────────────
  const personalProfiles = [
    { user: sami, profession: 'Ingénieur Data Science & IA', city: 'Tanger', interests: ['Technologie', 'IA', 'Data Science', 'Business'] },
    { user: youssef, profession: 'Développeur Full Stack', city: 'Casablanca', interests: ['Technologie', 'Startup', 'Web'] },
    { user: amina, profession: 'Designer UX/UI', city: 'Rabat', interests: ['Design', 'Art', 'Technologie'] },
    { user: sara, profession: 'Comptable & Fiscaliste', city: 'Fès', interests: ['Finance', 'Business', 'Droit'] },
    { user: mehdi, profession: 'Étudiant en Marketing', city: 'Marrakech', interests: ['Marketing', 'Communication', 'Business'] },
  ];

  for (const { user, profession, city, interests } of personalProfiles) {
    await prisma.personalProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, firstName: user.firstName, lastName: user.lastName,
        phone: '+212 6' + Math.floor(10000000 + Math.random() * 89999999),
        email: user.email, country: 'Maroc', city, profession, interests,
        workHistory: [{ title: profession, company: 'Communium Demo', startDate: '2022-01', endDate: '' }],
      },
    });
  }

  const businessProfiles = [
    { user: fatima, companyName: 'TechMa Solutions SARL', city: 'Tanger', activities: 'Développement logiciel, Consulting IT' },
    { user: karim, companyName: 'Karim Import Export', city: 'Casablanca', activities: 'Import/Export, Logistique' },
    { user: nadia, companyName: 'Nadia Conseil & Co.', city: 'Rabat', activities: 'Conseil, Formation professionnelle' },
  ];

  for (const { user, companyName, city, activities } of businessProfiles) {
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, companyName, city, country: 'Maroc',
        phone: '+212 5' + Math.floor(20000000 + Math.random() * 79999999),
        email: user.email, activities,
      },
    });
  }
  console.log('✓ Profiles created');

  // ── 3. TKS WALLETS ──────────────────────────────────────────────────────
  const walletData = [
    { user: sami, balance: 245 }, { user: fatima, balance: 890 },
    { user: youssef, balance: 120 }, { user: amina, balance: 50 },
    { user: karim, balance: 650 }, { user: sara, balance: 75 },
    { user: mehdi, balance: 30 }, { user: nadia, balance: 1200 },
  ];
  for (const { user, balance } of walletData) {
    await prisma.tksWallet.upsert({
      where: { userId: user.id },
      update: { balance },
      create: { userId: user.id, balance, totalEarned: balance + 50 },
    });
  }
  console.log('✓ Wallets created');

  // ── 4. CONNECTIONS ───────────────────────────────────────────────────────
  const pairs = [
    [sami, fatima], [sami, youssef], [sami, karim], [sami, nadia],
    [fatima, youssef], [fatima, karim], [youssef, amina],
    [karim, nadia], [sara, amina], [sara, mehdi],
  ];
  for (const [from, to] of pairs) {
    await prisma.connection.upsert({
      where: { fromId_toId: { fromId: from.id, toId: to.id } },
      update: {},
      create: { fromId: from.id, toId: to.id, status: 'ACCEPTED' },
    });
  }
  console.log('✓ Connections created');

  // ── 5. CATEGORIES ────────────────────────────────────────────────────────
  const catData = [
    { name: 'Informatique & Tech', slug: 'informatique-tech', icon: '💻' },
    { name: 'Import / Export', slug: 'import-export', icon: '📦' },
    { name: 'Immobilier', slug: 'immobilier', icon: '🏠' },
    { name: 'Véhicules', slug: 'vehicules', icon: '🚗' },
    { name: 'Formation & Cours', slug: 'formation-cours', icon: '📚' },
    { name: 'Services', slug: 'services', icon: '🛠️' },
  ];
  const cats: any[] = [];
  for (const c of catData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug }, update: {}, create: c,
    });
    cats.push(cat);
  }
  const [catTech, catImport, , , catForm, catServ] = cats;
  console.log('✓ Categories created');

  // ── 6. LISTINGS ──────────────────────────────────────────────────────────
  const listingData = [
    {
      seller: sami, category: catTech, title: 'MacBook Pro M3 14" — Excellent état',
      slug: 'macbook-pro-m3-14-excellent-etat', description: 'MacBook Pro M3, 16GB RAM, 512GB SSD. Acheté en janvier 2024, jamais réparé. Vendu avec chargeur original et housse de protection. Idéal pour développeurs et créatifs.',
      price: 18500, condition: 'LIKE_NEW', city: 'Tanger', images: [],
    },
    {
      seller: fatima, category: catTech, title: 'Formation React.js & Next.js — 20h en ligne',
      slug: 'formation-reactjs-nextjs-20h-en-ligne', description: 'Formation complète React.js et Next.js 14 avec projets pratiques. Certificat inclus. Idéal débutants et intermédiaires. Accès à vie aux enregistrements.',
      price: 850, condition: 'NEW', city: 'Tanger', images: [],
    },

  ];

  const listings: any[] = [];
  for (const l of listingData) {
    const listing = await prisma.listing.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        sellerId: l.seller.id, categoryId: l.category.id,
        title: l.title, slug: l.slug, description: l.description,
        price: l.price, condition: l.condition, city: l.city,
        images: l.images, tags: [], status: 'ACTIVE',
        viewCount: Math.floor(Math.random() * 200) + 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    listings.push(listing);
  }
  console.log('✓ Listings created');

  // ── 7. FORUMS & POSTS ────────────────────────────────────────────────────
  const forums = await Promise.all([
    prisma.forum.upsert({ where: { slug: 'general' }, update: {}, create: { name: 'Général', slug: 'general', description: 'Discussions générales de la communauté' } }),
    prisma.forum.upsert({ where: { slug: 'technologie' }, update: {}, create: { name: 'Technologie', slug: 'technologie', description: 'Tech, IA, développement' } }),
    prisma.forum.upsert({ where: { slug: 'business' }, update: {}, create: { name: 'Business & Entrepreneuriat', slug: 'business', description: 'Conseils business, startups, commerce' } }),
    prisma.forum.upsert({ where: { slug: 'emploi' }, update: {}, create: { name: 'Emploi & Carrière', slug: 'emploi', description: 'Offres, conseils, CV' } }),
  ]);
  const [fGeneral, fTech, fBusiness] = forums;

  const postData = [
    {
      forum: fTech, author: sami,
      title: "L'IA générative va-t-elle transformer le marché du travail au Maroc ?",
      content: "Suite à mes recherches sur l'impact de l'IA au Maroc, j'ai constaté que 40% des emplois administratifs pourraient être automatisés d'ici 2030. Qu'en pensez-vous ? Comment se préparer ? Partagez vos expériences !",
      tags: ['IA', 'emploi', 'Maroc', 'technologie'],
    },
    {
      forum: fBusiness, author: fatima,
      title: "Comment j'ai lancé ma startup tech à Tanger avec 50 000 DH",
      content: "Beaucoup me demandent comment j'ai démarré TechMa Solutions avec un budget limité. Voici mon parcours : 1) Valider l'idée avant d'investir 2) Bootstrap les 6 premiers mois 3) Trouver les bons partenaires. Je partage tout dans ce post !",
      tags: ['startup', 'entrepreneuriat', 'Tanger', 'financement'],
    },
    {
      forum: fGeneral, author: youssef,
      title: "Bienvenue sur The Communium — Présentez-vous !",
      content: "Bonjour à tous ! Je m'appelle Youssef, développeur Full Stack basé à Casablanca. Ravi de rejoindre cette communauté. N'hésitez pas à vous présenter en commentaire, parlons réseau !",
      tags: ['présentation', 'réseau', 'communauté'],
    },
    {
      forum: fTech, author: karim,
      title: "Meilleurs outils pour gérer son e-commerce au Maroc en 2026",
      content: "Après 3 ans d'import-export, voici mes outils incontournables : Shopify pour la boutique, Trello pour la gestion, et bien sûr The Communium pour le réseau B2B. Quels sont vos outils préférés ?",
      tags: ['e-commerce', 'outils', 'business', 'Maroc'],
    },
    {
      forum: fBusiness, author: nadia,
      title: "5 erreurs RH que commettent les PME marocaines",
      content: "Après 10 ans de consulting RH, j'ai identifié les 5 erreurs les plus coûteuses : 1) Pas de fiche de poste claire 2) Processus de recrutement trop long 3) Pas d'onboarding structuré 4) Évaluations inexistantes 5) Rémunération non compétitive. Solutions dans le fil !",
      tags: ['RH', 'PME', 'recrutement', 'management'],
    },
  ];

  const posts: any[] = [];
  for (const p of postData) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-' + Date.now();
    try {
      const post = await prisma.forumPost.create({
        data: {
          forumId: p.forum.id, authorId: p.author.id,
          title: p.title, slug, content: p.content,
          tags: p.tags, viewCount: Math.floor(Math.random() * 300) + 20,
        },
      });
      posts.push(post);
    } catch { /* skip if exists */ }
  }
  console.log('✓ Forum posts created');

  // ── 8. EVENTS ────────────────────────────────────────────────────────────
  const eventData = [
    {
      creator: nadia, title: 'Business Networking — Tanger Edition',
      description: 'Rencontre mensuelle des entrepreneurs et professionnels de Tanger. Pitchs, networking et échanges B2B.',
      city: 'Tanger', startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      maxAttendees: 50,
    },
    {
      creator: sami, title: 'Workshop IA & Data Science — Débutants',
      description: 'Introduction pratique à l\'IA et Data Science. Machine learning, Python, et cas d\'usage au Maroc.',
      city: 'Tanger', startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      maxAttendees: 30,
    },
    {
      creator: karim, title: 'Forum Import-Export Maroc 2026',
      description: 'Forum annuel des importateurs et exportateurs marocains. Opportunités, réglementation, partenariats.',
      city: 'Casablanca', startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      maxAttendees: 200,
    },
  ];

  const events: any[] = [];
  for (const e of eventData) {
    try {
      const event = await prisma.event.create({
        data: {
          organizerId: e.creator.id, title: e.title,
          slug: e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-' + Date.now(),
          description: e.description, city: e.city,
          startDate: e.startDate, endDate: e.endDate,
          maxAttendees: e.maxAttendees, status: 'UPCOMING',
        },
      });
      events.push(event);
    } catch { /* skip */ }
  }

  // RSVPs
  if (events[0]) {
    for (const user of [sami, youssef, amina, sara]) {
      try {
        await prisma.eventRsvp.create({ data: { eventId: events[0].id, userId: user.id, status: 'GOING' } });
      } catch { /* skip */ }
    }
  }
  console.log('✓ Events created');

  // ── 9. GROUPS ────────────────────────────────────────────────────────────
  const groupData = [
    { creator: sami, name: 'IA & Data Science Maroc', slug: 'ia-data-science-maroc', description: 'Communauté des passionnés d\'IA et Data Science au Maroc' },
    { creator: karim, name: 'Import Export Network', slug: 'import-export-network', description: 'Réseau des professionnels de l\'import/export' },
    { creator: nadia, name: 'Femmes Entrepreneures Maroc', slug: 'femmes-entrepreneures-maroc', description: 'Réseau de soutien aux femmes entrepreneuses marocaines' },
  ];

  const groups: any[] = [];
  for (const g of groupData) {
    try {
      const group = await prisma.group.create({
        data: { ownerId: g.creator.id, name: g.name, slug: g.slug, description: g.description, isPublic: true },
      });
      groups.push(group);
      await prisma.groupMember.createMany({
        data: [
          { groupId: group.id, userId: g.creator.id, role: 'ADMIN' },
        ],
        skipDuplicates: true,
      });
    } catch { /* skip */ }
  }

  if (groups[0]) {
    for (const user of [youssef, amina, mehdi]) {
      try { await prisma.groupMember.create({ data: { groupId: groups[0].id, userId: user.id, role: 'MEMBER' } }); } catch { /* skip */ }
    }
  }
  if (groups[1]) {
    for (const user of [fatima, sara]) {
      try { await prisma.groupMember.create({ data: { groupId: groups[1].id, userId: user.id, role: 'MEMBER' } }); } catch { /* skip */ }
    }
  }
  console.log('✓ Groups created');

  // ── 10. BADGES ───────────────────────────────────────────────────────────
  const badgeData = [
    { name: 'Pionnier', slug: 'pionnier', description: 'Un des premiers membres', icon: '🚀', color: '#C8102E', category: 'community' },
    { name: 'Vendeur Expert', slug: 'vendeur-expert', description: '5+ annonces publiées', icon: '🛍️', color: '#f59e0b', category: 'marketplace' },
    { name: 'Networker', slug: 'networker', description: '10+ connexions', icon: '🤝', color: '#3b82f6', category: 'network' },
    { name: 'Mentor', slug: 'mentor', description: 'Mentor certifié', icon: '🎓', color: '#8b5cf6', category: 'mentorship' },
    { name: 'Contributeur', slug: 'contributeur', description: '5+ posts forum', icon: '💬', color: '#10b981', category: 'forum' },
  ];

  const badges: any[] = [];
  for (const b of badgeData) {
    const badge = await prisma.badge.upsert({
      where: { slug: b.slug }, update: {}, create: { ...b, xpReward: 50 },
    });
    badges.push(badge);
  }

  // Award badges
  for (const badge of badges.slice(0, 2)) {
    for (const user of [sami, fatima, nadia]) {
      try { await prisma.userBadge.create({ data: { userId: user.id, badgeId: badge.id } }); } catch { /* skip */ }
    }
  }
  console.log('✓ Badges created');

  // ── 11. ACTIVITY FEED ───────────────────────────────────────────────────
  const feedItems = [
    { user: sami, type: 'POST', description: 'Sami Taleb a publié : "L\'IA générative va-t-elle transformer le marché du travail au Maroc ?"' },
    { user: fatima, type: 'LISTING', description: 'Fatima El Amrani a publié une annonce : Formation React.js & Next.js — 20h en ligne' },
    { user: youssef, type: 'CONNECTION', description: 'Youssef Ben Moussa et Sami Taleb sont maintenant connectés' },
    { user: karim, type: 'POST', description: 'Karim Idrissi a publié : "Meilleurs outils pour gérer son e-commerce au Maroc"' },
    { user: amina, type: 'GROUP_JOIN', description: 'Amina Cherkaoui a rejoint le groupe IA & Data Science Maroc' },
    { user: sami, type: 'ACHIEVEMENT', description: 'Sami Taleb a obtenu le badge Pionnier 🚀' },
    { user: fatima, type: 'POST', description: 'Fatima El Amrani a partagé : "Comment j\'ai lancé ma startup tech à Tanger avec 50 000 DH"' },
    { user: youssef, type: 'POST', description: 'Youssef Ben Moussa a posté : "Bienvenue sur The Communium — Présentez-vous !"' },
    { user: sami, type: 'EVENT', description: 'Sami Taleb participe à l\'événement : Business Networking — Tanger Edition' },
    { user: amina, type: 'POST', description: 'Amina Cherkaoui a commenté sur "L\'IA générative va-t-elle transformer le marché du travail ?"' },
  ];

  for (let i = 0; i < feedItems.length; i++) {
    const item = feedItems[i];
    const createdAt = new Date(Date.now() - (feedItems.length - i) * 2 * 60 * 60 * 1000);
    try {
      await prisma.activityFeedItem.create({
        data: {
          userId: item.user.id,
          type: item.type,
          title: item.description.slice(0, 100),
          body: item.description,
          isPublic: true, createdAt,
        },
      });
    } catch { /* skip */ }
  }
  console.log('✓ Activity feed created');

  // ── 12. NOTIFICATIONS ───────────────────────────────────────────────────
  const notifData = [
    { user: sami, title: 'Nouvelle connexion', message: 'Fatima El Amrani a accepté votre invitation', type: 'CONNECTION' },
    { user: sami, title: 'Nouveau badge !', message: 'Vous avez obtenu le badge Pionnier 🚀', type: 'BADGE' },
    { user: fatima, title: 'Nouveau message', message: 'Karim Idrissi vous a envoyé un message', type: 'MESSAGE' },
    { user: karim, title: 'Votre annonce', message: 'Quelqu\'un a consulté votre annonce import t-shirts', type: 'LISTING' },
  ];

  for (const n of notifData) {
    try {
      await prisma.notification.create({
        data: { userId: n.user.id, title: n.title, body: n.message, type: n.type },
      });
    } catch { /* skip */ }
  }
  console.log('✓ Notifications created');

  // ── 13. MENTORSHIP ───────────────────────────────────────────────────────
  try {
    await prisma.mentorProfile.upsert({
      where: { userId: nadia.id },
      update: {},
      create: {
        userId: nadia.id,
        headline: 'Experte RH & Développement Organisationnel | 10 ans d\'expérience',
        bio: 'Consultante RH avec 10 ans d\'expérience dans les PME marocaines. Spécialisée dans le recrutement, la formation et la transformation organisationnelle.',
        expertise: ['Ressources Humaines', 'Recrutement', 'Management', 'Formation'],
        industries: ['Services', 'PME', 'Finance', 'Conseil'],
        hourlyRate: 350, yearsExp: 10,
        isAvailable: true, rating: 4.8, totalSessions: 24,
      },
    });

    await prisma.mentorProfile.upsert({
      where: { userId: sami.id },
      update: {},
      create: {
        userId: sami.id,
        headline: 'Data Scientist & IA | Mentor pour étudiants et professionnels',
        bio: 'Ingénieur en Data Science et IA, passionné par la transmission du savoir. J\'accompagne les étudiants et professionnels dans leur transition vers les métiers de la data.',
        expertise: ['Data Science', 'Machine Learning', 'Python', 'IA'],
        industries: ['Technologie', 'Finance', 'Santé'],
        hourlyRate: 250, yearsExp: 5,
        isAvailable: true, rating: 4.6, totalSessions: 12,
      },
    });
    console.log('✓ Mentor profiles created');
  } catch (e) { console.log('⚠ Mentor profiles skipped:', (e as Error).message); }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Test accounts (password: Demo1234!):');
  console.log('   sami.taleb@communium.ma       (Personal)');
  console.log('   fatima.elamrani@communium.ma  (Business)');
  console.log('   youssef.benmoussa@communium.ma(Personal)');
  console.log('   nadia.tazi@communium.ma       (Business, Mentor)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
