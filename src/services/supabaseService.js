// src/services/supabaseService.js
import { supabase, isSupabaseConfigured } from '../supabase/config.js';
export { supabase, isSupabaseConfigured };
import { physicsFinishingTouchCourseData } from '../data/physicsFinishingTouchData.js';

/**
 * ==========================================
 * REAL-TIME BROADCAST BUS (Instant <50ms sync)
 * ==========================================
 */
let liveBus = null;

function getLiveBus() {
  if (!isSupabaseConfigured || !supabase) return null;
  if (!liveBus) {
    liveBus = supabase.channel('eduhunters_live_bus', {
      config: { broadcast: { self: false, ack: false } }
    });
    liveBus.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[SupabaseBus] Connected to ultra-fast real-time message bus.');
      }
    });
  }
  return liveBus;
}

export function broadcastSupabaseMessage(event, payload) {
  try {
    const bus = getLiveBus();
    if (bus) {
      bus.send({
        type: 'broadcast',
        event,
        payload
      }).catch(err => console.warn('[SupabaseBus] Send note:', err));
    }
  } catch (e) {}
}

export function subscribeToSupabaseMessage(event, callback) {
  if (!isSupabaseConfigured || !supabase || typeof callback !== 'function') {
    return () => {};
  }
  try {
    const bus = getLiveBus();
    if (bus) {
      bus.on('broadcast', { event }, (msg) => {
        if (msg?.payload) {
          callback(msg.payload);
        }
      });
    }
  } catch (e) {}
  return () => {};
}

/**
 * ==========================================
 * ORDERS & ENROLLMENT SYNCHRONIZATION
 * ==========================================
 */

/**
 * Save new enrollment order to Supabase
 */
export async function saveSupabaseOrder(order) {
  if (!isSupabaseConfigured || !supabase || !order) return null;
  try {
    const payload = {
      id: order.id,
      invoice_number: order.invoiceNumber || order.invoice_number,
      customer_name: order.customer?.name || order.studentName || 'Student',
      customer_phone: order.customer?.phone || order.studentPhone || '',
      customer_email: order.customer?.email || order.studentEmail || '',
      course_name: order.course?.name || order.itemTitle || 'Course Access',
      course_slug: order.course?.slug || '',
      amount: Number(order.totalPaid ?? order.amount ?? 0),
      payment_method: order.paymentMethodName || order.paymentMethod || 'bKash',
      trx_id: order.transactionId || order.trxId || 'PENDING',
      status: order.status || 'PENDING',
      is_approved: Boolean(order.isApproved),
      raw_data: order,
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Instant WebSocket Broadcast to Admin Panel (<50ms)
    broadcastSupabaseMessage('NEW_ORDER', payload);

    // 1.5 Safety check: Check if an order already exists for this email and course
    const cleanEmail = (payload.customer_email || '').trim().toLowerCase();
    const courseKey = (payload.course_name || '').trim();
    if (cleanEmail && cleanEmail.includes('@') && courseKey) {
      try {
        const { data: existingCloudOrder } = await supabase
          .from('eduhunters_orders')
          .select('id, status, is_approved, invoice_number')
          .ilike('customer_email', cleanEmail)
          .eq('course_name', courseKey)
          .limit(1)
          .maybeSingle();

        if (existingCloudOrder) {
          // If already approved/paid, NEVER downgrade or duplicate
          if (existingCloudOrder.is_approved || existingCloudOrder.status === 'PAID' || existingCloudOrder.status === 'COMPLETED') {
            return existingCloudOrder;
          }
          // If pending, reuse the existing ID and invoice number to update the existing record
          payload.id = existingCloudOrder.id;
          if (existingCloudOrder.invoice_number) {
            payload.invoice_number = existingCloudOrder.invoice_number;
          }
        }
      } catch (checkErr) {
        // Fallback silently
      }
    }

    // 2. Persistent save to PostgreSQL database
    const { data, error } = await supabase
      .from('eduhunters_orders')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Failed to save order:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] Order save exception:', err);
    return null;
  }
}

/**
 * Update order status (Approval / Rejection) in Supabase
 */
/**
 * Update order status (Approval / Rejection) in Supabase with multi-strategy ID resolution
 */
