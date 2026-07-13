/**
 * Phone number helpers.
 *
 * Doctor.whatsappNumber is a free-form string entered by the doctor. It may be
 * stored as "7021227203", "917021227203", "+91 70212 27203", etc. These helpers
 * normalize to a bare digits-only form suitable for wa.me / tel: links without
 * double-prefixing the country code.
 */

const DEFAULT_COUNTRY_CODE = '91'; // India

/**
 * Normalize a phone number for use in a wa.me link (digits only, with country code).
 * - Strips all non-digit characters (spaces, dashes, +, etc.)
 * - If the result is a bare 10-digit number, prefixes the default country code.
 * - If it already includes a country code, leaves it as-is.
 * Returns '' for empty/invalid input so callers can skip rendering.
 *
 * @param {string} raw
 * @param {string} [countryCode]
 * @returns {string}
 */
export function normalizeWhatsAppNumber(raw, countryCode = DEFAULT_COUNTRY_CODE) {
  if (!raw) return '';

  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';

  // Bare 10-digit local number -> add country code
  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  return digits;
}
