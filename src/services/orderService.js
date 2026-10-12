// src/services/orderService.js
// Order & Professional Invoice Management Service for Edu Hunters

const ORDERS_STORAGE_KEY = 'eh_user_orders_v3';

export const INITIAL_ORDERS = [];

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
