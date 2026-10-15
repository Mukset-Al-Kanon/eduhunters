import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://prblcytpdlfgvransoqr.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_mIb7ga_cQ01Eg2CnvDA1Fw_izVN6Q5B';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

if (isSupabaseConfigured) {
  console.log('[Supabase] Initialized successfully with Realtime enabled.');
} else {
  console.log('[Supabase] Not configured yet. Awaiting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}
