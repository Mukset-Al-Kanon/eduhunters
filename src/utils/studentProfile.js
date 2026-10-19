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
  let targetUser = user;
  if (!targetUser) {
    try {
      const saved = localStorage.getItem('eh_current_user');
      if (saved) targetUser = JSON.parse(saved);
    } catch (e) {}
  }
  if (!targetUser) return false;

  let name = (targetUser.displayName || targetUser.name || '').trim();
  let college = (targetUser.college || targetUser.institution || '').trim();
  let rawPhone = (targetUser.whatsapp || targetUser.phone || targetUser.phoneNumber || '').replace(/[^0-9]/g, '');
  let studentClass = (targetUser.hscBatch || targetUser.batch || targetUser.academicClass || targetUser.class || '').trim();

  if (!college || !rawPhone || !studentClass || !name || name.toLowerCase().startsWith('user_')) {
    try {
      const saved = localStorage.getItem('eh_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!name || name.toLowerCase().startsWith('user_')) name = (parsed.displayName || parsed.name || '').trim();
          if (!college) college = (parsed.college || parsed.institution || '').trim();
          if (!rawPhone) rawPhone = (parsed.whatsapp || parsed.phone || parsed.phoneNumber || '').replace(/[^0-9]/g, '');
          if (!studentClass) studentClass = (parsed.hscBatch || parsed.batch || parsed.academicClass || parsed.class || '').trim();
        }
      }
    } catch (e) {}
  }

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
  let targetUser = user;
  if (!targetUser) {
    try {
      const saved = localStorage.getItem('eh_current_user');
      if (saved) targetUser = JSON.parse(saved);
    } catch (e) {}
  }
  if (!targetUser) return ['name', 'phone', 'college', 'class'];

  let name = (targetUser.displayName || targetUser.name || '').trim();
  let college = (targetUser.college || targetUser.institution || '').trim();
  let rawPhone = (targetUser.whatsapp || targetUser.phone || targetUser.phoneNumber || '').replace(/[^0-9]/g, '');
  let studentClass = (targetUser.hscBatch || targetUser.batch || targetUser.academicClass || targetUser.class || '').trim();

  if (!college || !rawPhone || !studentClass || !name || name.toLowerCase().startsWith('user_')) {
    try {
      const saved = localStorage.getItem('eh_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!name || name.toLowerCase().startsWith('user_')) name = (parsed.displayName || parsed.name || '').trim();
          if (!college) college = (parsed.college || parsed.institution || '').trim();
          if (!rawPhone) rawPhone = (parsed.whatsapp || parsed.phone || parsed.phoneNumber || '').replace(/[^0-9]/g, '');
          if (!studentClass) studentClass = (parsed.hscBatch || parsed.batch || parsed.academicClass || parsed.class || '').trim();
        }
      }
    } catch (e) {}
  }

  const missing = [];
  if (!name || name.length < 2 || name.toLowerCase().startsWith('user_')) missing.push('name');
  if (!rawPhone || rawPhone.length < 10) missing.push('phone');
  if (!college || college.length < 2) missing.push('college');
  if (!studentClass || studentClass.length < 2) missing.push('class');
  return missing;
};

/**
 * Resolves full, 100% accurate student identity across:
 * 1. Logged-in AuthContext user
 * 2. localStorage 'eh_current_user'
 * 3. localStorage 'eh_user_profile'
 * 4. Browser-persistent unique guest ID & entered guest student name
 *
 * Guarantees every student has a unique persistent ID and accurate name (never generic colliding 'guest_student').
 *
 * @param {Object|null} currentUser
 * @param {string} [writeInName] - Optional name directly typed by the examinee
 * @returns {Object} { id, uid, name, displayName, phone, email, avatar, college, isGuest }
 */
export const getResolvedStudent = (currentUser, writeInName = '') => {
  let user = currentUser;

  // 1. Try localStorage 'eh_current_user' if user is not passed
  if (!user) {
    try {
      const saved = localStorage.getItem('eh_current_user');
      if (saved) user = JSON.parse(saved);
    } catch (e) {}
  }

  // 2. Try localStorage 'eh_user_profile'
  let profile = {};
  try {
    const rawProf = localStorage.getItem('eh_user_profile');
    if (rawProf) profile = JSON.parse(rawProf);
  } catch (e) {}

  // 3. Persistent Guest Identity in localStorage
  let guestId = '';
  try {
    guestId = localStorage.getItem('eh_guest_student_id') || '';
    if (!guestId || guestId === 'guest_student') {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('eh_guest_student_id', guestId);
    }
  } catch (e) {
    guestId = `guest_${Date.now()}`;
  }

  // 4. Guest Name in localStorage
  let storedGuestName = '';
  try {
    storedGuestName = (localStorage.getItem('eh_guest_student_name') || '').trim();
  } catch (e) {}

  // Resolve Student ID (Real User UID > Profile ID > Persistent Guest ID)
  const studentId = user?.uid || user?.id || profile?.id || guestId;

  // Resolve Student Name with high fidelity
  let studentName = (
    (writeInName && writeInName.trim()) ||
    user?.displayName ||
    user?.name ||
    profile?.displayName ||
    profile?.name ||
    storedGuestName ||
    ''
  ).trim();

  // If name is user_... or empty and user has an email, use the clean email prefix
  if ((!studentName || studentName.toLowerCase().startsWith('user_')) && user?.email) {
    studentName = user.email.split('@')[0];
  }

  // If still empty, assign a polite unique identifier
  if (!studentName) {
    studentName = `শিক্ষার্থী #${studentId.slice(-4)}`;
  }

  // Save guest name for future continuity if guest
  if (!user?.uid && !user?.email && studentName && !studentName.startsWith('শিক্ষার্থী #')) {
    try {
      localStorage.setItem('eh_guest_student_name', studentName);
    } catch (e) {}
  }

  const studentPhone = (user?.whatsapp || user?.phone || user?.phoneNumber || profile?.whatsapp || profile?.phone || '').replace(/[^0-9]/g, '');
  const studentEmail = (user?.email || profile?.email || '').trim().toLowerCase();
  const studentAvatar = user?.photoURL || user?.avatar || profile?.photoURL || profile?.avatar || '';
  const college = user?.college || user?.institution || profile?.college || '';

  return {
    id: studentId,
    uid: user?.uid || studentId,
    name: studentName,
    displayName: studentName,
    phone: studentPhone,
    whatsapp: studentPhone,
    email: studentEmail,
    avatar: studentAvatar,
    college: college,
    isGuest: !user?.uid && !user?.email
  };
};
