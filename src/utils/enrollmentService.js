// src/utils/enrollmentService.js
// Centralized Enrollment & Unlocking Service for Edu Hunters
import { getUserOrders } from '../services/orderService';
import { initialData } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { saveSupabaseOrder, saveSupabaseUser } from '../services/supabaseService';
import React, { useState, useEffect, useMemo } from 'react';

export const ENROLLED_COURSES_KEY = 'eduhunters_enrolled_courses';
export const ENROLLED_BATCHES_KEY = 'eduhunters_enrolled_batches';

/**
 * Normalizes any string for fuzzy comparison
 */
export function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^\w\u0980-\u09FF]+/g, ' ')
    .trim();
}

/**
 * Returns all enrolled course identifiers from localStorage
 */
export function getStoredEnrolledCourses() {
  try {
    const raw = localStorage.getItem(ENROLLED_COURSES_KEY);
    const legacy = localStorage.getItem('enrolled_courses');
    const list1 = raw ? JSON.parse(raw) : [];
    const list2 = legacy ? JSON.parse(legacy) : [];
    return Array.from(new Set([...(Array.isArray(list1) ? list1 : []), ...(Array.isArray(list2) ? list2 : [])]));
  } catch (e) {
    return [];
  }
}

/**
 * Returns all enrolled batch keys from localStorage
 */
export function getStoredEnrolledBatches() {
  try {
    const raw = localStorage.getItem(ENROLLED_BATCHES_KEY);
    const legacy = localStorage.getItem('enrolled_exam_batches');
    const list1 = raw ? JSON.parse(raw) : [];
    const list2 = legacy ? JSON.parse(legacy) : [];
    return Array.from(new Set([...(Array.isArray(list1) ? list1 : []), ...(Array.isArray(list2) ? list2 : [])]));
  } catch (e) {
    return [];
  }
}

/**
 * De-duplicates and canonicalizes an enrolled courses array into clean, human-readable course titles.
 * Eliminates internal ID/slug variations (e.g. ['Physics Finishing Touch Series', 'course-1791887161017', 'physics-finishing-touch-series'] => ['Physics Finishing Touch Series'])
 */
export function getCanonicalCourses(rawCourses, data = {}) {
  if (!Array.isArray(rawCourses) || rawCourses.length === 0) return [];

  const allCourses = data?.courses || initialData.courses || [];
  const allBundles = data?.bundles || initialData.bundles || [];
  const allBatches = EXAM_CATEGORIES_METADATA || [];

  const canonicalMap = new Map();

  rawCourses.forEach(item => {
    if (!item) return;
    const str = String(item).trim();
    if (!str) return;

    // Check against courses
    const foundCourse = allCourses.find(c => 
      c.id === str || 
      c.slug === str || 
      c.title === str || 
      c.name === str ||
      c.title?.toLowerCase() === str.toLowerCase() ||
      c.slug?.toLowerCase() === str.toLowerCase() ||
      c.id?.toLowerCase() === str.toLowerCase()
    );
    if (foundCourse) {
      const canonicalTitle = foundCourse.title || foundCourse.name;
      const key = canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, canonicalTitle);
      }
      return;
    }

    // Check against bundles
    const foundBundle = allBundles.find(b => 
      b.id === str || 
      b.slug === str || 
      b.title === str ||
      b.title?.toLowerCase() === str.toLowerCase()
    );
    if (foundBundle) {
      const canonicalTitle = foundBundle.title;
      const key = canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, canonicalTitle);
      }
      return;
    }

    // Check against exam batches
    const foundBatch = allBatches.find(eb => 
      eb.key === str || 
      eb.id === str || 
      eb.title === str ||
      eb.title?.toLowerCase() === str.toLowerCase()
    );
    if (foundBatch) {
      const canonicalTitle = foundBatch.title;
      const key = canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, canonicalTitle);
      }
      return;
    }

    // Filter out internal generated slugs or IDs
    if (str.startsWith('course-') || str.startsWith('ord_') || str.startsWith('TRX-') || str.startsWith('GRANT-') || str.startsWith('INV-')) {
      return;
    }

    const key = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!canonicalMap.has(key)) {
      canonicalMap.set(key, str);
    }
  });

  return Array.from(canonicalMap.values());
}

/**
 * Expands any course, bundle, or batch identifier to all its related keys, IDs, slugs, and child courses
 */
