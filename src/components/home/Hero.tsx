'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Truck, Ribbon, Shield, WandSparkles, Gift, ChevronLeft, ChevronRight, Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

interface HeroSlide {
  id: string;
  title: string;
  category: string;
  tag: string;
  price: number;
  originalPrice: number;
  rating: number;
  slug: string;
  image: string;
  description: string;
  productId?: string;
}

const DEFAULT_HALLOWEEN_SLIDES: HeroSlide[] = [
  {
    id: '1',
    title: '🎃 The Midnight Masquerade Crate',
    category: 'Halloween Special',
    tag: '🎃 Limited Edition',
    price: 14999,
    originalPrice: 17999,
    rating: 4.9,
    slug: 'grand-royal-celebration',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80',
    description: 'French sparkling wine, Belgian dark chocolate skulls, salted caramels, and scented gothic candle.',
  },
  {
    id: '2',
    title: '🍫 Belgian Witch Truffles & Wine Opulence',
    category: 'Haunted Luxe',
    tag: '🦇 Trending',
    price: 11950,
    originalPrice: 13500,
    rating: 4.8,
    slug: 'artisanal-chocolate-wine',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=80',
    description: 'Aged Pinot Noir, handcrafted artisanal dark chocolate pralines, spiced roasted pecans, and silk ribbons.',
  },
  {
    id: '3',
    title: '🕯️ Gothic Twilight Executive Hamper',
    category: 'Gothic Royale',
    tag: 'VIP Choice',
    price: 18900,
    originalPrice: 21000,
    rating: 5.0,
    slug: 'executive-corporate-crate',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=1000&q=80',
    description: 'Single malt whiskey, roasted macadamia nuts, black leather bound journal, and obsidian pen set.',
  },
  {
    id: '4',
    title: '🍂 Autumn Harvest & Spooky Treats Box',
    category: 'Autumn Delight',
    tag: '🍁 Spooky Treats',
    price: 8499,
    originalPrice: 9999,
    rating: 4.8,
    slug: 'sweet-birthday-basket',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1000&q=80',
    description: 'Organic spiced wildflower honey, cinnamon cookies, artisan clay lanterns, and glazed pistachios.',
  },
];

