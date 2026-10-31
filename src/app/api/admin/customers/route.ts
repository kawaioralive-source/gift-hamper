import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatCustomer(u: any, statsMap: Map<string, { orders: number; total_spent: number; last_order_date?: string }>) {
  const emailKey = (u.email || '').toLowerCase();
  const idKey = String(u.id);
  const stats = statsMap.get(idKey) || statsMap.get(emailKey) || { orders: 0, total_spent: 0 };

  return {
    id: String(u.id),
    name: u.name || 'Customer',
    email: u.email,
    phone: u.phone || '+91 98201 45821',
    role: u.role || 'user',
    is_active: u.is_active !== false,
    created_at: u.created_at || new Date().toISOString(),
    avatar_url: u.avatar_url || null,
    last_login: stats.last_order_date || u.created_at || null,
    _count: {
      orders: stats.orders,
      total_spent: stats.total_spent,
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

    const statsMap = new Map<string, { orders: number; total_spent: number; last_order_date?: string }>();

    // 1. Try Supabase
    try {
      const supabase = createClient();
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: customers, error, count } = await query;
      if (!error && customers && customers.length > 0) {
        // Fetch order stats for these customers
        try {
          const userEmails = customers.map(c => c.email).filter(Boolean);
          const userIds = customers.map(c => String(c.id));
          const { data: orders } = await supabase
            .from('orders')
            .select('user_id, customer_email, total_amount, created_at');

          if (orders) {
            for (const ord of orders) {
              const uId = ord.user_id ? String(ord.user_id) : null;
              const email = (ord.customer_email || '').toLowerCase();
              const amt = Number(ord.total_amount) || 0;

              if (uId) {
                const cur = statsMap.get(uId) || { orders: 0, total_spent: 0, last_order_date: ord.created_at };
                statsMap.set(uId, {
                  orders: cur.orders + 1,
                  total_spent: cur.total_spent + amt,
                  last_order_date: cur.last_order_date || ord.created_at,
                });
              }
              if (email) {
                const cur = statsMap.get(email) || { orders: 0, total_spent: 0, last_order_date: ord.created_at };
                statsMap.set(email, {
                  orders: cur.orders + 1,
                  total_spent: cur.total_spent + amt,
                  last_order_date: cur.last_order_date || ord.created_at,
                });
              }
            }
          }
        } catch {}

        return NextResponse.json({
          success: true,
          data: customers.map(c => formatCustomer(c, statsMap)),
          pagination: {
            page,
            limit,
            total: count || customers.length,
            total_pages: Math.ceil((count || customers.length) / limit),
          },
        });
      }
    } catch {}

    // 2. SQLite Fallback
    let sqliteQuery = `SELECT * FROM users WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      sqliteQuery += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const sqliteUsers = await querySqlite(sqliteQuery, params);

    // Get order stats from SQLite
    try {
      const sqliteOrders = await querySqlite(`SELECT user_id, customer_email, total_amount, created_at FROM orders`);
      if (sqliteOrders) {
        for (const ord of sqliteOrders) {
          const uId = ord.user_id ? String(ord.user_id) : null;
          const email = (ord.customer_email || '').toLowerCase();
          const amt = Number(ord.total_amount) || 0;

          if (uId) {
            const cur = statsMap.get(uId) || { orders: 0, total_spent: 0, last_order_date: ord.created_at };
            statsMap.set(uId, {
              orders: cur.orders + 1,
              total_spent: cur.total_spent + amt,
              last_order_date: cur.last_order_date || ord.created_at,
            });
          }
          if (email) {
            const cur = statsMap.get(email) || { orders: 0, total_spent: 0, last_order_date: ord.created_at };
            statsMap.set(email, {
              orders: cur.orders + 1,
              total_spent: cur.total_spent + amt,
              last_order_date: cur.last_order_date || ord.created_at,
            });
          }
        }
      }
    } catch {}

    const customersWithStats = sqliteUsers.map(c => formatCustomer(c, statsMap));

    return NextResponse.json({
      success: true,
      data: customersWithStats,
      pagination: {
        page,
        limit,
        total: customersWithStats.length,
        total_pages: Math.ceil(customersWithStats.length / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin customers API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
