import { z } from 'zod';

/**
 * Normalizes any Bangladeshi phone input into strictly 11 digits (e.g. '01677373788').
 * Removes spaces, hyphens, and leading +88 or 88.
 */
export function extract11DigitPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('+88')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('88')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Validates that the phone number is strictly 11 digits starting with '01[3-9]'.
 * User cannot give less than or more than 11 digits.
 */
export function isValid11DigitPhone(rawPhone?: string | null): boolean {
  if (!rawPhone) return false;
  const national = extract11DigitPhone(rawPhone);
  // Must be strictly 11 digits, starting with 01 and valid operator digit (3-9)
  return /^01[3-9]\d{8}$/.test(national);
}

/**
 * Normalizes phone number for database storage with '+88' prefix.
 * Example: User inputs '01677373788' -> saved in DB as '+8801677373788'.
 */
export function formatPhoneForDb(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const national = extract11DigitPhone(rawPhone);
  if (!national) return '';
  return `+88${national}`;
}

/**
 * Normalizes phone number for clean UI display.
 * Example: '+8801677373788' -> '01677373788' or keeps as is.
 */
export function formatPhoneForDisplay(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const national = extract11DigitPhone(rawPhone);
  return national || rawPhone;
}

/**
 * Zod refinement for strict 11-digit Bangladeshi mobile number
 */
export const BangladeshiPhoneSchema = z
  .string()
  .refine(
    (val) => isValid11DigitPhone(val),
    {
      message: 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।',
    }
  );
