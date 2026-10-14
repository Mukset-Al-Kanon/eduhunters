// src/services/supabaseService.js
import { supabase, isSupabaseConfigured } from '../supabase/config';

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
      .single();

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
    if (updates.raw_data) payload.raw_data = updates.raw_data;

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
 * Real-time subscription for orders (Dual-tier: WebSocket Broadcast + Postgres Changes)
 */
export function subscribeToSupabaseOrders(onOrderChange) {
  if (!isSupabaseConfigured || !supabase || typeof onOrderChange !== 'function') {
    return () => {};
  }

  // 1. Instant WebSocket Broadcast listener
  const unsubscribeBroadcast = subscribeToSupabaseMessage('NEW_ORDER', (payload) => {
    const mappedOrder = {
      ...(payload.raw_data || {}),
      id: payload.id,
      invoiceNumber: payload.invoice_number,
      status: payload.status,
      isApproved: payload.is_approved,
      transactionId: payload.trx_id,
      paymentMethodName: payload.payment_method,
      totalPaid: payload.amount,
      createdAt: payload.created_at
    };
    onOrderChange({ eventType: 'INSERT', order: mappedOrder });
  });

  // 2. PostgreSQL CDC listener
  const channel = supabase
    .channel('eduhunters_orders_cdc')
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
        onOrderChange({ eventType: payload.eventType, order: mappedOrder });
      }
    )
    .subscribe();

  return () => {
    if (typeof unsubscribeBroadcast === 'function') unsubscribeBroadcast();
    supabase.removeChannel(channel);
  };
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
      .single();

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
  const channel = supabase
    .channel('eduhunters_site_cdc')
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
  if (!isSupabaseConfigured || !supabase || !user?.uid) return false;
  try {
    const payload = {
      id: user.uid,
      email: user.email,
      name: user.displayName || user.name || extra.displayName || user.email?.split('@')[0],
      phone: user.phone || user.whatsapp || extra.phone || '',
      role: user.role || extra.role || 'student',
      enrolled_courses: user.enrolledCourses || extra.enrolledCourses || [],
      raw_data: { ...user, ...extra },
      last_active_at: new Date().toISOString()
    };

    // 1. Instant broadcast to Admin Panel (<50ms)
    broadcastSupabaseMessage('USER_REGISTERED', payload);

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

  // 1. Instant broadcast listener
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
      ...(payload.raw_data || {})
    };
    onUserChange({ eventType: 'INSERT', user: mappedUser });
  });

  // 2. PostgreSQL CDC listener
  const channel = supabase
    .channel('eduhunters_users_cdc')
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
            ...(row.raw_data || {})
          };
          onUserChange({ eventType: payload.eventType, user: mappedUser });
        }
      }
    )
    .subscribe();

  return () => {
    if (typeof unsubscribeBroadcast === 'function') unsubscribeBroadcast();
    supabase.removeChannel(channel);
  };
}
