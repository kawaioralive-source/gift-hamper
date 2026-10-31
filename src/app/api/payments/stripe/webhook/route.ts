import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-04-10',
  });
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Stripe webhook secret not configured. Please set STRIPE_WEBHOOK_SECRET environment variable.');
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { success: false, error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(supabase, paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(supabase: ReturnType<typeof createClient>, paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  if (!orderId) {
    console.error('No order_id in payment intent metadata');
    return;
  }

  // Find the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Order not found for payment intent:', paymentIntent.id);
    return;
  }

  // Check if already processed (idempotency)
  if (order.payment_status === 'paid') {
    return;
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'paid',
      payment_id: paymentIntent.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Failed to update order status:', updateError);
    return;
  }

  // Create payment record
  await supabase.from('payments').insert({
    order_id: orderId,
    payment_method: 'stripe',
    payment_provider: 'stripe',
    provider_payment_id: paymentIntent.id,
    amount: order.total_amount,
    currency: order.currency,
    status: 'captured',
    captured_at: new Date().toISOString(),
  });

  // Clear the cart
  if (order.user_id) {
    await supabase.from('cart_items').delete().eq('cart_id', order.user_id);
  } else if (order.session_id) {
    await supabase.from('cart_items').delete().eq('cart_id', order.session_id);
  }
}

async function handlePaymentFailed(supabase: ReturnType<typeof createClient>, paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  if (!orderId) return;

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      order_status: 'cancelled',
    })
    .eq('id', orderId);
}

async function handlePaymentCanceled(supabase: ReturnType<typeof createClient>, paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  if (!orderId) return;

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      order_status: 'cancelled',
    })
    .eq('id', orderId);
}