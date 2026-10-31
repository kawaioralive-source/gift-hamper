export interface SiteImagesConfig {
  header: {
    logo_url: string;
    logo_mobile_url: string;
    cart_icon_url: string;
    favicon_url: string;
  };
  halloween_banner: {
    active: boolean;
    banner_text: string;
    banner_code: string;
    banner_discount: string;
    banner_image_url: string;
  };
  hero_slides: Array<{
    id: string;
    title: string;
    tag: string;
    price: number;
    original_price?: number;
    image_url: string;
    slug: string;
    description: string;
  }>;
  circular_products: {
    use_live_products: boolean;
    items: Array<{
      id: string;
      name: string;
      image_url: string;
      href: string;
      tag?: string;
    }>;
  };
  shop_by_mood: Array<{
    id: string;
    title: string;
    tagline: string;
    tag: string;
    image_url: string;
    href: string;
  }>;
  feature_banners: {
    custom_builder_image: string;
    brand_story_image: string;
    corporate_banner_image: string;
  };
}

export const DEFAULT_SITE_IMAGES: SiteImagesConfig = {
  header: {
    logo_url: '/images/kawaiora-logo.png',
    logo_mobile_url: '/images/kawaiora-logo.png',
    cart_icon_url: '/images/cart-icon.png',
    favicon_url: '/favicon.ico',
  },
  halloween_banner: {
    active: true,
    banner_text: '🎃 HALLOWEEN SPOOKTACULAR SALE | Limited Edition Artisan Hampers | Pan-India Express Delivery 🦇',
    banner_code: 'SPOOKY20',
    banner_discount: '20% OFF',
    banner_image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  },
  hero_slides: [
    {
      id: '1',
      title: '🎃 The Midnight Masquerade Crate',
      tag: '🎃 Halloween Limited Edition',
      price: 14999,
      original_price: 17999,
      image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80',
      slug: 'grand-royal-celebration',
      description: 'French sparkling wine, Belgian dark chocolate skulls, salted caramels, and scented gothic candle.',
    },
    {
      id: '2',
      title: '🍫 Belgian Witch Truffles & Wine Opulence',
      tag: '🦇 Bewitched Luxe',
      price: 11950,
      original_price: 13500,
      image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=80',
      slug: 'artisanal-chocolate-wine',
      description: 'Aged Pinot Noir, handcrafted artisanal dark chocolate pralines, spiced roasted pecans, and silk ribbons.',
    },
    {
      id: '3',
      title: '🕯️ Gothic Twilight Executive Hamper',
      tag: 'VIP Choice',
      price: 18900,
      original_price: 21000,
      image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=1000&q=80',
      slug: 'executive-corporate-crate',
      description: 'Single malt whiskey, roasted macadamia nuts, black leather bound journal, and obsidian pen set.',
    },
    {
      id: '4',
      title: '🍂 Autumn Harvest & Spooky Treats Box',
      tag: '🍁 Autumn Special',
      price: 8499,
      original_price: 9999,
      image_url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1000&q=80',
      slug: 'sweet-birthday-basket',
      description: 'Organic spiced wildflower honey, cinnamon cookies, artisan clay lanterns, and glazed pistachios.',
    },
  ],
  circular_products: {
    use_live_products: true,
    items: [
      {
        id: '1',
        name: 'Grand Royal',
        image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=250&q=80',
        href: '/products/grand-royal-celebration',
        tag: '🎃 HOT',
      },
      {
        id: '2',
        name: 'Artisan Truffles',
        image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=250&q=80',
        href: '/products/artisanal-chocolate-wine',
        tag: '🍫 LUXE',
      },
      {
        id: '3',
        name: 'Executive Crate',
        image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=250&q=80',
        href: '/products/executive-corporate-crate',
        tag: 'VIP',
      },
      {
        id: '4',
        name: 'Spooky Box',
        image_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=250&q=80',
        href: '/customize/new',
        tag: '🪄 BUILD',
      },
      {
        id: '5',
        name: 'Zen Spa',
        image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=250&q=80',
        href: '/products/zen-wellness-spa',
        tag: '🕯️ RELAX',
      },
      {
        id: '6',
        name: 'Sweet Birthday',
        image_url: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=250&q=80',
        href: '/products/sweet-birthday-basket',
        tag: '🎉 TREAT',
      },
      {
        id: '7',
        name: 'Corporate Luxe',
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=250&q=80',
        href: '/corporate',
        tag: '💼 BULK',
      },
      {
        id: '8',
        name: 'Under ₹2,999',
        image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=250&q=80',
        href: '/shop?max_price=2999',
        tag: '⚡ VALUE',
      },
    ],
  },
  shop_by_mood: [
    {
      id: 'trick-or-treat',
      title: '🎃 Trick or Treat',
      tagline: 'Artisan dark chocolates, caramel skulls & gourmet confectionery',
      tag: 'Spooky Treats',
      image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Gourmet',
    },
    {
      id: 'midnight-magic',
      title: '🕯️ Midnight Magic',
      tagline: 'Gothic scented candles, Pinot Noir & handcrafted silk cards',
      tag: 'Mystic Vibe',
      image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      href: '/occasions/anniversary',
    },
    {
      id: 'pumpkin-warmth',
      title: '🍂 Pumpkin Warmth',
      tagline: 'Wildflower honey, cinnamon crisps, amber tea & wool keepsakes',
      tag: 'Autumn Mood',
      image_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      href: '/occasions/birthday',
    },
    {
      id: 'bewitched-royale',
      title: '👑 Bewitched Royale',
      tagline: 'French sparkling champagne, gold-leaf pralines & rigid keepsake crate',
      tag: 'Luxury Mood',
      image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      href: '/shop?category=Luxury',
    },
  ],
  feature_banners: {
    custom_builder_image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=1000&q=80',
    brand_story_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=80',
    corporate_banner_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
  },
};
