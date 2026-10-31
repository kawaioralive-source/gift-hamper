import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { history_id } = await request.json();
    if (!history_id) {
      return NextResponse.json({ success: false, error: 'history_id is required' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch targeted history version
    const { data: historyRow, error: fetchErr } = await supabase
      .from('brand_config_history')
      .select('*')
      .eq('id', history_id)
      .single();

    if (fetchErr || !historyRow) {
      return NextResponse.json({ success: false, error: 'Version record not found' }, { status: 404 });
    }

    // 2. Fetch current config to archive before restoring
    const { data: currentConfig } = await supabase
      .from('brand_config')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentConfig) {
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
          version_notes: `Archived automatically prior to restoring version #${history_id}`,
          changed_by: user.email || user.name || 'Admin',
        },
      ]);
    }

    // 3. Restore targeted version to active brand_config
    const restorePayload = {
      brand_name: historyRow.brand_name,
      brand_short_name: historyRow.brand_short_name,
      brand_tagline: historyRow.brand_tagline || '',
      logo_url: historyRow.logo_url || '/images/kawaiora-logo.png',
      logo_mobile_url: historyRow.logo_mobile_url || historyRow.logo_url || '/images/kawaiora-logo.png',
      favicon_url: historyRow.favicon_url || '/images/kawaiora-logo.png',
      support_email: historyRow.support_email || 'support@kawaiora.com',
      support_phone: historyRow.support_phone || '+91 98201 45821',
      primary_color: historyRow.primary_color || '#d97706',
      accent_color: historyRow.accent_color || '#e11d48',
      updated_at: new Date().toISOString(),
      updated_by: `${user.email || user.name} (Restored #${history_id})`,
    };

    let restoredRow = null;
    if (currentConfig?.id) {
      const { data, error } = await supabase
        .from('brand_config')
        .update(restorePayload)
        .eq('id', currentConfig.id)
        .select()
        .single();
      if (error) throw error;
      restoredRow = data;
    } else {
      const { data, error } = await supabase
        .from('brand_config')
        .insert([restorePayload])
        .select()
        .single();
      if (error) throw error;
      restoredRow = data;
    }

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back brand identity to version #${history_id} ("${restorePayload.brand_name}")`,
      data: restoredRow,
    });
  } catch (error: any) {
    console.error('Error restoring brand history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore brand identity' },
      { status: 500 }
    );
  }
}
