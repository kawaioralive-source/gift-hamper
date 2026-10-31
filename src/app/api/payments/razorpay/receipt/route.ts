import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_TsBChUSrjRiKMr';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '2tiebHy4x6XDMTEaBIFqeXiM';
  return new Razorpay({ key_id, key_secret });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');

    let dbOrder: any = null;

    // If orderId is provided, look up the order first
    if (orderId) {
      try {
        const supabase = createClient();
        let query = supabase.from('orders').select('*');
        const numId = Number(orderId);
        if (!isNaN(numId)) {
          query = query.or(`id.eq.${numId},order_number.eq.${orderId}`);
        } else {
          query = query.eq('order_number', orderId);
        }
        const { data, error } = await query.limit(1);
        if (!error && data && data.length > 0) {
          dbOrder = data[0];
          if (!paymentId && dbOrder.payment_id && dbOrder.payment_id.startsWith('pay_')) {
            paymentId = dbOrder.payment_id;
          }
        }
      } catch (err) {
        console.warn('Supabase order fetch in receipt error:', err);
      }

      if (!dbOrder) {
        try {
          const rows = await querySqlite(
            `SELECT * FROM orders WHERE id = ? OR order_number = ?`,
            [orderId, orderId]
          );
          if (rows && rows.length > 0) {
            dbOrder = rows[0];
            if (!paymentId && dbOrder.payment_id && dbOrder.payment_id.startsWith('pay_')) {
              paymentId = dbOrder.payment_id;
            }
          }
        } catch {}
      }
    }

    let rzpPayment: any = null;

    if (paymentId && paymentId.startsWith('pay_')) {
      try {
        const razorpay = getRazorpayInstance();
        rzpPayment = await razorpay.payments.fetch(paymentId);
      } catch (err: any) {
        console.warn('Failed to fetch payment directly from Razorpay API:', err?.message || err);
      }
    }

    // If Razorpay fetch succeeded or we have database order payment details
    let paymentDetails: any = null;
    if (dbOrder?.payment_details) {
      try {
        paymentDetails = typeof dbOrder.payment_details === 'string'
          ? JSON.parse(dbOrder.payment_details)
          : dbOrder.payment_details;
      } catch {}
    }

    const paymentSource = rzpPayment || paymentDetails;

    if (!paymentSource && !dbOrder) {
      return NextResponse.json(
        { success: false, error: 'Payment receipt not found for the provided identifier' },
        { status: 404 }
      );
    }

    const methodType = (rzpPayment?.method || paymentSource?.method || dbOrder?.payment_method || 'razorpay').toLowerCase();
    let methodDisplay = 'Razorpay Live';
    if (methodType === 'upi') methodDisplay = 'UPI';
    else if (methodType === 'card') methodDisplay = 'Credit / Debit Card';
    else if (methodType === 'netbanking') methodDisplay = 'Net Banking';
    else if (methodType === 'wallet') methodDisplay = 'Digital Wallet';

    const rawAmount = rzpPayment?.amount
      ? rzpPayment.amount / 100
      : (dbOrder?.total_amount || 0);

    const receiptData = {
      receipt_id: `REC-${(paymentId || dbOrder?.payment_id || dbOrder?.order_number || '000000').slice(-8).toUpperCase()}`,
      order_id: dbOrder?.id || orderId,
      order_number: dbOrder?.order_number || orderId,
      payment_id: paymentId || dbOrder?.payment_id || rzpPayment?.id,
      razorpay_order_id: rzpPayment?.order_id || paymentSource?.order_id || null,
      gateway: 'Razorpay Live Payment Gateway (India)',
      amount: rawAmount,
      currency: rzpPayment?.currency || dbOrder?.currency || 'INR',
      status: rzpPayment?.status || paymentSource?.status || dbOrder?.payment_status || 'captured',
      payment_method: methodDisplay,
      upi: {
        vpa: rzpPayment?.vpa || paymentSource?.vpa || null,
        rrn: rzpPayment?.acquirer_data?.rrn || paymentSource?.acquirer_data?.rrn || null,
        upi_transaction_id: rzpPayment?.acquirer_data?.upi_transaction_id || paymentSource?.acquirer_data?.upi_transaction_id || null,
      },
      card: rzpPayment?.card || paymentSource?.card ? {
        last4: (rzpPayment?.card || paymentSource?.card)?.last4,
        network: (rzpPayment?.card || paymentSource?.card)?.network,
        type: (rzpPayment?.card || paymentSource?.card)?.type,
        issuer: (rzpPayment?.card || paymentSource?.card)?.issuer || null,
      } : null,
      bank: rzpPayment?.bank || paymentSource?.bank || null,
      wallet: rzpPayment?.wallet || paymentSource?.wallet || null,
      customer: {
        name: dbOrder?.customer_name || dbOrder?.recipient_name || 'Valued Customer',
        email: rzpPayment?.email || dbOrder?.customer_email || 'customer@kawaiora.com',
        contact: rzpPayment?.contact || dbOrder?.customer_phone || dbOrder?.recipient_phone || '+919876543210',
      },
      merchant: {
        name: 'KawaiOra Artisan Hampers',
        support_email: 'support@kawaiora.com',
        website: 'https://kawaiora.com',
        verified_by: 'Razorpay Certified Live Merchant',
      },
      paid_at: rzpPayment?.created_at
        ? new Date(rzpPayment.created_at * 1000).toISOString()
        : (dbOrder?.confirmed_at || dbOrder?.created_at || new Date().toISOString()),
    };

    return NextResponse.json({
      success: true,
      data: receiptData,
    });
  } catch (error: any) {
    console.error('Receipt API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment receipt' },
      { status: 500 }
    );
  }
}
