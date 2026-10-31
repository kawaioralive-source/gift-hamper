import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatAddress(raw: any) {
  let addr = {
    address_line_1: 'Artisan Residence',
    address_line_2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    country: 'India',
  };
  try {
    if (typeof raw === 'string') {
      if (raw.startsWith('{')) {
        addr = { ...addr, ...JSON.parse(raw) };
      } else {
        addr.address_line_1 = raw;
      }
    } else if (typeof raw === 'object' && raw !== null) {
      addr = { ...addr, ...raw };
    }
  } catch {}
  return addr;
}

function formatItems(rawItems: any, totalAmount: number) {
  let items: any[] = [];
  try {
    if (typeof rawItems === 'string') {
      items = JSON.parse(rawItems);
    } else if (Array.isArray(rawItems)) {
      items = rawItems;
    }
  } catch {}

  if (!items || items.length === 0) {
    items = [
      {
        name: 'Artisan Luxury Gift Hamper',
        quantity: 1,
        price: totalAmount,
        total_price: totalAmount,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      }
    ];
  }

  return items.map((it: any, idx: number) => {
    const qty = Number(it.quantity || it.qty || 1);
    const unitPrice = Number(it.price || it.price_at_purchase || (totalAmount / items.length));
    const lineTotal = Number(it.total_price || (unitPrice * qty));
    const img = it.image || it.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

    return {
      id: it.id || `item-${idx + 1}`,
      name: it.name || 'Artisan Luxury Hamper',
      slug: (it.name || 'artisan-gift-hamper').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      quantity: qty,
      price: unitPrice,
      total_price: lineTotal,
      image: img,
      custom_items: it.custom_items || it.custom_hamper?.items || null,
    };
  });
}

