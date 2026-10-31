import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode')?.trim();

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, serviceable: false, message: 'Valid 6-digit PIN code is required' },
        { status: 400 }
      );
    }

    try {
      const supabase = createClient();
      const { data: zone, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('pincode', pincode)
        .eq('is_active', true)
        .single();

      if (!error && zone) {
        const estimatedDays = zone.estimated_days || 3;
        const deliveryBy = new Date();
        deliveryBy.setDate(deliveryBy.getDate() + estimatedDays);

        return NextResponse.json({
          success: true,
          serviceable: true,
          message: `Delivery available! Estimated ${estimatedDays}-${estimatedDays + 1} business days.`,
          zone: {
            pincode: zone.pincode,
            city: zone.city,
            state: zone.state,
            estimated_days: zone.estimated_days,
            shipping_cost: zone.shipping_cost,
            free_shipping_threshold: zone.free_shipping_threshold,
          },
          estimated_delivery: deliveryBy.toISOString().split('T')[0],
        });
      }
    } catch {
      // Fall through to standard national delivery serviceability
    }

    // Default fast delivery across major Indian pincodes
    const deliveryBy = new Date();
    deliveryBy.setDate(deliveryBy.getDate() + 3);

    return NextResponse.json({
      success: true,
      serviceable: true,
      message: `Delivery available! Express courier delivers within 2-3 business days.`,
      zone: {
        pincode,
        city: 'Nationwide Delivery',
        state: 'India',
        estimated_days: 3,
        shipping_cost: 99,
        free_shipping_threshold: 999,
      },
      estimated_delivery: deliveryBy.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Delivery check API error:', error);
    return NextResponse.json(
      { success: false, serviceable: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
