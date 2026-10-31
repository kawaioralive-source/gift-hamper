import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase().trim();

    // 1. If no code requested, return the currently active promo code for the top announcement banner
    if (!code) {
      let activeCoupons: any[] = [];
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', 1)
          .order('id', { ascending: false });
        if (data && data.length > 0) {
          activeCoupons = data;
        }
      } catch {}

      if (activeCoupons.length === 0) {
        try {
          const rows = await querySqlite(`SELECT * FROM discounts WHERE is_active = 1 ORDER BY id DESC`);
          if (rows && rows.length > 0) {
            activeCoupons = rows;
          }
        } catch {}
      }

      const activePromo = activeCoupons[0] || null;

      return NextResponse.json({
        success: true,
        data: activeCoupons,
        activePromo: activePromo ? {
          code: activePromo.code,
          percentage: activePromo.percentage || activePromo.discount_value || 10,
          description: `${activePromo.percentage || activePromo.discount_value || 10}% Off`,
        } : null,
      });
    }

    // 2. Validate specific code against Supabase and SQLite
    let matchedCoupon: any = null;

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .eq('is_active', 1)
        .limit(1);

      if (data && data.length > 0) {
        matchedCoupon = data[0];
      }
    } catch {}

    if (!matchedCoupon) {
      try {
        const rows = await querySqlite(
          `SELECT * FROM discounts WHERE UPPER(code) = ? AND is_active = 1`,
          [code]
        );
        if (rows && rows.length > 0) {
          matchedCoupon = rows[0];
        }
      } catch {}
    }

    if (!matchedCoupon) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Promo code is invalid, inactive, or expired' },
        { status: 400 }
      );
    }

    // Check expiry date if specified
    if (matchedCoupon.expiry_date) {
      const expiry = new Date(matchedCoupon.expiry_date);
      if (expiry < new Date()) {
        return NextResponse.json(
          { success: false, valid: false, error: 'This promo code has expired' },
          { status: 400 }
        );
      }
    }

    const discountValue = matchedCoupon.discount_value || matchedCoupon.percentage || 10;
    const discountType = matchedCoupon.discount_type || 'percentage';

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        code: matchedCoupon.code,
        discount_type: discountType,
        discount_value: discountValue,
        percentage: discountType === 'percentage' ? discountValue : 10,
        min_spend: matchedCoupon.min_spend || 0,
      },
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = (body.code || '').toUpperCase().trim();

    if (!code) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Promo code is required' },
        { status: 400 }
      );
    }

    let matchedCoupon: any = null;

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .eq('is_active', 1)
        .limit(1);

      if (data && data.length > 0) {
        matchedCoupon = data[0];
      }
    } catch {}

    if (!matchedCoupon) {
      try {
        const rows = await querySqlite(
          `SELECT * FROM discounts WHERE UPPER(code) = ? AND is_active = 1`,
          [code]
        );
        if (rows && rows.length > 0) {
          matchedCoupon = rows[0];
        }
      } catch {}
    }

    if (!matchedCoupon) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Promo code is invalid, inactive, or expired' },
        { status: 400 }
      );
    }

    if (matchedCoupon.expiry_date) {
      const expiry = new Date(matchedCoupon.expiry_date);
      if (expiry < new Date()) {
        return NextResponse.json(
          { success: false, valid: false, error: 'This promo code has expired' },
          { status: 400 }
        );
      }
    }

    const discountValue = matchedCoupon.discount_value || matchedCoupon.percentage || 10;
    const discountType = matchedCoupon.discount_type || 'percentage';

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        code: matchedCoupon.code,
        discount_type: discountType,
        discount_value: discountValue,
        percentage: discountType === 'percentage' ? discountValue : 10,
        min_spend: matchedCoupon.min_spend || 0,
      },
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
