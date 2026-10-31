import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const DEFAULT_HOMEPAGE_CONFIG = {
  hero_headline: 'Unforgettable Gifts, Crafted With Love',
  hero_subheadline: 'Surprise your loved ones, colleagues, and partners with artisan gourmet hampers, premium sparkling wines, and custom handmade keepsakes delivered right to their doorstep.',
  hero_badge_text: 'Handcrafted Gift Experiences',
  hero_primary_button_text: 'Explore Luxury Hampers',
  hero_primary_button_link: '/shop',
  hero_secondary_button_text: 'Build Custom Hamper',
  hero_secondary_button_link: '/customize/new',
  hero_image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80',
  promotional_banner_active: true,
  promotional_banner_text: '🌿 Special Welcome Offer: Use code WELCOME10 for 10% off your first luxury order!',
  sections_order: ['hero', 'promotions', 'occasions', 'featured', 'bestsellers', 'custom_builder', 'corporate', 'testimonials', 'story'],
  sections_visibility: {
    hero: true,
    promotions: true,
    occasions: true,
    featured: true,
    bestsellers: true,
    custom_builder: true,
    corporate: true,
    testimonials: true,
    story: true,
  },
  story_title: 'The Art of Thoughtful Gifting',
  story_text: 'Every KawaiOra hamper is thoughtfully curated by our artisan team. From handcrafted gourmet confectionery to hand-tied satin ribbons, we transform gifting into an unforgettable emotional celebration.',
  story_image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=80',
  status: 'published',
};

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_HOMEPAGE_CONFIG,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching homepage config:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_HOMEPAGE_CONFIG,
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
    const supabase = createClient();

    // 1. Fetch current config to archive
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
          version_notes: body.version_notes || 'Updated via Homepage Visual Editor',
          published_by: user.email || user.name || 'Admin',
        },
      ]);
    }

    // 2. Prepare payload
    const updatePayload = {
      hero_headline: body.hero_headline || DEFAULT_HOMEPAGE_CONFIG.hero_headline,
      hero_subheadline: body.hero_subheadline || DEFAULT_HOMEPAGE_CONFIG.hero_subheadline,
      hero_badge_text: body.hero_badge_text || DEFAULT_HOMEPAGE_CONFIG.hero_badge_text,
      hero_primary_button_text: body.hero_primary_button_text || DEFAULT_HOMEPAGE_CONFIG.hero_primary_button_text,
      hero_primary_button_link: body.hero_primary_button_link || DEFAULT_HOMEPAGE_CONFIG.hero_primary_button_link,
      hero_secondary_button_text: body.hero_secondary_button_text || DEFAULT_HOMEPAGE_CONFIG.hero_secondary_button_text,
      hero_secondary_button_link: body.hero_secondary_button_link || DEFAULT_HOMEPAGE_CONFIG.hero_secondary_button_link,
      hero_image_url: body.hero_image_url || DEFAULT_HOMEPAGE_CONFIG.hero_image_url,
      promotional_banner_active: body.promotional_banner_active !== undefined ? Boolean(body.promotional_banner_active) : true,
      promotional_banner_text: body.promotional_banner_text || DEFAULT_HOMEPAGE_CONFIG.promotional_banner_text,
      sections_order: body.sections_order || DEFAULT_HOMEPAGE_CONFIG.sections_order,
      sections_visibility: body.sections_visibility || DEFAULT_HOMEPAGE_CONFIG.sections_visibility,
      story_title: body.story_title || DEFAULT_HOMEPAGE_CONFIG.story_title,
      story_text: body.story_text || DEFAULT_HOMEPAGE_CONFIG.story_text,
      story_image_url: body.story_image_url || DEFAULT_HOMEPAGE_CONFIG.story_image_url,
      status: 'published',
      updated_at: new Date().toISOString(),
      updated_by: user.email || user.name || 'admin',
    };

    let savedRow = null;
    if (currentConfig?.id) {
      const { data, error } = await supabase
        .from('homepage_config')
        .update(updatePayload)
        .eq('id', currentConfig.id)
        .select()
        .single();
      if (error) throw error;
      savedRow = data;
    } else {
      const { data, error } = await supabase
        .from('homepage_config')
        .insert([updatePayload])
        .select()
        .single();
      if (error) throw error;
      savedRow = data;
    }

    try {
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Homepage layout and content published successfully!',
      data: savedRow,
    });
  } catch (error: any) {
    console.error('Error saving homepage config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish homepage layout' },
      { status: 500 }
    );
  }
}
