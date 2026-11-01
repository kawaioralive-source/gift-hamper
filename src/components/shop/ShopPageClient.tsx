'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Star,
  Tag,
  DollarSign,
  Users,
  Heart,
  Sparkles,
  Crown,
  Briefcase,
  Cake,
  Heart as HeartIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Gift,
  Package,
  Boxes,
  PartyPopper,
  Check,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'All Collections', icon: ShoppingBag },
  { value: 'luxury', label: 'Luxury Gift Collections', icon: Crown },
  { value: 'birthday', label: 'Birthday Hampers', icon: Cake },
  { value: 'anniversary', label: 'Anniversary Hampers', icon: HeartIcon },
  { value: 'wedding', label: 'Wedding Gifts', icon: Gift },
  { value: 'corporate', label: 'Corporate Gifts', icon: Briefcase },
  { value: 'chocolate', label: 'Chocolate Hampers', icon: Sparkles },
  { value: 'festive', label: 'Festive Hampers', icon: PartyPopper },
  { value: 'wellness', label: 'Wellness & Spa', icon: Sparkles },
  { value: 'boxes', label: 'Premium Gift Boxes', icon: Package },
  { value: 'custom', label: 'Custom Gift Combos', icon: Boxes },
];

const OCCASIONS = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'valentine', label: "Valentine's Day" },
  { value: 'baby_shower', label: 'Baby Shower' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'festival', label: 'Festivals' },
  { value: 'friendship', label: 'Friendship' },
];

const RECIPIENTS = [
  { value: 'her', label: 'For Her' },
  { value: 'him', label: 'For Him' },
  { value: 'mom', label: 'For Mom' },
  { value: 'dad', label: 'For Dad' },
  { value: 'wife', label: 'For Wife' },
  { value: 'husband', label: 'For Husband' },
  { value: 'girlfriend', label: 'For Girlfriend' },
  { value: 'boyfriend', label: 'For Boyfriend' },
  { value: 'friend', label: 'For Friends' },
  { value: 'kids', label: 'For Kids' },
  { value: 'colleagues', label: 'For Colleagues' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'discount', label: 'Best Discount' },
];

