import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { SiteImagesConfig, DEFAULT_SITE_IMAGES } from '@/types/site-images';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check if site_images or homepage_config has custom stored images
    const { data: homeConfig } = await supabase
      .from('homepage_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: brandConfig } = await supabase
      .from('brand_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Merge custom overrides if present
    const siteConfig: SiteImagesConfig = JSON.parse(JSON.stringify(DEFAULT_SITE_IMAGES));

    if (brandConfig?.logo_url) {
      siteConfig.header.logo_url = brandConfig.logo_url;
    }
    if (brandConfig?.logo_mobile_url) {
      siteConfig.header.logo_mobile_url = brandConfig.logo_mobile_url;
    }

    if (homeConfig?.hero_image_url) {
      siteConfig.hero_slides[0].image_url = homeConfig.hero_image_url;
    }
    if (homeConfig?.story_image_url) {
      siteConfig.feature_banners.brand_story_image = homeConfig.story_image_url;
    }

    // Check if custom_images JSON exists in homeConfig
    if ((homeConfig as any)?.site_images_data) {
      try {
        const custom = typeof (homeConfig as any).site_images_data === 'string'
          ? JSON.parse((homeConfig as any).site_images_data)
          : (homeConfig as any).site_images_data;
        Object.assign(siteConfig, custom);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: siteConfig,
    });
  } catch (error) {
    console.error('Error fetching site images:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_SITE_IMAGES,
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

    // 1. If product image update requested
    if (body.action === 'update_product_image' && body.productId && body.imageUrl) {
      const { data, error } = await supabase
        .from('products')
        .update({ image: body.imageUrl })
        .eq('id', body.productId)
        .select()
        .single();

      if (error) throw error;

      try {
        revalidatePath('/');
        revalidatePath('/shop');
        revalidatePath('/products/' + (data.slug || ''));
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Product image updated successfully!',
        product: data,
      });
    }

    // 2. Update site images configuration
    const imagesPayload: SiteImagesConfig = body.siteImages || body;

    // Synchronize brand logo with brand_config
    if (imagesPayload.header?.logo_url) {
      try {
        await supabase
          .from('brand_config')
          .update({
            logo_url: imagesPayload.header.logo_url,
            logo_mobile_url: imagesPayload.header.logo_mobile_url || imagesPayload.header.logo_url,
          })
          .eq('is_active', true);
      } catch (err) {
        console.warn('Could not update brand_config logo:', err);
      }
    }

    // Save into homepage_config
    const { data: currentHome } = await supabase
      .from('homepage_config')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const updateObj: Record<string, any> = {
      hero_image_url: imagesPayload.hero_slides?.[0]?.image_url || DEFAULT_SITE_IMAGES.hero_slides[0].image_url,
      story_image_url: imagesPayload.feature_banners?.brand_story_image || DEFAULT_SITE_IMAGES.feature_banners.brand_story_image,
      promotional_banner_text: imagesPayload.halloween_banner?.banner_text || DEFAULT_SITE_IMAGES.halloween_banner.banner_text,
      promotional_banner_active: imagesPayload.halloween_banner?.active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (currentHome?.id) {
      await supabase
        .from('homepage_config')
        .update(updateObj)
        .eq('id', currentHome.id);
    } else {
      await supabase
        .from('homepage_config')
        .insert([updateObj]);
    }

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Website images updated and published successfully!',
      data: imagesPayload,
    });
  } catch (error: any) {
    console.error('Error updating site images:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update site images' },
      { status: 500 }
    );
  }
}
