// =============================================
// The Communium - Shared Validators
// =============================================

/**
 * Validate Moroccan CIN (Carte d'Identité Nationale)
 * Format: 1-2 letters followed by 5-6 digits
 */
export function isValidCIN(cin: string): boolean {
  return /^[A-Z]{1,2}\d{5,6}$/i.test(cin);
}

/**
 * Validate Moroccan phone number
 * Format: +212 6XX XXX XXX or 06XX XXX XXX
 */
export function isValidMoroccanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s|-/g, '');
  return /^(\+212|0)(6|7)\d{8}$/.test(cleaned);
}

/**
 * Validate ICE (Identifiant Commun de l'Entreprise)
 * Format: 15 digits
 */
export function isValidICE(ice: string): boolean {
  return /^\d{15}$/.test(ice);
}

/**
 * Validate IF (Identifiant Fiscal)
 * Format: 8 digits
 */
export function isValidIF(ifNumber: string): boolean {
  return /^\d{8}$/.test(ifNumber);
}

/**
 * Validate RC (Registre de Commerce)
 * Format: digits followed by city code
 */
export function isValidRC(rc: string): boolean {
  return /^\d+-[A-Z]{2,4}$/i.test(rc);
}

/**
 * Validate Moroccan postal code
 */
export function isValidPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

/**
 * Calculate price with Moroccan VAT (20%)
 */
export function calculatePriceTTC(priceHT: number, vatRate = 0.2): {
  priceHT: number;
  vatAmount: number;
  priceTTC: number;
} {
  const vatAmount = Math.round(priceHT * vatRate);
  return {
    priceHT,
    vatAmount,
    priceTTC: priceHT + vatAmount,
  };
}
