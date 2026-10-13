// src/services/otpService.js
// Advanced OTP & Email Verification Service for Edu Hunters

// Known temporary / disposable fake email domains blacklist
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'guerrillamail.com',
  'trashmail.com', 'yopmail.com', 'sharklasers.com', 'getairmail.com',
  'dispostable.com', 'fakemailgenerator.com', 'temp-mail.org', 'temp-mail.io',
  'throwawaymail.com', 'maildrop.cc', 'inboxkitten.com', 'nada.ltd',
  'getnada.com', 'crazymailing.com', 'fakeinbox.com', 'mytemp.email',
  'mohmal.com', 'generator.email', 'emailondeck.com', 'dropmail.me',
  'tmpmail.net', 'tmpmail.org', 'tempail.com', 'tempinbox.com'
]);

/**
 * Checks if an email belongs to a disposable/fake email provider
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Validates general email structure
 */
export function isValidEmailFormat(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
}

/**
 * Generates a secure 6-digit OTP string
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a SHA-256 hash for secure storage of OTP tokens
 */
async function hashOTPToken(code, email) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(`${code}_${email}_eh_otp_salt_2026`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  // Deterministic fallback
  let hash = 0;
  const str = `${code}_${email}_eh_otp_salt_2026`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'eh_otp_h_' + Math.abs(hash);
}

// In-memory OTP storage: Map<email, { otpHash, expiresAt, attempts, requestedCount, firstRequestTime }>
const activeOTPStore = new Map();

const SESSION_PREFIX = 'eh_otp_';

function getStoredRecord(normalizedEmail) {
  if (activeOTPStore.has(normalizedEmail)) {
    return activeOTPStore.get(normalizedEmail);
  }
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${normalizedEmail}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // SessionStorage unavailable
  }
  return null;
}

function saveStoredRecord(normalizedEmail, record) {
  activeOTPStore.set(normalizedEmail, record);
  try {
    // Note: Record never stores plain OTP, only cryptographic otpHash
    sessionStorage.setItem(`${SESSION_PREFIX}${normalizedEmail}`, JSON.stringify(record));
  } catch (e) {}
}

function removeStoredRecord(normalizedEmail) {
  activeOTPStore.delete(normalizedEmail);
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${normalizedEmail}`);
  } catch (e) {}
}

/**
 * Sends a 6-digit verification code to the target email
 */
export async function sendVerificationOTP(email, userName = 'Student') {
  const normalizedEmail = email.toLowerCase().trim();

  if (!isValidEmailFormat(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (isDisposableEmail(normalizedEmail)) {
    throw new Error('Disposable or temporary email addresses are not allowed. Please use your authentic personal email.');
  }

  // Rate Limiting Check: Max 4 requests in 10 minutes
  const existingRecord = getStoredRecord(normalizedEmail);
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  let requestCount = 1;
  let firstRequestTime = now;

  if (existingRecord) {
    if (existingRecord.firstRequestTime && now - existingRecord.firstRequestTime < TEN_MINUTES) {
      requestCount = (existingRecord.requestedCount || 1) + 1;
      firstRequestTime = existingRecord.firstRequestTime;
      if (requestCount > 4) {
        const waitMinutes = Math.ceil((TEN_MINUTES - (now - firstRequestTime)) / 60000);
        throw new Error(`Too many verification code requests. Please wait ${waitMinutes} minute(s) before requesting again.`);
      }
    }
  }

  const otp = generateOTP();
  const validityMinutes = 5;
  const expiresAt = Date.now() + validityMinutes * 60 * 1000;
  const otpHash = await hashOTPToken(otp, normalizedEmail);

  const record = {
    otpHash,
    expiresAt,
    attempts: 0,
    requestedCount: requestCount,
    firstRequestTime
  };

  saveStoredRecord(normalizedEmail, record);

  // Check if EmailJS or custom email provider is configured in environment
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_lkisy77';
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_8vss8gb';
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'fKOJab5Prj6YcYXoO';

  if (serviceId && templateId && publicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: normalizedEmail,
            to_name: userName || 'Student',
            otp_code: otp,
            otp: otp,
            passcode: otp,
            expiry_minutes: validityMinutes,
            platform_name: 'Edu Hunters',
            subject: `Edu Hunters - Verification Code: ${otp}`,
            message: `Your 6-digit verification code is ${otp}. This code is valid for ${validityMinutes} minutes. Please do not share this code with anyone.`,
            support_email: 'eduhuntersbd@gmail.com'
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[OTP Service] EmailJS dispatch issue:', response.status, errText);
        throw new Error('Unable to deliver verification email at this moment. Please check your email or try again shortly.');
      }
    } catch (error) {
      console.warn('[OTP Service] EmailJS dispatch encountered an issue:', error);
      throw (error instanceof Error && error.message.includes('Unable to deliver'))
        ? error
        : new Error('Network issue sending verification email. Please check your internet connection.');
    }
  }

  // Security: Never return plain OTP in API response
  return {
    success: true,
    expiresAt,
    expiresInSeconds: validityMinutes * 60
  };
}

/**
 * Verifies the 6-digit OTP entered by the user
 */
export async function verifyEnteredOTP(email, inputOTP) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = getStoredRecord(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    removeStoredRecord(normalizedEmail);
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= 5) {
    removeStoredRecord(normalizedEmail);
    return {
      valid: false,
      error: 'Too many incorrect attempts. Please request a new verification code.'
    };
  }

  const cleanInput = String(inputOTP || '').trim();
  const inputHash = await hashOTPToken(cleanInput, normalizedEmail);

  // Compare hashes securely
  const isMatch = record.otpHash ? (record.otpHash === inputHash) : (record.otp === cleanInput);

  if (!isMatch) {
    record.attempts = (record.attempts || 0) + 1;
    saveStoredRecord(normalizedEmail, record);
    return {
      valid: false,
      error: `Invalid verification code. (${5 - record.attempts} attempt(s) remaining)`
    };
  }

  // Verification successful! Remove from store
  removeStoredRecord(normalizedEmail);
  return { valid: true };
}
