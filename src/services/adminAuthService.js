/**
 * src/services/adminAuthService.js
 * Dedicated, secure authentication service for Edu Hunters Admin Panel.
 * Completely separate from student/user authentication.
 */

const ADMIN_ACCOUNTS_KEY = 'eh_admin_accounts';
const ADMIN_SESSION_KEY = 'eh_admin_session';

// Master Security Passcode required to register a new admin account (Configurable via ENV)
export const ADMIN_SECURITY_MASTER_KEY = import.meta.env.VITE_ADMIN_MASTER_KEY || 'EDUHUNTERS2026';

/**
 * Generates a SHA-256 cryptographic digest of a password string
 */
export async function hashPassword(str) {
  if (!str) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(String(str) + '_eduhunters_secure_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  // Deterministic fallback
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'eh_h_' + Math.abs(hash);
}

// Seed default master admin if not exists
function getStoredAdmins() {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {}

  // Initial Seed Admin with secure root password
  const defaultAdmins = [
    {
      id: 'admin_root',
      name: 'Edu Hunters Admin',
      email: 'admin@eduhunters.com',
      password: '1901009',
      role: 'super_admin',
      createdAt: new Date().toISOString()
    }
  ];

  try {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(defaultAdmins));
  } catch (e) {}

  return defaultAdmins;
}

/**
 * Get currently active admin session
 */
export function getAdminSession() {
  try {
    const local = localStorage.getItem(ADMIN_SESSION_KEY);
    if (local) return JSON.parse(local);

    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) return JSON.parse(session);
  } catch (e) {}
  return null;
}

/**
 * Set active admin session
 */
export function setAdminSession(adminUser, rememberMe = true) {
  const sessionData = {
    id: adminUser.id || 'admin_' + Date.now(),
    name: adminUser.name || 'Admin',
    email: adminUser.email.toLowerCase().trim(),
    role: adminUser.role || 'admin',
    loginAt: new Date().toISOString()
  };

  try {
    if (rememberMe) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } else {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch (e) {}

  return sessionData;
}

/**
 * Clear admin session (Logout)
 */
export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {}
}

/**
 * Authenticate admin with email and password
 */
export async function authenticateAdmin(email, password, rememberMe = true) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanEmail || !cleanPass) {
    throw new Error('Please enter both admin email and password.');
  }

  const hashedAttempt = await hashPassword(cleanPass);
  const admins = getStoredAdmins();
  
  // Find matching admin by email and password (plain or hashed)
  const matchedIndex = admins.findIndex((a) => {
    if (a.email.toLowerCase() !== cleanEmail) return false;
    // Check root admin enforcement
    if (cleanEmail === 'admin@eduhunters.com') {
      return a.password === '1901009' && cleanPass === '1901009' || a.password === hashedAttempt;
    }
    return a.password === cleanPass || a.password === hashedAttempt;
  });

  if (matchedIndex === -1) {
    throw new Error('Invalid admin credentials. Access denied.');
  }

  const matched = admins[matchedIndex];

  // Silently upgrade plain password to SHA-256 hash in storage
  if (matched.password !== hashedAttempt) {
    try {
      matched.password = hashedAttempt;
      admins[matchedIndex] = matched;
      localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(admins));
    } catch (e) {}
  }

  const session = setAdminSession(matched, rememberMe);
  return session;
}

/**
 * Register a new Admin account
 * Requires the master security passcode for restricted authorization
 */
export async function registerAdmin({ name, email, password, securityKey, rememberMe = true }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();
  const cleanKey = String(securityKey || '').trim().toUpperCase();

  if (!cleanName) {
    throw new Error('Please provide an Admin full name or title.');
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid official admin email address.');
  }

  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Admin password must be at least 6 characters long.');
  }

  // Validate Security Key without exposing the key in error message
  if (cleanKey !== ADMIN_SECURITY_MASTER_KEY) {
    throw new Error('Invalid Admin Security Master Key. Authorization rejected.');
  }

  const admins = getStoredAdmins();
  const alreadyExists = admins.some((a) => a.email.toLowerCase() === cleanEmail);

  if (alreadyExists) {
    throw new Error('An admin account already exists with this email address. Please sign in instead.');
  }

  const hashedPassword = await hashPassword(cleanPass);

  const newAdmin = {
    id: 'admin_' + Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  admins.push(newAdmin);

  try {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(admins));
  } catch (e) {}

  const session = setAdminSession(newAdmin, rememberMe);
  return session;
}
