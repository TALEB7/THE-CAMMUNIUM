// =============================================
// The Communium - Shared Constants
// =============================================

// ==================== PLAN PRICING (MAD - Dirhams) ====================

export const PLAN_PRICING = {
  personal_premium: {
    id: 'personal_premium',
    name: 'Personnel Premium',
    priceHT: 200,
    vatRate: 0.2,
    priceTTC: 240,
    interval: 'year' as const,
    tksBonus: 50,
    accountType: 'personal' as const,
  },
  business_premium: {
    id: 'business_premium',
    name: 'Business Premium',
    priceHT: 500,
    vatRate: 0.2,
    priceTTC: 600,
    interval: 'year' as const,
    tksBonus: 150,
    accountType: 'business' as const,
  },
  company_creation: {
    id: 'company_creation',
    name: 'Création Entreprise',
    priceHT: 3000,
    vatRate: 0.2,
    priceTTC: 3600,
    interval: 'one_time' as const,
    tksBonus: 500,
    accountType: 'business' as const,
  },
} as const;

// ==================== TKS TOKEN REWARDS ====================

export const TKS_REWARDS = {
  SIGNUP_PERSONAL: 50,
  SIGNUP_BUSINESS: 150,
  SIGNUP_COMPANY_CREATION: 500,
  DAILY_LOGIN: 2,
  PROFILE_COMPLETE: 20,
  REFERRAL: 25,
  FIRST_MARKETPLACE_SALE: 15,
} as const;

export const TKS_COSTS = {
  BOOST_LISTING: 10,
  UNLOCK_PREMIUM_CONTENT: 5,
  HIGHLIGHT_PROFILE: 15,
} as const;

// ==================== INTEREST CATEGORIES ====================

export const INTEREST_CATEGORIES = [
  'Club',
  'Particulier',
  'Business',
  'Technologie',
  'Finance',
  'Marketing',
  'Commerce',
  'Immobilier',
  'Automobile',
  'Agriculture',
  'Tourisme',
  'Santé',
  'Éducation',
  'Artisanat',
  'Import/Export',
] as const;

// ==================== MARKETPLACE CATEGORIES ====================

export const MARKETPLACE_CATEGORIES = [
  'Shop Market',
  'Foods',
  'Automobile',
  'High Tech',
] as const;

// ==================== LISTING CONDITIONS ====================

/** Condition labels keyed by ListingCondition value */
export const LISTING_CONDITIONS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
};

/** Condition options with value/label pairs — for <select> dropdowns */
export const LISTING_CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
] as const;

// ==================== LISTING STATUSES ====================

export const LISTING_STATUSES: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'gray' },
  ACTIVE: { label: 'Active', color: 'green' },
  SOLD: { label: 'Vendu', color: 'blue' },
  EXPIRED: { label: 'Expirée', color: 'orange' },
  REPORTED: { label: 'Signalée', color: 'red' },
};

/** Status labels with Tailwind CSS color classes — for UI badges */
export const LISTING_STATUS_BADGES: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  SOLD: { label: 'Vendu', color: 'bg-blue-100 text-blue-700' },
  EXPIRED: { label: 'Expirée', color: 'bg-orange-100 text-orange-700' },
  REPORTED: { label: 'Signalée', color: 'bg-red-100 text-red-700' },
};

// ==================== AUCTION STATUSES ====================

export const AUCTION_STATUSES: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Programmée', color: 'blue' },
  ACTIVE: { label: 'En cours', color: 'green' },
  ENDED: { label: 'Terminée', color: 'gray' },
  CANCELED: { label: 'Annulée', color: 'red' },
};

// ==================== SORT OPTIONS ====================

export const MARKETPLACE_SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
] as const;

// ==================== COMPANY CREATION ====================

export const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL', desc: 'Société à responsabilité limitée' },
  { value: 'SA', label: 'SA', desc: 'Société anonyme' },
  { value: 'SAS', label: 'SAS', desc: 'Société par actions simplifiée' },
  { value: 'SNC', label: 'SNC', desc: 'Société en nom collectif' },
  { value: 'AUTO_ENTREPRENEUR', label: 'Auto-entrepreneur', desc: 'Statut individuel simplifié' },
] as const;

export const TAX_REGIMES = [
  { value: 'IR', label: 'IR', desc: 'Impôt sur le revenu' },
  { value: 'IS', label: 'IS', desc: 'Impôt sur les sociétés' },
] as const;

// ==================== MARKETPLACE CONFIG ====================

export const MARKETPLACE_CONFIG = {
  LISTING_EXPIRY_DAYS: 30,
  BOOST_DURATION_DAYS: 7,
  BOOST_COST_TKS: 10,
  MAX_IMAGES: 8,
  MAX_TAGS: 10,
  MIN_AUCTION_HOURS: 1,
  LISTINGS_PER_PAGE: 20,
} as const;

// ==================== LOCATION FILTERS ====================

export const CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Oujda',
  'Meknès',
  'Kénitra',
  'Tétouan',
  'Salé',
  'Nador',
  'Laâyoune',
  'El Jadida',
  'Béni Mellal',
  // International
  'New York',
  'Paris',
  'Genève',
  'Bruxelles',
  'Madrid',
] as const;

// ==================== SUPPORTED LANGUAGES ====================

export const SUPPORTED_LOCALES = ['fr', 'ar', 'en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  ar: 'العربية',
  en: 'English',
  es: 'Español',
};

export const RTL_LOCALES: Locale[] = ['ar'];

// ==================== MOROCCAN COMPLIANCE ====================

export const VAT_RATE = 0.2; // 20% TVA

export const MOROCCAN_INVOICE_FIELDS = [
  'ICE',  // Identifiant Commun de l'Entreprise
  'IF',   // Identifiant Fiscal
  'RC',   // Registre de Commerce
  'CNSS', // Caisse Nationale de Sécurité Sociale
] as const;
