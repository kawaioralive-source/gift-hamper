import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatOrderRow(o: any) {
  const raw = o.total_amount || 14999;
  const normalizedAmount = raw < 500 ? raw * 100 : raw;
  const orderStatus = (o.order_status || 'confirmed').toLowerCase();
  const pStatus = (o.payment_status || 'paid').toLowerCase().includes('paid') ? 'paid' : (o.payment_status || 'pending');

  return {
    id: String(o.id),
    order_number: o.order_number,
    created_at: o.created_at || new Date().toISOString(),
    confirmed_at: o.created_at || new Date().toISOString(),
    shipped_at: o.shipped_at || (orderStatus.includes('ship') || orderStatus.includes('out_for_delivery') ? o.created_at : null),
    delivered_at: o.delivered_at || (orderStatus.includes('deliver') ? o.created_at : null),
    cancelled_at: o.cancelled_at || (orderStatus.includes('cancel') ? o.created_at : null),
    total_amount: Math.round(normalizedAmount),
    order_status: orderStatus,
    payment_status: pStatus,
    customer_name: o.customer_name || 'Customer',
    customer_email: o.customer_email || 'customer@kawaiora.com',
    tracking_number: o.tracking_number || `TRK-${o.order_number}`,
    tracking_url: o.tracking_number ? `https://track.kawaiora.com/${o.tracking_number}` : null,
    profiles: {
      name: o.customer_name || 'Customer',
      email: o.customer_email || 'customer@kawaiora.com',
      avatar_url: null,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // 1. Try Supabase
    try {
      const supabase = createClient();
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
      }

      const { data: orders, error, count } = await query;
      if (!error && orders) {
        return NextResponse.json({
          success: true,
          data: orders.map(formatOrderRow),
          pagination: {
            page,
            limit,
            total: count || orders.length,
            total_pages: Math.ceil((count || orders.length) / limit) || 1,
          },
        });
      }
    } catch {
      // Supabase failed, fall through to SQLite
    }

    // 2. SQLite fallback (local dev)
    try {
      let sqliteQuery = `SELECT * FROM orders WHERE 1=1`;
      const params: any[] = [];
      if (search) {
        sqliteQuery += ` AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sqliteQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, (page - 1) * limit);

      const sqliteOrders = await querySqlite(sqliteQuery, params);
      return NextResponse.json({
        success: true,
        data: (sqliteOrders || []).map(formatOrderRow),
        pagination: {
          page,
          limit,
          total: (sqliteOrders || []).length,
          total_pages: 1,
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, total_pages: 1 },
      });
    }
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