export async function updateSupabaseOrderStatus(orderId, updatesOrStatus, extraCriteria = {}) {
  if (!isSupabaseConfigured || !supabase || (!orderId && !extraCriteria.id && !extraCriteria.trxId && !extraCriteria.phone)) return false;
  try {
    const isStringStatus = typeof updatesOrStatus === 'string';
    const statusVal = isStringStatus ? updatesOrStatus.toUpperCase() : (updatesOrStatus?.status ? updatesOrStatus.status.toUpperCase() : 'PAID');
    const isApprovedVal = isStringStatus 
      ? (statusVal === 'PAID' || statusVal === 'COMPLETED')
      : (typeof updatesOrStatus?.isApproved === 'boolean' ? updatesOrStatus.isApproved : (statusVal === 'PAID' || statusVal === 'COMPLETED'));

    const payload = {
      status: statusVal,
      is_approved: isApprovedVal,
      updated_at: new Date().toISOString()
    };

    // Gather all candidate IDs to match in database
    const idsToTry = new Set();
    const addCandidate = (val) => {
      if (!val || typeof val !== 'string') return;
      const clean = val.trim();
      if (!clean) return;
      idsToTry.add(clean);
      if (clean.startsWith('TRX-')) {
        const withoutTrx = clean.replace(/^TRX-/, '');
        idsToTry.add(withoutTrx);
        if (!withoutTrx.startsWith('ord_')) idsToTry.add(`ord_${withoutTrx}`);
      }
      if (clean.startsWith('st-')) idsToTry.add(clean.replace(/^st-/, ''));
      if (clean.startsWith('ord_')) {
        idsToTry.add(clean.replace(/^ord_/, ''));
        idsToTry.add(`TRX-${clean}`);
      }
      if (!clean.startsWith('ord_') && !clean.startsWith('TRX-') && !clean.startsWith('ORD-ADM-') && !clean.startsWith('st-')) {
        idsToTry.add(`ord_${clean}`);
        idsToTry.add(`TRX-${clean}`);
        idsToTry.add(`TRX-ord_${clean}`);
      }
    };

    addCandidate(orderId);
    addCandidate(extraCriteria.id);
    addCandidate(extraCriteria.orderId);

    const candidateArray = Array.from(idsToTry);
    let matchedOrder = null;

    // 1. Try finding by ID candidates
    if (candidateArray.length > 0) {
      for (const cand of candidateArray) {
        const { data } = await supabase
          .from('eduhunters_orders')
          .select('*')
          .eq('id', cand)
          .maybeSingle();
        if (data) {
          matchedOrder = data;
          break;
        }
      }
    }

    // 2. Fallback: try finding by TrxID
    const targetTrxId = extraCriteria.trxId || (typeof orderId === 'string' && orderId.length > 6 && !orderId.startsWith('TRX-') && !orderId.startsWith('ord_') ? orderId : null);
    if (!matchedOrder && targetTrxId && targetTrxId !== 'PENDING' && targetTrxId !== 'PENDING_VERIFICATION') {
      const { data } = await supabase
        .from('eduhunters_orders')
        .select('*')
        .eq('trx_id', targetTrxId)
        .maybeSingle();
      if (data) {
        matchedOrder = data;
      }
    }

    // 3. Fallback: try finding by invoice number
    if (!matchedOrder && extraCriteria.invoiceNumber && extraCriteria.invoiceNumber !== 'INV-EH') {
      const { data } = await supabase
        .from('eduhunters_orders')
        .select('*')
        .eq('invoice_number', extraCriteria.invoiceNumber)
        .maybeSingle();
      if (data) {
        matchedOrder = data;
      }
    }

    // 4. Fallback: try finding by customer email
    if (!matchedOrder && extraCriteria.email) {
      const cleanEmail = String(extraCriteria.email).toLowerCase().trim();
      if (cleanEmail) {
        if (extraCriteria.courseTitle) {
          const { data: withCourse } = await supabase
            .from('eduhunters_orders')
            .select('*')
            .eq('customer_email', cleanEmail)
            .ilike('course_name', `%${extraCriteria.courseTitle.slice(0, 15)}%`)
            .order('created_at', { ascending: false })
            .limit(1);
          if (withCourse && withCourse.length > 0) {
            matchedOrder = withCourse[0];
          }
        }
        if (!matchedOrder) {
          const { data: anyPending } = await supabase
            .from('eduhunters_orders')
            .select('*')
            .eq('customer_email', cleanEmail)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(1);
          if (anyPending && anyPending.length > 0) {
            matchedOrder = anyPending[0];
          }
        }
      }
    }

    // 5. Fallback: try finding by phone (+ course name)
    if (!matchedOrder && extraCriteria.phone) {
      const cleanPhone = String(extraCriteria.phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8) {
        const last8 = cleanPhone.slice(-8);
        const { data: phoneMatches } = await supabase
          .from('eduhunters_orders')
          .select('*')
          .ilike('customer_phone', `%${last8}%`)
          .order('created_at', { ascending: false });
        if (phoneMatches && phoneMatches.length > 0) {
          if (extraCriteria.courseTitle) {
            const courseMatch = phoneMatches.find(m => (m.course_name || '').toLowerCase().includes(extraCriteria.courseTitle.toLowerCase().slice(0, 15)));
            matchedOrder = courseMatch || phoneMatches[0];
          } else {
            matchedOrder = phoneMatches[0];
          }
        }
      }
    }

    // Prepare updated raw_data
    const existingRaw = matchedOrder?.raw_data || (typeof updatesOrStatus === 'object' && updatesOrStatus?.raw_data ? updatesOrStatus.raw_data : null);
    if (existingRaw) {
      payload.raw_data = {
        ...existingRaw,
        status: statusVal,
        isApproved: isApprovedVal,
        is_approved: isApprovedVal,
        updatedAt: new Date().toISOString()
      };
      if (payload.raw_data.transaction) {
        payload.raw_data.transaction.status = isApprovedVal ? 'Completed' : (statusVal === 'REJECTED' ? 'Rejected' : 'Pending');
      }
      if (payload.raw_data.student) {
        payload.raw_data.student.status = isApprovedVal ? 'Active' : 'Pending';
      }
    }

    // Execute update on matched ID or candidate IDs
    let updateQuery = supabase.from('eduhunters_orders').update(payload);
    if (matchedOrder?.id) {
      updateQuery = updateQuery.eq('id', matchedOrder.id);
    } else if (candidateArray.length > 0) {
      updateQuery = updateQuery.in('id', candidateArray);
    } else if (targetTrxId) {
      updateQuery = updateQuery.eq('trx_id', targetTrxId);
    }

    const { error } = await updateQuery;
    if (error) {
      console.warn('[Supabase] Failed to update order:', error.message);
    }

    // Automatic Guarantee: If approved, ensure student profile in eduhunters_users is instantly unlocked
    if (isApprovedVal && (statusVal === 'PAID' || statusVal === 'COMPLETED')) {
      const studentEmail = (matchedOrder?.customer_email || extraCriteria.email || '').toLowerCase().trim();
      const studentPhone = (matchedOrder?.customer_phone || extraCriteria.phone || '').replace(/[^0-9]/g, '');
      const studentUid = matchedOrder?.raw_data?.userId || matchedOrder?.raw_data?.customer?.uid || extraCriteria.uid || extraCriteria.userId;
      const courseTitleToGrant = extraCriteria.courseTitle || matchedOrder?.course_name || matchedOrder?.raw_data?.course?.name;
      const studentName = matchedOrder?.customer_name || extraCriteria.studentName || 'Student';

      if (courseTitleToGrant && (studentEmail || studentPhone || studentUid)) {
        saveSupabaseUser({
          uid: studentUid,
          id: studentUid,
          email: studentEmail,
          phone: studentPhone,
          displayName: studentName,
          name: studentName,
          role: 'Student'
        }, {
          enrolledCourses: [courseTitleToGrant]
        }).catch(e => console.warn('[Supabase] Auto user enrollment unlock note:', e));
      }
    }

    // Instant Broadcast to all users / student device
    broadcastSupabaseMessage('ORDER_STATUS_CHANGED', { 
      orderId: matchedOrder?.id || orderId, 
      status: statusVal, 
      isApproved: isApprovedVal 
    });

    return !error;
  } catch (err) {
    console.warn('[Supabase] Order update exception:', err);
    return false;
  }
}

