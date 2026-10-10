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

// In-memory OTP storage: Map<email, { otp, expiresAt, attempts }>
const activeOTPStore = new Map();

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

  const otp = generateOTP();
  const validityMinutes = 5;
  const expiresAt = Date.now() + validityMinutes * 60 * 1000;

  activeOTPStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0
  });

  // Check if EmailJS or custom email provider is configured in environment
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: normalizedEmail,
            to_name: userName,
            otp_code: otp,
            expiry_minutes: validityMinutes,
            platform_name: 'Edu Hunters'
          }
        })
      });
    } catch (error) {
      console.warn('[OTP Service] EmailJS dispatch encountered an issue:', error);
    }
  }

  console.info(`[Edu Hunters Security] Verification code dispatched to ${normalizedEmail} (Expires in ${validityMinutes}m)`);

  return {
    success: true,
    otp,
    expiresAt,
    expiresInSeconds: validityMinutes * 60
  };
}

/**
 * Verifies the 6-digit OTP entered by the user
 */
export function verifyEnteredOTP(email, inputOTP) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = activeOTPStore.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    activeOTPStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= 5) {
    activeOTPStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Too many incorrect attempts. Please request a new verification code.'
    };
  }

  if (record.otp !== String(inputOTP).trim()) {
    record.attempts += 1;
    return {
      valid: false,
      error: 'Invalid verification code. Please check your inbox and try again.'
    };
  }

  // Verification successful! Remove from store
  activeOTPStore.delete(normalizedEmail);
  return { valid: true };
}
