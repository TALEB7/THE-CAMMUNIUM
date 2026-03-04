// ==================== ACCOUNT TYPES ====================

export type AccountType = 'personal' | 'business' | 'company_creation';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  accountType: AccountType;
  isVerified: boolean;
  isActive: boolean;
  profileViews: number;
  createdAt: string;
}

// ==================== PERSONAL PROFILE ====================

export interface PersonalProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  birthday: string | null;
  identityType: 'cin' | 'passport' | null;
  identityNumber: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  profession: string | null;
  photoUrl: string | null;
  workHistory: WorkHistoryEntry[];
  interests: string[];
}

export interface WorkHistoryEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
}

// ==================== BUSINESS PROFILE ====================

export interface BusinessProfile {
  id: string;
  userId: string;
  companyName: string | null;
  rc: string | null;
  creationDate: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  activities: string | null;
  ice: string | null;
  ifNumber: string | null;
  logoUrl: string | null;
  interests: string[];
}

// ==================== MEMBERSHIP ====================

export type MembershipPlan = 'personal_premium' | 'business_premium' | 'company_creation';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELED';

export interface Membership {
  id: string;
  userId: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  expiresAt: string | null;
  createdAt: string;
}

// ==================== PAYMENTS ====================

export type PaymentProvider = 'STRIPE' | 'CMI';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerRef: string | null;
  status: PaymentStatus;
  planId: string | null;
  vatAmount: number | null;
  createdAt: string;
}

// ==================== TKS TOKENS ====================

export type TksTransactionType = 'EARNED' | 'SPENT';

export interface TksWallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface TksTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TksTransactionType;
  reason: string;
  createdAt: string;
}

// ==================== MARKETPLACE ====================

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REPORTED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
  _count?: { listings: number };
}

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[];
  tags: string[];
  city: string | null;
  location: string | null;
  viewCount: number;
  isBoosted: boolean;
  boostedUntil: string | null;
  expiresAt: string | null;
  createdAt: string;
  seller?: Partial<User>;
  category?: Category;
  auction?: Partial<Auction>;
  _count?: { favorites: number; reviews: number };
}

export interface ListingReview {
  id: string;
  listingId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: Partial<User>;
}

// ==================== AUCTIONS ====================

export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELED';

export interface Auction {
  id: string;
  listingId: string;
  startingPrice: number;
  reservePrice: number | null;
  currentPrice: number | null;
  minIncrement: number;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  winnerId: string | null;
  totalBids: number;
  createdAt: string;
  listing?: Partial<Listing>;
  winner?: Partial<User>;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  isWinning: boolean;
  createdAt: string;
  bidder?: Partial<User>;
  auction?: Partial<Auction>;
}

// ==================== COMPANY CREATION ====================

export type LegalFormValue = 'SARL' | 'SA' | 'SAS' | 'SNC' | 'AUTO_ENTREPRENEUR';
export type TaxRegimeValue = 'IR' | 'IS';

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