/**
 * Permanently delete order from Supabase
 */
export async function deleteSupabaseOrder(orderId, extraCriteria = {}) {
  if (!isSupabaseConfigured || !supabase || !orderId) return false;
  try {
    const idsToTry = new Set();
    if (orderId) idsToTry.add(orderId);
    if (typeof orderId === 'string') {
      if (orderId.startsWith('TRX-')) idsToTry.add(orderId.replace('TRX-', ''));
      if (orderId.startsWith('st-')) idsToTry.add(orderId.replace('st-', ''));
    }
    if (extraCriteria.id) {
      idsToTry.add(extraCriteria.id);
      if (typeof extraCriteria.id === 'string') {
        if (extraCriteria.id.startsWith('TRX-')) idsToTry.add(extraCriteria.id.replace('TRX-', ''));
        if (extraCriteria.id.startsWith('st-')) idsToTry.add(extraCriteria.id.replace('st-', ''));
      }
    }
    if (extraCriteria.orderId) idsToTry.add(extraCriteria.orderId);

    for (const id of idsToTry) {
      await supabase
        .from('eduhunters_orders')
        .delete()
        .eq('id', id);
    }

    if (extraCriteria.trxId && extraCriteria.trxId !== 'PENDING' && extraCriteria.trxId !== 'PENDING_VERIFICATION') {
      await supabase
        .from('eduhunters_orders')
        .delete()
        .eq('trx_id', extraCriteria.trxId);
    }
    if (extraCriteria.invoiceNumber && extraCriteria.invoiceNumber !== 'INV-EH') {
      await supabase
        .from('eduhunters_orders')
        .delete()
        .eq('invoice_number', extraCriteria.invoiceNumber);
    }

    broadcastSupabaseMessage('ORDER_DELETED', { orderId });
    return true;
  } catch (err) {
    console.warn('[Supabase] Order deletion exception:', err);
    return false;
  }
}

/**
 * Update transaction amount in Supabase order
 */
export async function updateSupabaseOrderAmount(orderId, newAmount, extraCriteria = {}) {
  if (!isSupabaseConfigured || !supabase || !orderId) return false;
  try {
    const num = Number(newAmount) || 0;
    const idsToTry = new Set();
    if (orderId) idsToTry.add(orderId);
    if (typeof orderId === 'string') {
      if (orderId.startsWith('TRX-')) idsToTry.add(orderId.replace('TRX-', ''));
      if (orderId.startsWith('st-')) idsToTry.add(orderId.replace('st-', ''));
    }
    if (extraCriteria.id) {
      idsToTry.add(extraCriteria.id);
      if (typeof extraCriteria.id === 'string') {
        if (extraCriteria.id.startsWith('TRX-')) idsToTry.add(extraCriteria.id.replace('TRX-', ''));
        if (extraCriteria.id.startsWith('st-')) idsToTry.add(extraCriteria.id.replace('st-', ''));
      }
    }
    if (extraCriteria.orderId) idsToTry.add(extraCriteria.orderId);

    let matchedId = null;
    let existingRaw = null;

    for (const id of idsToTry) {
      const { data } = await supabase
        .from('eduhunters_orders')
        .select('id, raw_data')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        matchedId = data.id;
        existingRaw = data.raw_data;
        break;
      }
    }

    if (!matchedId && extraCriteria.trxId && extraCriteria.trxId !== 'PENDING' && extraCriteria.trxId !== 'PENDING_VERIFICATION') {
      const { data } = await supabase
        .from('eduhunters_orders')
        .select('id, raw_data')
        .eq('trx_id', extraCriteria.trxId)
        .maybeSingle();
      if (data) {
        matchedId = data.id;
        existingRaw = data.raw_data;
      }
    }

    if (matchedId) {
      const updatedRaw = {
        ...(existingRaw || {}),
        totalPaid: num,
        amount: num
      };
      if (updatedRaw.transaction) updatedRaw.transaction.amount = num;
      if (updatedRaw.student) updatedRaw.student.amount = num;

      await supabase
        .from('eduhunters_orders')
        .update({
          amount: num,
          raw_data: updatedRaw,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchedId);
    }

    broadcastSupabaseMessage('ORDER_AMOUNT_UPDATED', { orderId, amount: num });
    return true;
  } catch (err) {
    console.warn('[Supabase] Order amount update exception:', err);
    return false;
  }
}

/**
 * Fetch all orders from Supabase
 */
