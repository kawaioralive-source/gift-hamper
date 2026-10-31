import { createClient } from '@supabase/supabase-js';

export function isSupabaseAdminOffline(): boolean {
  if (process.env.USE_SQLITE === 'true') return true;
  return false;
}

export function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeptxbbzsnzwgulxigle.supabase.co').replace(/^\uFEFF/, '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_UvAnIPMAC2g7ayTrg0duUw_ekACengE'
  ).replace(/^\uFEFF/, '').trim();

  return createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
