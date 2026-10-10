// src/utils/enrollmentService.js
// Centralized Enrollment & Unlocking Service for Edu Hunters
import { getUserOrders } from '../services/orderService';
import { initialData } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
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
    return raw ? JSON.parse(raw) : [];
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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
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
 * Updates localStorage, active user, orders, and broadcasts real-time update events.
 */
export function grantCourseAccess(itemOrTitle, data = {}) {
  try {
    const { courses: resolvedCourses, batches: resolvedBatches } = resolveAllAssociatedKeys(itemOrTitle, data);

    // 1. Update localStorage eduhunters_enrolled_courses
    const currentCourses = getStoredEnrolledCourses();
    const nextCourses = Array.from(new Set([...currentCourses, ...resolvedCourses]));
    localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(nextCourses));

    // 2. Update localStorage eduhunters_enrolled_batches
    const currentBatches = getStoredEnrolledBatches();
    const nextBatches = Array.from(new Set([...currentBatches, ...resolvedBatches]));
    localStorage.setItem(ENROLLED_BATCHES_KEY, JSON.stringify(nextBatches));

    // 3. Update localStorage currentUser if available
    try {
      const rawUser = localStorage.getItem('eh_current_user');
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        const userCourses = parsedUser.enrolledCourses || [];
        parsedUser.enrolledCourses = Array.from(new Set([...userCourses, ...resolvedCourses]));
        localStorage.setItem('eh_current_user', JSON.stringify(parsedUser));
      }
    } catch (e) {}

    // 4. Update matching orders in orderService storage
    try {
      const orders = getUserOrders();
      let updatedOrders = false;
      const normRaw = normalizeStr(typeof itemOrTitle === 'object' ? (itemOrTitle.title || itemOrTitle.name || itemOrTitle.id) : itemOrTitle);

      const nextOrdersList = orders.map(ord => {
        const ordTitle = normalizeStr(ord.course?.name || ord.items?.[0]?.title || '');
        const ordSlug = normalizeStr(ord.course?.slug || ord.course?.id || '');
        const isMatch = normRaw.includes(ordTitle) || ordTitle.includes(normRaw) || normRaw.includes(ordSlug);

        if (isMatch && ord.status !== 'PAID') {
          updatedOrders = true;
          return { ...ord, status: 'PAID', isApproved: true };
        }
        return ord;
      });

      if (updatedOrders) {
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrdersList));
      }
    } catch (e) {}

    // 5. Broadcast real-time events across windows & listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:enrollment_updated', {
        detail: {
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
            payload: { courses: resolvedCourses, batches: resolvedBatches }
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
 * Comprehensive check whether a course, exam batch, or bundle is unlocked/enrolled for the user.
 */
export function isItemEnrolled(itemOrId, currentUser = null, data = null) {
  if (!itemOrId) return false;

  // 1. Admin Role has master pass to everything
  if (currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@eduhunters.com') {
    return true;
  }

  // 2. Free item check
  if (typeof itemOrId === 'object' && itemOrId !== null) {
    if (itemOrId.isFree === true) return true;
    if (itemOrId.category?.toLowerCase() === 'free') return true;
    if (itemOrId.salePrice !== undefined && Number(itemOrId.salePrice) === 0) return true;
    if (itemOrId.price !== undefined && (Number(itemOrId.price) === 0 || String(itemOrId.price).toLowerCase() === 'free')) return true;
  }

  // 3. User must be logged in to access or be considered enrolled in any paid course, bundle, or batch
  if (!currentUser) {
    return false;
  }

  // Extract possible identifiers for this item
  const candidates = [];
  if (typeof itemOrId === 'string') {
    candidates.push(itemOrId);
    candidates.push(itemOrId.toLowerCase());
    candidates.push(normalizeStr(itemOrId));
  } else if (typeof itemOrId === 'object' && itemOrId !== null) {
    if (itemOrId.id) candidates.push(itemOrId.id, itemOrId.id.toLowerCase(), normalizeStr(itemOrId.id));
    if (itemOrId.slug) candidates.push(itemOrId.slug, itemOrId.slug.toLowerCase(), normalizeStr(itemOrId.slug));
    if (itemOrId.key) candidates.push(itemOrId.key, itemOrId.key.toLowerCase(), normalizeStr(itemOrId.key));
    if (itemOrId.title) candidates.push(itemOrId.title, itemOrId.title.toLowerCase(), normalizeStr(itemOrId.title));
    if (itemOrId.name) candidates.push(itemOrId.name, itemOrId.name.toLowerCase(), normalizeStr(itemOrId.name));
  }

  const cleanCandidates = Array.from(new Set(candidates.filter(Boolean)));

  // Helper matcher against an array of enrolled string entries
  const matchesAnyEnrolled = (enrolledArray) => {
    if (!Array.isArray(enrolledArray) || enrolledArray.length === 0) return false;
    for (const enrolled of enrolledArray) {
      if (typeof enrolled !== 'string') continue;
      const normEnrolled = normalizeStr(enrolled);
      for (const cand of cleanCandidates) {
        const normCand = normalizeStr(cand);
        if (normEnrolled === normCand) return true;
        if (normCand.length >= 5 && (normEnrolled.includes(normCand) || normCand.includes(normEnrolled))) return true;
      }
    }
    return false;
  };

  // 3. Check Current User explicit enrolledCourses
  if (currentUser?.enrolledCourses) {
    if (currentUser.enrolledCourses.includes('All Courses (Super Admin Pass)')) return true;
    if (matchesAnyEnrolled(currentUser.enrolledCourses)) return true;
  }

  // 4. Check localStorage eduhunters_enrolled_courses
  const storedCourses = getStoredEnrolledCourses();
  if (matchesAnyEnrolled(storedCourses)) return true;

  // 5. Check localStorage eduhunters_enrolled_batches
  const storedBatches = getStoredEnrolledBatches();
  if (matchesAnyEnrolled(storedBatches)) return true;

  // 6. Check data.users if matching user has it
  if (data?.users && Array.isArray(data.users)) {
    const userPhone = (currentUser?.phoneNumber || currentUser?.phone || '').replace(/[^0-9]/g, '');
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userName = (currentUser?.displayName || currentUser?.name || '').toLowerCase().trim();

    for (const u of data.users) {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();

      const isMatch = (userPhone.length >= 6 && uPhone.includes(userPhone)) ||
                      (userEmail && uEmail === userEmail) ||
                      (userName && uName === userName) ||
                      (currentUser?.uid && u.id === currentUser.uid);

      if (isMatch && matchesAnyEnrolled(u.enrolledCourses)) {
        return true;
      }
    }
  }

  // 7. Check data.enrolledStudents
  if (data?.enrolledStudents && Array.isArray(data.enrolledStudents)) {
    const userPhone = (currentUser?.phoneNumber || currentUser?.phone || '').replace(/[^0-9]/g, '');
    for (const st of data.enrolledStudents) {
      if (st.status === 'Active') {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const matchPhone = userPhone.length >= 6 && stPhone.includes(userPhone);
        if (matchPhone || !currentUser) { // If guest / demo mode, check active enrolled entries
          if (cleanCandidates.some(c => normalizeStr(st.courseName || '').includes(normalizeStr(c)))) {
            return true;
          }
        }
      }
    }
  }

  // 8. Check data.accounting.transactions for approved/completed transaction
  if (data?.accounting?.transactions && Array.isArray(data.accounting.transactions)) {
    for (const tx of data.accounting.transactions) {
      if (tx.status === 'Completed' || tx.status === 'Approved') {
        const normItem = normalizeStr(tx.itemTitle || '');
        for (const cand of cleanCandidates) {
          const normCand = normalizeStr(cand);
          if (normItem === normCand || (normCand.length >= 5 && (normItem.includes(normCand) || normCand.includes(normItem)))) {
            return true;
          }
        }
      }
    }
  }

  // 9. Check User Orders in orderService
  try {
    const orders = getUserOrders();
    for (const ord of orders) {
      if (ord.status === 'PAID' || ord.status === 'Completed' || ord.isApproved) {
        const ordSlug = normalizeStr(ord.course?.slug || ord.course?.id || '');
        const ordName = normalizeStr(ord.course?.name || '');
        const ordItem = normalizeStr(ord.items?.[0]?.title || '');

        for (const cand of cleanCandidates) {
          const normCand = normalizeStr(cand);
          if (normCand === ordSlug || normCand === ordName || normCand === ordItem ||
             (normCand.length >= 5 && (ordName.includes(normCand) || normCand.includes(ordName) || ordItem.includes(normCand)))) {
            return true;
          }
        }

        // Also check if order was for a bundle containing this candidate
        const allBundles = data?.bundles || initialData.bundles || [];
        for (const b of allBundles) {
          const bTitle = normalizeStr(b.title);
          if (ordName.includes(bTitle) || ordItem.includes(bTitle)) {
            for (const cand of cleanCandidates) {
              if ((b.courseIds || []).map(normalizeStr).includes(normalizeStr(cand))) {
                return true;
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  // 10. Check if this candidate belongs to any enrolled Bundle
  const allBundles = data?.bundles || initialData.bundles || [];
  for (const b of allBundles) {
    const bundleCandidates = [b.id, b.title, normalizeStr(b.title)];
    const isThisBundleEnrolled = bundleCandidates.some(bc => 
      storedCourses.some(sc => normalizeStr(sc) === normalizeStr(bc)) ||
      (currentUser?.enrolledCourses && currentUser.enrolledCourses.some(uc => normalizeStr(uc) === normalizeStr(bc)))
    );

    if (isThisBundleEnrolled) {
      for (const cand of cleanCandidates) {
        if ((b.courseIds || []).map(normalizeStr).includes(normalizeStr(cand))) {
          return true;
        }
      }
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
          if (event.data?.type === 'ENROLLMENT_UPDATED' || event.data?.type === 'DATA_SYNC') {
            setVersion(v => v + 1);
          }
        };
      } catch (e) {}
    }

    return () => {
      if (typeof window !== 'undefined') {
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