export async function fetchSupabaseOrders() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('eduhunters_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('[Supabase] Failed to fetch orders:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      ...row.raw_data,
      id: row.id,
      invoiceNumber: row.invoice_number,
      status: row.status,
      isApproved: row.is_approved,
      transactionId: row.trx_id,
      paymentMethodName: row.payment_method,
      totalPaid: row.amount,
      createdAt: row.created_at,
      course_name: row.course_name,
      course_slug: row.course_slug,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      customer: {
        ...(row.raw_data?.customer || {}),
        name: row.customer_name || row.raw_data?.customer?.name,
        email: row.customer_email || row.raw_data?.customer?.email,
        phone: row.customer_phone || row.raw_data?.customer?.phone
      },
      course: {
        ...(row.raw_data?.course || {}),
        name: row.course_name || row.raw_data?.course?.name,
        title: row.course_name || row.raw_data?.course?.title,
        slug: row.course_slug || row.raw_data?.course?.slug
      }
    }));
  } catch (err) {
    console.warn('[Supabase] Fetch orders exception:', err);
    return [];
  }
}

/**
 * Real-time subscription for orders (Deduplicated to prevent 2x duplicate notifications)
 */
export function subscribeToSupabaseOrders(onOrderChange) {
  if (!isSupabaseConfigured || !supabase || typeof onOrderChange !== 'function') {
    return () => {};
  }

  // Deduplication cache so broadcast + postgres_changes don't trigger 2x duplicate notifications
  const recentOrderEvents = new Set();
  const notifyOnce = (eventType, mappedOrder) => {
    if (!mappedOrder?.id && !mappedOrder?.invoiceNumber && !mappedOrder?.transactionId) return;
    const key = `${eventType}_${mappedOrder.id || mappedOrder.invoiceNumber || mappedOrder.transactionId}`;
    if (recentOrderEvents.has(key)) return;
    recentOrderEvents.add(key);
    setTimeout(() => recentOrderEvents.delete(key), 8000);
    onOrderChange({ eventType, order: mappedOrder });
  };

  // 1. Instant WebSocket Broadcast listener
  const unsubscribeBroadcast = subscribeToSupabaseMessage('NEW_ORDER', (payload) => {
    if (!payload) return;
    const mappedOrder = {
      ...(payload.raw_data || payload),
      id: payload.id,
      invoiceNumber: payload.invoice_number || payload.invoiceNumber,
      status: payload.status,
      isApproved: payload.is_approved !== undefined ? payload.is_approved : payload.isApproved,
      transactionId: payload.trx_id || payload.transactionId,
      paymentMethodName: payload.payment_method || payload.paymentMethodName,
      totalPaid: payload.amount !== undefined ? payload.amount : payload.totalPaid,
      createdAt: payload.created_at || payload.createdAt
    };
    notifyOnce('INSERT', mappedOrder);
  });

  // 2. PostgreSQL CDC listener
  const channelId = `eduhunters_orders_cdc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'eduhunters_orders' },
      (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        const mappedOrder = {
          ...(row.raw_data || {}),
          id: row.id,
          invoiceNumber: row.invoice_number,
          status: row.status,
          isApproved: row.is_approved,
          transactionId: row.trx_id,
          paymentMethodName: row.payment_method,
          totalPaid: row.amount,
          createdAt: row.created_at
        };
        notifyOnce(payload.eventType, mappedOrder);
      }
    )
    .subscribe();

  return () => {
    if (typeof unsubscribeBroadcast === 'function') unsubscribeBroadcast();
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch all approved courses and orders for a specific student across any device
 */
export async function fetchUserApprovedEnrollments(email, phone, uid) {
  if (!isSupabaseConfigured || !supabase) return { courses: [], orders: [] };
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    if (!cleanEmail && !cleanPhone && !uid) return { courses: [], orders: [] };

    // 1. Fetch user record from eduhunters_users
    let userEnrolled = [];
    let dbUser = null;
    try {
      if (uid) {
        const { data } = await supabase.from('eduhunters_users').select('*').eq('id', uid).maybeSingle();
        dbUser = data;
      }
      if (!dbUser && cleanEmail) {
        const { data } = await supabase.from('eduhunters_users').select('*').eq('email', cleanEmail).maybeSingle();
        dbUser = data;
      }
      if (!dbUser && cleanPhone && cleanPhone.length >= 8) {
        const { data } = await supabase.from('eduhunters_users').select('*').ilike('phone', `%${cleanPhone.slice(-8)}%`).maybeSingle();
        dbUser = data;
      }
      if (dbUser && Array.isArray(dbUser.enrolled_courses)) {
        userEnrolled = dbUser.enrolled_courses;
      }
    } catch (e) {}

    // 2. Fetch all approved/paid orders from eduhunters_orders
    const filterClauses = [];
    if (cleanEmail) filterClauses.push(`customer_email.eq.${cleanEmail}`);
    if (cleanPhone && cleanPhone.length >= 6) {
      filterClauses.push(`customer_phone.eq.${cleanPhone}`);
      const raw10 = cleanPhone.slice(-10);
      if (raw10.length === 10) {
        filterClauses.push(`customer_phone.eq.0${raw10}`);
        filterClauses.push(`customer_phone.eq.880${raw10}`);
        filterClauses.push(`customer_phone.eq.+880${raw10}`);
      }
    }

    let ordersList = [];
    if (filterClauses.length > 0) {
      const { data: matchedOrders, error } = await supabase
        .from('eduhunters_orders')
        .select('*')
        .or(filterClauses.join(','))
        .in('status', ['PAID', 'Completed', 'paid', 'completed', 'APPROVED', 'Approved', 'approved', 'SUCCESS', 'success'])
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(matchedOrders)) {
        ordersList = matchedOrders.map(row => ({
          ...(row.raw_data || {}),
          id: row.id,
          invoiceNumber: row.invoice_number,
          status: 'PAID',
          isApproved: true,
          transactionId: row.trx_id,
          paymentMethodName: row.payment_method,
          totalPaid: row.amount,
          customer: {
            name: row.customer_name,
            email: row.customer_email,
            phone: row.customer_phone,
            uid: uid || row.raw_data?.userId || row.raw_data?.customer?.uid
          },
          userId: uid || row.raw_data?.userId || row.raw_data?.customer?.uid,
          course: {
            id: row.course_slug || row.id,
            name: row.course_name,
            title: row.course_name,
            slug: row.course_slug || ''
          },
          createdAt: row.created_at
        }));
      }
    }

    // Collect all course titles, slugs, IDs, and exam batches
    const courseKeys = new Set(userEnrolled);
    const batchKeys = new Set();
    if (dbUser && Array.isArray(dbUser.enrolled_batches)) {
      dbUser.enrolled_batches.forEach(b => batchKeys.add(b));
    }

    ordersList.forEach(ord => {
      if (ord.course?.name) courseKeys.add(ord.course.name);
      if (ord.course?.title) courseKeys.add(ord.course.title);
      if (ord.course?.slug) courseKeys.add(ord.course.slug);
      if (ord.course?.id) courseKeys.add(ord.course.id);
      if (ord.raw_data?.course?.name) courseKeys.add(ord.raw_data.course.name);
      if (ord.raw_data?.course?.slug) courseKeys.add(ord.raw_data.course.slug);

      if (ord.batchId) batchKeys.add(ord.batchId);
      if (ord.batchName) batchKeys.add(ord.batchName);
      if (ord.raw_data?.batchId) batchKeys.add(ord.raw_data.batchId);
      if (ord.raw_data?.batchName) batchKeys.add(ord.raw_data.batchName);
      if (ord.raw_data?.isBatch || ord.isBatch) {
        if (ord.course?.id) batchKeys.add(ord.course.id);
        if (ord.course?.name) batchKeys.add(ord.course.name);
        if (ord.course?.slug) batchKeys.add(ord.course.slug);
      }
    });

    return {
      courses: Array.from(courseKeys),
      batches: Array.from(batchKeys),
      orders: ordersList
    };
  } catch (err) {
    console.warn('[Supabase] fetchUserApprovedEnrollments exception:', err);
    return { courses: [], batches: [], orders: [] };
  }
}

/**
 * ==========================================
 * SITE DATA (SLIDERS, COURSES, SETTINGS)
 * ==========================================
 */

let _pendingSiteData = null;
let _siteDataDebounceTimer = null;
let _siteDataResolvers = [];

async function executeSaveSupabaseSiteData(siteData) {
  if (!isSupabaseConfigured || !supabase || !siteData) return false;
  try {
    const sanitized = JSON.parse(JSON.stringify(siteData, (key, value) => {
      if (value === undefined) return null;
      return value;
    }));

    // Guarantee _lastUpdated is always a valid ISO timestamp so clients never reject updates
    const now = new Date().toISOString();
    sanitized._lastUpdated = sanitized._lastUpdated || now;

    // Critical Protection: If sanitized is missing users or accounting, merge from local cache so user course access is NEVER wiped
    try {
      const cached = JSON.parse(localStorage.getItem('eduhunters_data') || '{}');
      if ((!Array.isArray(sanitized.users) || sanitized.users.length === 0) && Array.isArray(cached.users) && cached.users.length > 0) {
        sanitized.users = cached.users;
      }
      if (!sanitized.accounting && cached.accounting) {
        sanitized.accounting = cached.accounting;
      }
      if (!sanitized.siteSettings && cached.siteSettings) {
        sanitized.siteSettings = cached.siteSettings;
      }
      if (!sanitized.heroSlides && cached.heroSlides) {
        sanitized.heroSlides = cached.heroSlides;
      }
    } catch (e) {}

    // Clean ephemeral blob: URLs from courses so dead memory URLs are not persisted
    if (Array.isArray(sanitized.courses)) {
      sanitized.courses = sanitized.courses.map(c => {
        if (!c || !Array.isArray(c.curriculum)) return c;
        const cleanedCurriculum = c.curriculum.map(sec => {
          const chapters = Array.isArray(sec.chapters) ? sec.chapters.map(ch => {
            const lessons = Array.isArray(ch.lessons) ? ch.lessons.map(les => {
              if (typeof les === 'object' && les !== null) {
                return {
                  ...les,
                  videoUrl: typeof les.videoUrl === 'string' && les.videoUrl.startsWith('blob:') ? '' : les.videoUrl,
                  pdfUrl: typeof les.pdfUrl === 'string' && les.pdfUrl.startsWith('blob:') ? '' : les.pdfUrl
                };
              }
              return les;
            }) : [];
            return { ...ch, lessons };
          }) : [];

          const lessons = Array.isArray(sec.lessons) ? sec.lessons.map(les => {
            if (typeof les === 'object' && les !== null) {
              return {
                ...les,
                videoUrl: typeof les.videoUrl === 'string' && les.videoUrl.startsWith('blob:') ? '' : les.videoUrl,
                pdfUrl: typeof les.pdfUrl === 'string' && les.pdfUrl.startsWith('blob:') ? '' : les.pdfUrl
              };
            }
            return les;
          }) : [];

          return { ...sec, chapters, lessons };
        });
        return { ...c, curriculum: cleanedCurriculum };
      });
    }

    // Bulletproof Guard: Protect Physics 1st paper Finishing Touch Series and its 5 chapters/quizzes
    if (sanitized && Array.isArray(sanitized.courses)) {
      const physIdx = sanitized.courses.findIndex(c => 
        c && (c.id === 'course-1791887161017' || c.slug === 'physics-finishing-touch-series')
      );
      if (physIdx !== -1) {
        const cur = sanitized.courses[physIdx];
        const lessons = cur?.curriculum?.[0]?.lessons || cur?.curriculum?.sections?.[0]?.lessons;
        if (!lessons || lessons.length < 5 || !lessons[0]?.quiz?.questions?.length) {
          sanitized.courses[physIdx] = {
            ...cur,
            ...physicsFinishingTouchCourseData,
            curriculum: physicsFinishingTouchCourseData.curriculum
          };
        }
      } else {
        sanitized.courses.push(physicsFinishingTouchCourseData);
      }
    }

    const payload = {
      id: 'main_data',
      data: sanitized,
      updated_at: now
    };

    // 1. Instant broadcast to all visiting tabs and windows (<50ms)
    broadcastSupabaseMessage('SITE_DATA_UPDATED', sanitized);

    // 2. Persistent save to PostgreSQL database
    const { error } = await supabase
      .from('eduhunters_site')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Failed to save site data:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Site data save exception:', err);
    return false;
  }
}

/**
 * Save site data (Hero slider, courses, settings) to Supabase with automatic coalescing debounce (200ms)
 */
export async function saveSupabaseSiteData(siteData) {
  if (!isSupabaseConfigured || !supabase || !siteData) return false;

  // Merge into in-memory queue to prevent losing fast successive updates
  _pendingSiteData = {
    ...(_pendingSiteData || {}),
    ...siteData,
    courses: siteData.courses || _pendingSiteData?.courses,
    users: siteData.users || _pendingSiteData?.users,
    accounting: siteData.accounting || _pendingSiteData?.accounting,
    _lastUpdated: siteData._lastUpdated || new Date().toISOString()
  };

  return new Promise((resolve) => {
    _siteDataResolvers.push(resolve);

    if (_siteDataDebounceTimer) {
      clearTimeout(_siteDataDebounceTimer);
    }

    _siteDataDebounceTimer = setTimeout(async () => {
      const dataToSave = _pendingSiteData;
      const resolvers = [..._siteDataResolvers];
      _pendingSiteData = null;
      _siteDataResolvers = [];
      _siteDataDebounceTimer = null;

      try {
        const result = await executeSaveSupabaseSiteData(dataToSave);
        resolvers.forEach(r => r(result));
      } catch (err) {
        resolvers.forEach(r => r(false));
      }
    }, 200);
  });
}

/**
 * Fetch site data from Supabase
 */
export async function fetchSupabaseSiteData() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('eduhunters_site')
      .select('data, updated_at')
      .eq('id', 'main_data')
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('[Supabase] Failed to fetch site data:', error.message);
      }
      return null;
    }
    if (!data?.data) return null;
    const siteData = data.data;
    siteData._lastUpdated = siteData._lastUpdated || data.updated_at || new Date().toISOString();
    return siteData;
  } catch (err) {
    console.warn('[Supabase] Fetch site data exception:', err);
    return null;
  }
}

/**
 * Real-time subscription for site data (Hero slider & course edits across devices)
 */
export function subscribeToSupabaseSiteData(onUpdate) {
  if (!isSupabaseConfigured || !supabase || typeof onUpdate !== 'function') {
    return () => {};
  }

  // 1. Instant Broadcast listener
  const unsubscribeBroadcast = subscribeToSupabaseMessage('SITE_DATA_UPDATED', (newData) => {
    if (newData) {
      newData._lastUpdated = newData._lastUpdated || new Date().toISOString();
      onUpdate(newData);
    }
  });

  // 2. PostgreSQL CDC listener
  const channelId = `eduhunters_site_cdc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'eduhunters_site', filter: 'id=eq.main_data' },
      (payload) => {
        const newData = payload.new?.data;
        const updatedAt = payload.new?.updated_at;
        if (newData) {
          newData._lastUpdated = newData._lastUpdated || updatedAt || new Date().toISOString();
          onUpdate(newData);
        }
      }
    )
    .subscribe();

  // 3. Proactive initial fetch so current database state is loaded immediately on start
  fetchSupabaseSiteData().then(existingData => {
    if (existingData) {
      onUpdate(existingData);
    }
  }).catch(err => {
    console.warn('[Supabase] Initial fetch in subscription note:', err);
  });

  return () => {
    if (typeof unsubscribeBroadcast === 'function') unsubscribeBroadcast();
    supabase.removeChannel(channel);
  };
}

