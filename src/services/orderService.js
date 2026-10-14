import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';

const ORDERS_STORAGE_KEY = 'eh_user_orders_v3';

export const INITIAL_ORDERS = [];

function sanitizeForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    return value;
  }));
}

/**
 * Retrieves all stored user orders, initializing clean for production.
 */
export function getUserOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(o => !['ord_exam_2026_9842', 'ord_course_2026_8421', 'ord_store_2026_6105'].includes(o.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.error('[orderService] Failed to load orders from localStorage:', err);
    return [];
  }
}

/**
 * Generates an official, sequence-style invoice number
 */
export function generateInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `INV-${currentYear}-EH-${randomSuffix}`;
}

/**
 * Automatically creates and persists a new order and invoice upon purchase.
 * Also synchronizes in real time with AdminPanel ledger, enrolled students, and Cloud Firestore.
 */
export async function saveNewOrder({
  item,
  studentName,
  studentPhone,
  studentEmail,
  studentUid,
  paymentMethod = 'bkash',
  trxId,
  amount,
  originalPrice,
  discount
}) {
  const orderId = `ord_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceNumber = generateInvoiceNumber();

  const finalAmount = Number(amount) || 0;
  const initialSubtotal = Number(originalPrice) || (finalAmount > 0 ? finalAmount : 1000);
  const calculatedDiscount = Number(discount) !== undefined && !isNaN(Number(discount)) 
    ? Number(discount) 
    : Math.max(0, initialSubtotal - finalAmount);

  const title = item?.title || item?.name || 'Edu Hunters Premium Program';
  const type = item?.targetType === 'exam' || item?.categoryKey === 'sureshot' ? 'exam' : (item?.type || 'course');
  const badge = type === 'exam' ? 'Exam Batch' : (type === 'bundle' ? 'Bundle Combo' : (type === 'store' ? 'Store Item' : 'Course Access'));

  const newOrder = {
    id: orderId,
    invoiceNumber,
    type: type === 'exam' ? 'course' : type, // Keep consistent for router checks
    targetType: type === 'exam' ? 'exam' : 'course',
    badge,
    status: 'PENDING',
    isApproved: false,
    course: {
      name: title,
      slug: item?.slug || 'program',
      targetType: type === 'exam' ? 'exam' : 'course',
      categoryKey: item?.categoryKey || 'sureshot',
      fb_group: item?.fb_group || 'https://www.facebook.com/groups/eduhunters'
    },
    customer: {
      name: studentName || 'Online Student',
      email: studentEmail || 'student@eduhunters.com.bd',
      phone: studentPhone || 'N/A',
      studentId: `EH-STU-${Math.floor(1000 + Math.random() * 9000)}`,
      address: 'Dhaka, Bangladesh',
      district: 'Dhaka',
      country: 'Bangladesh'
    },
    paymentGateway: (paymentMethod || 'bkash').toLowerCase(),
    paymentMethodName: (paymentMethod || '').toLowerCase().includes('nagad')
      ? 'Nagad Mobile Financial Services'
      : (paymentMethod || '').toLowerCase().includes('card')
        ? 'Debit / Credit Card (Online Gateway)'
        : 'bKash Mobile Financial Services',
    totalPaid: finalAmount,
    subtotal: initialSubtotal,
    discount: calculatedDiscount,
    vat: 0,
    transactionId: trxId || `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: `item_${Date.now()}`,
        title: title,
        subtitle: item?.subtitle || 'Complete digital learning access, masterclass video lectures, model tests & digital course syllabus',
        type: type === 'exam' ? 'Digital Exam Batch Access' : (type === 'store' ? 'Printed Academic Material' : 'Online Course Program'),
        quantity: 1,
        unitPrice: initialSubtotal,
        amount: initialSubtotal
      }
    ]
  };

  // 1. Transaction representation for accounting ledger & admin verification hub
  const newTx = {
    id: `TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    orderId: newOrder.id,
    invoiceNumber: newOrder.invoiceNumber,
    type: 'INCOME',
    category: type === 'store' ? 'Store Product' : 'Course Enrollment',
    itemTitle: title,
    amount: finalAmount,
    method: newOrder.paymentMethodName.includes('Nagad') ? 'Nagad' : (newOrder.paymentMethodName.includes('Card') ? 'Card' : 'bKash'),
    trxId: newOrder.transactionId,
    studentName: newOrder.customer.name,
    studentPhone: newOrder.customer.phone,
    studentEmail: newOrder.customer.email,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    status: 'Pending',
    notes: `Enrollment Form Submitted (${paymentMethod.toUpperCase()})`
  };

  // 2. Student record for enrolled students directory (Pending verification)
  const newStudent = {
    id: `st-${Date.now()}`,
    name: newOrder.customer.name,
    phone: newOrder.customer.phone,
    email: newOrder.customer.email,
    batch: 'HSC 26',
    courseName: title,
    status: 'Pending',
    joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    amount: finalAmount,
    trxId: newOrder.transactionId,
    paymentMethod: paymentMethod
  };

  try {
    // 3. Persist order in local user orders
    const existingOrders = getUserOrders();
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

    // 4. Update accounting in eduhunters_data so AdminPanel immediately has the transaction
    const rawSiteData = localStorage.getItem('eduhunters_data');
    if (rawSiteData) {
      try {
        const parsedSite = JSON.parse(rawSiteData);
        const prevAcc = parsedSite.accounting || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, totalOrders: 0, transactions: [] };
        const prevTxs = Array.isArray(prevAcc.transactions) ? prevAcc.transactions : [];
        const nextTxs = [newTx, ...prevTxs.filter(t => t.id !== newTx.id)];
        const nextOrdersCount = (Number(prevAcc.totalOrders) || prevTxs.length) + 1;

        parsedSite.accounting = {
          ...prevAcc,
          totalOrders: nextOrdersCount,
          transactions: nextTxs
        };
        parsedSite._lastUpdated = new Date().toISOString();
        localStorage.setItem('eduhunters_data', JSON.stringify(parsedSite));
      } catch (e) {}
    }

    // 5. Update eh_enrolled_students with Pending status
    try {
      const rawStudents = localStorage.getItem('eh_enrolled_students');
      const prevStudents = rawStudents ? JSON.parse(rawStudents) : [];
      const nextStudents = [newStudent, ...prevStudents.filter(s => !(s.phone === newStudent.phone && s.courseName === newStudent.courseName))];
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
    } catch (e) {}

    // Note: Course is NOT unlocked yet. It unlocks only when Admin clicks "Approve".

    // 6. Dispatch real-time events across windows & listeners immediately
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('eh:orders_updated', { detail: newOrder }));
        window.dispatchEvent(new CustomEvent('eh:new_enrollment', {
          detail: { order: newOrder, transaction: newTx, student: newStudent }
        }));
        window.dispatchEvent(new Event('storage'));

        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({
            type: 'NEW_ENROLLMENT_ORDER',
            payload: { order: newOrder, transaction: newTx, student: newStudent }
          });
          bc.close();
        }
      } catch (e) {}
    }

    // 7. Persist order in Cloud Firestore asynchronously (non-blocking for instant UI response)
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'orders', orderId);
        const cloudOrderData = sanitizeForFirestore({
          ...newOrder,
          transaction: newTx,
          student: newStudent,
          _savedAt: new Date().toISOString()
        });
        // Background fire-and-forget: AdminPanel onSnapshot(collection(db, 'orders')) receives it in real-time
        setDoc(docRef, cloudOrderData).catch((cloudErr) => {
          console.warn('[orderService] Cloud order background save note:', cloudErr);
        });

        // 8. Back-propagate contact info directly to student's user profile in Cloud Firestore
        const cleanPhone = (studentPhone || '').trim();
        if (cleanPhone && cleanPhone !== 'N/A') {
          const profileUpdates = {
            phone: cleanPhone,
            whatsapp: cleanPhone,
            updatedAt: new Date().toISOString()
          };
          if (studentName && studentName !== 'Online Student' && studentName !== 'Student') {
            profileUpdates.displayName = studentName;
            profileUpdates.name = studentName;
          }

          if (studentUid) {
            setDoc(doc(db, 'users', studentUid), profileUpdates, { merge: true }).catch(() => {});
          } else if (studentEmail) {
            getDocs(collection(db, 'users')).then(snap => {
              snap.docs.forEach(docSnap => {
                const uData = docSnap.data();
                if (uData.email && uData.email.toLowerCase() === studentEmail.toLowerCase()) {
                  setDoc(doc(db, 'users', docSnap.id), profileUpdates, { merge: true }).catch(() => {});
                }
              });
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('[orderService] Background task setup note:', e);
      }
    }

    // 9. Back-sync contact number to active local user session if not already populated
    try {
      const rawCur = localStorage.getItem('eh_current_user');
      if (rawCur) {
        const cur = JSON.parse(rawCur);
        const cleanPhone = (studentPhone || '').trim();
        const hasNoPhone = !cur.phone || cur.phone === 'N/A' || cur.phone === '01700-000000';
        if (hasNoPhone && cleanPhone && cleanPhone !== 'N/A') {
          cur.phone = cleanPhone;
          cur.whatsapp = cleanPhone;
          if (studentName && (!cur.displayName || cur.displayName === 'Student')) {
            cur.displayName = studentName;
            cur.name = studentName;
          }
          localStorage.setItem('eh_current_user', JSON.stringify(cur));
        }
      }
    } catch (e) {}
  } catch (err) {
    console.error('[orderService] Failed to save new order:', err);
  }

  return newOrder;
}

/**
 * Approves a pending enrollment order, unlocks the course, and broadcasts real-time activation
 */
export function approveOrder(identifier, { courseTitle, studentPhone, studentEmail, studentName, amount } = {}) {
  try {
    const orders = getUserOrders();
    const cleanPhone = (studentPhone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (studentEmail || '').toLowerCase().trim();
    let approvedOrder = null;

    const nextOrders = orders.map(ord => {
      const ordPhone = (ord.customer?.phone || '').replace(/[^0-9]/g, '');
      const ordEmail = (ord.customer?.email || '').toLowerCase().trim();
      const ordTitle = ord.course?.name || ord.items?.[0]?.title || '';
      const matchId = identifier && (ord.id === identifier || ord.invoiceNumber === identifier || ord.transactionId === identifier);
      const matchDetails = (courseTitle && ordTitle === courseTitle) && ((cleanPhone && ordPhone === cleanPhone) || (cleanEmail && ordEmail === cleanEmail));

      if (matchId || matchDetails) {
        approvedOrder = {
          ...ord,
          status: 'PAID',
          isApproved: true,
          approvedAt: new Date().toISOString()
        };
        return approvedOrder;
      }
      return ord;
    });

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));

    const finalTitle = courseTitle || approvedOrder?.course?.name || approvedOrder?.items?.[0]?.title || 'Course Enrollment';
    const finalAmount = Number(amount) || Number(approvedOrder?.totalPaid) || 0;

    // 1. Unlock course in local user storage (eh_current_user)
    try {
      const rawCur = localStorage.getItem('eh_current_user');
      if (rawCur) {
        const cur = JSON.parse(rawCur);
        const curPhone = (cur.whatsapp || cur.phone || '').replace(/[^0-9]/g, '');
        const curEmail = (cur.email || '').toLowerCase().trim();
        const isCurrentTarget = (cleanPhone && curPhone === cleanPhone) || (cleanEmail && curEmail === cleanEmail) || (!cleanPhone && !cleanEmail);

        if (isCurrentTarget) {
          const enrolled = Array.isArray(cur.enrolledCourses) ? cur.enrolledCourses : [];
          if (!enrolled.includes(finalTitle)) {
            cur.enrolledCourses = [finalTitle, ...enrolled];
            cur.totalSpent = (Number(cur.totalSpent) || 0) + finalAmount;
            localStorage.setItem('eh_current_user', JSON.stringify(cur));
          }
        }
      }

      // 2. Unlock in eh_registered_users
      const rawReg = localStorage.getItem('eh_registered_users');
      if (rawReg) {
        const regList = JSON.parse(rawReg);
        if (Array.isArray(regList)) {
          const updatedReg = regList.map(u => {
            const uPhone = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');
            const uEmail = (u.email || '').toLowerCase().trim();
            if ((cleanEmail && uEmail === cleanEmail) || (cleanPhone && uPhone === cleanPhone)) {
              const uEnrolled = Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [];
              return {
                ...u,
                status: 'Active',
                enrolledCourses: uEnrolled.includes(finalTitle) ? uEnrolled : [finalTitle, ...uEnrolled],
                totalSpent: (Number(u.totalSpent) || 0) + finalAmount
              };
            }
            return u;
          });
          localStorage.setItem('eh_registered_users', JSON.stringify(updatedReg));
        }
      }
    } catch (e) {}

    // 3. Update eh_enrolled_students to Active
    try {
      const rawStudents = localStorage.getItem('eh_enrolled_students');
      if (rawStudents) {
        const stList = JSON.parse(rawStudents);
        if (Array.isArray(stList)) {
          const nextStudents = stList.map(st => {
            const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
            const stEmail = (st.email || '').toLowerCase().trim();
            if ((cleanPhone && stPhone === cleanPhone) || (cleanEmail && stEmail === cleanEmail) || (st.courseName === finalTitle && cleanPhone && stPhone.includes(cleanPhone))) {
              return { ...st, status: 'Active' };
            }
            return st;
          });
          localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
        }
      }
    } catch (e) {}

    // 4. Update Cloud Firestore if configured
    if (isFirebaseConfigured && db) {
      const targetOrderId = approvedOrder?.id || (typeof identifier === 'string' && identifier.startsWith('ord_') ? identifier : null);
      if (targetOrderId) {
        try {
          setDoc(doc(db, 'orders', targetOrderId), {
            status: 'PAID',
            isApproved: true,
            approvedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        } catch (e) {}
      }

      // Automatically unlock course for student in Firestore users collection
      if (cleanEmail || cleanPhone) {
        try {
          getDocs(collection(db, 'users')).then(snap => {
            snap.docs.forEach(docSnap => {
              const uData = docSnap.data();
              const uEmail = (uData.email || '').toLowerCase().trim();
              const uPhone = (uData.whatsapp || uData.phone || '').replace(/[^0-9]/g, '');
              const isMatch = (cleanEmail && uEmail && uEmail === cleanEmail) ||
                              (cleanPhone && uPhone && (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone)));

              if (isMatch) {
                const enrolled = Array.isArray(uData.enrolledCourses) ? uData.enrolledCourses : [];
                if (!enrolled.includes(finalTitle)) {
                  setDoc(doc(db, 'users', docSnap.id), {
                    enrolledCourses: [finalTitle, ...enrolled],
                    status: 'Active',
                    totalSpent: (Number(uData.totalSpent) || 0) + finalAmount
                  }, { merge: true }).catch(() => {});
                }
              }
            });
          }).catch(() => {});
        } catch (e) {}
      }
    }

    // 5. Dispatch real-time unlock broadcast across tabs and windows
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:enrollment_approved', {
        detail: {
          orderId: approvedOrder?.id || identifier,
          courseTitle: finalTitle,
          studentPhone: cleanPhone,
          studentEmail: cleanEmail,
          studentName: studentName || approvedOrder?.customer?.name
        }
      }));
      window.dispatchEvent(new CustomEvent('eh:orders_updated'));
      window.dispatchEvent(new Event('storage'));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({
            type: 'ENROLLMENT_APPROVED',
            payload: {
              orderId: approvedOrder?.id || identifier,
              courseTitle: finalTitle,
              studentPhone: cleanPhone,
              studentEmail: cleanEmail,
              studentName: studentName || approvedOrder?.customer?.name
            }
          });
          bc.close();
        } catch (e) {}
      }
    }

    return approvedOrder;
  } catch (err) {
    console.error('[orderService] Failed to approve order:', err);
    return null;
  }
}
