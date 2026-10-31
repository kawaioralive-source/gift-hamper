import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function generateTicketNumber(): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CAN-${yearMonth}-${rand}`;
}

// GET: Check existing cancellation ticket status for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved = await Promise.resolve(params);
    const orderId = resolved.id;
    const numId = Number(orderId);

    const supabase = createAdminClient();
    let query = supabase.from('cancellation_tickets').select('*');
    if (!isNaN(numId)) {
      query = query.or(`order_id.eq.${numId},order_number.eq.${orderId}`);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: tickets, error } = await query.order('id', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, ticket: null });
    }

    const activeTicket = tickets && tickets.length > 0 ? tickets[0] : null;

    // Fetch history if ticket exists
    let history: any[] = [];
    if (activeTicket) {
      const { data: histData } = await supabase
        .from('cancellation_ticket_history')
        .select('*')
        .eq('ticket_id', activeTicket.id)
        .order('id', { ascending: false });
      history = histData || [];
    }

    const res = NextResponse.json({
      success: true,
      ticket: activeTicket,
      history,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (err) {
    console.error('Fetch cancellation ticket error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

// POST: Customer raises cancellation ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const resolved = await Promise.resolve(params);
    const orderId = resolved.id;
    const numId = Number(orderId);
    const body = await request.json();
    const { reason, description } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: 'Please select a valid cancellation reason.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch order
    let orderQuery = supabase.from('orders').select('*');
    if (!isNaN(numId)) {
      orderQuery = orderQuery.or(`id.eq.${numId},order_number.eq.${orderId}`);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }
    const { data: orders, error: orderErr } = await orderQuery.limit(1);

    if (orderErr || !orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // 2. Ownership verification
    if (user && order.user_id && order.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized to cancel this order.' }, { status: 403 });
    }
    if (!user && order.session_id && sessionId && order.session_id !== sessionId) {
      return NextResponse.json({ success: false, error: 'Session mismatch. Please sign in.' }, { status: 403 });
    }

    // 3. Status eligibility check
    const nonCancellable = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
    const currentStatus = (order.order_status || 'pending').toLowerCase();
    if (nonCancellable.includes(currentStatus)) {
      return NextResponse.json({
        success: false,
        error: `Order cannot be cancelled in "${currentStatus}" status. Please contact support.`,
      }, { status: 400 });
    }

    // 4. Check for existing active cancellation ticket
    const { data: existingTickets } = await supabase
      .from('cancellation_tickets')
      .select('*')
      .eq('order_id', order.id)
      .in('status', ['pending', 'under_review', 'approved']);

    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({
        success: false,
        error: `A cancellation ticket (${existingTickets[0].ticket_number}) is already ${existingTickets[0].status} for this order.`,
        ticket: existingTickets[0],
      }, { status: 400 });
    }

    // 5. Generate unique Ticket Number
    const ticketNumber = generateTicketNumber();

    // 6. Insert Cancellation Ticket (Order remains UNCHANGED until admin approves)
    const { data: newTicket, error: insertErr } = await supabase
      .from('cancellation_tickets')
      .insert([{
        ticket_number: ticketNumber,
        order_id: order.id,
        order_number: order.order_number,
        user_id: user?.id || order.user_id || null,
        customer_name: order.customer_name || user?.name || 'Customer',
        customer_email: order.customer_email || user?.email || '',
        customer_phone: order.customer_phone || user?.phone || '',
        reason: reason.trim(),
        description: description?.trim() || '',
        status: 'pending',
      }])
      .select()
      .single();

    if (insertErr || !newTicket) {
      console.error('Insert ticket error:', insertErr);
      return NextResponse.json({ success: false, error: 'Failed to create cancellation ticket' }, { status: 500 });
    }

    // 7. Insert initial History entry
    await supabase.from('cancellation_ticket_history').insert([{
      ticket_id: newTicket.id,
      previous_status: null,
      new_status: 'pending',
      changed_by: user?.name || order.customer_name || 'Customer',
      remarks: `Ticket raised: ${reason.trim()}`,
    }]);

    const res = NextResponse.json({
      success: true,
      message: 'Cancellation ticket submitted successfully! Our administration team will review your request shortly.',
      ticket: newTicket,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (err) {
    console.error('Cancellation ticket submission error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error submitting ticket' }, { status: 500 });
  }
}
