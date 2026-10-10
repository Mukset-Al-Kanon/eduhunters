// src/services/orderService.js
// Order & Professional Invoice Management Service for Edu Hunters

const ORDERS_STORAGE_KEY = 'eh_user_orders_v3';

export const INITIAL_ORDERS = [
  {
    id: 'ord_exam_2026_9842',
    invoiceNumber: 'INV-2026-EH-009842',
    type: 'course',
    badge: 'Exam Batch',
    status: 'PAID',
    course: {
      name: 'Sure Shot Medical Admission Exam Batch 2025/26',
      slug: 'sureshot',
      targetType: 'exam',
      categoryKey: 'sureshot',
      fb_group: 'https://www.facebook.com/groups/1298423684604005'
    },
    customer: {
      name: 'Rafid Ahmed',
      email: 'rafid.ahmed99@gmail.com',
      phone: '01712-345678',
      studentId: 'EH-STU-9842',
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
      district: 'Dhaka',
      country: 'Bangladesh'
    },
    paymentGateway: 'bkash',
    paymentMethodName: 'bKash Mobile Financial Services',
    totalPaid: 1500,
    subtotal: 1800,
    discount: 300,
    vat: 0,
    transactionId: 'TXN90K2LM14',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item_1',
        title: 'Sure Shot Medical Admission Exam Batch 2025/26',
        subtitle: 'Comprehensive Medical Entrance Model Tests, Negative Marking Engine, Detailed Answer Analysis & Discussion Masterclasses',
        type: 'Digital Exam Series Access',
        quantity: 1,
        unitPrice: 1800,
        amount: 1800
      }
    ]
  },
  {
    id: 'ord_course_2026_8421',
    invoiceNumber: 'INV-2026-EH-008421',
    type: 'course',
    badge: 'Free Course',
    status: 'PAID',
    course: {
      name: 'Master English Grammar & Vocabulary Bootcamp (30 Days)',
      slug: 'master-english-30-days',
      targetType: 'course',
      fb_group: 'https://youtube.com/@eduhunters'
    },
    customer: {
      name: 'Rafid Ahmed',
      email: 'rafid.ahmed99@gmail.com',
      phone: '01712-345678',
      studentId: 'EH-STU-9842',
      address: 'Dhanmondi, Dhaka',
      district: 'Dhaka',
      country: 'Bangladesh'
    },
    paymentGateway: 'free',
    paymentMethodName: 'Promotional / Full Scholarship',
    totalPaid: 0,
    subtotal: 1500,
    discount: 1500,
    vat: 0,
    transactionId: 'TXN81N4FREE',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item_2',
        title: 'Master English Grammar & Vocabulary Bootcamp (30 Days)',
        subtitle: 'Full 30-Day Video Lectures, Grammar Worksheets, Daily Drills & Exam Preparation Guide',
        type: 'Online Video Course Access',
        quantity: 1,
        unitPrice: 1500,
        amount: 1500
      }
    ]
  },
  {
    id: 'ord_store_2026_6105',
    invoiceNumber: 'INV-2026-EH-006105',
    type: 'store',
    badge: 'Store Purchase',
    status: 'PAID',
    paymentGateway: 'bkash',
    paymentMethodName: 'bKash Merchant Pay',
    totalPaid: 450,
    subtotal: 500,
    discount: 50,
    vat: 0,
    transactionId: 'TXN72A8RT42',
    createdAt: new Date(Date.now() - 32 * 24 * 3600 * 1000).toISOString(),
    customer: {
      name: 'Md. Shafiqul Islam',
      email: 'shafiqul.islam@example.com',
      phone: '01712-345678',
      studentId: 'EH-STU-6105',
      address: 'House #12, Road #4, Dhanmondi',
      thana: 'Dhanmondi',
      district: 'Dhaka',
      country: 'Bangladesh'
    },
    fullName: 'Md. Shafiqul Islam',
    phone: '01712-345678',
    address: 'House #12, Road #4, Dhanmondi',
    thana: 'Dhanmondi',
    district: 'Dhaka',
    items: [
      {
        id: 'book_bio_1',
        title: 'Biology High-Yield Concept & MCQ Practice Book',
        subtitle: 'Official Printed Edition (Paperback) with 2000+ Verified Medical & University Admission Questions',
        type: 'Printed Academic Book',
        quantity: 1,
        price: 450,
        unitPrice: 450,
        amount: 450,
        book: {
          name: 'Biology High-Yield Concept & MCQ Practice Book',
          book_type: 'Printed Book',
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',
          download_url: null
        }
      }
    ]
  }
];

/**
 * Retrieves all stored user orders, initializing with sample orders if empty.
 */
export function getUserOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  } catch (err) {
    console.error('[orderService] Failed to load orders from localStorage:', err);
    return INITIAL_ORDERS;
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
 */
export function saveNewOrder({
  item,
  studentName,
  studentPhone,
  studentEmail,
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
    targetType: type === 'exam' ? 'exam' : undefined,
    badge,
    status: 'PAID',
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

  try {
    const existingOrders = getUserOrders();
    const updated = [newOrder, ...existingOrders];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch system event so OrdersPage and other listeners update in real time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:orders_updated', { detail: newOrder }));
    }
  } catch (err) {
    console.error('[orderService] Failed to save new order:', err);
  }

  return newOrder;
}