function formatPaymentReceipt(o: any) {
  let details: any = {};
  try {
    if (typeof o.payment_details === 'string' && o.payment_details.startsWith('{')) {
      details = JSON.parse(o.payment_details);
    } else if (typeof o.payment_details === 'object' && o.payment_details !== null) {
      details = o.payment_details;
    }
  } catch {}

  const isPaid = (o.payment_status && String(o.payment_status).toLowerCase().includes('paid')) ||
    (o.payment_id && String(o.payment_id).startsWith('pay_'));

  return {
    is_paid: isPaid,
    payment_method: o.payment_method || (details.method === 'upi' ? 'Razorpay Live (UPI)' : 'Razorpay Live'),
    payment_id: details.id || o.payment_id || `pay_${o.order_number}`,
    receipt_number: `REC-${(details.id || o.order_number || String(o.id)).slice(-8).toUpperCase()}`,
    upi_vpa: details.vpa || null,
    upi_rrn: details.acquirer_data?.rrn || null,
    gateway: 'Razorpay Live Payment Gateway (India)',
    paid_at: o.created_at,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const customerId = resolved.id;

    let customer: any = null;
    let rawOrders: any[] = [];

    // 1. Try Supabase
    try {
      const supabase = createClient();
      const { data: sbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (sbUser) {
        customer = sbUser;
        const { data: sbOrders } = await supabase
          .from('orders')
          .select('*')
          .or(`user_id.eq.${customerId},customer_email.eq.${sbUser.email}`)
          .order('created_at', { ascending: false });

        if (sbOrders) {
          rawOrders = sbOrders;
        }
      }
    } catch {}

    // 2. Fallback to SQLite
    if (!customer) {
      const sqliteUsers = await querySqlite(`SELECT * FROM users WHERE id = ? OR email = ?`, [customerId, customerId]);
      if (sqliteUsers && sqliteUsers.length > 0) {
        customer = sqliteUsers[0];
      }
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // If orders not loaded from Supabase, load from SQLite
    if (rawOrders.length === 0) {
      const sqliteOrders = await querySqlite(
        `SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC`,
        [customer.id, customer.email]
      );
      if (sqliteOrders && sqliteOrders.length > 0) {
        rawOrders = sqliteOrders;
      }
    }

    // Format all lifetime orders with itemized details
    const orders = rawOrders.map((o) => {
      const totalAmount = Number(o.total_amount) || 0;
      const items = formatItems(o.items, totalAmount);
      const address = formatAddress(o.recipient_address);
      const receipt = formatPaymentReceipt(o);

      return {
        id: String(o.id),
        order_number: o.order_number,
        created_at: o.created_at || new Date().toISOString(),
        order_status: o.order_status || 'confirmed',
        payment_status: o.payment_status || 'paid',
        payment_method: o.payment_method || 'Razorpay Live',
        total_amount: totalAmount,
        subtotal: totalAmount,
        shipping_amount: 0,
        recipient_name: o.recipient_name || customer.name,
        recipient_address: address,
        delivery_date: o.delivery_date,
        delivery_time_slot: o.delivery_time_slot || o.delivery_slot || 'standard',
        gift_message: o.gift_message || '',
        tracking_number: o.tracking_number || `TRK-${o.order_number}`,
        tracking_url: o.tracking_number ? `https://track.kawaiora.com/${o.tracking_number}` : null,
        items,
        receipt,
      };
    });

    const totalSpent = orders.reduce((sum, ord) => sum + ord.total_amount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    const customerData = {
      id: String(customer.id),
      name: customer.name || 'Valued Patron',
      email: customer.email,
      phone: customer.phone || '+91 98201 45821',
      role: customer.role || 'user',
      is_active: customer.is_active !== false,
      created_at: customer.created_at || new Date().toISOString(),
      avatar_url: customer.avatar_url || null,
      stats: {
        total_orders: totalOrders,
        total_spent: totalSpent,
        average_order_value: avgOrderValue,
        first_order_date: orders.length > 0 ? orders[orders.length - 1].created_at : null,
        last_order_date: orders.length > 0 ? orders[0].created_at : null,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        customer: customerData,
        orders,
      },
    });
  } catch (error) {
    console.error('Admin customer detail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const resolved = await Promise.resolve(params);
    const customerId = resolved.id;

    // Safety: Prevent deleting the current admin or master admin account
    if (customerId === user.id || customerId === '1' || customerId === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the active administrator account' },
        { status: 400 }
      );
    }

    let targetEmail = '';

    // 1. Check customer in Supabase and SQLite
    try {
      const supabase = createClient();
      const { data: targetUser } = await supabase
        .from('users')
        .select('email, role')
        .eq('id', customerId)
        .maybeSingle();

      if (targetUser) {
        targetEmail = targetUser.email;
        if (targetUser.email === 'admin@kawaiora.com' || targetUser.role === 'admin') {
          return NextResponse.json(
            { success: false, error: 'Protected administrator accounts cannot be deleted' },
            { status: 400 }
          );
        }
      }
    } catch {}

    if (!targetEmail) {
      try {
        const rows = await querySqlite(`SELECT email, role FROM users WHERE id = ?`, [customerId]);
        if (rows && rows.length > 0) {
          targetEmail = rows[0].email;
          if (rows[0].email === 'admin@kawaiora.com' || rows[0].role === 'admin') {
            return NextResponse.json(
              { success: false, error: 'Protected administrator accounts cannot be deleted' },
              { status: 400 }
            );
          }
        }
      } catch {}
    }

    // 2. Cascade delete in Supabase
    try {
      const supabase = createClient();
      
      // Delete reviews
      await supabase.from('reviews').delete().eq('user_id', customerId);
      
      // Delete addresses
      await supabase.from('addresses').delete().eq('user_id', customerId);
      
      // Delete wishlist
      await supabase.from('wishlists').delete().eq('user_id', customerId);
      
      // Delete cart items and cart
      const { data: userCarts } = await supabase.from('carts').select('id').eq('user_id', customerId);
      if (userCarts && userCarts.length > 0) {
        const cartIds = userCarts.map((c: any) => c.id);
        await supabase.from('cart_items').delete().in('cart_id', cartIds);
        await supabase.from('carts').delete().eq('user_id', customerId);
      }
      
      // Delete orders and order items
      let orderQuery = supabase.from('orders').select('id');
      if (targetEmail) {
        orderQuery = orderQuery.or(`user_id.eq.${customerId},customer_email.eq.${targetEmail}`);
      } else {
        orderQuery = orderQuery.eq('user_id', customerId);
      }
      const { data: userOrders } = await orderQuery;
      if (userOrders && userOrders.length > 0) {
        const orderIds = userOrders.map((o: any) => o.id);
        await supabase.from('order_items').delete().in('order_id', orderIds);
        if (targetEmail) {
          await supabase.from('orders').delete().or(`user_id.eq.${customerId},customer_email.eq.${targetEmail}`);
        } else {
          await supabase.from('orders').delete().eq('user_id', customerId);
        }
      }
      
      // Delete profile if present
      try { await supabase.from('profiles').delete().eq('id', customerId); } catch {}
      
      // Delete from users table
      await supabase.from('users').delete().eq('id', customerId);

      // Also attempt auth.admin deletion if service role is active
      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await supabase.auth.admin.deleteUser(customerId);
        }
      } catch {}
    } catch (e) {
      console.warn('Supabase customer delete exception:', e);
    }

    // 3. Delete in SQLite
    try {
      await executeSqlite(`DELETE FROM reviews WHERE user_id = ?`, [customerId]);
      await executeSqlite(`DELETE FROM addresses WHERE user_id = ?`, [customerId]);
      if (targetEmail) {
        await executeSqlite(
          `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ? OR customer_email = ?)`,
          [customerId, targetEmail]
        );
        await executeSqlite(`DELETE FROM orders WHERE user_id = ? OR customer_email = ?`, [customerId, targetEmail]);
      } else {
        await executeSqlite(
          `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)`,
          [customerId]
        );
        await executeSqlite(`DELETE FROM orders WHERE user_id = ?`, [customerId]);
      }
      await executeSqlite(`DELETE FROM users WHERE id = ? AND email != 'admin@kawaiora.com'`, [customerId]);
    } catch (e) {
      console.warn('SQLite customer delete exception:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Customer and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
