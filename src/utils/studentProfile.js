// src/utils/studentProfile.js

/**
 * Checks whether a student profile has all required fields completed for free trial & enrollment:
 * 1. Full Name (displayName or name)
 * 2. Contact Phone / WhatsApp Number (whatsapp, phone, or phoneNumber)
 * 3. College / Educational Institution Name (college or institution)
 * 4. Class / HSC Batch (hscBatch, batch, academicClass, or class)
 *
 * @param {Object|null} user - The current user object
 * @returns {boolean} True if all 4 fields are non-empty strings
 */
export const isStudentProfileComplete = (user) => {
  if (!user) return false;
  const name = (user.displayName || user.name || '').trim();
  const college = (user.college || user.institution || '').trim();
  const rawPhone = (user.whatsapp || user.phone || user.phoneNumber || '').replace(/[^0-9]/g, '');
  const studentClass = (user.hscBatch || user.batch || user.academicClass || user.class || '').trim();

  const hasValidName = name.length >= 2 && !name.toLowerCase().startsWith('user_');
  const hasValidPhone = rawPhone.length >= 10;
  const hasValidCollege = college.length >= 2;
  const hasValidClass = studentClass.length >= 2;

  return Boolean(hasValidName && hasValidPhone && hasValidCollege && hasValidClass);
};

/**
 * Returns a list of missing profile field keys ('name', 'phone', 'college', 'class')
 *
 * @param {Object|null} user
 * @returns {Array<string>}
 */
export const getMissingProfileFields = (user) => {
  if (!user) return ['name', 'phone', 'college', 'class'];
  const missing = [];
  const name = (user.displayName || user.name || '').trim();
  const college = (user.college || user.institution || '').trim();
  const rawPhone = (user.whatsapp || user.phone || user.phoneNumber || '').replace(/[^0-9]/g, '');
  const studentClass = (user.hscBatch || user.batch || user.academicClass || user.class || '').trim();

  if (!name || name.length < 2 || name.toLowerCase().startsWith('user_')) missing.push('name');
  if (!rawPhone || rawPhone.length < 10) missing.push('phone');
  if (!college || college.length < 2) missing.push('college');
  if (!studentClass || studentClass.length < 2) missing.push('class');
  return missing;
};
