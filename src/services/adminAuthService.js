/**
 * src/services/adminAuthService.js
 * Dedicated, secure authentication service for Edu Hunters Admin Panel.
 * Completely separate from student/user authentication.
 */

const ADMIN_ACCOUNTS_KEY = 'eh_admin_accounts';
const ADMIN_SESSION_KEY = 'eh_admin_session';

// Default Master Security Passcode required to register a new admin account
export const ADMIN_SECURITY_MASTER_KEY = 'EDUHUNTERS2026';

// Seed default master admin if not exists
function getStoredAdmins() {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        // Enforce the new secret password 1901009 for the root admin
        const rootAdmin = list.find((a) => a.email.toLowerCase() === 'admin@eduhunters.com');
        if (rootAdmin && rootAdmin.password !== '1901009') {
          rootAdmin.password = '1901009';
          localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (e) {}

  // Initial Seed Admin with secure custom password
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

  const admins = getStoredAdmins();
  const matched = admins.find(
    (a) => a.email.toLowerCase() === cleanEmail && a.password === cleanPass
  );

  if (!matched) {
    throw new Error('Invalid admin credentials. Access denied.');
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

  // Validate Security Key
  if (cleanKey !== ADMIN_SECURITY_MASTER_KEY) {
    throw new Error(
      `Invalid Admin Security Master Key. Authorization rejected. (Default key: ${ADMIN_SECURITY_MASTER_KEY})`
    );
  }

  const admins = getStoredAdmins();
  const alreadyExists = admins.some((a) => a.email.toLowerCase() === cleanEmail);

  if (alreadyExists) {
    throw new Error('An admin account already exists with this email address. Please sign in instead.');
  }

  const newAdmin = {
    id: 'admin_' + Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
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
