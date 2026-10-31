import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const ticketId = Number(resolved.id);
    const body = await request.json().catch(() => ({}));
    const adminNote = body.admin_response || 'Cancellation approved by administrator.';

    const supabase = createAdminClient();

    // 1. Fetch ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from('cancellation_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ success: false, error: 'Cancellation ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'approved') {
      return NextResponse.json({ success: false, error: 'Ticket is already approved' }, { status: 400 });
    }

    // 2. Fetch order to verify
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', ticket.order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Associated order not found' }, { status: 404 });
    }

    // 3. Update Cancellation Ticket status to Approved
    const nowIso = new Date().toISOString();
    await supabase
      .from('cancellation_tickets')
      .update({
        status: 'approved',
        admin_id: user.id || 'admin',
        admin_response: adminNote,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', ticketId);

    // 4. Update Order status to Cancelled
    const updatedNotes = order.notes 
      ? `${order.notes}\n[Approved Cancellation Ticket #${ticket.ticket_number}]: ${ticket.reason}`
      : `[Approved Cancellation Ticket #${ticket.ticket_number}]: ${ticket.reason}`;

    await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        cancelled_at: nowIso,
        notes: updatedNotes,
      })
      .eq('id', order.id);

    // 5. Restore Inventory exactly once
    try {
      let itemsList: any[] = [];
      if (order.items) {
        itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      }

      for (const item of itemsList) {
        const prodId = Number(item.product_id || item.id);
        const qty = Number(item.quantity || 1);
        if (!isNaN(prodId) && qty > 0) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock')
            .eq('id', prodId)
            .single();

          if (prod && typeof prod.stock === 'number') {
            await supabase
              .from('products')
              .update({ stock: prod.stock + qty })
              .eq('id', prodId);
          }
        }
      }
    } catch (invErr) {
      console.warn('Inventory restoration notice:', invErr);
    }

    // 6. Record in Cancellation Ticket History
    await supabase.from('cancellation_ticket_history').insert([{
      ticket_id: ticketId,
      previous_status: ticket.status,
      new_status: 'approved',
      changed_by: user.name || 'Admin',
      remarks: adminNote,
    }]);

    const res = NextResponse.json({
      success: true,
      message: `Cancellation Ticket #${ticket.ticket_number} approved! Order #${order.order_number} has been cancelled and inventory restored.`,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (err) {
    console.error('Approve cancellation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error approving ticket' }, { status: 500 });
  }
}
