export type Locale = 'fr' | 'en' | 'ar';

export interface Translations {
  // ── Navigation ──
  nav: {
    dashboard: string;
    feed: string;
    profile: string;
    forums: string;
    groups: string;
    events: string;
    connections: string;
    mentorship: string;
    polls: string;
    announcements: string;
    testimonials: string;
    marketplace: string;
    auctions: string;
    comparisons: string;
    priceAlerts: string;
    search: string;
    companyCreation: string;
    badges: string;
    bookmarks: string;
    helpCenter: string;
    contact: string;
    tokens: string;
    membership: string;
    admin: string;
    settings: string;
    // Section labels
    community: string;
    commerce: string;
    tools: string;
    account: string;
  };

  // ── Header ──
  header: {
    signIn: string;
    searchTooltip: string;
    messagesTooltip: string;
    notificationsTooltip: string;
  };

  // ── Common ──
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    submit: string;
    send: string;
    back: string;
    next: string;
    previous: string;
    seeAll: string;
    see: string;
    manage: string;
    noData: string;
    page: string;
    active: string;
    expired: string;
    free: string;
    approved: string;
    pending: string;
    new_: string;
    read: string;
    replied: string;
    archived: string;
    MAD: string;
    Tks: string;
    votes: string;
    views: string;
    articles: string;
    yes: string;
    no: string;
    pinned: string;
    draft: string;
    timeJustNow: string;
    timeMinAgo: string;
    timeHoursAgo: string;
    timeDaysAgo: string;
    error: string;
    success: string;
  };

  // ── Dashboard ──
  dashboard: {
    greeting: string;
    overview: string;
    connectionsLabel: string;
    listingsLabel: string;
    tksBalance: string;
    profileViews: string;
    tokensAvailable: string;
    total: string;
    notifications: string;
    unreadNotif: string;
    messages: string;
    unreadMsg: string;
    membershipLabel: string;
    forumPosts: string;
    badgesLabel: string;
    mentorshipLabel: string;
    eventsLabel: string;
    groupsLabel: string;
    favoritesLabel: string;
    quickActions: string;
    completeProfile: string;
    completeProfileDesc: string;
    exploreMarketplace: string;
    exploreMarketplaceDesc: string;
    joinForums: string;
    joinForumsDesc: string;
    discoverEvents: string;
    discoverEventsDesc: string;
    myTokens: string;
    myTokensDesc: string;
    myBadges: string;
    myBadgesDesc: string;
    recentActivity: string;
    seeFeed: string;
  };

  // ── Tokens ──
  tokens: {
    title: string;
    description: string;
    balanceAvailable: string;
    totalEarned: string;
    totalSpent: string;
    dailyReward: string;
    dailyRewardDesc: string;
    claimReward: string;
    claimed: string;
    alreadyClaimed: string;
    earnTks: string;
    spendTks: string;
    transactionHistory: string;
    noTransactions: string;
    dailyLogin: string;
    completeProfile100: string;
    referMember: string;
    firstSale: string;
    badgeUnlocked: string;
    boostListing: string;
    boostProfile: string;
    premiumContent: string;
    auction: string;
    variable: string;
    // Transaction type labels
    txDailyReward: string;
    txReferral: string;
    txPurchase: string;
    txListingBoost: string;
    txProfileBoost: string;
    txAuctionBid: string;
    txPremiumContent: string;
    txSignupBonus: string;
    txProfileComplete: string;
    txFirstSale: string;
    txAdminCredit: string;
    txAdminDebit: string;
  };

  // ── Testimonials ──
  testimonials: {
    title: string;
    description: string;
    writeTestimonial: string;
    shareExperience: string;
    yourTestimonial: string;
    rating: string;
    position: string;
    company: string;
    submitNote: string;
    testimonialSent: string;
    featured: string;
    allTestimonials: string;
    myTestimonials: string;
    noTestimonials: string;
    beFirst: string;
    placeholderContent: string;
    placeholderRole: string;
    placeholderCompany: string;
  };

  // ── Contact ──
  contact: {
    title: string;
    description: string;
    contactTab: string;
    newsletterTab: string;
    sendMessage: string;
    messageSent: string;
    messageSentDesc: string;
    sendAnother: string;
    fullName: string;
    email: string;
    subject: string;
    message: string;
    firstName: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderSubject: string;
    placeholderMessage: string;
    placeholderFirstName: string;
    address: string;
    addressValue: string;
    emailValue: string;
    phone: string;
    phoneValue: string;
    hours: string;
    hoursValue: string;
    stayInformed: string;
    newsletterDesc: string;
    subscribeBtn: string;
    subscribed: string;
    subscribedDesc: string;
    errorSubscribe: string;
    whatYouGet: string;
    businessNews: string;
    businessNewsDesc: string;
    practicalTips: string;
    practicalTipsDesc: string;
    networkOpportunities: string;
    networkOpportunitiesDesc: string;
    exclusiveOffers: string;
    exclusiveOffersDesc: string;
    newsletterFrequency: string;
  };

  // ── Feed ──
  feed: {
    title: string;
    description: string;
    global: string;
    myNetwork: string;
    noActivity: string;
    noActivityPersonal: string;
    noActivityGlobal: string;
    activitiesByType: string;
    activities: string;
    // Activity types
    post: string;
    listing: string;
    auctionType: string;
    event: string;
    connection: string;
    group: string;
    mentorshipType: string;
    achievement: string;
  };

  // ── Admin ──
  admin: {
    title: string;
    tabOverview: string;
    tabUsers: string;
    tabTestimonials: string;
    tabNewsletter: string;
    tabContact: string;
    tabReports: string;
    users: string;
    thisWeek: string;
    activeListings: string;
    activeAuctions: string;
    revenue30d: string;
    messagesTotal: string;
    mentors: string;
    activeSessions: string;
    reports: string;
    pendingReports: string;
    newsletterSubs: string;
    contactMessages: string;
    newMessages: string;
    searchUser: string;
    tableHeaders: {
      name: string;
      email: string;
      role: string;
      plan: string;
      tks: string;
      status: string;
    };
    moderateTestimonials: string;
    noTestimonials: string;
    approve: string;
    reject: string;
    featureBtn: string;
    unfeatureBtn: string;
    activeSubs: string;
    unsubscribed: string;
    totalHistory: string;
    campaignManagement: string;
    campaignManagementDesc: string;
    newContact: string;
    readContact: string;
    repliedContact: string;
    archivedContact: string;
    noContactMessages: string;
    markRead: string;
    markReplied: string;
    archive: string;
    noReports: string;
  };

  // ── Membership ──
  membership: {
    title: string;
    description: string;
    currentPlan: string;
    expiresOn: string;
    paymentMethod: string;
    subscribe: string;
    redirecting: string;
    tksSystem: string;
    tksSystemDesc: string;
    earnTks: string;
    useTks: string;
    personalPremium: string;
    personalPremiumDesc: string;
    businessPremium: string;
    businessPremiumDesc: string;
    companyCreation: string;
    companyCreationDesc: string;
    mostPopular: string;
    vatIncluded: string;
    cmi: string;
    cmiDesc: string;
    stripe: string;
    stripeDesc: string;
    // Features
    verifiedProfile: string;
    unlimitedConnections: string;
    fullMarketplace: string;
    advancedMessaging: string;
    tks50: string;
    emailSupport: string;
    companyPage: string;
    analyticsStats: string;
    priorityMarketplace: string;
    jobPostings: string;
    tks150: string;
    moroccanBilling: string;
    prioritySupport: string;
    fullLegalCreation: string;
    domiciliation: string;
    rcIceIf: string;
    businessPremium1yr: string;
    tks500: string;
    dedicatedSupport12m: string;
  };

  // ── Settings ──
  settings: {
    title: string;
    accountTab: string;
    notificationsTab: string;
    messagesGroup: string;
    auctionsGroup: string;
    mentorshipGroup: string;
    byEmail: string;
    push: string;
    inApp: string;
  };

  // ── Badges ──
  badges: {
    title: string;
    description: string;
    leaderboard: string;
    badgeDetail: string;
    badgesCount: string;
    xp: string;
    earnedBadges: string;
    noBadges: string;
    noLeaderboard: string;
    obtained: string;
    notObtained: string;
    membersWithBadge: string;
    checkBadges: string;
    checking: string;
    user: string;
    secret: string;
  };

  // ── Polls ──
  polls: {
    title: string;
    description: string;
    newPoll: string;
    newPollTitle: string;
    results: string;
    noPolls: string;
    question: string;
    pollDescription: string;
    options: string;
    endDate: string;
    multipleChoice: string;
    anonymous: string;
    addOption: string;
    createPoll: string;
    creating: string;
    closePoll: string;
    activeFilter: string;
    endedFilter: string;
    ended: string;
    placeholderQuestion: string;
    placeholderDesc: string;
    placeholderOption: string;
  };

  // ── Bookmarks ──
  bookmarks: {
    title: string;
    description: string;
    noBookmarks: string;
    noBookmarksDesc: string;
    all: string;
    listings: string;
    forum: string;
    events: string;
    groups: string;
    polls: string;
    addNote: string;
    noteTooltip: string;
    deleteTooltip: string;
  };

  // ── Announcements ──
  announcements: {
    title: string;
    description: string;
    noAnnouncements: string;
    unread: string;
    pinned: string;
    expiresOn: string;
    learnMore: string;
    // Types
    information: string;
    update: string;
    maintenance: string;
    promotion: string;
    urgent: string;
  };

  // ── FAQ ──
  faq: {
    title: string;
    description: string;
    faqTitle: string;
    popularArticles: string;
    categories: string;
    helpful: string;
    noArticles: string;
    noResults: string;
    typeToSearch: string;
    noCategories: string;
    viewFullArticle: string;
    searchPlaceholder: string;
    category: string;
  };

  // ── Events ──
  events: {
    title: string;
    description: string;
    createEvent: string;
    filters: string;
    filterByCity: string;
    allTypes: string;
    inPerson: string;
    online: string;
    hybrid: string;
    noEvents: string;
    noEventsDesc: string;
    rsvpBtn: string;
    cancelRsvp: string;
    waitlisted: string;
    registered: string;
    cancelled: string;
    participants: string;
    createEventTitle: string;
    eventTitle: string;
    eventDesc: string;
    eventType: string;
    city: string;
    address: string;
    startDate: string;
    endDate: string;
    maxAttendees: string;
    unlimited: string;
    price: string;
    createBtn: string;
  };

  // ── Forums ──
  forums: {
    title: string;
    description: string;
  };

  // ── Groups ──
  groups: {
    title: string;
    description: string;
    createGroup: string;
    searchPlaceholder: string;
    noGroups: string;
    noGroupsDesc: string;
    members: string;
    posts: string;
    allGroups: string;
    owner: string;
    leave: string;
    join: string;
    privateLabel: string;
    publications: string;
    writeSomething: string;
    noPublications: string;
    back: string;
    groupName: string;
    descriptionLabel: string;
    category: string;
    categoryPlaceholder: string;
    privateGroup: string;
    createBtn: string;
    joinMeeting: string;
    startMeeting: string;
    groupNotFound: string;
    membersTitle: string;
  };

  // ── Connections ──
  connections: {
    title: string;
    description: string;
  };

  // ── Mentorship ──
  mentorshipPage: {
    title: string;
    description: string;
  };

  // ── Marketplace ──
  marketplacePage: {
    title: string;
    description: string;
  };

  // ── Auctions Page ──
  auctionsPage: {
    title: string;
    description: string;
  };

  // ── Search ──
  searchPage: {
    title: string;
    description: string;
  };

  // ── Company Creation ──
  companyCreationPage: {
    title: string;
    description: string;
  };

  // ── Comparisons ──
  comparisonsPage: {
    title: string;
    description: string;
  };

  // ── Alerts ──
  alertsPage: {
    title: string;
    description: string;
  };

  // ── Home / Landing ──
  home: {
    navAbout: string;
    navMembership: string;
    subtitle: string;
    signIn: string;
    applyToJoin: string;
    heroTitle: string;
    heroDesc: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
    joinCommunity: string;
    goToDashboard: string;
    verifiedNetworkTitle: string;
    verifiedNetworkDesc: string;
    verified: string;
    aiMatchingTitle: string;
    aiMatchingDesc: string;
    membershipTitle: string;
    membershipSubtitle: string;
    planPersonal: string;
    planPersonalDesc: string;
    planPersonalPrice: string;
    planBusiness: string;
    planBusinessDesc: string;
    planBusinessPrice: string;
    planCreation: string;
    planCreationDesc: string;
    planCreationPrice: string;
    popular: string;
    perYear: string;
    startNow: string;
    choose: string;
    personalFeatures: string[];
    businessFeatures: string[];
    creationFeatures: string[];
    copyright: string;
    dataPrivacy: string;
    contact: string;
  };
}