const PRICE_PRESETS = [
  { value: '', label: 'All Prices' },
  { value: '0-1000', label: 'Under ₹1,000' },
  { value: '1000-2500', label: '₹1,000 - ₹2,500' },
  { value: '2500-5000', label: '₹2,500 - ₹5,000' },
  { value: '5000-10000', label: '₹5,000 - ₹10,000' },
  { value: '10000', label: '₹10,000 & Above' },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  review_count: number;
  images: string[];
  category: { name: string; slug: string } | null;
  occasion: { name: string; slug: string } | null;
  recipient: { name: string; slug: string } | null;
  tag: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  short_description: string;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface ShopPageClientProps {
  initialCategory?: string;
  initialOccasion?: string;
  initialTitle?: string;
  showFilters?: boolean;
}

export function ShopPageClient({
  initialCategory = '',
  initialOccasion = '',
  initialTitle,
  showFilters = true,
}: ShopPageClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Accordion open/collapse states
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    occasions: true,
    recipients: false,
    attributes: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter states from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || initialCategory || '';
  const occasion = searchParams.get('occasion') || initialOccasion || '';
  const recipient = searchParams.get('recipient') || '';
  const priceRange = searchParams.get('price') || '';
  const sort = searchParams.get('sort') || 'newest';
  const inStock = searchParams.get('in_stock') === 'true';
  const isFeatured = searchParams.get('is_featured') === 'true';
  const isBestseller = searchParams.get('is_bestseller') === 'true';
  const isNewArrival = searchParams.get('is_new_arrival') === 'true';

  // Custom min/max local inputs
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (occasion) params.set('occasion', occasion);
      if (recipient) params.set('recipient', recipient);
      if (priceRange) params.set('price', priceRange);
      if (sort) params.set('sort', sort);
      if (inStock) params.set('in_stock', 'true');
      if (isFeatured) params.set('is_featured', 'true');
      if (isBestseller) params.set('is_bestseller', 'true');
      if (isNewArrival) params.set('is_new_arrival', 'true');
      params.set('page', currentPage.toString());
      params.set('limit', '18');

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    category,
    occasion,
    recipient,
    priceRange,
    sort,
    inStock,
    isFeatured,
    isBestseller,
    isNewArrival,
    currentPage,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push('/shop');
  };

  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minPriceInput && !maxPriceInput) return;
    const min = minPriceInput ? parseInt(minPriceInput, 10) : 0;
    const max = maxPriceInput ? parseInt(maxPriceInput, 10) : '';
    const rangeVal = max ? `${min}-${max}` : `${min}`;
    handleFilterChange('price', rangeVal);
  };

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (search) filters.push({ key: 'search', label: `Search: "${search}"`, value: search });
    if (category) {
      const match = CATEGORIES.find((c) => c.value === category);
      filters.push({ key: 'category', label: `Category: ${match ? match.label : category}`, value: category });
    }
    if (occasion) {
      const match = OCCASIONS.find((o) => o.value === occasion);
      filters.push({ key: 'occasion', label: `Occasion: ${match ? match.label : occasion}`, value: occasion });
    }
    if (recipient) {
      const match = RECIPIENTS.find((r) => r.value === recipient);
      filters.push({ key: 'recipient', label: `Recipient: ${match ? match.label : recipient}`, value: recipient });
    }
    if (priceRange) {
      const preset = PRICE_PRESETS.find((p) => p.value === priceRange);
      filters.push({
        key: 'price',
        label: `Price: ${preset ? preset.label : `₹${priceRange.replace('-', ' - ₹')}`}`,
        value: priceRange,
      });
    }
    if (inStock) filters.push({ key: 'in_stock', label: 'In Stock Only', value: 'true' });
    if (isFeatured) filters.push({ key: 'is_featured', label: 'Featured Collections', value: 'true' });
    if (isBestseller) filters.push({ key: 'is_bestseller', label: 'Bestsellers', value: 'true' });
    if (isNewArrival) filters.push({ key: 'is_new_arrival', label: 'New Arrivals', value: 'true' });
    return filters;
  }, [search, category, occasion, recipient, priceRange, inStock, isFeatured, isBestseller, isNewArrival]);

  // Reusable Filter Content (shared between Desktop Sidebar & Mobile Drawer)
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Category Section */}
      <div className="border-b border-rose-100 dark:border-slate-800 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between text-left group py-1"
        >
          <span className="font-serif font-bold text-sm text-rose-950 dark:text-rose-100 group-hover:text-rose-600 transition">
            Categories & Collections
          </span>
          {expandedSections.categories ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          )}
        </button>

        {expandedSections.categories && (
          <div className="mt-3 space-y-1 max-h-56 overflow-y-auto pr-1">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleFilterChange('category', isSelected ? '' : c.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition text-left',
                    isSelected
                      ? 'bg-rose-100/70 text-rose-950 font-bold dark:bg-rose-950/60 dark:text-rose-200'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50/50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-rose-600' : 'text-slate-400')} />
                    <span className="truncate">{c.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="border-b border-rose-100 dark:border-slate-800 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-left group py-1"
        >
          <span className="font-serif font-bold text-sm text-rose-950 dark:text-rose-100 group-hover:text-rose-600 transition">
            Price Range (INR)
          </span>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          )}
        </button>

        {expandedSections.price && (
          <div className="mt-3 space-y-3">
            {/* Preset Price Pills */}
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((p) => {
                const isSelected = priceRange === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleFilterChange('price', isSelected ? '' : p.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition',
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            <form onSubmit={handleCustomPriceSubmit} className="pt-2 flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <Button type="submit" size="sm" variant="outline" className="text-xs shrink-0 px-2.5">
                Go
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Occasions Section */}
      <div className="border-b border-rose-100 dark:border-slate-800 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('occasions')}
          className="w-full flex items-center justify-between text-left group py-1"
        >
          <span className="font-serif font-bold text-sm text-rose-950 dark:text-rose-100 group-hover:text-rose-600 transition">
            Occasions
          </span>
          {expandedSections.occasions ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          )}
        </button>

        {expandedSections.occasions && (
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto pr-1">
            {OCCASIONS.map((o) => {
              const isSelected = occasion === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleFilterChange('occasion', isSelected ? '' : o.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition text-left',
                    isSelected
                      ? 'bg-rose-100/70 text-rose-950 font-bold dark:bg-rose-950/60 dark:text-rose-200'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50/50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span>{o.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipients Section */}
      <div className="border-b border-rose-100 dark:border-slate-800 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('recipients')}
          className="w-full flex items-center justify-between text-left group py-1"
        >
          <span className="font-serif font-bold text-sm text-rose-950 dark:text-rose-100 group-hover:text-rose-600 transition">
            Gift For Who?
          </span>
          {expandedSections.recipients ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          )}
        </button>

        {expandedSections.recipients && (
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto pr-1">
            {RECIPIENTS.map((r) => {
              const isSelected = recipient === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleFilterChange('recipient', isSelected ? '' : r.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition text-left',
                    isSelected
                      ? 'bg-rose-100/70 text-rose-950 font-bold dark:bg-rose-950/60 dark:text-rose-200'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50/50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span>{r.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Highlights & Availability */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('attributes')}
          className="w-full flex items-center justify-between text-left group py-1 mb-2"
        >
          <span className="font-serif font-bold text-sm text-rose-950 dark:text-rose-100 group-hover:text-rose-600 transition">
            Special Highlights
          </span>
          {expandedSections.attributes ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
          )}
        </button>

        {expandedSections.attributes && (
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => handleFilterChange('in_stock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>In Stock Only</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => handleFilterChange('is_bestseller', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>Bestseller Hampers</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => handleFilterChange('is_new_arrival', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>New Arrivals</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => handleFilterChange('is_featured', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>Editor's Curated</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf7f8] dark:bg-slate-950 font-sans">
      {/* Luxury Collection Header Banner */}
      <div className="relative border-b border-rose-100/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="container-custom py-8 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Handcrafted Hampers Atelier
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {initialTitle || 'Bespoke Luxury Hampers'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Explore our curated gallery of {total} artisanal gift hampers designed for memorable unboxing moments.
              </p>
            </div>

            {/* Mobile Filter Trigger & View Mode Switcher */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {showFilters && <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </button>}

              <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-lg transition',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-lg transition',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {showFilters && activeFilters.length > 0 && (
            <div className="mt-5 pt-4 border-t border-rose-100/60 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Active Filters:</span>
              {activeFilters.map((af) => (
                <span
                  key={af.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 border border-rose-200/80 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-200 shadow-xs"
                >
                  {af.label}
                  <button
                    type="button"
                    onClick={() => handleFilterChange(af.key, '')}
                    className="p-0.5 hover:bg-rose-200/60 dark:hover:bg-rose-800/60 rounded-full transition"
                    aria-label={`Remove filter ${af.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar & Products Grid */}
      <div className="container-custom py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar (hidden on mobile) */}
          {showFilters && <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                  <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                    Refine Hampers
                  </h3>
                </div>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {renderFilterControls()}
            </div>
          </aside>}

          {/* Products Column */}
          <div className="flex-1 min-w-0">
            {/* Top Toolbar: Count & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-rose-100/60 dark:border-slate-800">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-bold text-slate-900 dark:text-white">{products.length}</span>{' '}
                of <span className="font-bold text-slate-900 dark:text-white">{total}</span> bespoke hampers
              </p>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-rose-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-xs"
                >
                  {SORT_OPTIONS.map((so) => (
                    <option key={so.value} value={so.value}>
                      {so.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid or Empty State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="aspect-square bg-rose-50 dark:bg-slate-800" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-full" />
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-4 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800 p-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
                  <Gift className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">
                  No Hampers Found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  We couldn&apos;t find hampers matching your selected combination. Try clearing filters or selecting another celebration category.
                </p>
                <Button variant="rose" onClick={clearAllFilters} className="text-xs">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Clear All Filters & View All
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'gap-6',
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  )}
                >
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl h-9 px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <div key={p} className="flex items-center gap-1">
                            {prev && p - prev > 1 && <span className="text-xs text-slate-400 px-1">…</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                'w-9 h-9 rounded-xl text-xs font-bold transition',
                                currentPage === p
                                  ? 'bg-rose-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                              )}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl h-9 px-3"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {showFilters && filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-rose-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                  Refine Hampers
                </h3>
                {activeFilters.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    {activeFilters.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterControls()}
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="p-4 border-t border-rose-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setFiltersOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-xs font-bold text-white shadow-md transition"
              >
                Apply Filters ({total})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const inWish = isInWishlist(product.id);
  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop';
  const secondaryImage = product.images[1] || null;
  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, undefined, 1, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_at_price: product.compare_at_price,
      images: product.images,
      stock: 25,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product.id, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
    });
    toast.success(inWish ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  if (viewMode === 'list') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-3xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-rose-300 dark:hover:border-rose-800 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="relative w-full sm:w-48 h-48 shrink-0 rounded-2xl overflow-hidden bg-rose-50/50 dark:bg-slate-800">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discountPercent > 0 && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                {product.category?.name || 'Artisan Hamper'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {product.rating} ({product.review_count})
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white group-hover:text-rose-600 transition truncate">
              {product.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-3 border-t border-rose-100/60 dark:border-slate-800">
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none font-mono">
                {formatCurrency(product.price)}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-slate-400 line-through ml-2 font-mono">
                  {formatCurrency(product.compare_at_price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWish}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                aria-label="Wishlist"
              >
                <Heart className={cn('w-4 h-4', inWish ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} />
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="rounded-3xl overflow-hidden border border-rose-100/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col group hover:border-rose-300 dark:hover:border-rose-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-square w-full bg-rose-50/50 dark:bg-slate-800">
        <img
          src={mainImage}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover transition duration-700',
            secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
          )}
          loading="lazy"
        />
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition duration-700"
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase shadow-md">
              {discountPercent}% OFF
            </span>
          )}
          {product.is_bestseller && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow-md flex items-center gap-1">
              <Crown className="w-2.5 h-2.5" /> Bestseller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWish}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition hover:scale-110 shadow-md z-10"
          aria-label="Add to Wishlist"
        >
          <Heart className={cn('w-4 h-4 transition', inWish ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500')} />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between gap-3.5">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px]">
              {product.category?.name || 'Artisan Hamper'}
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {product.rating} ({product.review_count})
            </span>
          </div>

          <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition leading-snug line-clamp-1">
            {product.name}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto border-t border-rose-100/60 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none font-mono">
              {formatCurrency(product.price)}
            </div>
            {product.compare_at_price && (
              <div className="text-xs text-slate-400 line-through mt-1 leading-none font-mono">
                {formatCurrency(product.compare_at_price)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-sm hover:shadow transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add to Bag
          </button>
        </div>
      </div>
    </Link>
  );
}