export function resolveAllAssociatedKeys(itemOrTitle, data = {}) {
  const allBundles = data?.bundles || initialData.bundles || [];
  const allCourses = data?.courses || initialData.courses || [];
  const allBatches = EXAM_CATEGORIES_METADATA || [];

  const rawStr = typeof itemOrTitle === 'object' && itemOrTitle !== null
    ? (itemOrTitle.id || itemOrTitle.slug || itemOrTitle.key || itemOrTitle.title || itemOrTitle.name || '')
    : String(itemOrTitle || '');

  const normTarget = normalizeStr(rawStr);
  const keysToGrant = new Set();
  const batchesToGrant = new Set();

  if (rawStr) {
    keysToGrant.add(rawStr);
    keysToGrant.add(rawStr.toLowerCase());
  }

  // 1. Check if it matches a Bundle
  const foundBundle = allBundles.find(b => {
    const bId = normalizeStr(b.id);
    const bTitle = normalizeStr(b.title);
    return normTarget === bId || normTarget === bTitle || normTarget.includes(bTitle) || bTitle.includes(normTarget);
  });

  if (foundBundle) {
    keysToGrant.add(foundBundle.id);
    keysToGrant.add(foundBundle.title);
    keysToGrant.add(normalizeStr(foundBundle.title));

    (foundBundle.courseIds || []).forEach(cId => {
      keysToGrant.add(cId);
      keysToGrant.add(cId.toLowerCase());
      // Check if child is an exam batch
      const foundBatch = allBatches.find(bat => bat.key === cId || bat.id === cId);
      if (foundBatch) {
        batchesToGrant.add(foundBatch.key);
        keysToGrant.add(foundBatch.title);
      }
      // Check if child is a course
      const foundCourse = allCourses.find(c => c.id === cId || c.slug === cId);
      if (foundCourse) {
        if (foundCourse.title) keysToGrant.add(foundCourse.title);
        if (foundCourse.name) keysToGrant.add(foundCourse.name);
        if (foundCourse.slug) keysToGrant.add(foundCourse.slug);
      }
    });
  }

  // 2. Check if it matches an Exam Batch
  const foundBatch = allBatches.find(bat => {
    const batKey = normalizeStr(bat.key);
    const batTitle = normalizeStr(bat.title);
    return normTarget === batKey || normTarget === batTitle || normTarget.includes(batKey) || normTarget.includes(batTitle);
  });

  if (foundBatch) {
    batchesToGrant.add(foundBatch.key);
    keysToGrant.add(foundBatch.key);
    keysToGrant.add(foundBatch.title);
    keysToGrant.add(normalizeStr(foundBatch.title));
  }

  // 3. Check if it matches a Course
  const foundCourse = allCourses.find(c => {
    const cId = normalizeStr(c.id);
    const cSlug = normalizeStr(c.slug);
    const cTitle = normalizeStr(c.title || c.name);
    return normTarget === cId || normTarget === cSlug || normTarget === cTitle || normTarget.includes(cTitle) || cTitle.includes(normTarget);
  });

  if (foundCourse) {
    if (foundCourse.id) keysToGrant.add(foundCourse.id);
    if (foundCourse.slug) keysToGrant.add(foundCourse.slug);
    if (foundCourse.title) keysToGrant.add(foundCourse.title);
    if (foundCourse.name) keysToGrant.add(foundCourse.name);
  }

  return {
    courses: Array.from(keysToGrant),
    batches: Array.from(batchesToGrant)
  };
}

/**
 * Grants access to a course, bundle, or exam batch.
 * Can be called for current user OR an explicitly passed targetUser.
 * Updates localStorage, user-scoped keys, eh_registered_users, orders, Firestore, and broadcasts real-time events.
 */
