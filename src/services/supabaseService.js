// src/services/supabaseService.js
import { supabase, isSupabaseConfigured } from '../supabase/config.js';
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
export async function updateSupabaseOrderStatus(orderId, updates) {
  if (!isSupabaseConfigured || !supabase || !orderId) return false;
  try {
    const payload = {
      updated_at: new Date().toISOString()
    };
    if (updates.status) payload.status = updates.status;
    if (typeof updates.isApproved === 'boolean') payload.is_approved = updates.isApproved;

    try {
      const { data: existing } = await supabase
        .from('eduhunters_orders')
        .select('raw_data')
        .eq('id', orderId)
        .maybeSingle();
      if (existing?.raw_data) {
        payload.raw_data = {
          ...existing.raw_data,
          status: updates.status || existing.raw_data.status,
          isApproved: typeof updates.isApproved === 'boolean' ? updates.isApproved : existing.raw_data.isApproved,
          updatedAt: new Date().toISOString()
        };
      } else if (updates.raw_data) {
        payload.raw_data = updates.raw_data;
      }
    } catch (e) {
      if (updates.raw_data) payload.raw_data = updates.raw_data;
    }

    // 1. Instant Broadcast to all users / student device
    broadcastSupabaseMessage('ORDER_STATUS_CHANGED', { orderId, ...updates });

    // 2. Persistent update to PostgreSQL database
    const { error } = await supabase
      .from('eduhunters_orders')
      .update(payload)
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Failed to update order:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Order update exception:', err);
    return false;
  }
}

/**
 * Permanently delete order from Supabase
 */
export async function deleteSupabaseOrder(orderId) {
  if (!isSupabaseConfigured || !supabase || !orderId) return false;
  try {
    const { error } = await supabase
      .from('eduhunters_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Failed to delete order:', error.message);
      return false;
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
export async function updateSupabaseOrderAmount(orderId, newAmount) {
  if (!isSupabaseConfigured || !supabase || !orderId) return false;
  try {
    const num = Number(newAmount) || 0;
    const { data: existing } = await supabase
      .from('eduhunters_orders')
      .select('raw_data')
      .eq('id', orderId)
      .maybeSingle();

    const updatedRaw = {
      ...(existing?.raw_data || {}),
      totalPaid: num,
      amount: num
    };

    const { error } = await supabase
      .from('eduhunters_orders')
      .update({
        amount: num,
        raw_data: updatedRaw,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Failed to update order amount:', error.message);
      return false;
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
      createdAt: row.created_at
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
    try {
      let query = supabase.from('eduhunters_users').select('*');
      if (uid) {
        query = query.eq('id', uid);
      } else if (cleanEmail) {
        query = query.eq('email', cleanEmail);
      }
      const { data: dbUser } = await query.maybeSingle();
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
    if (uid) filterClauses.push(`id.eq.${uid}`);

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

/**
 * Save site data (Hero slider, courses, settings) to Supabase
 */
export async function saveSupabaseSiteData(siteData) {
  if (!isSupabaseConfigured || !supabase || !siteData) return false;
  try {
    const sanitized = JSON.parse(JSON.stringify(siteData, (key, value) => {
      if (value === undefined) return null;
      return value;
    }));

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

    const now = new Date().toISOString();
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
 * Fetch site data from Supabase
 */
export async function fetchSupabaseSiteData() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('eduhunters_site')
      .select('data')
      .eq('id', 'main_data')
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('[Supabase] Failed to fetch site data:', error.message);
      }
      return null;
    }
    return data?.data || null;
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
    if (newData) onUpdate(newData);
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
        if (newData) {
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
    let existingEnrolled = [];
    let existingRaw = {};
    try {
      const { data: existingUser } = await supabase
        .from('eduhunters_users')
        .select('enrolled_courses, raw_data, email, name, phone, role')
        .eq('id', targetId)
        .maybeSingle();
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

    const mergedCourses = Array.from(new Set([
      ...existingEnrolled,
      ...incomingCourses
    ])).filter(Boolean);

    const payload = {
      id: targetId,
      email: user.email || existingRaw.email,
      name: user.displayName || user.name || extra.displayName || existingRaw.displayName || existingRaw.name || user.email?.split('@')[0],
      phone: user.phone || user.whatsapp || extra.phone || existingRaw.phone || '',
      role: user.role || extra.role || existingRaw.role || 'student',
      enrolled_courses: mergedCourses,
      raw_data: { ...existingRaw, ...user, ...extra, enrolledCourses: mergedCourses, id: targetId, uid: targetId },
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
      .order('last_active_at', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('[Supabase] Failed to fetch users:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      uid: row.id,
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.name,
      phone: row.phone,
      role: row.role === 'admin' ? 'Admin' : 'Student',
      enrolledCourses: Array.isArray(row.enrolled_courses) ? row.enrolled_courses : [],
      created_at: row.created_at,
      createdAt: row.created_at,
      ...(row.raw_data || {})
    }));
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
    const mappedUser = {
      uid: payload.id,
      id: payload.id,
      email: payload.email,
      name: payload.name,
      displayName: payload.name,
      phone: payload.phone,
      role: payload.role === 'admin' ? 'Admin' : 'Student',
      enrolledCourses: Array.isArray(payload.enrolled_courses) ? payload.enrolled_courses : [],
      isNewRegistration: true,
      registeredAt: payload.registeredAt || Date.now(),
      ...(payload.raw_data || {})
    };
    onUserChange({ eventType: 'INSERT', user: mappedUser });
  });

  // Listener for user profile updates
  const unsubscribeUpdate = subscribeToSupabaseMessage('USER_UPDATED', (payload) => {
    const mappedUser = {
      uid: payload.id,
      id: payload.id,
      email: payload.email,
      name: payload.name,
      displayName: payload.name,
      phone: payload.phone,
      role: payload.role === 'admin' ? 'Admin' : 'Student',
      enrolledCourses: Array.isArray(payload.enrolled_courses) ? payload.enrolled_courses : [],
      ...(payload.raw_data || {})
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
          const mappedUser = {
            uid: row.id,
            id: row.id,
            email: row.email,
            name: row.name,
            displayName: row.name,
            phone: row.phone,
            role: row.role === 'admin' ? 'Admin' : 'Student',
            enrolledCourses: Array.isArray(row.enrolled_courses) ? row.enrolled_courses : [],
            created_at: row.created_at,
            createdAt: row.created_at,
            ...(row.raw_data || {})
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

