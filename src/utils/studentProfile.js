// src/utils/studentProfile.js

/**
 * Checks whether a student profile has all required fields completed for enrollment:
 * 1. Full Name (displayName or name)
 * 2. College / Educational Institution Name (college or institution)
 * 3. WhatsApp / Contact Phone Number (whatsapp, phone, or phoneNumber)
 *
 * @param {Object|null} user - The current user object
 * @returns {boolean} True if all 3 fields are non-empty strings
 */
export const isStudentProfileComplete = (user) => {
  if (!user) return false;
  const name = (user.displayName || user.name || '').trim();
  const college = (user.college || user.institution || '').trim();
  const phone = (user.whatsapp || user.phone || user.phoneNumber || '').trim();
  return Boolean(name && college && phone);
};

/**
 * Returns a list of missing profile field keys ('name', 'college', 'phone')
 *
 * @param {Object|null} user
 * @returns {Array<string>}
 */
export const getMissingProfileFields = (user) => {
  if (!user) return ['name', 'college', 'phone'];
  const missing = [];
  if (!(user.displayName || user.name || '').trim()) missing.push('name');
  if (!(user.college || user.institution || '').trim()) missing.push('college');
  if (!(user.whatsapp || user.phone || user.phoneNumber || '').trim()) missing.push('phone');
  return missing;
};
