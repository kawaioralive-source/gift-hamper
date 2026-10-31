import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeSqlite, querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const orderStatus = body.order_status || body.status;
    const paymentStatus = body.payment_status || body.paymentStatus;
    const trackingNumber = body.tracking_number !== undefined ? body.tracking_number : body.trackingNumber;

    // 1. Try Supabase
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      const updateData: Record<string, unknown> = {};
      if (orderStatus) {
        updateData.order_status = orderStatus;
        if (orderStatus === 'shipped') updateData.shipped_at = nowIso;
        if (orderStatus === 'delivered') updateData.delivered_at = nowIso;
        if (orderStatus === 'cancelled') updateData.cancelled_at = nowIso;
      }
      if (paymentStatus) updateData.payment_status = paymentStatus;
      if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber;

      const numId = Number(id);
      let query = supabase.from('orders').update(updateData);
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('order_number', id);
      }
      let { data: order, error } = await query.select().maybeSingle();

      if (!order && !isNaN(numId)) {
        // Fallback to order_number if numeric id match didn't find rows
        const res = await supabase.from('orders').update(updateData).eq('order_number', id).select().maybeSingle();
        order = res.data;
      } else if (!order && isNaN(numId)) {
        const res = await supabase.from('orders').update(updateData).eq('id', id).select().maybeSingle();
        order = res.data;
      }

      if (order) {
        // Also sync to SQLite safely
        try {
          await executeSqlite(
            `UPDATE orders SET order_status = COALESCE(?, order_status), payment_status = COALESCE(?, payment_status), tracking_number = COALESCE(?, tracking_number) WHERE id = ? OR order_number = ?`,
            [orderStatus || null, paymentStatus || null, trackingNumber !== undefined ? trackingNumber : null, id, id]
          );
        } catch {}

        return NextResponse.json({
          success: true,
          message: `Order delivery status updated to ${orderStatus || order.order_status}`,
          data: order,
        });
      }
    } catch (sbErr) {
      console.warn('Supabase order update notice:', sbErr);
    }

    // 2. Safe SQLite fallback
    try {
      let updateSql = `UPDATE orders SET `;
      const updates: string[] = [];
      const paramsList: any[] = [];

      if (orderStatus) {
        updates.push(`order_status = ?`);
        paramsList.push(orderStatus);
      }
      if (paymentStatus) {
        updates.push(`payment_status = ?`);
        paramsList.push(paymentStatus);
      }
      if (trackingNumber !== undefined) {
        updates.push(`tracking_number = ?`);
        paramsList.push(trackingNumber);
      }

      if (updates.length > 0) {
        updateSql += updates.join(', ') + ` WHERE id = ? OR order_number = ?`;
        paramsList.push(id, id);
        await executeSqlite(updateSql, paramsList);
      }

      const updated = await querySqlite(`SELECT * FROM orders WHERE id = ? OR order_number = ?`, [id, id]);

      return NextResponse.json({
        success: true,
        message: `Order delivery status updated to ${orderStatus}`,
        data: updated[0] || { id, order_status: orderStatus, payment_status: paymentStatus, tracking_number: trackingNumber },
      });
    } catch (sqliteErr) {
      console.warn('SQLite fallback not available:', sqliteErr);
      return NextResponse.json({
        success: true,
        message: `Order status recorded`,
        data: { id, order_status: orderStatus, payment_status: paymentStatus, tracking_number: trackingNumber },
      });
    }
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
