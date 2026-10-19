import React from 'react';

// Permanent Tombstones & Amount Overrides Persistence Helpers
export const getDeletedIdsSet = () => {
  try {
    const o = JSON.parse(localStorage.getItem('eh_deleted_orders') || '[]');
    const t = JSON.parse(localStorage.getItem('eh_deleted_transactions') || '[]');
    const set = new Set([...(Array.isArray(o) ? o : []), ...(Array.isArray(t) ? t : [])]);
    Array.from(set).forEach(id => {
      if (typeof id === 'string') {
        set.add(id.replace(/^(TRX-|st-)/, ''));
      }
    });
    return set;
  } catch {
    return new Set();
  }
};

export const getAmountOverridesMap = () => {
  try {
    return JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
  } catch {
    return {};
  }
};

export const getStatusOverridesMap = () => {
  try {
    return JSON.parse(localStorage.getItem('eh_status_overrides') || '{}');
  } catch {
    return {};
  }
};

export const saveStatusOverride = (keys, status) => {
  try {
    const map = getStatusOverridesMap();
    const keyArr = Array.isArray(keys) ? keys : [keys];
    keyArr.filter(Boolean).forEach(k => {
      const sKey = String(k).trim();
      if (sKey) {
        map[sKey] = status;
        const clean = sKey.replace(/^(TRX-|st-|ord_)/, '').trim();
        if (clean) map[clean] = status;
      }
    });
    localStorage.setItem('eh_status_overrides', JSON.stringify(map));
  } catch (e) {}
};

export const applyStatusOverride = (tx, overrides) => {
  if (!tx) return tx;
  const sMap = overrides || getStatusOverridesMap();
  const cleanId = typeof tx.id === 'string' ? tx.id.replace(/^(TRX-|st-|ord_)/, '') : '';
  const cleanOrderId = typeof tx.orderId === 'string' ? tx.orderId.replace(/^(TRX-|st-|ord_)/, '') : '';
  const overrideVal = sMap[tx.id] ?? sMap[tx.orderId] ?? sMap[tx.trxId] ?? sMap[tx.invoiceNumber] ?? sMap[cleanId] ?? sMap[cleanOrderId];
  if (overrideVal) {
    const isApproved = (overrideVal || '').toLowerCase() === 'completed';
    return { ...tx, status: overrideVal, isApproved };
  }
  return tx;
};