/**
 * ==========================================
 * USERS SYNCHRONIZATION
 * ==========================================
 */

/**
 * Sync user profile to Supabase
 */
export async function saveSupabaseUser(user, extra = {}) {
  const targetId = user?.uid || user?.id || (user?.email ? 'u_' + btoa(user.email).replace(/[^a-zA-Z0-9]/g, '') : null);
  if (!isSupabaseConfigured || !supabase || !targetId) return false;
  try {
    const isNew = Boolean(extra.isNewRegistration);

    // Fetch existing user record to preserve and merge enrolled_courses and raw_data
    let existingId = targetId;
    let existingEnrolled = [];
    let existingRaw = {};
    let existingUser = null;
    try {
      const { data } = await supabase
        .from('eduhunters_users')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();
      existingUser = data;

      if (!existingUser && (user.email || extra.email)) {
        const cleanEmail = (user.email || extra.email).toLowerCase().trim();
        const { data: userByEmail } = await supabase
          .from('eduhunters_users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (userByEmail) {
          existingUser = userByEmail;
          existingId = userByEmail.id;
        }
      }

      if (!existingUser && (user.phone || user.whatsapp || extra.phone || extra.whatsapp)) {
        const cleanPhone = String(user.phone || user.whatsapp || extra.phone || extra.whatsapp).replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 8) {
          const { data: userByPhone } = await supabase
            .from('eduhunters_users')
            .select('*')
            .ilike('phone', `%${cleanPhone.slice(-8)}%`)
            .maybeSingle();
          if (userByPhone) {
            existingUser = userByPhone;
            existingId = userByPhone.id;
          }
        }
      }

      if (existingUser) {
        if (Array.isArray(existingUser.enrolled_courses)) {
          existingEnrolled = existingUser.enrolled_courses;
        }
        if (existingUser.raw_data && typeof existingUser.raw_data === 'object') {
          existingRaw = existingUser.raw_data;
        }
      }
    } catch (e) {}

    const incomingCourses = Array.isArray(user.enrolledCourses)
      ? user.enrolledCourses
      : Array.isArray(extra.enrolledCourses)
        ? extra.enrolledCourses
        : [];

    let mergedCourses = extra.overwriteEnrolledCourses
      ? incomingCourses
      : Array.from(new Set([
          ...existingEnrolled,
          ...incomingCourses
        ])).filter(Boolean);

    // Expand canonical aliases for Physics Finishing Touch Series if enrolled
    const hasPhysicsFinishing = mergedCourses.some(c => {
      const low = String(c).toLowerCase();
      return low.includes('1791887161017') || low.includes('physics-finishing-touch-series') || (low.includes('physics') && low.includes('finishing'));
    });
    if (hasPhysicsFinishing) {
      mergedCourses = Array.from(new Set([
        'Physics Finishing Touch Series',
        'course-1791887161017',
        'physics-finishing-touch-series',
        'Physics 1st paper Finishing Touch Series',
        ...mergedCourses
      ]));
    }

    const finalName = (user.displayName || user.name || extra.displayName || extra.name || existingRaw.displayName || existingRaw.name || user.email?.split('@')[0] || '').trim();
    const finalPhone = (user.whatsapp || user.phone || user.phoneNumber || extra.whatsapp || extra.phone || existingRaw.whatsapp || existingRaw.phone || '').trim();
    const finalCollege = (user.college || user.institution || extra.college || extra.institution || existingRaw.college || existingRaw.institution || '').trim();
    const finalBatch = (user.hscBatch || user.batch || extra.hscBatch || extra.batch || existingRaw.hscBatch || existingRaw.batch || '').trim();
    const finalPhoto = user.photoURL || extra.photoURL || existingRaw.photoURL || '/avatar.svg';
    const finalEmail = (user.email || extra.email || existingRaw.email || '').toLowerCase().trim();
    const finalRole = user.role || extra.role || existingRaw.role || 'student';

    const mergedRaw = {
      ...existingRaw,
      ...user,
      ...extra,
      id: existingId,
      uid: existingId,
      email: finalEmail,
      name: finalName,
      displayName: finalName,
      phone: finalPhone,
      whatsapp: finalPhone,
      college: finalCollege,
      institution: finalCollege,
      hscBatch: finalBatch,
      batch: finalBatch,
      photoURL: finalPhoto,
      avatar: finalPhoto,
      role: finalRole,
      enrolledCourses: mergedCourses
    };

    const createdTimestamp = existingUser?.created_at || existingRaw?.createdAt || existingRaw?.created_at || new Date().toISOString();
    mergedRaw.createdAt = createdTimestamp;
    mergedRaw.created_at = createdTimestamp;

    const payload = {
      id: existingId,
      email: finalEmail,
      name: finalName,
      phone: finalPhone,
      role: finalRole,
      enrolled_courses: mergedCourses,
      raw_data: mergedRaw,
      created_at: createdTimestamp,
      last_active_at: new Date().toISOString()
    };

    // 1. Instant broadcast to Admin Panel (<50ms) ONLY on genuine new registrations
    if (isNew) {
      broadcastSupabaseMessage('USER_REGISTERED', { ...payload, isNewRegistration: true, registeredAt: Date.now() });
    } else {
      broadcastSupabaseMessage('USER_UPDATED', payload);
    }

    // 2. Persistent save to PostgreSQL database
    const { error } = await supabase
      .from('eduhunters_users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Failed to sync user:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Sync user exception:', err);
    return false;
  }
}

