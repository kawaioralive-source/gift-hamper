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
    const body = await request.json();
    const rejectionReason = body.rejection_reason?.trim();

    if (!rejectionReason) {
      return NextResponse.json({ success: false, error: 'Please provide an official rejection reason for the customer.' }, { status: 400 });
    }

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

    if (ticket.status === 'rejected') {
      return NextResponse.json({ success: false, error: 'Ticket is already rejected' }, { status: 400 });
    }

    // 2. Update Cancellation Ticket status to Rejected (Order remains active and unchanged!)
    const nowIso = new Date().toISOString();
    await supabase
      .from('cancellation_tickets')
      .update({
        status: 'rejected',
        admin_id: user.id || 'admin',
        admin_response: rejectionReason,
        rejection_reason: rejectionReason,
        rejected_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', ticketId);

    // 3. Record in Cancellation Ticket History
    await supabase.from('cancellation_ticket_history').insert([{
      ticket_id: ticketId,
      previous_status: ticket.status,
      new_status: 'rejected',
      changed_by: user.name || 'Admin',
      remarks: `Rejected: ${rejectionReason}`,
    }]);

    const res = NextResponse.json({
      success: true,
      message: `Cancellation Ticket #${ticket.ticket_number} rejected. Order remains active.`,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (err) {
    console.error('Reject cancellation error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error rejecting ticket' }, { status: 500 });
  }
}
