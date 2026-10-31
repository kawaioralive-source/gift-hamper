import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const supabase = createAdminClient();

    // 1. Compute summary counts
    const { data: allTickets } = await supabase.from('cancellation_tickets').select('status');
    const counts = {
      total: allTickets?.length || 0,
      pending: allTickets?.filter(t => t.status === 'pending').length || 0,
      under_review: allTickets?.filter(t => t.status === 'under_review').length || 0,
      approved: allTickets?.filter(t => t.status === 'approved').length || 0,
      rejected: allTickets?.filter(t => t.status === 'rejected').length || 0,
    };

    // 2. Query filtered tickets
    let query = supabase
      .from('cancellation_tickets')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Fetch admin tickets error:', error);
      return NextResponse.json({ success: false, error: 'Failed to query tickets' }, { status: 500 });
    }

    const res = NextResponse.json({
      success: true,
      data: tickets || [],
      counts,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit) || 1,
      },
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (err) {
    console.error('Admin cancellation tickets API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