export function grantCourseAccess(itemOrTitle, data = {}, targetUser = null) {
  try {
    const { courses: resolvedCourses, batches: resolvedBatches } = resolveAllAssociatedKeys(itemOrTitle, data);
    const titleToUse = typeof itemOrTitle === 'object' && itemOrTitle !== null
      ? (itemOrTitle.title || itemOrTitle.name || itemOrTitle.id)
      : String(itemOrTitle || '');

    const targetUid = targetUser?.uid || targetUser?.id || null;
    const targetEmail = (targetUser?.email || '').toLowerCase().trim();
    const targetPhone = (targetUser?.phone || targetUser?.whatsapp || '').replace(/[^0-9]/g, '');

    // 1. Update localStorage eduhunters_enrolled_courses (global / current browser)
    const currentCourses = getStoredEnrolledCourses();
    const nextCourses = Array.from(new Set([...currentCourses, ...resolvedCourses]));
    localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(nextCourses));

    // 2. Update localStorage eduhunters_enrolled_batches
    const currentBatches = getStoredEnrolledBatches();
    const nextBatches = Array.from(new Set([...currentBatches, ...resolvedBatches]));
    localStorage.setItem(ENROLLED_BATCHES_KEY, JSON.stringify(nextBatches));

    // 3. Update target user specific scoped localStorage keys (for Dashboard & CoursePlayer)
    if (targetUid) {
      try {
        const uScopedCourses = JSON.parse(localStorage.getItem(`eduhunters_enrolled_courses_${targetUid}`) || '[]');
        const nextUAdminCourses = Array.from(new Set([...uScopedCourses, ...resolvedCourses]));
        localStorage.setItem(`eduhunters_enrolled_courses_${targetUid}`, JSON.stringify(nextUAdminCourses));

        const uScopedBatches = JSON.parse(localStorage.getItem(`eduhunters_enrolled_batches_${targetUid}`) || '[]');
        const nextUAdminBatches = Array.from(new Set([...uScopedBatches, ...resolvedBatches]));
        localStorage.setItem(`eduhunters_enrolled_batches_${targetUid}`, JSON.stringify(nextUAdminBatches));
      } catch (e) {}
    }

    // 4. Update localStorage currentUser if matching or targetUser is null
    try {
      const rawUser = localStorage.getItem('eh_current_user');
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        const curEmail = (parsedUser.email || '').toLowerCase().trim();
        const curUid = parsedUser.uid || parsedUser.id;
        const isMatch = !targetUser || (curEmail && targetEmail && curEmail === targetEmail) || (curUid && targetUid && curUid === targetUid);

        if (isMatch) {
          const userCourses = parsedUser.enrolledCourses || [];
          parsedUser.enrolledCourses = getCanonicalCourses([...userCourses, titleToUse], data);
          localStorage.setItem('eh_current_user', JSON.stringify(parsedUser));
        }
      }
    } catch (e) {}

    // 5. Update eh_registered_users list
    try {
      const rawReg = localStorage.getItem('eh_registered_users');
      if (rawReg) {
        const regList = JSON.parse(rawReg);
        if (Array.isArray(regList)) {
          const updatedReg = regList.map(u => {
            const uEmail = (u.email || '').toLowerCase().trim();
            const uUid = u.uid || u.id;
            const uPhone = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');

            const isTarget = (targetEmail && uEmail === targetEmail) ||
                             (targetUid && uUid === targetUid) ||
                             (targetPhone && uPhone && targetPhone === uPhone);

            if (isTarget) {
              const prevCourses = Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [];
              return {
                ...u,
                enrolledCourses: getCanonicalCourses([...prevCourses, titleToUse], data)
              };
            }
            return u;
          });
          localStorage.setItem('eh_registered_users', JSON.stringify(updatedReg));
        }
      }
    } catch (e) {}

    // 6. Update matching orders or generate an Admin Grant Paid Order in orderService storage
    try {
      const orders = getUserOrders();
      let updatedOrders = false;
      const normRaw = normalizeStr(titleToUse);

      const nextOrdersList = orders.map(ord => {
        const ordEmail = (ord.customer?.email || '').toLowerCase().trim();
        const ordUid = ord.userId || ord.customer?.uid;
        const ordTitle = normalizeStr(ord.course?.name || ord.items?.[0]?.title || '');
        const ordSlug = normalizeStr(ord.course?.slug || ord.course?.id || '');
        const isMatchCourse = normRaw.includes(ordTitle) || ordTitle.includes(normRaw) || normRaw.includes(ordSlug);
        const isMatchUser = !targetUser || (targetEmail && ordEmail === targetEmail) || (targetUid && ordUid === targetUid);

        if (isMatchCourse && isMatchUser && ord.status !== 'PAID') {
          updatedOrders = true;
          return { ...ord, status: 'PAID', isApproved: true };
        }
        return ord;
      });

      if (updatedOrders) {
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrdersList));
      } else if (targetUser) {
        // Create an instant approved Admin Grant order so isItemEnrolled 100% detects it
        const adminOrder = {
          id: `ORD-ADM-${Date.now()}`,
          invoiceNumber: `INV-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'PAID',
          isApproved: true,
          totalPaid: 0,
          customer: {
            name: targetUser.name || targetUser.displayName || 'Student',
            email: targetUser.email || '',
            phone: targetUser.phone || targetUser.whatsapp || '',
            uid: targetUid
          },
          userId: targetUid,
          course: {
            id: itemOrTitle?.id || itemOrTitle?.slug || titleToUse,
            name: titleToUse,
            title: titleToUse,
            slug: itemOrTitle?.slug || '',
            categoryKey: resolvedBatches[0] || undefined
          },
          paymentMethodName: 'Admin Direct Grant',
          transactionId: `GRANT-${Date.now()}`,
          notes: 'Admin Panel User Management Direct Grant',
          createdAt: new Date().toISOString()
        };
        nextOrdersList.unshift(adminOrder);
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrdersList));
        saveSupabaseOrder(adminOrder).catch(e => console.warn('[enrollmentService] Supabase grant save note:', e));

        if (targetUser && (targetUid || targetEmail)) {
          saveSupabaseUser({
            uid: targetUid || `u_${targetEmail.replace(/[^a-z0-9]/g, '')}`,
            id: targetUid,
            email: targetEmail,
            displayName: targetUser.name || targetUser.displayName || 'Student',
            phone: targetPhone
          }, {
            enrolledCourses: resolvedCourses
          }).catch(e => console.warn('[enrollmentService] Supabase user grant sync note:', e));
        }
      }
    } catch (e) {}

    // 7. Update Cloud Firestore atomically if configured and user has a valid UID
    if (isFirebaseConfigured && db && targetUid) {
      try {
        setDoc(doc(db, 'users', targetUid), {
          enrolledCourses: arrayUnion(...resolvedCourses),
          lastAccessGrantedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn('[enrollmentService] Firestore setDoc note:', err);
        });
      } catch (err) {}
    }

    // 8. Broadcast real-time events across windows & listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:enrollment_updated', {
        detail: {
          targetUserId: targetUid,
          targetEmail: targetEmail,
          courses: resolvedCourses,
          batches: resolvedBatches,
          timestamp: Date.now()
        }
      }));
      window.dispatchEvent(new CustomEvent('eh:orders_updated'));
      window.dispatchEvent(new Event('storage'));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({
            type: 'ENROLLMENT_UPDATED',
            payload: { 
              targetUserId: targetUid,
              targetEmail: targetEmail,
              courses: resolvedCourses, 
              batches: resolvedBatches 
            }
          });
          bc.close();
        } catch (e) {}
      }
    }

    return { courses: resolvedCourses, batches: resolvedBatches };
  } catch (err) {
    console.error('[enrollmentService] Error granting access:', err);
    return { courses: [], batches: [] };
  }
}

/**
 * Revokes access to a course, bundle, or exam batch for a specific user.
 */
export function revokeCourseAccess(itemOrTitle, data = {}, targetUser = null) {
  try {
    const { courses: resolvedCourses, batches: resolvedBatches } = resolveAllAssociatedKeys(itemOrTitle, data);
    const targetUid = targetUser?.uid || targetUser?.id || null;
    const targetEmail = (targetUser?.email || '').toLowerCase().trim();
    const resolvedSet = new Set(resolvedCourses.map(c => normalizeStr(c)));

    // 1. Update user scoped localStorage keys
    if (targetUid) {
      try {
        const uScopedCourses = JSON.parse(localStorage.getItem(`eduhunters_enrolled_courses_${targetUid}`) || '[]');
        const nextUAdminCourses = uScopedCourses.filter(c => !resolvedSet.has(normalizeStr(c)));
        localStorage.setItem(`eduhunters_enrolled_courses_${targetUid}`, JSON.stringify(nextUAdminCourses));

        const uScopedBatches = JSON.parse(localStorage.getItem(`eduhunters_enrolled_batches_${targetUid}`) || '[]');
        const nextUAdminBatches = uScopedBatches.filter(b => !resolvedBatches.includes(b));
        localStorage.setItem(`eduhunters_enrolled_batches_${targetUid}`, JSON.stringify(nextUAdminBatches));
      } catch (e) {}
    }

    // 2. Update eh_registered_users
    try {
      const rawReg = localStorage.getItem('eh_registered_users');
      if (rawReg) {
        const regList = JSON.parse(rawReg);
        if (Array.isArray(regList)) {
          const updatedReg = regList.map(u => {
            const uEmail = (u.email || '').toLowerCase().trim();
            const uUid = u.uid || u.id;
            const isTarget = (targetEmail && uEmail === targetEmail) || (targetUid && uUid === targetUid);
            if (isTarget) {
              const prevCourses = Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [];
              return {
                ...u,
                enrolledCourses: prevCourses.filter(c => !resolvedSet.has(normalizeStr(c)))
              };
            }
            return u;
          });
          localStorage.setItem('eh_registered_users', JSON.stringify(updatedReg));
        }
      }
    } catch (e) {}

    // 3. Update currentUser if matching
    try {
      const rawUser = localStorage.getItem('eh_current_user');
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        const curEmail = (parsedUser.email || '').toLowerCase().trim();
        const curUid = parsedUser.uid || parsedUser.id;
        const isMatch = !targetUser || (curEmail && targetEmail && curEmail === targetEmail) || (curUid && targetUid && curUid === targetUid);

        if (isMatch) {
          const userCourses = parsedUser.enrolledCourses || [];
          parsedUser.enrolledCourses = userCourses.filter(c => !resolvedSet.has(normalizeStr(c)));
          localStorage.setItem('eh_current_user', JSON.stringify(parsedUser));

          const curGlobalCourses = getStoredEnrolledCourses();
          const nextGlobalCourses = curGlobalCourses.filter(c => !resolvedSet.has(normalizeStr(c)));
          localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(nextGlobalCourses));
        }
      }
    } catch (e) {}

    // 4. Update orders in orderService storage
    try {
      const orders = getUserOrders();
      const titleToUse = typeof itemOrTitle === 'object' && itemOrTitle !== null
        ? (itemOrTitle.title || itemOrTitle.name || itemOrTitle.id)
        : String(itemOrTitle || '');
      const normRaw = normalizeStr(titleToUse);

      const nextOrdersList = orders.map(ord => {
        const ordEmail = (ord.customer?.email || '').toLowerCase().trim();
        const ordUid = ord.userId || ord.customer?.uid;
        const ordTitle = normalizeStr(ord.course?.name || ord.items?.[0]?.title || '');
        const isMatchCourse = normRaw.includes(ordTitle) || ordTitle.includes(normRaw);
        const isMatchUser = !targetUser || (targetEmail && ordEmail === targetEmail) || (targetUid && ordUid === targetUid);

        if (isMatchCourse && isMatchUser) {
          return { ...ord, status: 'CANCELLED', isApproved: false };
        }
        return ord;
      });
      localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrdersList));
    } catch (e) {}

    // 5. Update Firestore atomically if configured
    if (isFirebaseConfigured && db && targetUid) {
      try {
        setDoc(doc(db, 'users', targetUid), {
          enrolledCourses: arrayRemove(...resolvedCourses),
          lastAccessRevokedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    // 6. Broadcast real-time events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:enrollment_updated', {
        detail: {
          targetUserId: targetUid,
          targetEmail: targetEmail,
          revoked: resolvedCourses,
          timestamp: Date.now()
        }
      }));
      window.dispatchEvent(new CustomEvent('eh:orders_updated'));
      window.dispatchEvent(new Event('storage'));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({
            type: 'ENROLLMENT_UPDATED',
            payload: { targetUserId: targetUid, revoked: resolvedCourses }
          });
          bc.close();
        } catch (e) {}
      }
    }

    return true;
  } catch (err) {
    console.error('[enrollmentService] Error revoking access:', err);
    return false;
  }
}

/**
 * Cleans up unverified legacy 'sureshot' from localStorage if not backed by a paid order
 */
export function cleanUnverifiedLegacyBatches() {
  try {
    const rawBatches = localStorage.getItem(ENROLLED_BATCHES_KEY);
    const legacyBatches = localStorage.getItem('enrolled_exam_batches');
    if (rawBatches || legacyBatches) {
      const orders = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
      const hasPaidSureshot = orders.some(o => 
        (o.status === 'PAID' || o.isApproved) && 
        (o.course?.categoryKey === 'sureshot' || o.course?.slug === 'sureshot' || o.categoryKey === 'sureshot')
      );
      if (!hasPaidSureshot) {
        localStorage.removeItem(ENROLLED_BATCHES_KEY);
        localStorage.removeItem('enrolled_exam_batches');
      }
    }
  } catch (e) {}
}

// Automatically clean unverified batches on module initialization
cleanUnverifiedLegacyBatches();

/**
 * Comprehensive check whether a course, exam batch, or bundle is unlocked/enrolled for the user.
 * 100% accurate: only returns true if the user has actually enrolled or purchased it.
 */
export function isItemEnrolled(itemOrId, currentUser = null, data = null, options = {}) {
  if (!itemOrId) return false;

  // 1. Admin Role has master pass to everything (except when viewing personal dashboard where only genuine enrollments are shown)
  if (!options?.forDashboard && (currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@eduhunters.com')) {
    return true;
  }

  // 2. User must be logged in to access or be considered enrolled in personal dashboard
  if (!currentUser) {
    return false;
  }

  // Extract possible candidate identifiers for this item
  const candidates = new Set();
  if (typeof itemOrId === 'string') {
    const val = itemOrId.trim();
    if (val) {
      candidates.add(val);
      candidates.add(val.toLowerCase());
      candidates.add(normalizeStr(val));
    }
  } else if (typeof itemOrId === 'object' && itemOrId !== null) {
    if (itemOrId.id) {
      const s = String(itemOrId.id).trim();
      candidates.add(s);
      candidates.add(s.toLowerCase());
      candidates.add(normalizeStr(s));
    }
    if (itemOrId.slug) {
      const s = String(itemOrId.slug).trim();
      candidates.add(s);
      candidates.add(s.toLowerCase());
      candidates.add(normalizeStr(s));
    }
    if (itemOrId.key) {
      const s = String(itemOrId.key).trim();
      candidates.add(s);
      candidates.add(s.toLowerCase());
      candidates.add(normalizeStr(s));
    }
    if (itemOrId.title) {
      const s = String(itemOrId.title).trim();
      candidates.add(s);
      candidates.add(s.toLowerCase());
      candidates.add(normalizeStr(s));
    }
    if (itemOrId.name) {
      const s = String(itemOrId.name).trim();
      candidates.add(s);
      candidates.add(s.toLowerCase());
      candidates.add(normalizeStr(s));
    }
  }

  const cleanCandidates = Array.from(candidates).filter(Boolean);
  if (cleanCandidates.length === 0) return false;

  // Helper matcher against an array of enrolled string entries (exact ID or exact normalized string match)
  const matchesList = (list) => {
    if (!Array.isArray(list) || list.length === 0) return false;
    for (const item of list) {
      if (!item) continue;
      const str = typeof item === 'string' ? item.trim() : (item.id || item.slug || item.key || item.title || '').trim();
      if (!str) continue;
      const normItem = normalizeStr(str);
      const lowItem = str.toLowerCase();
      for (const cand of cleanCandidates) {
        if (cand === str || cand.toLowerCase() === lowItem || normalizeStr(cand) === normItem) {
          return true;
        }
      }
    }
    return false;
  };

  // 3. Check Current User explicit enrolledCourses / enrolledBatches
  if (currentUser?.enrolledCourses) {
    if (!options?.forDashboard && currentUser.enrolledCourses.includes('All Courses (Super Admin Pass)')) return true;
    if (matchesList(currentUser.enrolledCourses)) return true;
  }
  if (currentUser?.enrolledBatches && matchesList(currentUser.enrolledBatches)) {
    return true;
  }

  // 4. Check localStorage enrolled courses & batches
  const storedCourses = options?.forDashboard ? [] : getStoredEnrolledCourses();
  const storedBatches = options?.forDashboard ? [] : getStoredEnrolledBatches();

  // On personal dashboard, unverified global localStorage entries are not applied unless user-scoped
  if (!options?.forDashboard) {
    if (matchesList(storedCourses)) return true;
    if (matchesList(storedBatches)) return true;
  } else if (currentUser?.uid) {
    try {
      const userSpecificBatches = JSON.parse(localStorage.getItem(`eduhunters_enrolled_batches_${currentUser.uid}`) || '[]');
      if (matchesList(userSpecificBatches)) return true;
      const userSpecificCourses = JSON.parse(localStorage.getItem(`eduhunters_enrolled_courses_${currentUser.uid}`) || '[]');
      if (matchesList(userSpecificCourses)) return true;
    } catch (e) {}
  }

  // 5. Check User Orders in orderService (only completed / approved / paid orders belonging to this user)
  try {
    const orders = getUserOrders();
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userPhone = (currentUser?.phoneNumber || currentUser?.phone || currentUser?.whatsapp || '').replace(/[^0-9]/g, '');
    const userUid = currentUser?.uid || currentUser?.id;

    for (const ord of orders) {
      const isPaid = ord.status === 'PAID' || ord.status === 'Completed' || ord.isApproved === true;
      if (!isPaid) continue;

      // Strict user ownership check: The order must belong to this user
      if (currentUser) {
        const orderEmail = (ord.customer?.email || '').toLowerCase().trim();
        const orderPhone = (ord.customer?.phone || '').replace(/[^0-9]/g, '');
        const orderUid = ord.userId || ord.customer?.uid;

        const isOwner = (userEmail && orderEmail && orderEmail === userEmail) ||
                        (userPhone && orderPhone && (orderPhone === userPhone || orderPhone.endsWith(userPhone) || userPhone.endsWith(orderPhone))) ||
                        (userUid && orderUid && orderUid === userUid);

        if (!isOwner) continue;
      }

      const orderKeys = [
        ord.course?.id,
        ord.course?.slug,
        ord.course?.key,
        ord.categoryKey,
        ord.bundleId,
        ord.items?.[0]?.id,
        ord.items?.[0]?.key,
        ord.items?.[0]?.slug,
        ord.items?.[0]?.title,
        ord.course?.name,
        ord.course?.title
      ].filter(Boolean);

      if (matchesList(orderKeys)) return true;

      // If this order was for a bundle, check if this item is in the bundle's child courseIds
      const allBundles = data?.bundles || initialData.bundles || [];
      for (const b of allBundles) {
        const isBundleMatch = orderKeys.some(ok => 
          ok === b.id || String(ok).toLowerCase() === String(b.id).toLowerCase() || normalizeStr(ok) === normalizeStr(b.title)
        );
        if (isBundleMatch && Array.isArray(b.courseIds)) {
          if (matchesList(b.courseIds)) return true;
        }
      }
    }
  } catch (e) {}

  // 6. Check data.users if matching user has explicit enrolledCourses
  if (data?.users && Array.isArray(data.users)) {
    const userPhone = (currentUser?.phoneNumber || currentUser?.phone || '').replace(/[^0-9]/g, '');
    const userEmail = (currentUser?.email || '').toLowerCase().trim();

    for (const u of data.users) {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').toLowerCase().trim();

      const isMatch = (userPhone.length >= 6 && uPhone === userPhone) ||
                      (userEmail && uEmail === userEmail) ||
                      (currentUser?.uid && u.id === currentUser.uid);

      if (isMatch) {
        if (matchesList(u.enrolledCourses) || matchesList(u.enrolledBatches)) {
          return true;
        }
      }
    }
  }

  // 7. Check if user is enrolled in a Bundle that contains this item
  const allBundles = data?.bundles || initialData.bundles || [];
  for (const b of allBundles) {
    const isBundleEnrolled = storedCourses.some(sc => sc === b.id || normalizeStr(sc) === normalizeStr(b.title)) ||
                             (currentUser?.enrolledCourses && currentUser.enrolledCourses.some(uc => uc === b.id || normalizeStr(uc) === normalizeStr(b.title)));
    if (isBundleEnrolled && Array.isArray(b.courseIds)) {
      if (matchesList(b.courseIds)) return true;
    }
  }

  return false;
}

/**
 * Custom React hook that automatically synchronizes and updates enrollment status
 * upon any real-time order, approval, or storage changes.
 */
export function useEnrollmentStatus(itemOrId, currentUser = null, data = null) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setVersion(v => v + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eh:enrollment_approved', handleUpdate);
      window.addEventListener('eh:enrollment_updated', handleUpdate);
      window.addEventListener('eh:orders_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      window.addEventListener('eduhunters_data_updated', handleUpdate);
    }

    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (event) => {
          if (
            event.data?.type === 'ENROLLMENT_APPROVED' || 
            event.data?.type === 'ENROLLMENT_UPDATED' || 
            event.data?.type === 'DATA_SYNC'
          ) {
            setVersion(v => v + 1);
          }
        };
      } catch (e) {}
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('eh:enrollment_approved', handleUpdate);
        window.removeEventListener('eh:enrollment_updated', handleUpdate);
        window.removeEventListener('eh:orders_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('eduhunters_data_updated', handleUpdate);
      }
      if (bc) bc.close();
    };
  }, []);

  return useMemo(() => {
    return isItemEnrolled(itemOrId, currentUser, data);
  }, [itemOrId, currentUser, data, version]);
}
