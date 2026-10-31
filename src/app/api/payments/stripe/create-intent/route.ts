import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const cookieStore = cookies();
    const user = await getSessionUser();
    const body = await request.json();

    const { orderId, amount, currency = 'inr', payment_method_types = ['card'] } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount < 50) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 50 cents' },
        { status: 400 }
      );
    }

    // Verify the order exists and belongs to the user/session
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (user && order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!user && order.session_id !== cookieStore.get('session_id')?.value) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify amount matches
    const amountInCents = Math.round(order.total_amount * 100);
    if (amountInCents !== amount) {
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      payment_method_types,
      metadata: {
        order_id: orderId,
        customer_name: order.customer_name,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update the order with Stripe payment intent ID
    await supabase
      .from('orders')
      .update({ payment_id: paymentIntent.id })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },
    });
  } catch (error) {
    console.error('Stripe create payment intent error:', error);

    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { success: false, error: 'Payment provider misconfigured' },
        { status: 500 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}