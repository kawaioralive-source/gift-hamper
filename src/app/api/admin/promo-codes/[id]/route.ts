import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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

    try {
      const supabase = createClient();
      const numId = Number(id);
      let query = supabase.from('coupons').select('*');
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('code', id);
      }
      const { data: promoCode, error } = await query.limit(1).maybeSingle();

      if (!error && promoCode) {
        return NextResponse.json({
          success: true,
          data: {
            ...promoCode,
            is_active: promoCode.is_active === 1 || promoCode.is_active === true,
            min_order_amount: promoCode.min_spend,
            usage_limit: promoCode.max_uses,
            starts_at: promoCode.created_at,
            expires_at: promoCode.expiry_date,
            applies_to: promoCode.applicable_category || 'all',
          },
        });
      }
    } catch {}

    const rows = await querySqlite(`SELECT * FROM discounts WHERE id = ? OR code = ?`, [id, id]);
    if (rows && rows.length > 0) {
      const d = rows[0];
      return NextResponse.json({
        success: true,
        data: {
          id: String(d.id),
          code: d.code,
          discount_type: d.discount_type || 'percentage',
          discount_value: d.discount_value || d.percentage || 10,
          is_active: d.is_active === 1 || d.is_active === true,
          min_order_amount: d.min_spend || 0,
          usage_limit: d.max_uses || 0,
          starts_at: d.created_at,
          expires_at: d.expiry_date || null,
          applies_to: d.applicable_category || 'all',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Promo code not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Admin promo code fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo code' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolved = await Promise.resolve(params);
    const id = resolved.id;
    const body = await request.json();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateFields: any = {};
    if (body.code) updateFields.code = body.code.toUpperCase().trim();
    if (body.discount_type) updateFields.discount_type = body.discount_type;
    if (body.discount_value != null) {
      updateFields.discount_value = Number(body.discount_value);
      if (body.discount_type === 'percentage' || !body.discount_type) {
        updateFields.percentage = Number(body.discount_value);
      }
    }
    if (body.is_active !== undefined) {
      updateFields.is_active = (body.is_active === true || body.is_active === 1 || body.is_active === 'true') ? 1 : 0;
    }
    if (body.min_order_amount != null || body.min_spend != null) {
      updateFields.min_spend = Number(body.min_order_amount ?? body.min_spend);
    }
    if (body.usage_limit != null || body.max_uses != null) {
      updateFields.max_uses = Number(body.usage_limit ?? body.max_uses);
    }
    if (body.expires_at !== undefined) {
      updateFields.expiry_date = body.expires_at || null;
    }
    if (body.applies_to) {
      updateFields.applicable_category = body.applies_to;
    }

    if (updateFields.is_active === 1) {
      try {
        const supabase = createClient();
        const numId = Number(id);
        if (!isNaN(numId)) {
          await supabase.from('coupons').update({ is_active: 0 }).neq('id', numId);
        } else {
          await supabase.from('coupons').update({ is_active: 0 }).neq('code', id);
        }
      } catch {}
      try {
        await executeSqlite(`UPDATE discounts SET is_active = 0 WHERE id != ? AND code != ?`, [id, id]);
      } catch {}
    }

    try {
      const supabase = createClient();
      const numId = Number(id);
      let query = supabase.from('coupons').update(updateFields);
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('code', id);
      }
      const { data: promoCode, error } = await query.select().single();

      if (!error && promoCode) {
        return NextResponse.json({
          success: true,
          message: 'Promo code updated successfully',
          data: {
            ...promoCode,
            is_active: promoCode.is_active === 1,
          },
        });
      }
    } catch {}

    // SQLite fallback
    try {
      await executeSqlite(
        `UPDATE discounts SET code = COALESCE(?, code), percentage = COALESCE(?, percentage), is_active = COALESCE(?, is_active), discount_value = COALESCE(?, discount_value) WHERE id = ? OR code = ?`,
        [updateFields.code, updateFields.percentage, updateFields.is_active, updateFields.discount_value, id, id]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Promo code updated successfully',
      data: { id, ...updateFields },
    });
  } catch (error) {
    console.error('Promo code update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    try {
      const supabase = createClient();
      const numId = Number(id);
      let query = supabase.from('coupons').delete();
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('code', id);
      }
      await query;
    } catch {}

    try {
      await executeSqlite(`DELETE FROM discounts WHERE id = ? OR code = ?`, [id, id]);
    } catch {}

    return NextResponse.json({ success: true, message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Promo code deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
