'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Filter, X, ChevronDown, Grid, List, Star, Tag, DollarSign, Users, Heart, Sparkles, Crown, Briefcase, Baby, Cake, Heart as HeartIcon, Search, ChevronLeft, ChevronRight, ShoppingBag, Gift, Package, Boxes, PartyPopper } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
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
  { value: 'valentine', label: 'Valentine\'s Day' },
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
  { value: 'friend', label: 'For Friend' },
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

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500 - ₹1,000' },
  { value: '1000-2000', label: '₹1,000 - ₹2,000' },
  { value: '2000-5000', label: '₹2,000 - ₹5,000' },
  { value: '5000-10000', label: '₹5,000 - ₹10,000' },
  { value: '10000', label: '₹10,000+' },
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
}

export function ShopPageClient({ initialCategory = '', initialOccasion = '', initialTitle }: ShopPageClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || initialCategory || '');
  const [occasion, setOccasion] = useState(searchParams.get('occasion') || initialOccasion || '');
  const [recipient, setRecipient] = useState(searchParams.get('recipient') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');
  const [isFeatured, setIsFeatured] = useState(searchParams.get('is_featured') === 'true');
  const [isBestseller, setIsBestseller] = useState(searchParams.get('is_bestseller') === 'true');
  const [isNewArrival, setIsNewArrival] = useState(searchParams.get('is_new_arrival') === 'true');

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
      params.set('limit', '20');

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      if (data.success) {
        setProducts(data.data);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category, occasion, recipient, priceRange, sort, inStock, isFeatured, isBestseller, isNewArrival, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (search) count++;
    if (category) count++;
    if (occasion) count++;
    if (recipient) count++;
    if (priceRange) count++;
    if (inStock) count++;
    if (isFeatured) count++;
    if (isBestseller) count++;
    if (isNewArrival) count++;
    setActiveFiltersCount(count);
  }, [search, category, occasion, recipient, priceRange, inStock, isFeatured, isBestseller, isNewArrival]);

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
    router.push('/shop');
  };

  const getPriceRangeLabel = (value: string) => {
    return PRICE_RANGES.find(r => r.value === value)?.label || 'All Prices';
  };

  const activeFilters = [
    { key: 'search', label: search ? `Search: "${search}"` : null, value: search },
    { key: 'category', label: category ? `Category: ${CATEGORIES.find(c => c.value === category)?.label}` : null, value: category },
    { key: 'occasion', label: occasion ? `Occasion: ${OCCASIONS.find(o => o.value === occasion)?.label}` : null, value: occasion },
    { key: 'recipient', label: recipient ? `Recipient: ${RECIPIENTS.find(r => r.value === recipient)?.label}` : null, value: recipient },
    { key: 'price', label: priceRange ? `Price: ${getPriceRangeLabel(priceRange)}` : null, value: priceRange },
    { key: 'in_stock', label: inStock ? 'In Stock Only' : null, value: inStock ? 'true' : '' },
    { key: 'is_featured', label: isFeatured ? 'Featured' : null, value: isFeatured ? 'true' : '' },
    { key: 'is_bestseller', label: isBestseller ? 'Best Sellers' : null, value: isBestseller ? 'true' : '' },
    { key: 'is_new_arrival', label: isNewArrival ? 'New Arrivals' : null, value: isNewArrival ? 'true' : '' },
  ].filter(f => f.value);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container-custom py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">All Gift Hampers</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Discover {total} premium hampers curated for every celebration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn('lg:hidden', filtersOpen && 'border-amber-500 text-amber-600')}
              >
                Filters {activeFiltersCount > 0 && <Badge variant="amber">{activeFiltersCount}</Badge>}
              </Button>
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<Grid className="w-4 h-4" />}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                />
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<List className="w-4 h-4" />}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 animate-in">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="amber"
                  className="flex items-center gap-1.5"
                  onClick={() => handleFilterChange(filter.key, '')}
                >
                  {filter.label}
                  <X className="w-3 h-3 cursor-pointer hover:opacity-70" />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={cn(
            'lg:w-72 flex-shrink-0',
            filtersOpen ? 'block' : 'hidden lg:block'
          )}>
            <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-24 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)} className="lg:hidden">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div>
                <label className="label-text">Search</label>
                <Input
                  value={search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search hampers, items..."
                  leftIcon={<Search className="w-4 h-4" />}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium w-full">Popular searches:</span>
                  {['Chocolate', 'Birthday', 'Corporate', 'Wine', 'Spa'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleFilterChange('search', tag)}
                      className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-800 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="label-text">Category</label>
                <Select
                  value={category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))]}
                  placeholder="Select category"
                />
              </div>

              {/* Occasion */}
              <div>
                <label className="label-text">Occasion</label>
                <Select
                  value={occasion}
                  onChange={(e) => handleFilterChange('occasion', e.target.value)}
                  options={[{ value: '', label: 'All Occasions' }, ...OCCASIONS.map(o => ({ value: o.value, label: o.label }))]}
                  placeholder="Select occasion"
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="label-text">Recipient</label>
                <Select
                  value={recipient}
                  onChange={(e) => handleFilterChange('recipient', e.target.value)}
                  options={[{ value: '', label: 'All Recipients' }, ...RECIPIENTS.map(r => ({ value: r.value, label: r.label }))]}
                  placeholder="Select recipient"
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="label-text">Price Range</label>
                <Select
                  value={priceRange}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                  options={PRICE_RANGES.map(r => ({ value: r.value, label: r.label }))}
                  placeholder="Select price range"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="label-text">Sort By</label>
                <Select
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  options={SORT_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                  placeholder="Sort by"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => handleFilterChange('is_featured', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => handleFilterChange('is_bestseller', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Best Sellers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => handleFilterChange('is_new_arrival', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">New Arrivals</span>
                </label>
              </div>

              {activeFiltersCount > 0 && (
                <Button variant="outline" className="w-full" onClick={clearAllFilters}>
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
                    <div className="h-60 bg-slate-200 dark:bg-slate-800" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-4 max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <Tag className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hampers found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                  We couldn't find any hampers matching your criteria. Try searching for these popular gifting collections:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {['Grand Royal', 'Chocolate', 'Executive Crate', 'Birthday Delight', 'Zen Wellness'].map((sug) => (
                    <Button
                      key={sug}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('search', sug)}
                      className="text-xs"
                    >
                      {sug}
                    </Button>
                  ))}
                </div>
                <Button variant="primary" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-1.5" />
                  View All Hampers
                </Button>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{products.length}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{total}</span> hampers
                  </p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      options={SORT_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                      className="w-auto"
                    />
                  </div>
                </div>

                {/* Products */}
                <div
                  className={cn(
                    'gap-6',
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  )}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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

      {/* Mobile Filters Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl animate-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-lg">Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              {/* Filter content would go here - simplified for mobile */}
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                Use the desktop version for full filtering options
              </p>
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
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
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
    toast.success(`${product.name} added to bag!`);
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
      <Link href={`/products/${product.slug}`} className="flex flex-col sm:flex-row gap-5 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:shadow-lg transition-all group bg-white dark:bg-slate-900/90">
        <div className="relative w-full sm:w-44 h-44 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase shadow-sm">
              -{discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">{product.category?.name}</span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {product.rating} ({product.review_count})
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition truncate font-serif">{product.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2 leading-relaxed">{product.short_description}</p>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{formatCurrency(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xs text-slate-400 line-through ml-2 leading-none">{formatCurrency(product.compare_at_price)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleWish} aria-label="Wishlist" className="h-9 px-3 rounded-xl">
                <Heart className={cn('w-4 h-4', inWish ? 'fill-rose-500 text-rose-500' : '')} />
              </Button>
              <Button size="sm" onClick={handleAdd} className="h-9 px-4 rounded-xl text-xs font-bold shrink-0 shadow-sm bg-amber-500 hover:bg-amber-400 text-black border-none" leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                Add to Bag
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 flex flex-col group hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900/90">
      <div className="relative overflow-hidden aspect-square w-full bg-slate-100 dark:bg-slate-900">
        <img
          src={mainImage}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover transition duration-500',
            secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
          )}
          loading="lazy"
        />
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase shadow-md">
              -{discountPercent}% OFF
            </span>
          )}
          {product.tag && (
            <Badge variant="amber" className="shadow-md text-[10px]">{product.tag}</Badge>
          )}
        </div>
        <button
          onClick={handleWish}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition hover:scale-110 shadow-md z-10"
          aria-label="Add to Wishlist"
        >
          <Heart className={cn('w-4 h-4 transition', inWish ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500')} />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">{product.category?.name}</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {product.rating} ({product.review_count})
            </span>
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition leading-snug line-clamp-1 font-serif">{product.name}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{product.short_description}</p>
        </div>
        <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto border-t border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">
              {formatCurrency(product.price)}
            </div>
            {product.compare_at_price && (
              <div className="text-xs text-slate-400 line-through mt-1 leading-none">
                {formatCurrency(product.compare_at_price)}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            className="shrink-0 whitespace-nowrap text-xs font-bold px-3.5 py-2 h-9 rounded-xl shadow-sm hover:shadow bg-amber-500 hover:bg-amber-400 text-black border-none"
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
          >
            Add to Bag
          </Button>
        </div>
      </div>
    </Link>
  );
}