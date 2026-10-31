'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Flame,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { DEFAULT_SITE_IMAGES, SiteImagesConfig } from '@/types/site-images';

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
}

export function AdminImageManagerClient() {
  const [config, setConfig] = useState<SiteImagesConfig>(DEFAULT_SITE_IMAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'header' | 'halloween' | 'circular' | 'moods' | 'banners' | 'products'>('all');

  // Product live search & update
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [newProductImage, setNewProductImage] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [imagesRes, productsRes] = await Promise.all([
          fetch('/api/admin/site-images'),
          fetch('/api/products?limit=50'),
        ]);

        if (imagesRes.ok) {
          const imgJson = await imagesRes.json();
          if (imgJson.success && imgJson.data) {
            setConfig(imgJson.data);
          }
        }

        if (productsRes.ok) {
          const prodJson = await productsRes.json();
          if (prodJson.success && Array.isArray(prodJson.data)) {
            setProducts(prodJson.data);
          }
        }
      } catch (err) {
        console.error('Failed to load image manager config', err);
        toast.error('Could not load current image settings');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/site-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteImages: config }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('🎉 All website images updated and published successfully!');
        window.dispatchEvent(new Event('brand-identity-updated'));
      } else {
        toast.error(json.error || 'Failed to save images');
      }
    } catch (err: any) {
      toast.error('Failed to save website images');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProductImage = async () => {
    if (!selectedProduct || !newProductImage.trim()) {
      toast.error('Please enter a valid product image URL');
      return;
    }

    try {
      setUpdatingProduct(true);
      const res = await fetch('/api/admin/site-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_product_image',
          productId: selectedProduct.id,
          imageUrl: newProductImage.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Image updated for "${selectedProduct.name}"!`);
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? { ...p, image: newProductImage.trim() } : p))
        );
        setSelectedProduct((prev) => (prev ? { ...prev, image: newProductImage.trim() } : null));
        setNewProductImage('');
      } else {
        toast.error(json.error || 'Failed to update product image');
      }
    } catch {
      toast.error('Network error updating product image');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading website image settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-orange-950/80 via-slate-900 to-purple-950/80 border border-orange-500/30 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Image CMS & Halloween Theme Controls</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Website Image & Theme Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Admin has 100% control to inspect and replace any image across KawaiOra: Brand Logos, Halloween Hero Slides, Circular Product Story highlights, Mood tiles, and Product Photos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig(DEFAULT_SITE_IMAGES)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/30"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Publish All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Images' },
          { id: 'header', label: 'Header & Brand' },
          { id: 'halloween', label: '🎃 Halloween & Hero Slides' },
          { id: 'circular', label: '⭕ Circular Products Bar' },
          { id: 'moods', label: '✨ Shop by Mood' },
          { id: 'banners', label: '🎁 Feature Banners' },
          { id: 'products', label: '🛍️ Product Catalog Replacer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Header & Brand Assets */}
      {(activeTab === 'all' || activeTab === 'header') && (
        <Card className="p-6 border-orange-500/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Header & Brand Assets</span>
                <Badge variant="amber" className="text-[10px]">Header Navigation</Badge>
              </h2>
              <p className="text-xs text-slate-500">Logos and icons displayed on the top sticky header</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Desktop Logo */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Desktop Main Logo</label>
              <div className="h-28 rounded-2xl bg-black border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden group">
                <img src={config.header.logo_url} alt="Desktop Logo Preview" className="max-h-full max-w-full object-contain" />
              </div>
              <input
                type="text"
                value={config.header.logo_url}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, logo_url: e.target.value },
                  }))
                }
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Mobile Logo */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Logo</label>
              <div className="h-28 rounded-2xl bg-black border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden group">
                <img src={config.header.logo_mobile_url} alt="Mobile Logo Preview" className="max-h-full max-w-full object-contain" />
              </div>
              <input
                type="text"
                value={config.header.logo_mobile_url}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, logo_mobile_url: e.target.value },
                  }))
                }
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Cart Icon */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cart Icon Image</label>
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border flex items-center justify-center p-3">
                <img src={config.header.cart_icon_url} alt="Cart Icon Preview" className="w-12 h-12 object-contain" />
              </div>
              <input
                type="text"
                value={config.header.cart_icon_url}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, cart_icon_url: e.target.value },
                  }))
                }
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Favicon */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Browser Favicon</label>
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border flex items-center justify-center p-3">
                <img src={config.header.favicon_url} alt="Favicon Preview" className="w-8 h-8 object-contain" />
              </div>
              <input
                type="text"
                value={config.header.favicon_url}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, favicon_url: e.target.value },
                  }))
                }
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 2. 🎃 Halloween Theme & Hero Slides */}
      {(activeTab === 'all' || activeTab === 'halloween') && (
        <Card className="p-6 border-orange-500/30 shadow-glow-halloween/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎃 Halloween Theme & Hero Carousel Slides</span>
                <Badge variant="rose" className="text-[10px]">Spooky Special</Badge>
              </h2>
              <p className="text-xs text-slate-500">Configure top promotional banner and all 4 hero showcase slides</p>
            </div>
          </div>

          {/* Announcement Bar Settings */}
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                Top Promotional Announcement Banner
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.halloween_banner.active}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      halloween_banner: { ...prev.halloween_banner, active: e.target.checked },
                    }))
                  }
                  className="rounded text-orange-500"
                />
                Active
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Banner Announcement Text</label>
                <input
                  type="text"
                  value={config.halloween_banner.banner_text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      halloween_banner: { ...prev.halloween_banner, banner_text: e.target.value },
                    }))
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Coupon Code</label>
                <input
                  type="text"
                  value={config.halloween_banner.banner_code}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      halloween_banner: { ...prev.halloween_banner, banner_code: e.target.value },
                    }))
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/30 uppercase font-bold"
                />
              </div>
            </div>
          </div>

          {/* 4 Hero Slides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.hero_slides.map((slide, index) => (
              <div key={slide.id} className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    Slide #{index + 1}: {slide.title}
                  </span>
                  <Badge variant="amber" className="text-[10px]">{slide.tag}</Badge>
                </div>

                <div className="h-40 rounded-xl overflow-hidden relative group border">
                  <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-[10px] font-mono">
                    ₹{slide.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Image URL</label>
                    <input
                      type="text"
                      value={slide.image_url}
                      onChange={(e) => {
                        const newSlides = [...config.hero_slides];
                        newSlides[index].image_url = e.target.value;
                        setConfig((prev) => ({ ...prev, hero_slides: newSlides }));
                      }}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const newSlides = [...config.hero_slides];
                          newSlides[index].title = e.target.value;
                          setConfig((prev) => ({ ...prev, hero_slides: newSlides }));
                        }}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Tag / Badge</label>
                      <input
                        type="text"
                        value={slide.tag}
                        onChange={(e) => {
                          const newSlides = [...config.hero_slides];
                          newSlides[index].tag = e.target.value;
                          setConfig((prev) => ({ ...prev, hero_slides: newSlides }));
                        }}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. ⭕ Circular Products Bar (Story Highlights) */}
      {(activeTab === 'all' || activeTab === 'circular') && (
        <Card className="p-6 border-orange-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⭕ Circular Bar Showing Products & Stories</span>
                <Badge variant="amber" className="text-[10px]">High Conversion</Badge>
              </h2>
              <p className="text-xs text-slate-500">
                Instagram-style circular story highlights directly beneath the header. Shows products or custom curated shortcuts.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer">
              <input
                type="checkbox"
                checked={config.circular_products.use_live_products}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    circular_products: { ...prev.circular_products, use_live_products: e.target.checked },
                  }))
                }
                className="rounded text-orange-500"
              />
              <span>Auto-load Real Store Products</span>
            </label>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            {config.circular_products.use_live_products
              ? '✨ Live products mode is ACTIVE: The circular strip automatically displays the newest & most popular products from your database with their live product photos. You can also customize the fallback items below.'
              : '⚡ Custom mode is ACTIVE: The circular strip strictly displays your 8 custom items configured below.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {config.circular_products.items.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/70 flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-orange-500 via-purple-600 to-amber-400 shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...config.circular_products.items];
                    newItems[idx].name = e.target.value;
                    setConfig((prev) => ({
                      ...prev,
                      circular_products: { ...prev.circular_products, items: newItems },
                    }));
                  }}
                  className="w-full text-[11px] font-bold text-center px-1 py-1 rounded border bg-white dark:bg-slate-800"
                  placeholder="Title"
                />

                <input
                  type="text"
                  value={item.image_url}
                  onChange={(e) => {
                    const newItems = [...config.circular_products.items];
                    newItems[idx].image_url = e.target.value;
                    setConfig((prev) => ({
                      ...prev,
                      circular_products: { ...prev.circular_products, items: newItems },
                    }));
                  }}
                  className="w-full text-[10px] text-slate-400 px-1 py-0.5 rounded border bg-white dark:bg-slate-800 truncate"
                  placeholder="Image URL"
                />

                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => {
                    const newItems = [...config.circular_products.items];
                    newItems[idx].href = e.target.value;
                    setConfig((prev) => ({
                      ...prev,
                      circular_products: { ...prev.circular_products, items: newItems },
                    }));
                  }}
                  className="w-full text-[10px] text-slate-400 px-1 py-0.5 rounded border bg-white dark:bg-slate-800 truncate"
                  placeholder="Link URL"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. ✨ Shop by Mood Cards */}
      {(activeTab === 'all' || activeTab === 'moods') && (
        <Card className="p-6 border-orange-500/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>✨ Shop by Mood Visual Tiles</span>
                <Badge variant="amber" className="text-[10px]">Aesthetic Tiles</Badge>
              </h2>
              <p className="text-xs text-slate-500">Visual cards that inspire customers to shop by emotion & vibe</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.shop_by_mood.map((mood, idx) => (
              <div key={mood.id} className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
                <div className="h-44 rounded-xl overflow-hidden relative group border">
                  <img src={mood.image_url} alt={mood.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="rose" className="text-[9px]">{mood.tag}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Image URL</label>
                    <input
                      type="text"
                      value={mood.image_url}
                      onChange={(e) => {
                        const newMoods = [...config.shop_by_mood];
                        newMoods[idx].image_url = e.target.value;
                        setConfig((prev) => ({ ...prev, shop_by_mood: newMoods }));
                      }}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Title</label>
                    <input
                      type="text"
                      value={mood.title}
                      onChange={(e) => {
                        const newMoods = [...config.shop_by_mood];
                        newMoods[idx].title = e.target.value;
                        setConfig((prev) => ({ ...prev, shop_by_mood: newMoods }));
                      }}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Tagline</label>
                    <input
                      type="text"
                      value={mood.tagline}
                      onChange={(e) => {
                        const newMoods = [...config.shop_by_mood];
                        newMoods[idx].tagline = e.target.value;
                        setConfig((prev) => ({ ...prev, shop_by_mood: newMoods }));
                      }}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Link Destination</label>
                    <input
                      type="text"
                      value={mood.href}
                      onChange={(e) => {
                        const newMoods = [...config.shop_by_mood];
                        newMoods[idx].href = e.target.value;
                        setConfig((prev) => ({ ...prev, shop_by_mood: newMoods }));
                      }}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. 🎁 Feature & Story Banners */}
      {(activeTab === 'all' || activeTab === 'banners') && (
        <Card className="p-6 border-orange-500/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎁 Feature & Story Banners</span>
                <Badge variant="amber" className="text-[10px]">Brand Story</Badge>
              </h2>
              <p className="text-xs text-slate-500">Custom builder and brand heritage showcase images</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Builder Banner */}
            <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Custom Hamper Builder Banner Image
              </span>
              <div className="h-44 rounded-xl overflow-hidden relative border">
                <img
                  src={config.feature_banners.custom_builder_image}
                  alt="Custom Builder Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={config.feature_banners.custom_builder_image}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    feature_banners: { ...prev.feature_banners, custom_builder_image: e.target.value },
                  }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                placeholder="https://..."
              />
            </div>

            {/* Brand Story Image */}
            <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Brand Heritage & Story Image
              </span>
              <div className="h-44 rounded-xl overflow-hidden relative border">
                <img
                  src={config.feature_banners.brand_story_image}
                  alt="Brand Story"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={config.feature_banners.brand_story_image}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    feature_banners: { ...prev.feature_banners, brand_story_image: e.target.value },
                  }))
                }
                className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                placeholder="https://..."
              />
            </div>
          </div>
        </Card>
      )}

      {/* 6. 🛍️ Product Catalog Replacer */}
      {(activeTab === 'all' || activeTab === 'products') && (
        <Card className="p-6 border-orange-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🛍️ Product Catalog Image Replacer</span>
                <Badge variant="rose" className="text-[10px]">Instant Live Sync</Badge>
              </h2>
              <p className="text-xs text-slate-500">
                Search any product from the catalog, preview its current image, and update it instantly.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/30"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setNewProductImage(p.image);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border transition cursor-pointer ${
                    selectedProduct?.id === p.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover border bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-[11px] text-orange-600 font-semibold">₹{p.price.toLocaleString('en-IN')}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs shrink-0">
                    Select
                  </Button>
                </div>
              ))}
            </div>

            {/* Editor Panel for Selected Product */}
            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selected Product Image Editor
              </h3>

              {selectedProduct ? (
                <div className="space-y-3">
                  <div className="h-44 rounded-xl overflow-hidden relative border bg-black">
                    <img
                      src={newProductImage || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedProduct.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Slug: {selectedProduct.slug}</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">New Image URL</label>
                    <input
                      type="text"
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>

                  <Button
                    onClick={handleUpdateProductImage}
                    disabled={updatingProduct}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 shadow-md"
                  >
                    {updatingProduct ? 'Updating in Database...' : 'Save Product Image'}
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a product from the list to preview and update its image.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
