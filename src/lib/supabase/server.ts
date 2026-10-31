import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function isSupabaseOffline(): boolean {
  if (process.env.USE_SQLITE === 'true') return true;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^\uFEFF/, '').trim();
  if (!url) return true;
  return false;
}

export function createClient() {
  if (isSupabaseOffline()) {
    throw new Error('Supabase remote is unconfigured or offline. Using fast local SQLite.');
  }

  const cookieStore = cookies();
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^\uFEFF/, '').trim();
  const rawKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).replace(/^\uFEFF/, '').trim();

  return createServerClient(
    rawUrl,
    rawKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  );
}
