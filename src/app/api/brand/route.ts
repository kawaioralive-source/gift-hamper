import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const DEFAULT_BRAND = {
  brand_name: 'Kavayura Hampers',
  brand_short_name: 'Kavayura',
  brand_tagline: 'Artisan Handcrafted Hampers & Nationwide Luxury Gifting',
  logo_url: '/images/kawaiora-logo.png',
  logo_mobile_url: '/images/kawaiora-logo.png',
  favicon_url: '/images/kawaiora-logo.png',
  support_email: 'support@kavayurahampers.com',
  support_phone: '+91 98201 45821',
  support_address: 'Mumbai, Maharashtra, India',
  primary_color: '#d97706',
  accent_color: '#e11d48',
  announcement_text: '✨ Kavayura Hampers | Handcrafted Luxury Gifts & Nationwide Express Delivery',
};

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brand_config')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_BRAND,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching brand configuration:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_BRAND,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      brand_name,
      brand_short_name,
      brand_tagline,
      logo_url,
      logo_mobile_url,
      favicon_url,
      support_email,
      support_phone,
      support_address,
      primary_color,
      accent_color,
      announcement_text,
      version_notes,
    } = body;

    if (!brand_name || !brand_name.trim()) {
      return NextResponse.json({ success: false, error: 'Brand name is required' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch current active brand configuration to record into history
    const { data: currentConfig } = await supabase
      .from('brand_config')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentConfig) {
      // Archive current version to history
      await supabase.from('brand_config_history').insert([
        {
          config_id: currentConfig.id,
          brand_name: currentConfig.brand_name,
          brand_short_name: currentConfig.brand_short_name,
          brand_tagline: currentConfig.brand_tagline,
          logo_url: currentConfig.logo_url,
          logo_mobile_url: currentConfig.logo_mobile_url,
          favicon_url: currentConfig.favicon_url,
          support_email: currentConfig.support_email,
          support_phone: currentConfig.support_phone,
          primary_color: currentConfig.primary_color,
          accent_color: currentConfig.accent_color,
          version_notes: version_notes || 'Updated via Brand Identity Management',
          changed_by: user.email || user.name || 'Admin',
        },
      ]);
    }

    // 2. Upsert / update brand_config
    const updatePayload = {
      brand_name: brand_name.trim(),
      brand_short_name: (brand_short_name || brand_name).trim(),
      brand_tagline: (brand_tagline || '').trim(),
      logo_url: (logo_url || '/images/kawaiora-logo.png').trim(),
      logo_mobile_url: (logo_mobile_url || logo_url || '/images/kawaiora-logo.png').trim(),
      favicon_url: (favicon_url || '/images/kawaiora-logo.png').trim(),
      support_email: (support_email || 'support@kawaiora.com').trim(),
      support_phone: (support_phone || '+91 98201 45821').trim(),
      support_address: (support_address || 'Mumbai, Maharashtra, India').trim(),
      primary_color: (primary_color || '#d97706').trim(),
      accent_color: (accent_color || '#e11d48').trim(),
      announcement_text: (announcement_text || '').trim(),
      is_active: true,
      updated_at: new Date().toISOString(),
      updated_by: user.email || user.name || 'admin',
    };

    let updatedRow = null;
    if (currentConfig?.id) {
      const { data, error } = await supabase
        .from('brand_config')
        .update(updatePayload)
        .eq('id', currentConfig.id)
        .select()
        .single();
      if (error) throw error;
      updatedRow = data;
    } else {
      const { data, error } = await supabase
        .from('brand_config')
        .insert([updatePayload])
        .select()
        .single();
      if (error) throw error;
      updatedRow = data;
    }

    // Purge cached paths so all pages immediately re-render with the new identity
    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Global brand identity updated to "${updatePayload.brand_name}" successfully!`,
      data: updatedRow,
    });
  } catch (error: any) {
    console.error('Error saving brand identity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish brand identity' },
      { status: 500 }
    );
  }
}