export function Hero() {
  const [slides, setSlides] = useState(DEFAULT_HALLOWEEN_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();
  const [heroConfig, setHeroConfig] = useState({
    headline: '🎃 Hauntingly Exquisite\nArtisan Hampers',
    subheadline: 'Bewitch your loved ones, colleagues, and soulmates with limited-edition Belgian chocolates, pumpkin spice luxuries, and enchanted handmade keepsakes delivered across India.',
    badgeText: '🦇 Halloween Limited Edition Gifting',
    primaryButtonText: 'Explore Halloween Hampers',
    primaryButtonLink: '/shop',
    secondaryButtonText: 'Craft Spooky Hamper',
    secondaryButtonLink: '/customize/new',
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const [homeRes, imagesRes, productsRes] = await Promise.all([
          fetch('/api/homepage-editor'),
          fetch('/api/admin/site-images'),
          fetch('/api/products?limit=50'),
        ]);

        let halloweenThemeActive = true;
        let savedHeroSlides: any[] = [];
        if (imagesRes.ok) {
          const imgJson = await imagesRes.json();
          halloweenThemeActive = imgJson.data?.halloween_banner?.active === true;
          if (imgJson.success && Array.isArray(imgJson.data?.hero_slides)) savedHeroSlides = imgJson.data.hero_slides;
        }

        if (productsRes.ok) {
          const productsJson = await productsRes.json();
          if (productsJson.success && Array.isArray(productsJson.data) && productsJson.data.length > 0) {
            const orderedProducts = [
              ...savedHeroSlides
                .map((slide) => productsJson.data.find((product: any) => product.slug === slide.slug))
                .filter(Boolean),
              ...productsJson.data.filter((product: any) => !savedHeroSlides.some((slide) => slide.slug === product.slug)),
            ];
            const seenProductIds = new Set<string>();
            const liveSlides: HeroSlide[] = orderedProducts
              .filter((product: any) => {
                const id = String(product.id);
                if (seenProductIds.has(id)) return false;
                seenProductIds.add(id);
                return true;
              })
              .map((product: any, index: number) => {
                const savedSlide = savedHeroSlides.find((slide) => slide.slug === product.slug);
                return {
                  id: String(product.id),
                  productId: String(product.id),
                  title: product.name,
                  category: 'Halloween Special',
                  tag: savedSlide?.tag || (index === 0 ? '🎃 Featured' : 'Curated Gift'),
                  price: Number(product.price) || 0,
                  originalPrice: Number(product.compare_at_price) || 0,
                  rating: Number(product.rating) || 4.9,
                  slug: product.slug,
                  image: product.images?.[0] || product.image || DEFAULT_HALLOWEEN_SLIDES[index % DEFAULT_HALLOWEEN_SLIDES.length].image,
                  description: product.short_description || product.description || '',
                };
              });
            setSlides(liveSlides);
            setCurrentSlide(0);
          }
        }

        // The Halloween design owns the hero copy while it is enabled. The
        // homepage editor should only replace it after that theme is turned off.
        if (!halloweenThemeActive && homeRes.ok) {
          const json = await homeRes.json();
          if (json.success && json.data) {
            setHeroConfig((prev) => ({
              ...prev,
              headline: json.data.hero_headline || prev.headline,
              subheadline: json.data.hero_subheadline || prev.subheadline,
              badgeText: json.data.hero_badge_text || prev.badgeText,
              primaryButtonText: json.data.hero_primary_button_text || prev.primaryButtonText,
              primaryButtonLink: json.data.hero_primary_button_link || prev.primaryButtonLink,
              secondaryButtonText: json.data.hero_secondary_button_text || prev.secondaryButtonText,
              secondaryButtonLink: json.data.hero_secondary_button_link || prev.secondaryButtonLink,
            }));
          }
        }
      } catch {}
    }
    loadConfig();
  }, []);

  const active = slides[currentSlide] || DEFAULT_HALLOWEEN_SLIDES[0];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!active.productId) return;
    addToCart(active.productId, undefined, 1, {
      id: active.productId,
      name: active.title,
      slug: active.slug,
      price: active.price,
      images: [active.image],
      stock: 25,
    });
    toast.success(`${active.title} added to cart!`);
  };

  return (
    <section className="relative overflow-hidden py-16 lg:py-28 px-4 sm:px-6 lg:px-8">
      {/* Decorative ambient blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 animate-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              {heroConfig.badgeText}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-serif whitespace-pre-line">
              {heroConfig.headline}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {heroConfig.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={heroConfig.primaryButtonLink}>
                <Button size="xl" leftIcon={<ArrowRight className="w-5 h-5" />} rightIcon={<ArrowRight className="w-5 h-5" />}>
                  {heroConfig.primaryButtonText}
                </Button>
              </Link>
              <Link href={heroConfig.secondaryButtonLink}>
                <Button variant="outline" size="xl" leftIcon={<WandSparkles className="w-5 h-5 text-amber-500" />}>
                  {heroConfig.secondaryButtonText}
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Express Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Ribbon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Satin Ribbon Wrapped</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Showcase Slider */}
          <div
            className="lg:col-span-5 relative"
          >
            {/* Floating Top Accent Icon */}
            <div className="absolute -top-5 -right-3 z-30 w-24 sm:w-28 p-1.5 bg-slate-950 dark:bg-slate-100 rounded-2xl border-2 border-white/90 dark:border-slate-900/90 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full aspect-square rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                <Gift className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Slider Container */}
            <div className="relative rounded-3xl overflow-hidden glass-panel p-3 shadow-2xl border border-rose-500/30 group">
              {/* Image Carousel */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={cn(
                      'absolute inset-0 transition-all duration-700 ease-out',
                      index === currentSlide
                        ? 'opacity-100 scale-100 translate-x-0'
                        : index < currentSlide
                        ? 'opacity-0 scale-95 -translate-x-full'
                        : 'opacity-0 scale-95 translate-x-full'
                    )}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  </div>
                ))}

                {/* Badge Overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <Badge variant="amber" className="shadow-lg backdrop-blur-md">
                    {active.tag}
                  </Badge>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {active.rating}
                  </span>
                </div>

                {/* Interactive Arrow Controls */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-800 dark:text-slate-100 opacity-80 hover:opacity-100 hover:scale-110 transition shadow-lg"
                  aria-label="Previous hamper"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-800 dark:text-slate-100 opacity-80 hover:opacity-100 hover:scale-110 transition shadow-lg"
                  aria-label="Next hamper"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Interactive Slide Info Card */}
              <div className="mt-3 p-4 rounded-xl glass-card bg-slate-950/90 backdrop-blur-md border border-rose-500/30 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">{active.category}</div>
                  <div className="text-sm font-bold text-white truncate">{active.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-amber-400 font-extrabold text-base">{formatCurrency(active.price)}</span>
                    {active.originalPrice > active.price && <span className="text-slate-400 text-xs line-through">{formatCurrency(active.originalPrice)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {active.productId && <button
                    type="button"
                    onClick={handleQuickAdd}
                    className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                    title="Quick Add to Cart"
                    aria-label={`Add ${active.title} to cart`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>}
                  <Link href={active.productId ? `/products/${active.slug}` : '/shop'}>
                    <Button variant="rose" size="sm">
                      View Box
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-2 mt-3 pb-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === currentSlide
                        ? 'w-6 bg-amber-500 shadow-sm shadow-amber-500/50'
                        : 'w-2 bg-slate-400/40 hover:bg-slate-400/80'
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
