/**
 * adminSyncService.js
 * Centralized, atomic synchronization engine for all Admin Panel operations.
 * Enforces a single source of truth across:
 * 1. Enrolled Students (eh_enrolled_students)
 * 2. Registered Users (eh_registered_users)
 * 3. Accounting & Transactions (eh_user_orders_v3 & accounting.transactions)
 * 4. Supabase Cloud Database (eduhunters_orders & eduhunters_users)
 * 5. Course Access Grants (eh_enrolled_courses)
 */

import { isSupabaseConfigured } from '../supabase/config';
import {
  saveSupabaseOrder,
  updateSupabaseOrderStatus,
  deleteSupabaseOrder,
  saveSupabaseUser
} from './supabaseService';
import {
  grantCourseAccess,
  revokeCourseAccess,
  getCanonicalCourses,
  isPhoneMatch
} from '../utils/enrollmentService';
import {
  saveStatusOverride,
  getAmountOverridesMap,
  applyStatusOverride
} from '../components/admin/adminHelpers';
import { approveOrder, revokeOrder } from './orderService';

/**
 * Clean phone number helper
 */
export function cleanPhoneNumber(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

/**
 * Check if a student matches a user record
 */
export function matchStudentToUser(student, user) {
  if (!student || !user) return false;
  const sPhone = cleanPhoneNumber(student.phone);
  const uPhone = cleanPhoneNumber(user.phone || user.whatsapp);
  if (sPhone && uPhone && isPhoneMatch(sPhone, uPhone)) return true;

  const sEmail = String(student.email || '').trim().toLowerCase();
  const uEmail = String(user.email || '').trim().toLowerCase();
  if (sEmail && uEmail && sEmail === uEmail) return true;

  const sName = String(student.name || '').trim().toLowerCase();
  const uName = String(user.name || user.displayName || '').trim().toLowerCase();
  if (sName && uName && sName === uName && sPhone.length >= 6 && uPhone.length >= 6) return true;

  return false;
}

/**
 * Atomic Manual Student Enrollment (From Admin Dashboard "+ New Student")
 */
export function atomicEnrollNewStudent({
  studentData,
  courses = [],
  bundles = [],
  enrolledStudents = [],
  usersList = [],
  accounting = {}
}) {
  const cleanPhone = cleanPhoneNumber(studentData.phone);
  const cleanEmail = (studentData.email || '').trim().toLowerCase();
  const name = (studentData.name || '').trim();
  const courseName = studentData.courseName || courses[0]?.title || 'Combo Course';
  const batch = studentData.batch || 'HSC 26';
  const status = studentData.status || 'Active';
  const isActive = status === 'Active';

  const newIdNumber = Math.floor(100 + Math.random() * 900);
  const newOrderId = `ord_manual_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // 1. New Enrolled Student Record
  const newStudent = {
    id: `st-${Date.now()}`,
    orderId: newOrderId,
    name,
    studentId: `EH-2026-${newIdNumber}`,
    batch,
    courseName,
    phone: studentData.phone.trim(),
    email: cleanEmail || `student${newIdNumber}@eduhunters.com`,
    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&auto=format&fit=crop&q=80`,
    status,
    joinedDate: 'Today',
    amount: 0,
    trxId: `MANUAL-${Date.now()}`,
    paymentMethod: 'Manual Enrollment'
  };

  const nextEnrolledStudents = [newStudent, ...enrolledStudents];
  try {
    localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolledStudents));
  } catch (e) {}

  // 2. Synchronize Registered Users (usersList)
  let userFound = false;
  const nextUsersList = usersList.map(u => {
    if (matchStudentToUser(newStudent, u)) {
      userFound = true;
      const currentCourses = u.enrolledCourses || [];
      const updatedCourses = Array.from(new Set([...currentCourses, courseName]));
      const updatedUser = {
        ...u,
        name: name || u.name,
        phone: studentData.phone.trim() || u.phone,
        batch: batch || u.batch,
        hscBatch: batch || u.hscBatch,
        status: status || u.status,
        enrolledCourses: updatedCourses
      };
      if (isSupabaseConfigured) {
        saveSupabaseUser(updatedUser).catch(() => {});
      }
      return updatedUser;
    }
    return u;
  });

  if (!userFound) {
    const newUserRecord = {
      id: `usr_${Date.now()}`,
      name,
      displayName: name,
      email: newStudent.email,
      phone: newStudent.phone,
      whatsapp: newStudent.phone,
      role: 'Student',
      status,
      batch,
      hscBatch: batch,
      college: 'EduHunters Student',
      institution: 'EduHunters Student',
      enrolledCourses: [courseName],
      totalSpent: 0,
      joinedDate: 'Today',
      lastActive: 'Just registered',
      device: 'Admin Console',
      avatar: newStudent.avatar,
      createdAt: nowIso,
      created_at: nowIso
    };
    nextUsersList.unshift(newUserRecord);
    if (isSupabaseConfigured) {
      saveSupabaseUser(newUserRecord, { isNewRegistration: true }).catch(() => {});
    }
  }

  try {
    localStorage.setItem('eh_registered_users', JSON.stringify(nextUsersList));
  } catch (e) {}

  // 3. Grant access locally if Active
  if (isActive) {
    grantCourseAccess(courseName, { bundles, courses }, { name, phone: studentData.phone, email: newStudent.email });
  }

  // 4. Save order to Supabase
  if (isSupabaseConfigured) {
    saveSupabaseOrder({
      id: newOrderId,
      invoice_number: `INV-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_name: name,
      customer_phone: studentData.phone.trim(),
      customer_email: newStudent.email,
      course_name: courseName,
      course_slug: '',
      amount: 0,
      payment_method: 'Manual Enrollment',
      trx_id: newStudent.trxId,
      status: isActive ? 'PAID' : 'PENDING',
      is_approved: isActive,
      raw_data: { ...newStudent, orderId: newOrderId, isApproved: isActive }
    }).catch(() => {});
  }

  return {
    enrolledStudents: nextEnrolledStudents,
    usersList: nextUsersList,
    newStudent
  };
}

/**
 * Atomic Student Update (Edit existing student)
 */
export function atomicUpdateStudent({
  studentId,
  studentData,
  courses = [],
  bundles = [],
  enrolledStudents = [],
  usersList = []
}) {
  const existingSt = enrolledStudents.find(s => s.id === studentId);
  const name = (studentData.name || '').trim();
  const phone = (studentData.phone || '').trim();
  const email = (studentData.email || '').trim().toLowerCase();
  const courseName = studentData.courseName || '';
  const batch = studentData.batch || 'HSC 26';
  const status = studentData.status || 'Active';
  const isActive = status === 'Active';

  // 1. Update enrolledStudents
  const nextEnrolledStudents = enrolledStudents.map(st => {
    if (st.id === studentId) {
      return {
        ...st,
        name: name || st.name,
        phone: phone || st.phone,
        email: email || st.email,
        batch: batch || st.batch,
        courseName: courseName || st.courseName,
        status: status || st.status
      };
    }
    return st;
  });

  try {
    localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolledStudents));
  } catch (e) {}

  // 2. Update usersList
  const nextUsersList = usersList.map(u => {
    if (existingSt && matchStudentToUser(existingSt, u)) {
      const mergedCourses = Array.from(new Set([...(u.enrolledCourses || []), courseName].filter(Boolean)));
      const updatedUser = {
        ...u,
        name: name || u.name,
        phone: phone || u.phone,
        email: email || u.email,
        batch: batch || u.batch,
        hscBatch: batch || u.hscBatch,
        status: status || u.status,
        enrolledCourses: mergedCourses
      };
      if (isSupabaseConfigured) {
        saveSupabaseUser(updatedUser).catch(() => {});
      }
      return updatedUser;
    }
    return u;
  });

  try {
    localStorage.setItem('eh_registered_users', JSON.stringify(nextUsersList));
  } catch (e) {}

  // 3. Update Course Access
  if (isActive && courseName) {
    grantCourseAccess(courseName, { bundles, courses }, { name, phone, email });
  }

  // 4. Update Supabase order
  const targetOrderId = existingSt?.orderId || (studentId.startsWith('st-ord_') ? studentId.replace('st-', '') : null);
  if (targetOrderId && isSupabaseConfigured) {
    updateSupabaseOrderStatus(targetOrderId, {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      course_name: courseName,
      status: isActive ? 'PAID' : 'PENDING',
      is_approved: isActive
    }).catch(() => {});
  }

  return {
    enrolledStudents: nextEnrolledStudents,
    usersList: nextUsersList
  };
}
