import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const cookieStore = cookies();
    const user = await getSessionUser();
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
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

    const sessionId = cookieStore.get('session_id')?.value;
    if (!user && order.session_id !== sessionId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending_payment', 'paid', 'confirmed'];
    if (!cancellableStatuses.includes(order.order_status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel order in ${order.order_status} status` },
        { status: 400 }
      );
    }

    // If payment was made, process refund
    if (order.payment_status === 'paid' && order.payment_id) {
      // TODO: Process refund via payment provider (Razorpay/Stripe)
      // For now, just update status
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        notes: order.notes 
          ? `${order.notes}\nCancelled: ${reason}` 
          : `Cancelled: ${reason}`,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Order cancellation error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel order' },
        { status: 500 }
      );
    }

    // Restore inventory
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id);

    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_id) {
          await supabase.rpc('increment_product_stock', {
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel order API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}