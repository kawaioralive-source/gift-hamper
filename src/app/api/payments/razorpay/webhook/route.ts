import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';

function getWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay webhook secret not configured.');
  }
  return secret;
}

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const secret = getWebhookSecret();
    const isValid = verifyWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      console.error('Razorpay webhook signature verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const body = JSON.parse(rawBody);
    const event = body.event;
    const payload = body.payload;

    const supabase = createClient();

    switch (event) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;
        const razorpayPaymentId = paymentEntity?.id;

        if (razorpayOrderId) {
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_id', razorpayOrderId)
            .single();

          if (order && order.payment_status !== 'paid') {
            await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                order_status: 'paid',
                payment_id: razorpayPaymentId || order.payment_id,
                confirmed_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            await supabase.from('payments').insert({
              order_id: order.id,
              payment_method: 'razorpay',
              payment_provider: 'razorpay',
              provider_payment_id: razorpayPaymentId || razorpayOrderId,
              provider_order_id: razorpayOrderId,
              amount: paymentEntity?.amount ? paymentEntity.amount / 100 : order.total_amount,
              currency: order.currency || 'INR',
              status: 'captured',
              captured_at: new Date().toISOString(),
            });

            if (order.user_id) {
              await supabase.from('cart_items').delete().eq('cart_id', order.user_id);
            } else if (order.session_id) {
              await supabase.from('cart_items').delete().eq('cart_id', order.session_id);
            }
          }
        }
        break;
      }
      case 'payment.failed': {
        const paymentEntity = payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;

        if (razorpayOrderId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              order_status: 'cancelled',
            })
            .eq('payment_id', razorpayOrderId);
        }
        break;
      }
      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
