import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || '2tiebHy4x6XDMTEaBIFqeXiM';
}

function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = getRazorpayKeySecret();
  const expectedSignature = createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (razorpaySignature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < razorpaySignature.length; i++) {
    result |= razorpaySignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // 1. Verify the signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      console.error('Razorpay signature verification failed', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // 2. Fetch live payment details from Razorpay API
    let razorpayPayment: any = null;
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_TsBChUSrjRiKMr',
        key_secret: process.env.RAZORPAY_KEY_SECRET || '2tiebHy4x6XDMTEaBIFqeXiM',
      });
      razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.warn('Could not fetch payment directly from Razorpay API:', fetchErr);
    }

    // 3. Find the order in Supabase or SQLite
    let order: any = null;
    try {
      const supabase = createClient();
      let query = supabase.from('orders').select('*');
      if (order_id) {
        const numId = Number(order_id);
        if (!isNaN(numId)) {
          query = query.or(`id.eq.${numId},order_number.eq.${order_id},payment_id.eq.${razorpay_order_id}`);
        } else {
          query = query.or(`order_number.eq.${order_id},payment_id.eq.${razorpay_order_id}`);
        }
      } else {
        query = query.eq('payment_id', razorpay_order_id);
      }
      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) {
        order = data[0];
      }
    } catch {}

    if (!order) {
      try {
        const rows = await querySqlite(
          `SELECT * FROM orders WHERE payment_id = ? OR id = ? OR order_number = ?`,
          [razorpay_order_id, order_id, order_id]
        );
        if (rows && rows.length > 0) {
          order = rows[0];
        }
      } catch {}
    }

    const paymentMethodLabel = razorpayPayment?.method === 'upi'
      ? 'UPI'
      : razorpayPayment?.method === 'card'
      ? 'Card'
      : razorpayPayment?.method === 'netbanking'
      ? 'Net Banking'
      : (razorpayPayment?.method || 'Razorpay');

    const paymentDetailsJSON = JSON.stringify(razorpayPayment || {
      id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: 'captured',
      method: 'razorpay',
    });

    const targetOrderId = order?.id || order_id;

    // 4. Update order status in Supabase and SQLite
    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed',
          payment_id: razorpay_payment_id,
          payment_method: paymentMethodLabel,
          payment_details: paymentDetailsJSON,
        })
        .or(`id.eq.${targetOrderId},order_number.eq.${targetOrderId}`);
    } catch {}

    try {
      await executeSqlite(
        `UPDATE orders SET payment_status = 'paid', order_status = 'confirmed', payment_id = ?, payment_method = ?, payment_details = ? WHERE id = ? OR order_number = ? OR payment_id = ?`,
        [razorpay_payment_id, paymentMethodLabel, paymentDetailsJSON, targetOrderId, targetOrderId, razorpay_order_id]
      );
    } catch {}

    // Formatted Receipt structure
    const receipt = {
      receipt_id: `REC-${razorpay_payment_id.slice(-8).toUpperCase()}`,
      razorpay_payment_id,
      razorpay_order_id,
      order_number: order?.order_number || targetOrderId,
      amount: razorpayPayment?.amount ? razorpayPayment.amount / 100 : (order?.total_amount || 0),
      currency: razorpayPayment?.currency || 'INR',
      status: razorpayPayment?.status || 'captured',
      method: paymentMethodLabel,
      vpa: razorpayPayment?.vpa || null,
      bank: razorpayPayment?.bank || null,
      card: razorpayPayment?.card ? {
        last4: razorpayPayment.card.last4,
        network: razorpayPayment.card.network,
        type: razorpayPayment.card.type,
      } : null,
      rrn: razorpayPayment?.acquirer_data?.rrn || razorpayPayment?.acquirer_data?.upi_transaction_id || null,
      customer_email: razorpayPayment?.email || order?.customer_email,
      customer_phone: razorpayPayment?.contact || order?.customer_phone,
      created_at: razorpayPayment?.created_at
        ? new Date(razorpayPayment.created_at * 1000).toISOString()
        : new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully via Razorpay Live Gateway',
      data: {
        order_id: targetOrderId,
        order_number: order?.order_number || targetOrderId,
        payment_id: razorpay_payment_id,
        receipt,
      },
    });
  } catch (error) {
    console.error('Razorpay verify payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