/**
 * Fetch all users from Supabase for AdminPanel
 */
export async function fetchSupabaseUsers() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('eduhunters_users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('[Supabase] Failed to fetch users:', error.message);
      return [];
    }
    return (data || []).map(row => {
      const raw = row.raw_data || {};
      const finalName = (raw.displayName || raw.name || row.name || '').trim();
      const finalPhone = (raw.whatsapp || raw.phone || row.phone || '').trim();
      const finalCollege = (raw.college || raw.institution || '').trim();
      const finalBatch = (raw.hscBatch || raw.batch || '').trim();
      const finalPhoto = raw.photoURL || raw.avatar || '/avatar.svg';
      const roleStr = raw.role || row.role;
      const createdIso = row.created_at || raw.createdAt || raw.created_at || row.last_active_at || new Date().toISOString();
      return {
        ...raw,
        uid: row.id,
        id: row.id,
        email: row.email || raw.email,
        name: finalName,
        displayName: finalName,
        phone: finalPhone,
        whatsapp: finalPhone,
        college: finalCollege,
        institution: finalCollege,
        batch: finalBatch,
        hscBatch: finalBatch,
        avatar: finalPhoto,
        photoURL: finalPhoto,
        role: roleStr === 'admin' ? 'Admin' : 'Student',
        enrolledCourses: Array.isArray(row.enrolled_courses) ? row.enrolled_courses : (Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : []),
        created_at: createdIso,
        createdAt: createdIso
      };
    });
  } catch (err) {
    console.warn('[Supabase] Fetch users exception:', err);
    return [];
  }
}

