import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // 1. Try Supabase
    try {
      const supabase = createClient();
      let query = supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('code', `%${search}%`);
      }

      const { data: promoCodes, error, count } = await query;
      if (!error && promoCodes) {
        const formatted = promoCodes.map((d: any) => ({
          id: String(d.id),
          code: d.code,
          description: `${d.percentage || d.discount_value}% off storewide`,
          discount_type: d.discount_type || 'percentage',
          discount_value: d.discount_value || d.percentage || 10,
          min_spend: d.min_spend || 0,
          min_order_amount: d.min_spend || 0,
          max_discount_amount: null,
          usage_limit: d.max_uses || null,
          used_count: d.times_used || 0,
          is_active: d.is_active === 1 || d.is_active === true,
          starts_at: d.created_at,
          expires_at: d.expiry_date || null,
          created_at: d.created_at || new Date().toISOString(),
        }));

        return NextResponse.json({
          success: true,
          data: formatted,
          pagination: {
            page: 1,
            limit: 20,
            total: count || formatted.length,
            total_pages: 1,
          },
        });
      }
    } catch (e) {
      console.warn('Supabase promo codes fetch error:', e);
    }

    // 2. SQLite Fallback
    const sqliteDiscounts = await querySqlite(`SELECT * FROM discounts ORDER BY id DESC`);
    const formatted = (sqliteDiscounts || []).map((d: any) => ({
      id: String(d.id),
      code: d.code,
      description: `${d.percentage || d.discount_value}% off storewide`,
      discount_type: d.discount_type || 'percentage',
      discount_value: d.discount_value || d.percentage || 10,
      min_spend: d.min_spend || 0,
      min_order_amount: d.min_spend || 0,
      max_discount_amount: null,
      usage_limit: d.max_uses || null,
      used_count: d.times_used || 0,
      is_active: d.is_active === 1 || d.is_active === true,
      starts_at: d.created_at,
      expires_at: d.expiry_date || null,
      created_at: d.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page: 1,
        limit: 20,
        total: formatted.length,
        total_pages: 1,
      },
    });
  } catch (error) {
    console.error('Admin promo codes API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const code = (body.code || `PROMO${Math.floor(Math.random() * 9000 + 1000)}`).toUpperCase().trim();
    const discountValue = Number(body.discount_value || body.percentage || 10);
    const discountType = body.discount_type || 'percentage';
    const percentageVal = discountType === 'percentage' ? discountValue : Number(body.percentage || 10);
    const isActiveVal = (body.is_active === false || body.is_active === 0 || body.is_active === 'false') ? 0 : 1;
    const minSpend = Number(body.min_order_amount || body.min_spend || 0);
    const maxUses = body.usage_limit ? Number(body.usage_limit) : 0;
    const expiryDate = body.expires_at || null;
    const applicableCategory = body.applies_to || 'all';

    if (isActiveVal === 1) {
      try {
        const supabase = createClient();
        await supabase.from('coupons').update({ is_active: 0 }).neq('code', code);
      } catch {}
      try {
        await executeSqlite(`UPDATE discounts SET is_active = 0 WHERE code != ?`, [code]);
      } catch {}
    }

    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      const couponPayload = {
        code,
        discount_type: discountType,
        discount_value: discountValue,
        percentage: percentageVal,
        is_active: isActiveVal,
        min_spend: minSpend,
        max_uses: maxUses,
        expiry_date: expiryDate || null,
        applicable_category: applicableCategory,
      };

      let promoCode: any = null;
      let error: any = null;

      if (existing) {
        const updateRes = await supabase
          .from('coupons')
          .update(couponPayload)
          .eq('id', existing.id)
          .select()
          .single();
        promoCode = updateRes.data;
        error = updateRes.error;
      } else {
        const insertRes = await supabase
          .from('coupons')
          .insert(couponPayload)
          .select()
          .single();
        promoCode = insertRes.data;
        error = insertRes.error;
      }

      if (!error && promoCode) {
        return NextResponse.json({
          success: true,
          message: 'Promo code created successfully',
          data: {
            ...promoCode,
            is_active: promoCode.is_active === 1,
          },
        });
      } else if (error) {
        console.warn('Supabase coupon save error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase coupon save exception:', e);
    }

    // SQLite fallback
    try {
      await executeSqlite(
        `INSERT INTO discounts (code, percentage, is_active, created_at, discount_type, discount_value, min_spend) VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
        [code, percentageVal, isActiveVal, discountType, discountValue, minSpend]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Promo code created successfully',
      data: {
        id: `promo-${Date.now()}`,
        code,
        discount_type: discountType,
        discount_value: discountValue,
        percentage: percentageVal,
        is_active: isActiveVal === 1,
      },
    });
  } catch (error) {
    console.error('Promo code creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}
