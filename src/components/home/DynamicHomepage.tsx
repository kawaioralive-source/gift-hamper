'use client';

import { useState, useEffect } from 'react';
import { Hero } from '@/components/home/Hero';
import { ShopByOccasion } from '@/components/home/ShopByOccasion';
import { FeaturedHampers } from '@/components/home/FeaturedHampers';
import { PersonalizedGifting } from '@/components/home/PersonalizedGifting';
import { BestSellers } from '@/components/home/BestSellers';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { FaqSection } from '@/components/home/FaqSection';
import { StoryHighlights } from '@/components/home/StoryHighlights';
import { TrustBenefitsBar } from '@/components/home/TrustBenefitsBar';
import { ShopByMood } from '@/components/home/ShopByMood';

interface DynamicHomepageProps {
  initialConfig?: {
    sections_order?: string[];
    sections_visibility?: Record<string, boolean>;
    promotional_banner_active?: boolean;
    promotional_banner_text?: string;
  };
}

const DEFAULT_ORDER = [
  'story_highlights',
  'hero',
  'trust_bar',
  'moods',
  'occasions',
  'featured',
  'custom_builder',
  'bestsellers',
  'story',
  'testimonials',
  'faq',
];

export function DynamicHomepage({ initialConfig }: DynamicHomepageProps) {
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(
    initialConfig?.sections_order || DEFAULT_ORDER
  );
  const [sectionsVisibility, setSectionsVisibility] = useState<Record<string, boolean>>(
    initialConfig?.sections_visibility || {}
  );
  const [promoBanner, setPromoBanner] = useState<{ active: boolean; text: string }>({
    active: initialConfig?.promotional_banner_active ?? true,
    text: initialConfig?.promotional_banner_text || '🌿 Special Welcome Offer: Use code WELCOME10 for 10% off your first luxury order!',
  });

  useEffect(() => {
    async function loadLayout() {
      try {
        const res = await fetch('/api/homepage-editor');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (Array.isArray(json.data.sections_order)) {
              setSectionsOrder(json.data.sections_order);
            }
            if (json.data.sections_visibility) {
              setSectionsVisibility(json.data.sections_visibility);
            }
            if (json.data.promotional_banner_text) {
              setPromoBanner({
                active: json.data.promotional_banner_active ?? true,
                text: json.data.promotional_banner_text,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Using baseline homepage layout:', e);
      }
    }
    loadLayout();
  }, []);

  const renderSection = (key: string) => {
    if (sectionsVisibility[key] === false) return null;

    switch (key) {
      case 'story_highlights':
      case 'highlights':
        return <StoryHighlights key="story_highlights" />;
      case 'hero':
        return <Hero key="hero" />;
      case 'trust_bar':
      case 'benefits':
        return <TrustBenefitsBar key="trust_bar" />;
      case 'moods':
      case 'shop_by_mood':
        return <ShopByMood key="moods" />;
      case 'promotions':
        return promoBanner.active ? (
          <div key="promotions" className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold tracking-wide shadow-inner">
            <span>{promoBanner.text}</span>
          </div>
        ) : null;
      case 'occasions':
        return <ShopByOccasion key="occasions" />;
      case 'featured':
        return <FeaturedHampers key="featured" />;
      case 'custom_builder':
      case 'personalized':
        return <PersonalizedGifting key="custom_builder" />;
      case 'bestsellers':
        return <BestSellers key="bestsellers" />;
      case 'story':
      case 'why_us':
        return <WhyChooseUs key="story" />;
      case 'testimonials':
      case 'reviews':
        return <CustomerReviews key="testimonials" />;
      case 'faq':
        return <FaqSection key="faq" />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-grow">
      {sectionsOrder.map((sectionKey) => renderSection(sectionKey))}
    </main>
  );
}
