import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TsBChUSrjRiKMr';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '2tiebHy4x6XDMTEaBIFqeXiM';

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const user = await getSessionUser();
    const body = await request.json();

    const { orderId, amount, currency = 'INR', receipt, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 100 paise (₹1)' },
        { status: 400 }
      );
    }

    let order: any = null;

    // 1. Try Supabase
    try {
      const supabase = createClient();
      const numId = Number(orderId);
      let query = supabase.from('orders').select('*');
      if (!isNaN(numId)) {
        query = query.or(`id.eq.${numId},order_number.eq.${orderId}`);
      } else {
        query = query.eq('order_number', orderId);
      }
      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) {
        order = data[0];
      }
    } catch {}

    // 2. Fall back to SQLite
    if (!order) {
      try {
        const rows = await querySqlite(
          `SELECT * FROM orders WHERE id = ? OR order_number = ?`,
          [orderId, orderId]
        );
        if (rows && rows.length > 0) {
          order = rows[0];
        }
      } catch {}
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderNumberStr = String(order.order_number || order.id || orderId);
    const amountInPaise = Math.round(Number(amount));

    const razorpay = getRazorpayInstance();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rec_${orderNumberStr.slice(-20)}`,
      notes: {
        order_id: String(order.id),
        order_number: orderNumberStr,
        customer_name: order.customer_name || 'Valued Customer',
        customer_email: order.customer_email || 'customer@kawaiora.com',
        ...notes,
      },
    });

    // Update the order with Razorpay order ID in Supabase and SQLite
    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({ payment_id: razorpayOrder.id })
        .eq('id', order.id);
    } catch {}

    try {
      await executeSqlite(
        `UPDATE orders SET payment_id = ? WHERE id = ? OR order_number = ?`,
        [razorpayOrder.id, order.id, order.order_number]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_TsBChUSrjRiKMr',
        order_number: orderNumberStr,
      },
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment order';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
