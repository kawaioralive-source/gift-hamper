import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeptxbbzsnzwgulxigle.supabase.co').replace(/^\uFEFF/, '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UvAnIPMAC2g7ayTrg0duUw_ekACengE').replace(/^\uFEFF/, '').trim();

  return createBrowserClient(url, key);
}