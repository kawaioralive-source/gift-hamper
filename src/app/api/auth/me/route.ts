import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    let authUser: any = null;

    if (accessToken) {
      authUser = await verifyToken(accessToken);
    }

    if (!authUser) {
      const authUserCookie = request.cookies.get('auth_user')?.value;
      if (authUserCookie) {
        try {
          authUser = JSON.parse(authUserCookie);
        } catch {}
      }
    }

    if (!authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let currentUser = {
      id: String(authUser.id),
      email: authUser.email,
      name: authUser.name || 'Valued Customer',
      role: authUser.role || 'user',
      phone: authUser.phone || '+919876543210',
      phone_verified: true,
      avatar_url: authUser.avatar_url || null,
    };

    try {
      const supabase = createAdminClient();
      const numId = Number(authUser.id);
      let query = supabase.from('users').select('id, email, name, role, created_at');
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('email', authUser.email);
      }
      const { data: freshUser } = await query.maybeSingle();

      if (freshUser) {
        currentUser = {
          ...currentUser,
          id: String(freshUser.id),
          email: freshUser.email,
          name: freshUser.name || currentUser.name,
          role: freshUser.role || currentUser.role,
        };
      }
    } catch {}

    return NextResponse.json({
      success: true,
      user: currentUser,
      data: currentUser,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}