import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. API Rate Limiting
  if (pathname.startsWith('/api/')) {
    let limitConfig = { windowMs: 60 * 1000, maxRequests: 120 }; // Default: 120 req/min
    if (pathname.startsWith('/api/auth/')) {
      limitConfig = { windowMs: 60 * 1000, maxRequests: 25 }; // Auth: 25 req/min
    } else if (pathname.startsWith('/api/orders') || pathname.startsWith('/api/payments/')) {
      limitConfig = { windowMs: 60 * 1000, maxRequests: 45 }; // Payments & Orders: 45 req/min
    }

    const rateResult = checkRateLimit(request, limitConfig);
    if (!rateResult.allowed) {
      return createRateLimitResponse(rateResult.retryAfterSec);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Add Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_UvAnIPMAC2g7ayTrg0duUw_ekACengE'
  ).replace(/^\uFEFF/, '').trim();

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://qeptxbbzsnzwgulxigle.supabase.co'
  ).replace(/^\uFEFF/, '').trim();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const isSupabaseOffline = process.env.USE_SQLITE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Refresh session if expired (only when remote Supabase is reachable)
  if (!isSupabaseOffline) {
    try {
      await supabase.auth.getSession();
    } catch {}
  }

  // Protected routes (Note: /orders and /orders/[id] are accessible to guests and customers to view order confirmations and receipts)
  const protectedPaths = ['/dashboard', '/profile', '/addresses'];
  const adminPaths = ['/admin'];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAdmin = adminPaths.some((path) => pathname.startsWith(path));

  if (isProtected || isAdmin) {
    let isAuthenticated = false;
    let userRole = 'user';

    // 1. Check local session cookie (auth_user)
    const authUserCookie = request.cookies.get('auth_user')?.value;
    if (authUserCookie) {
      try {
        const parsed = JSON.parse(authUserCookie);
        if (parsed && (parsed.email || parsed.id)) {
          isAuthenticated = true;
          userRole = parsed.role || 'user';
        }
      } catch {}
    }

    // 2. Check Supabase session if not already verified and online
    if (!isAuthenticated && !isSupabaseOffline) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          isAuthenticated = true;
          const { data: { user } } = await supabase.auth.getUser();
          userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'user';
        }
      } catch {}
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdmin && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/addresses/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};