export const getUserTimestamp = (u) => {
  if (!u) return 0;
  if (typeof u.timestamp === 'number' && !isNaN(u.timestamp) && u.timestamp > 0) return u.timestamp;
  if (typeof u.registeredAt === 'number' && !isNaN(u.registeredAt) && u.registeredAt > 0) return u.registeredAt;

  const iso = u.createdAt || u.created_at;
  if (iso) {
    const t = new Date(iso).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  const lastActive = u.lastActiveAt || u.last_active_at;
  if (lastActive) {
    const t = new Date(lastActive).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  const joined = (u.joinedDate || '').trim().toLowerCase();
  // Only return current time if literally created right now in the current session
  if (joined === 'just now') {
    return Date.now();
  }
  // If it is a real parsable date like '18 Oct 2026' or '2026-10-18'
  if (joined && !['just now', 'today', 'active now', 'recently', 'official launch'].includes(joined)) {
    const t = new Date(joined).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  if (typeof u.id === 'string') {
    const match = u.id.match(/\d{10,13}/);
    if (match) {
      const num = Number(match[0]);
      if (!isNaN(num) && num > 1000000000) return num;
    }
  }
  if (typeof u.uid === 'string') {
    const match = u.uid.match(/\d{10,13}/);
    if (match) {
      const num = Number(match[0]);
      if (!isNaN(num) && num > 1000000000) return num;
    }
  }

  // Older baseline for seed users lacking timestamps so newly registered users are ALWAYS on top
  return 1000;
};

export const isDeletedItem = (item, deletedIds) => {
  if (!item) return false;
  // CRITICAL SAFETY GUARD: Approved / Paid orders or Active students MUST NEVER be treated as deleted
  const isPaidOrActive = Boolean(item.isApproved) || 
                         (item.status || '').toUpperCase() === 'PAID' || 
                         (item.status || '').toLowerCase() === 'completed' || 
                         (item.status || '').toLowerCase() === 'active';
  if (isPaidOrActive) return false;

  const dSet = deletedIds || getDeletedIdsSet();
  if (dSet.size === 0) return false;
  const k1 = item.id;
  const k2 = item.orderId;
  const k4 = item.invoiceNumber;
  const s1 = typeof item.id === 'string' ? item.id.replace(/^(TRX-|st-)/, '') : null;
  const s2 = typeof item.orderId === 'string' ? item.orderId.replace(/^(TRX-|st-)/, '') : null;
  return [k1, k2, k4, s1, s2].filter(Boolean).some(id => dSet.has(id) || dSet.has(String(id)));
};

export const applyAmountOverride = (tx, overrides) => {
  if (!tx) return tx;
  const oMap = overrides || getAmountOverridesMap();
  const cleanId = typeof tx.id === 'string' ? tx.id.replace(/^(TRX-|st-)/, '') : '';
  const cleanOrderId = typeof tx.orderId === 'string' ? tx.orderId.replace(/^(TRX-|st-)/, '') : '';
  const overrideVal = oMap[tx.id] ?? oMap[tx.orderId] ?? oMap[tx.trxId] ?? oMap[tx.invoiceNumber] ?? oMap[cleanId] ?? oMap[cleanOrderId];
  if (overrideVal !== undefined && !isNaN(Number(overrideVal))) {
    return { ...tx, amount: Number(overrideVal) };
  }
  return tx;
};

export const DEFAULT_ACCOUNTING_RESET_AT = '2026-10-16T17:05:00.000Z';

export const getAccountingResetConfig = () => {
  try {
    let resetAt = localStorage.getItem('eh_accounting_reset_at');
    if (!resetAt) {
      resetAt = DEFAULT_ACCOUNTING_RESET_AT;
      localStorage.setItem('eh_accounting_reset_at', resetAt);
    }
    const legacyIds = JSON.parse(localStorage.getItem('eh_accounting_legacy_ids') || '[]');
    return {
      resetAt,
      legacyIdsSet: new Set(legacyIds)
    };
  } catch {
    return { resetAt: DEFAULT_ACCOUNTING_RESET_AT, legacyIdsSet: new Set() };
  }
};

export const isHistoricalTx = (tx, resetConfig) => {
  if (!tx) return false;
  if (tx.isHistorical || tx.beforeReset) return true;
  const cfg = resetConfig || getAccountingResetConfig();
  if (cfg.legacyIdsSet && cfg.legacyIdsSet.size > 0) {
    if (cfg.legacyIdsSet.has(tx.id) || cfg.legacyIdsSet.has(tx.orderId) || (tx.trxId && cfg.legacyIdsSet.has(tx.trxId))) {
      return true;
    }
    const cleanId = typeof tx.id === 'string' ? tx.id.replace(/^(TRX-|st-)/, '') : '';
    const cleanOrderId = typeof tx.orderId === 'string' ? tx.orderId.replace(/^(TRX-|st-)/, '') : '';
    if (cleanId && cfg.legacyIdsSet.has(cleanId)) return true;
    if (cleanOrderId && cfg.legacyIdsSet.has(cleanOrderId)) return true;
  }
  const rTime = cfg.resetAt ? new Date(cfg.resetAt).getTime() : new Date(DEFAULT_ACCOUNTING_RESET_AT).getTime();
  if (tx.createdAt) {
    return new Date(tx.createdAt).getTime() <= rTime;
  }
  if (tx.date) {
    const dTime = new Date(tx.date).getTime();
    if (!isNaN(dTime)) return dTime <= rTime;
  }
  return true;
};

// File-scoped pure mappers so state initializers, listeners, and heartbeats can convert order docs reliably
export const mapOrderDocToTx = (docId, order) => {
  if (!order) return null;
  const t = order.transaction || {};
  let isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || Boolean(order.isApproved) || Boolean(order.is_approved) || (t.status || '').toLowerCase() === 'completed';
  const isRejected = order.status === 'REJECTED' || (t.status || '').toLowerCase() === 'rejected';

  // Check persistent status override
  const sMap = getStatusOverridesMap();
  const cleanDocId = typeof docId === 'string' ? docId.replace(/^(TRX-|st-|ord_)/, '') : '';
  const overrideStatus = sMap[docId] ?? sMap[cleanDocId] ?? sMap[t.id] ?? sMap[t.trxId] ?? sMap[order.transactionId] ?? sMap[order.invoiceNumber];
  if (overrideStatus) {
    isPaid = (overrideStatus || '').toLowerCase() === 'completed';
  }

  // AUTO-RESOLVE: If student is already enrolled/active in the system, this order is fulfilled and MUST NOT show as Pending
  if (!isPaid && !isRejected) {
    const rawP = t.studentPhone || order.customer?.phone || '';
    const cleanP = String(rawP).replace(/[^0-9]/g, '').slice(-10);
    const cleanE = String(t.studentEmail || order.customer?.email || '').trim().toLowerCase();
    try {
      const rawEnrolled = localStorage.getItem('eh_enrolled_students');
      if (rawEnrolled) {
        const parsed = JSON.parse(rawEnrolled);
        if (Array.isArray(parsed) && parsed.some(st => {
          const sp = String(st.phone || '').replace(/[^0-9]/g, '').slice(-10);
          const se = String(st.email || '').trim().toLowerCase();
          return ((cleanP && sp && cleanP === sp) || (cleanE && se && cleanE === se)) && (st.status || '').toLowerCase() === 'active';
        })) {
          isPaid = true;
        }
      }
      if (!isPaid) {
        const rawUsers = localStorage.getItem('eh_registered_users');
        if (rawUsers) {
          const parsedU = JSON.parse(rawUsers);
          if (Array.isArray(parsedU) && parsedU.some(u => {
            const up = String(u.phone || u.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
            const ue = String(u.email || '').trim().toLowerCase();
            return ((cleanP && up && cleanP === up) || (cleanE && ue && cleanE === ue)) && Array.isArray(u.enrolledCourses) && u.enrolledCourses.length > 0;
          })) {
            isPaid = true;
          }
        }
      }
    } catch (e) {}
  }

  const status = isPaid ? 'Completed' : (isRejected ? 'Rejected' : 'Pending');

  const baseTx = {
    id: t.id || `TRX-${docId}`,
    orderId: docId,
    invoiceNumber: order.invoiceNumber || t.invoiceNumber || 'INV-EH',
    type: 'INCOME',
    category: t.category || (order.type === 'store' ? 'Store Product' : (order.targetType === 'exam' ? 'Exam Batch Enrollment' : 'Course Enrollment')),
    itemTitle: t.itemTitle || order.course?.name || order.items?.[0]?.title || 'Course Access',
    amount: Number(t.amount !== undefined ? t.amount : (order.totalPaid || 0)),
    method: t.method || (order.paymentMethodName?.toLowerCase().includes('nagad') ? 'Nagad' : (order.paymentMethodName?.toLowerCase().includes('card') ? 'Card' : 'bKash')),
    trxId: t.trxId || order.transactionId || 'PENDING',
    studentName: t.studentName || order.customer?.name || 'Online Student',
    studentPhone: t.studentPhone || order.customer?.phone || 'N/A',
    studentEmail: t.studentEmail || order.customer?.email || '',
    date: t.date || (order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: t.createdAt || order.createdAt || new Date().toISOString(),
    status: status,
    isApproved: isPaid,
    notes: t.notes || (order.paymentMethodName ? `Paid via ${order.paymentMethodName}` : 'Submitted via Web Checkout')
  };
  return applyAmountOverride(baseTx);
};

export const mapOrderDocToStudent = (docId, order) => {
  if (!order) return null;
  const s = order.student || {};
  const t = order.transaction || {};
  let isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || Boolean(order.isApproved) || Boolean(order.is_approved) || (t.status || '').toLowerCase() === 'completed';
  
  const sMap = getStatusOverridesMap();
  const cleanDocId = typeof docId === 'string' ? docId.replace(/^(TRX-|st-|ord_)/, '') : '';
  const overrideStatus = sMap[docId] ?? sMap[cleanDocId] ?? sMap[s.id] ?? sMap[t.id] ?? sMap[s.trxId] ?? sMap[t.trxId] ?? sMap[order.transactionId];
  if (overrideStatus) {
    isPaid = (overrideStatus || '').toLowerCase() === 'completed';
  }

  if (!isPaid) {
    const rawP = s.phone || order.customer?.phone || t.studentPhone || '';
    const cleanP = String(rawP).replace(/[^0-9]/g, '').slice(-10);
    const cleanE = String(s.email || order.customer?.email || t.studentEmail || '').trim().toLowerCase();
    try {
      const rawUsers = localStorage.getItem('eh_registered_users');
      if (rawUsers) {
        const parsedU = JSON.parse(rawUsers);
        if (Array.isArray(parsedU) && parsedU.some(u => {
          const up = String(u.phone || u.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
          const ue = String(u.email || '').trim().toLowerCase();
          return ((cleanP && up && cleanP === up) || (cleanE && ue && cleanE === ue)) && Array.isArray(u.enrolledCourses) && u.enrolledCourses.length > 0;
        })) {
          isPaid = true;
        }
      }
    } catch (e) {}
  }

  const baseStudent = {
    id: s.id || `st-${docId}`,
    orderId: docId,
    name: s.name || order.customer?.name || t.studentName || 'Online Student',
    phone: s.phone || order.customer?.phone || t.studentPhone || 'N/A',
    email: s.email || order.customer?.email || t.studentEmail || '',
    batch: s.batch || 'HSC 26',
    courseName: s.courseName || order.course?.name || order.items?.[0]?.title || 'Course Access',
    status: isPaid ? 'Active' : 'Pending',
    joinedDate: s.joinedDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'),
    amount: Number(s.amount !== undefined ? s.amount : (order.totalPaid || 0)),
    trxId: s.trxId || order.transactionId || t.trxId || 'PENDING',
    paymentMethod: s.paymentMethod || t.method || (order.paymentMethodName?.toLowerCase().includes('nagad') ? 'Nagad' : 'bKash')
  };
  const oMap = getAmountOverridesMap();
  const cleanId = typeof baseStudent.id === 'string' ? baseStudent.id.replace(/^(TRX-|st-)/, '') : '';
  const overrideVal = oMap[baseStudent.id] ?? oMap[baseStudent.orderId] ?? oMap[baseStudent.trxId] ?? oMap[cleanId];
  if (overrideVal !== undefined && !isNaN(Number(overrideVal))) {
    baseStudent.amount = Number(overrideVal);
  }
  return baseStudent;
};

// Clean date and time formatter for orders and ledger entries
export const formatOrderDateTime = (dateOrIso) => {
  if (!dateOrIso) return { date: '--', time: '', full: '--' };
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) {
      return { date: String(dateOrIso), time: '', full: String(dateOrIso) };
    }
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr, full: `${dateStr} · ${timeStr}` };
  } catch {
    return { date: String(dateOrIso), time: '', full: String(dateOrIso) };
  }
};

// Pure helper: Deduplicate transactions so approved students never have duplicate pending records,
// amount 0 approved records auto-heal to their real paid fee, and deleted transactions NEVER resurrect
export const deduplicateTransactions = (txList) => {
  if (!Array.isArray(txList)) return [];
  const deletedIds = getDeletedIdsSet();
  const overrides = getAmountOverridesMap();

  const cleanLast10Phone = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/[^0-9]/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // 1. Identify all completed/approved students across transactions, enrolled students, and users
  const approvedKeys = new Set();
  const studentKnownPrice = new Map(); // email/phone -> real price if > 0

  // Inspect existing txList
  txList.forEach(t => {
    if (!t || isDeletedItem(t, deletedIds)) return;
    const s = (t.status || '').toLowerCase();
    const isApproved = s === 'completed' || s === 'paid' || Boolean(t.isApproved);
    const p = cleanLast10Phone(t.studentPhone);
    const e = (t.studentEmail || '').trim().toLowerCase();
    const amt = Number(t.amount) || 0;

    if (amt > 0) {
      if (e && e.includes('@')) studentKnownPrice.set(e, amt);
      if (p) studentKnownPrice.set(p, amt);
    }

    if (isApproved) {
      if (e && e.includes('@')) approvedKeys.add(e);
      if (p) approvedKeys.add(p);
      const c = (t.itemTitle || t.category || '').trim().toLowerCase();
      if (e && c) approvedKeys.add(`${e}_${c}`);
      if (p && c) approvedKeys.add(`${p}_${c}`);
    }
  });

  // Also pull from enrolled students & registered users to guarantee zero ghost pendings
  try {
    const rawEnrolled = localStorage.getItem('eh_enrolled_students');
    if (rawEnrolled) {
      const parsed = JSON.parse(rawEnrolled);
      if (Array.isArray(parsed)) {
        parsed.forEach(st => {
          const sp = cleanLast10Phone(st.phone);
          const se = (st.email || '').trim().toLowerCase();
          const amt = Number(st.amount) || 0;
          if (amt > 0) {
            if (se && !studentKnownPrice.has(se)) studentKnownPrice.set(se, amt);
            if (sp && !studentKnownPrice.has(sp)) studentKnownPrice.set(sp, amt);
          }
          if (se && se.includes('@')) approvedKeys.add(se);
          if (sp) approvedKeys.add(sp);
          const sc = (st.courseName || '').trim().toLowerCase();
          if (se && sc) approvedKeys.add(`${se}_${sc}`);
          if (sp && sc) approvedKeys.add(`${sp}_${sc}`);
        });
      }
    }
    const rawUsers = localStorage.getItem('eh_registered_users');
    if (rawUsers) {
      const parsedU = JSON.parse(rawUsers);
      if (Array.isArray(parsedU)) {
        parsedU.forEach(u => {
          const up = cleanLast10Phone(u.phone || u.whatsapp);
          const ue = (u.email || '').trim().toLowerCase();
          const amt = Number(u.totalSpent) || 0;
          if (amt > 0) {
            if (ue && !studentKnownPrice.has(ue)) studentKnownPrice.set(ue, amt);
            if (up && !studentKnownPrice.has(up)) studentKnownPrice.set(up, amt);
          }
          if (Array.isArray(u.enrolledCourses) && u.enrolledCourses.length > 0) {
            if (ue && ue.includes('@')) approvedKeys.add(ue);
            if (up) approvedKeys.add(up);
            u.enrolledCourses.forEach(cName => {
              const uc = (cName || '').trim().toLowerCase();
              if (ue && uc) approvedKeys.add(`${ue}_${uc}`);
              if (up && uc) approvedKeys.add(`${up}_${uc}`);
            });
          }
        });
      }
    }
  } catch (e) {}

  // 2. Filter transactions:
  // - Completed/paid/rejected transactions: keep exactly ONE completed record per student email and course!
  // - If completed transaction amount is 0, auto-heal with known student price (e.g. ৳499)
  // - Pending transactions: If student is already enrolled/approved, DISCARD IT!
  // - Keep at most ONE pending request per student email and course.
  const seenPendingKeys = new Set();
  const seenCompletedTrx = new Set();
  const seenCompletedEmailCourse = new Set();
  const result = [];

  for (let t of txList) {
    if (!t || isDeletedItem(t, deletedIds)) continue;
    t = applyAmountOverride(t, overrides);

    const s = (t.status || '').toLowerCase();
    const isCompleted = s === 'completed' || s === 'paid' || Boolean(t.isApproved);
    const p = cleanLast10Phone(t.studentPhone);
    const e = (t.studentEmail || '').trim().toLowerCase();
    const c = (t.itemTitle || t.category || '').trim().toLowerCase();

    if (isCompleted) {
      // Auto-heal 0 amount if real fee is known
      let finalAmt = Number(t.amount) || 0;
      if (finalAmt <= 0) {
        const known = (e && studentKnownPrice.get(e)) || (p && studentKnownPrice.get(p)) || 0;
        if (known > 0) {
          finalAmt = known;
          t = { ...t, amount: finalAmt };
        }
      }

      // Check for duplicate completed transactions for the same student and course
      const compKey = (e && e.includes('@') && c) ? `${e}_${c}` : (p && c ? `${p}_${c}` : null);
      if (compKey) {
        if (seenCompletedEmailCourse.has(compKey)) continue;
        seenCompletedEmailCourse.add(compKey);
      }

      const validTrx = t.trxId && t.trxId !== 'PENDING' && t.trxId !== 'PENDING_VERIFICATION' && t.trxId.length >= 6 ? t.trxId.toUpperCase().trim() : null;
      if (validTrx) {
        if (seenCompletedTrx.has(validTrx)) continue;
        seenCompletedTrx.add(validTrx);
      }
      result.push(t);
      continue;
    }

    if (s === 'rejected') {
      result.push(t);
      continue;
    }

    // It's a pending transaction:
    // If student has already been approved / enrolled in any course or this course, drop old pending drafts!
    const isAlreadyEnrolled = (e && approvedKeys.has(e)) ||
                              (e && c && approvedKeys.has(`${e}_${c}`)) ||
                              (p && approvedKeys.has(p)) ||
                              (p && c && approvedKeys.has(`${p}_${c}`));
    if (isAlreadyEnrolled) {
      continue;
    }

    // Un-enrolled student: keep at most ONE pending record per (email, course) or (phone, course)
    const pendingKey = (e && e.includes('@') && c) ? `${e}_${c}` : (p && c ? `${p}_${c}` : (e || p || t.id));
    if (seenPendingKeys.has(pendingKey)) {
      continue;
    }
    seenPendingKeys.add(pendingKey);
    result.push(t);
  }

  return result;
};

// Pure helper: Deduplicate users without EVER losing any enrolled course access (Union of courses)
export const deduplicateUsers = (userList) => {
  if (!Array.isArray(userList)) return [];

  const cleanUserPhone = (p) => {
    if (!p) return '';
    const digits = String(p).replace(/[^0-9]/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const cleanUserEmail = (e) => {
    if (!e) return '';
    const s = String(e).trim().toLowerCase();
    if (s === 'null' || s === 'undefined' || !s.includes('@') || s.endsWith('@eduhunters.com')) {
      return '';
    }
    return s;
  };

  const isRealUid = (id) => {
    if (!id) return false;
    const s = String(id);
    return !s.startsWith('usr-') && !s.startsWith('user_') && !s.startsWith('u_') && s.length >= 20;
  };

  const mergeTwo = (a, b) => {
    let chosenId = a.id || a.uid;
    if (!isRealUid(chosenId) && isRealUid(b.id || b.uid)) {
      chosenId = b.id || b.uid;
    }

    const aEmail = cleanUserEmail(a.email);
    const bEmail = cleanUserEmail(b.email);
    const chosenEmail = aEmail || bEmail || a.email || b.email || '';

    const isGeneric = (n) => !n || ['student', 'online student', 'user'].includes(String(n).trim().toLowerCase());
    let chosenName = a.name || a.displayName;
    if (isGeneric(chosenName) && !isGeneric(b.name || b.displayName)) {
      chosenName = b.name || b.displayName;
    }

    const chosenPhone = a.phone || b.phone || a.whatsapp || b.whatsapp || '';
    const chosenWhatsapp = a.whatsapp || b.whatsapp || chosenPhone;

    // 100% GUARANTEE: UNION OF ENROLLED COURSES SO ACCESS IS NEVER LOST
    const allCourses = Array.from(new Set([
      ...(Array.isArray(a.enrolledCourses) ? a.enrolledCourses : []),
      ...(Array.isArray(b.enrolledCourses) ? b.enrolledCourses : [])
    ])).filter(Boolean);

    const chosenSpent = Math.max(Number(a.totalSpent) || 0, Number(b.totalSpent) || 0);

    const isCustomAvatar = (av) => av && typeof av === 'string' && !av.includes('dicebear.com');
    const chosenAvatar = isCustomAvatar(a.avatar || a.photoURL) 
      ? (a.avatar || a.photoURL) 
      : (isCustomAvatar(b.avatar || b.photoURL) ? (b.avatar || b.photoURL) : (a.avatar || b.avatar || a.photoURL || b.photoURL));

    const chosenRole = (a.role === 'Admin' || b.role === 'Admin') ? 'Admin' : (a.role || b.role || 'Student');
    const chosenStatus = (a.status === 'Active' || b.status === 'Active') ? 'Active' : (a.status || b.status || 'Active');

    const aDate = a.createdAt || a.created_at;
    const bDate = b.createdAt || b.created_at;
    const chosenCreatedAt = aDate && bDate ? (new Date(aDate) < new Date(bDate) ? aDate : bDate) : (aDate || bDate);

    return {
      ...a,
      ...b,
      id: chosenId,
      uid: chosenId,
      name: chosenName || 'Student',
      displayName: chosenName || 'Student',
      email: chosenEmail,
      phone: chosenPhone,
      whatsapp: chosenWhatsapp,
      enrolledCourses: allCourses,
      totalSpent: chosenSpent,
      avatar: chosenAvatar,
      photoURL: chosenAvatar,
      role: chosenRole,
      status: chosenStatus,
      batch: a.batch || b.batch || a.hscBatch || b.hscBatch || 'HSC 26',
      hscBatch: a.hscBatch || b.hscBatch || a.batch || b.batch || 'HSC 26',
      college: a.college || b.college || a.institution || b.institution || '',
      institution: a.institution || b.institution || a.college || b.college || '',
      ...(chosenCreatedAt ? { createdAt: chosenCreatedAt, created_at: chosenCreatedAt } : {})
    };
  };

  const mergedList = [];
  
  userList.forEach(rawUser => {
    if (!rawUser) return;
    const uPhone = cleanUserPhone(rawUser.phone || rawUser.whatsapp);
    const uEmail = cleanUserEmail(rawUser.email);
    const uId = rawUser.id || rawUser.uid;

    const matchIndex = mergedList.findIndex(existing => {
      if (uId && (existing.id === uId || existing.uid === uId)) return true;
      const exEmail = cleanUserEmail(existing.email);
      if (uEmail && exEmail && uEmail === exEmail) return true;
      const exPhone = cleanUserPhone(existing.phone || existing.whatsapp);
      if (uPhone && exPhone && uPhone === exPhone && uPhone.length >= 8) {
        if (uEmail && exEmail && uEmail !== exEmail) {
          const uName = (rawUser.name || '').trim().toLowerCase();
          const exName = (existing.name || '').trim().toLowerCase();
          return uName === exName;
        }
        return true;
      }
      return false;
    });

    if (matchIndex !== -1) {
      mergedList[matchIndex] = mergeTwo(mergedList[matchIndex], rawUser);
    } else {
      mergedList.push({
        ...rawUser,
        enrolledCourses: Array.isArray(rawUser.enrolledCourses) ? [...rawUser.enrolledCourses] : [],
        totalSpent: Number(rawUser.totalSpent) || 0
      });
    }
  });

  return mergedList;
};

// Minimal time formatter for podium and leaderboards (matching user website)
export const formatMinimalTime = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

// Points TokenPill matching clean enterprise dashboard style
export const AdminTokenPill = ({ points, size = 'sm', variant = 'gold' }) => {
  const isLarge = size === 'lg';
  const formatted = points === undefined || points === null || points === '--' 
    ? '--' 
    : (Number.isInteger(Number(points)) ? Number(points) : +(Number(points).toFixed(2)));
  
  const getBadgeStyle = () => {
    if (variant === 'gold') return 'bg-amber-50 text-amber-800 border-amber-300';
    if (variant === 'silver') return 'bg-slate-100 text-slate-800 border-slate-300';
    if (variant === 'bronze') return 'bg-orange-50 text-orange-900 border-orange-300';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-full font-mono font-bold select-none border shadow-xs ${getBadgeStyle()} ${
      isLarge ? 'px-3 py-0.5 text-xs' : 'px-2.5 py-0.5 text-[11px]'
    }`}>
      <span className="tracking-tight">{formatted} pts</span>
    </div>
  );
};
