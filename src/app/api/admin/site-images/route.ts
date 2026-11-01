import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  SiteImagesConfig,
  DEFAULT_SITE_IMAGES,
  mergeSiteImagesConfig,
} from '@/types/site-images';

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

    let siteConfig: SiteImagesConfig = mergeSiteImagesConfig(DEFAULT_SITE_IMAGES, null);

    if (homeConfig?.hero_image_url) {
      siteConfig.hero_slides[0].image_url = homeConfig.hero_image_url;
    }
    if (homeConfig?.story_image_url) {
      siteConfig.feature_banners.brand_story_image = homeConfig.story_image_url;
    }

    const storedImagesRaw = (homeConfig as any)?.site_images_data;
    const hasStoredImages = storedImagesRaw && typeof storedImagesRaw === 'object'
      ? Object.keys(storedImagesRaw).length > 0
      : Boolean(storedImagesRaw);

    // Older saves kept these two fields outside the full image configuration.
    if (homeConfig && !hasStoredImages) {
      if (homeConfig.promotional_banner_text) {
        siteConfig.halloween_banner.banner_text = homeConfig.promotional_banner_text;
      }
      if (homeConfig.promotional_banner_active !== null && homeConfig.promotional_banner_active !== undefined) {
        siteConfig.halloween_banner.active = Boolean(homeConfig.promotional_banner_active);
      }
    }

    // Read the full saved configuration (header, theme, navigation and store settings).
    if (hasStoredImages) {
      try {
        const custom = typeof (homeConfig as any).site_images_data === 'string'
          ? JSON.parse((homeConfig as any).site_images_data)
          : (homeConfig as any).site_images_data;
        siteConfig = mergeSiteImagesConfig(siteConfig, custom);
      } catch {}
    }

    // Brand Identity is the canonical logo editor; mirror it over any older
    // image-manager snapshot so both admin screens show the newest logo.
    if (brandConfig?.logo_url) siteConfig.header.logo_url = brandConfig.logo_url;
    if (brandConfig?.logo_mobile_url) siteConfig.header.logo_mobile_url = brandConfig.logo_mobile_url;

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
    const requestedImages = body.siteImages || body;
    if (requestedImages?.store_settings?.free_shipping_threshold !== undefined) {
      const threshold = Number(requestedImages.store_settings.free_shipping_threshold);
      if (!Number.isFinite(threshold) || threshold <= 0) {
        return NextResponse.json({ success: false, error: 'Free delivery threshold must be greater than zero.' }, { status: 400 });
      }
    }

    const { data: currentHome, error: readHomeError } = await supabase
      .from('homepage_config')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readHomeError) throw readHomeError;

    let currentImages = mergeSiteImagesConfig(DEFAULT_SITE_IMAGES, null);
    if ((currentHome as any)?.site_images_data) {
      try {
        const stored = typeof (currentHome as any).site_images_data === 'string'
          ? JSON.parse((currentHome as any).site_images_data)
          : (currentHome as any).site_images_data;
        currentImages = mergeSiteImagesConfig(currentImages, stored);
      } catch {}
    }

    const imagesPayload: SiteImagesConfig = mergeSiteImagesConfig(currentImages, requestedImages);

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

    const updateObj: Record<string, any> = {
      site_images_data: imagesPayload,
      hero_image_url: imagesPayload.hero_slides[0]?.image_url || DEFAULT_SITE_IMAGES.hero_slides[0].image_url,
      story_image_url: imagesPayload.feature_banners.brand_story_image || DEFAULT_SITE_IMAGES.feature_banners.brand_story_image,
      promotional_banner_text: imagesPayload.halloween_banner.banner_text,
      promotional_banner_active: imagesPayload.halloween_banner.active,
      updated_at: new Date().toISOString(),
    };

    if (currentHome?.id) {
      const { error } = await supabase
        .from('homepage_config')
        .update(updateObj)
        .eq('id', currentHome.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('homepage_config')
        .insert([{
          hero_headline: 'Unforgettable Gifts, Crafted With Love',
          hero_subheadline: 'Surprise your loved ones, colleagues, and partners with artisan gourmet hampers, premium sparkling wines, and custom handmade keepsakes delivered right to their doorstep.',
          hero_badge_text: 'Handcrafted Gift Experiences',
          hero_primary_button_text: 'Explore Luxury Hampers',
          hero_primary_button_link: '/shop',
          hero_secondary_button_text: 'Build Custom Hamper',
          hero_secondary_button_link: '/customize/new',
          sections_order: ['story_highlights', 'hero', 'trust_bar', 'occasions', 'featured', 'bestsellers', 'custom_builder', 'corporate', 'testimonials', 'story', 'faq'],
          sections_visibility: {
            story_highlights: true,
            hero: true,
            trust_bar: true,
            promotions: true,
            occasions: true,
            featured: true,
            bestsellers: true,
            custom_builder: true,
            corporate: true,
            testimonials: true,
            story: true,
            faq: true,
          },
          story_title: 'The Art of Thoughtful Gifting',
          story_text: 'Every KawaiOra hamper is thoughtfully curated by our artisan team. From handcrafted gourmet confectionery to hand-tied satin ribbons, we transform gifting into an unforgettable emotional celebration.',
          status: 'published',
          ...updateObj,
        }]);
      if (error) throw error;
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
