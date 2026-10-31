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
      .from('homepage_config_history')
      .select('*')
      .eq('id', history_id)
      .single();

    if (fetchErr || !historyRow || !historyRow.config_data) {
      return NextResponse.json({ success: false, error: 'Version record not found' }, { status: 404 });
    }

    const targetConfig = historyRow.config_data;

    // 2. Archive current config before restoring
    const { data: currentConfig } = await supabase
      .from('homepage_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentConfig) {
      await supabase.from('homepage_config_history').insert([
        {
          config_data: currentConfig,
          version_notes: `Archived automatically prior to restoring homepage layout #${history_id}`,
          published_by: user.email || user.name || 'Admin',
        },
      ]);
    }

    // 3. Restore to homepage_config
    const restorePayload = {
      hero_headline: targetConfig.hero_headline,
      hero_subheadline: targetConfig.hero_subheadline,
      hero_badge_text: targetConfig.hero_badge_text,
      hero_primary_button_text: targetConfig.hero_primary_button_text,
      hero_primary_button_link: targetConfig.hero_primary_button_link,
      hero_secondary_button_text: targetConfig.hero_secondary_button_text,
      hero_secondary_button_link: targetConfig.hero_secondary_button_link,
      hero_image_url: targetConfig.hero_image_url,
      promotional_banner_active: targetConfig.promotional_banner_active,
      promotional_banner_text: targetConfig.promotional_banner_text,
      sections_order: targetConfig.sections_order,
      sections_visibility: targetConfig.sections_visibility,
      story_title: targetConfig.story_title,
      story_text: targetConfig.story_text,
      story_image_url: targetConfig.story_image_url,
      status: 'published',
      updated_at: new Date().toISOString(),
      updated_by: `${user.email || user.name} (Restored #${history_id})`,
    };

    let restoredRow = null;
    if (currentConfig?.id) {
      const { data, error } = await supabase
        .from('homepage_config')
        .update(restorePayload)
        .eq('id', currentConfig.id)
        .select()
        .single();
      if (error) throw error;
      restoredRow = data;
    } else {
      const { data, error } = await supabase
        .from('homepage_config')
        .insert([restorePayload])
        .select()
        .single();
      if (error) throw error;
      restoredRow = data;
    }

    try {
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back homepage layout to version #${history_id}`,
      data: restoredRow,
    });
  } catch (error: any) {
    console.error('Error restoring homepage history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore homepage version' },
      { status: 500 }
    );
  }
}