/**
 * Real-time subscription for users
 */
export function subscribeToSupabaseUsers(onUserChange) {
  if (!isSupabaseConfigured || !supabase || typeof onUserChange !== 'function') {
    return () => {};
  }

  // 1. Instant broadcast listener for genuine new registrations
  const unsubscribeBroadcast = subscribeToSupabaseMessage('USER_REGISTERED', (payload) => {
    const raw = payload.raw_data || {};
    const finalName = (raw.displayName || raw.name || payload.name || '').trim();
    const finalPhone = (raw.whatsapp || raw.phone || payload.phone || '').trim();
    const finalCollege = (raw.college || raw.institution || '').trim();
    const finalBatch = (raw.hscBatch || raw.batch || '').trim();
    const finalPhoto = raw.photoURL || raw.avatar || '/avatar.svg';
    const mappedUser = {
      ...raw,
      uid: payload.id,
      id: payload.id,
      email: payload.email || raw.email,
      name: finalName,
      displayName: finalName,
      phone: finalPhone,
      whatsapp: finalPhone,
      college: finalCollege,
      institution: finalCollege,
      batch: finalBatch,
      hscBatch: finalBatch,
      avatar: finalPhoto,
      photoURL: finalPhoto,
      role: (raw.role || payload.role) === 'admin' ? 'Admin' : 'Student',
      enrolledCourses: Array.isArray(payload.enrolled_courses) ? payload.enrolled_courses : (Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : []),
      isNewRegistration: true,
      registeredAt: payload.registeredAt || Date.now(),
      created_at: payload.created_at || raw.createdAt || new Date().toISOString(),
      createdAt: payload.created_at || raw.createdAt || new Date().toISOString()
    };
    onUserChange({ eventType: 'INSERT', user: mappedUser });
  });

  // Listener for user profile updates
  const unsubscribeUpdate = subscribeToSupabaseMessage('USER_UPDATED', (payload) => {
    const raw = payload.raw_data || {};
    const finalName = (raw.displayName || raw.name || payload.name || '').trim();
    const finalPhone = (raw.whatsapp || raw.phone || payload.phone || '').trim();
    const finalCollege = (raw.college || raw.institution || '').trim();
    const finalBatch = (raw.hscBatch || raw.batch || '').trim();
    const finalPhoto = raw.photoURL || raw.avatar || '/avatar.svg';
    const mappedUser = {
      ...raw,
      uid: payload.id,
      id: payload.id,
      email: payload.email || raw.email,
      name: finalName,
      displayName: finalName,
      phone: finalPhone,
      whatsapp: finalPhone,
      college: finalCollege,
      institution: finalCollege,
      batch: finalBatch,
      hscBatch: finalBatch,
      avatar: finalPhoto,
      photoURL: finalPhoto,
      role: (raw.role || payload.role) === 'admin' ? 'Admin' : 'Student',
      enrolledCourses: Array.isArray(payload.enrolled_courses) ? payload.enrolled_courses : (Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : []),
      created_at: payload.created_at || raw.created_at || raw.createdAt || new Date().toISOString(),
      createdAt: payload.created_at || raw.created_at || raw.createdAt || new Date().toISOString()
    };
    onUserChange({ eventType: 'UPDATE', user: mappedUser });
  });

  // 2. PostgreSQL CDC listener
  const channelId = `eduhunters_users_cdc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'eduhunters_users' },
      (payload) => {
        const row = payload.new;
        if (row) {
          const raw = row.raw_data || {};
          const finalName = (raw.displayName || raw.name || row.name || '').trim();
          const finalPhone = (raw.whatsapp || raw.phone || row.phone || '').trim();
          const finalCollege = (raw.college || raw.institution || '').trim();
          const finalBatch = (raw.hscBatch || raw.batch || '').trim();
          const finalPhoto = raw.photoURL || raw.avatar || '/avatar.svg';
          const mappedUser = {
            ...raw,
            uid: row.id,
            id: row.id,
            email: row.email || raw.email,
            name: finalName,
            displayName: finalName,
            phone: finalPhone,
            whatsapp: finalPhone,
            college: finalCollege,
            institution: finalCollege,
            batch: finalBatch,
            hscBatch: finalBatch,
            avatar: finalPhoto,
            photoURL: finalPhoto,
            role: (raw.role || row.role) === 'admin' ? 'Admin' : 'Student',
            enrolledCourses: Array.isArray(row.enrolled_courses) ? row.enrolled_courses : (Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : []),
            created_at: row.created_at || raw.createdAt,
            createdAt: row.created_at || raw.createdAt
          };
          onUserChange({ eventType: payload.eventType, user: mappedUser });
        }
      }
    )
    .subscribe();

  return () => {
    if (typeof unsubscribeBroadcast === 'function') unsubscribeBroadcast();
    if (typeof unsubscribeUpdate === 'function') unsubscribeUpdate();
    supabase.removeChannel(channel);
  };
}

/**
 * Permanently delete user from Supabase
 */
export async function deleteSupabaseUser(userId, email) {
  if (!isSupabaseConfigured || !supabase || (!userId && !email)) return false;
  try {
    let query = supabase.from('eduhunters_users').delete();
    if (userId && email) {
      query = query.or(`id.eq.${userId},email.eq.${email.toLowerCase().trim()}`);
    } else if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { error } = await query;
    if (error) {
      console.warn('[Supabase] Failed to delete user:', error.message);
      return false;
    }
    broadcastSupabaseMessage('USER_DELETED', { userId, email });
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete user exception:', err);
    return false;
  }
}

