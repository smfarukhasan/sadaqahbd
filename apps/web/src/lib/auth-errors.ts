/**
 * Friendly localized authentication error messages.
 * Maps raw Firebase error codes/messages to professional, human-readable notices.
 */
export function getFriendlyAuthErrorMessage(
  err: any,
  locale: 'bn' | 'en' = 'bn',
  fallbackDefault?: string
): string {
  if (!err) return fallbackDefault || (locale === 'en' ? 'An unexpected error occurred.' : 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।');

  const rawCode = (err.code || '').toLowerCase();
  const rawMsg = (err.message || '').toLowerCase();

  // Invalid credentials / wrong password / user not found
  if (
    rawCode === 'auth/invalid-credential' ||
    rawCode === 'auth/wrong-password' ||
    rawCode === 'auth/user-not-found' ||
    rawMsg.includes('invalid-credential') ||
    rawMsg.includes('wrong-password') ||
    rawMsg.includes('user-not-found')
  ) {
    return locale === 'en'
      ? 'Invalid email address or password. Please verify and try again.'
      : 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
  }

  // Account already exists
  if (
    rawCode === 'auth/email-already-in-use' ||
    rawMsg.includes('email-already-in-use')
  ) {
    return locale === 'en'
      ? 'An account with this email already exists. Please log in instead.'
      : 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।';
  }

  // Account exists with different credential
  if (
    rawCode === 'auth/account-exists-with-different-credential' ||
    rawMsg.includes('account-exists-with-different-credential')
  ) {
    return locale === 'en'
      ? 'An account already exists with this email using a different sign-in method. Please use your original login method.'
      : 'এই ইমেইল দিয়ে ইতোমধ্যে পাসওয়ার্ডের মাধ্যমে অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে পাসওয়ার্ড দিয়ে লগইন করুন।';
  }

  // Invalid email format
  if (
    rawCode === 'auth/invalid-email' ||
    rawMsg.includes('invalid-email')
  ) {
    return locale === 'en'
      ? 'Please provide a valid email address.'
      : 'অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।';
  }

  // Weak password
  if (
    rawCode === 'auth/weak-password' ||
    rawMsg.includes('weak-password')
  ) {
    return locale === 'en'
      ? 'Password is too weak. Please use at least 6 characters.'
      : 'পাসওয়ার্ডটি অত্যন্ত দুর্বল। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।';
  }

  // Too many requests (rate limit)
  if (
    rawCode === 'auth/too-many-requests' ||
    rawMsg.includes('too-many-requests')
  ) {
    return locale === 'en'
      ? 'Too many failed attempts. Access is temporarily restricted. Please try again in a few moments.'
      : 'অতিরিক্ত ব্যর্থ চেষ্টার কারণে একাউন্ট সাময়িকভাবে লক রয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  // Unauthorized domain (Domain not whitelisted in Firebase Console)
  if (
    rawCode === 'auth/unauthorized-domain' ||
    rawMsg.includes('unauthorized-domain')
  ) {
    return locale === 'en'
      ? 'Domain unauthorized: Please add "sadaqahbd.com" to Authorized Domains in Firebase Console (Authentication > Settings > Authorized domains).'
      : 'ডোমেনটি Firebase-এ অনুমোদিত নয়: অনুগ্রহ করে Firebase Console-এর (Authentication > Settings > Authorized domains)-এ গিয়ে "sadaqahbd.com" ও "www.sadaqahbd.com" যুক্ত করুন।';
  }

  // Popup blocked by browser
  if (
    rawCode === 'auth/popup-blocked' ||
    rawMsg.includes('popup-blocked')
  ) {
    return locale === 'en'
      ? 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
      : 'আপনার ব্রাউজার গুগল লগইন পপ-আপ উইন্ডো ব্লক করেছে। অনুগ্রহ করে ব্রাউজারের পপ-আপ এলাউ করুন।';
  }

  // Operation not allowed (e.g. Google Sign-In not enabled in console)
  if (
    rawCode === 'auth/operation-not-allowed' ||
    rawMsg.includes('operation-not-allowed')
  ) {
    return locale === 'en'
      ? 'Google Sign-In is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.'
      : 'Firebase Console-এ গুগল সাইন-ইন চালু করা নেই। অনুগ্রহ করে Authentication > Sign-in method থেকে Google সক্রিয় করুন।';
  }

  // Cancelled popup request
  if (
    rawCode === 'auth/cancelled-popup-request' ||
    rawMsg.includes('cancelled-popup-request')
  ) {
    return locale === 'en'
      ? 'Another sign-in attempt was already in progress.'
      : 'পূর্বের লগইন উইন্ডো প্রসেসিংয়ে ছিল। অনুগ্রহ করে পুনরায় ক্লিক করুন।';
  }

  // Custom application error from backend API (does not contain raw Firebase internals)
  if (err.message && !err.message.includes('Firebase:') && !err.message.includes('auth/')) {
    return err.message;
  }

  // Network / Backend offline / Failed to fetch
  if (
    rawCode === 'auth/network-request-failed' ||
    rawMsg.includes('network-request-failed') ||
    rawMsg === 'failed to fetch' ||
    rawMsg.includes('load failed') ||
    rawMsg.includes('connection refused')
  ) {
    return locale === 'en'
      ? 'Unable to reach the server. Please check your network and verify the backend service is running.'
      : 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হচ্ছে না। অনুগ্রহ করে ইন্টারনেট ও সার্ভার সংযোগ পরীক্ষা করুন।';
  }

  // Popup closed by user
  if (
    rawCode === 'auth/popup-closed-by-user' ||
    rawMsg.includes('popup-closed-by-user')
  ) {
    return locale === 'en'
      ? 'Sign-in window was closed before completing authentication.'
      : 'লগইন উইন্ডো বন্ধ করা হয়েছে।';
  }

  // Fallback default with error code for rapid troubleshooting
  if (fallbackDefault) return fallbackDefault;

  const detailSuffix = rawCode ? ` (${rawCode})` : (err.message ? ` (${err.message.slice(0, 80)})` : '');

  return locale === 'en'
    ? `Authentication failed. Please verify your credentials and try again.${detailSuffix}`
    : `অথেনটিকেশনে সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।${detailSuffix}`;
}
