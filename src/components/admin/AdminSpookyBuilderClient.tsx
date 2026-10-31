'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit2, Trash2, Search, Filter, Box, Coffee, Cookie, 
  Ribbon, Gift, Check, X, ArrowLeft, RefreshCw, AlertCircle, Eye, Tag
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface CustomItem {
  id: string;
  name: string;
  category: string;
  price: number;
  raw_price?: number;
  image: string;
  description: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Sparkles },
  { value: 'box', label: 'Boxes & Trunks', icon: Box },
  { value: 'treat', label: 'Gourmet Treats', icon: Cookie },
  { value: 'beverage', label: 'Beverages', icon: Coffee },
  { value: 'keepsake', label: 'Keepsakes & Gifts', icon: Gift },
  { value: 'card', label: 'Greeting Cards', icon: Tag },
  { value: 'packaging', label: 'Ribbons & Seals', icon: Ribbon },
];

const PRESET_IMAGES = [
  { label: '🎃 Spooky Midnight Crate', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80', cat: 'box' },
  { label: '🍬 Ghost Chocolate Truffles', url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80', cat: 'treat' },
  { label: '🍾 Spooky Sparkling Wine', url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=400&q=80', cat: 'beverage' },
  { label: '🕯️ Pumpkin Soy Candle', url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80', cat: 'keepsake' },
  { label: '💌 Spooky Foil Card', url: 'https://images.unsplash.com/photo-1513885535751-8b9238cd48?auto=format&fit=crop&w=400&q=80', cat: 'card' },
  { label: '🎀 Velvet Black Ribbon', url: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=400&q=80', cat: 'packaging' },
];

export function AdminSpookyBuilderClient() {
  const [items, setItems] = useState<CustomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CustomItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'treat',
    price: 499,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    description: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/custom-items?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error('Failed to load items from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: activeCategory !== 'all' ? activeCategory : 'treat',
      price: 499,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: CustomItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      description: item.description,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/admin/custom-items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('Item updated successfully!');
          setShowModal(false);
          fetchItems();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to update item');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/custom-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('Item added to Spooky Builder!');
          setShowModal(false);
          fetchItems();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to add item');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Network error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: CustomItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/admin/custom-items/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`"${itemToDelete.name}" deleted from database`);
        setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        toast.error('Failed to delete item');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Network error deleting item');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950/80 via-slate-900 to-amber-950/70 border border-orange-500/30 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase mb-3 border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              Spooky Hamper Builder Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              🎃 Spooky Builder Products
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Add and customize items for the interactive Hamper Builder. All changes save directly to Supabase and reflect instantly in the customer builder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchItems}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
              leftIcon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
            >
              Refresh
            </Button>
            <Button
              onClick={openAddModal}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Builder Product
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.value;
            const count = cat.value === 'all' 
              ? items.length 
              : items.filter(i => i.category === cat.value).length;

            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                  isSelected
                    ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/25"
                    : "bg-slate-900/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search custom items by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </form>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{items.length}</span> custom builder products
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16 p-6 border-dashed border-2 border-slate-300 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No custom items found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            There are no products listed in this category yet. Add a new item to make it available in the Custom Hamper Builder.
          </p>
          <Button onClick={openAddModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add First Product
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-orange-500/40"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="outline" className="bg-slate-900/80 backdrop-blur-md text-white border-white/20 text-[11px] capitalize">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-orange-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs shadow-md">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                    {item.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(item)}
                  className="flex-1 text-xs text-slate-700 dark:text-slate-300 hover:text-orange-500"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Builder Product' : 'Add Product to Spooky Builder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🎃 Dark Chocolate Bat Truffles"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Builder Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="box">📦 Box / Trunk / Basket</option>
                    <option value="treat">🍬 Gourmet Treats & Food</option>
                    <option value="beverage">🍾 Beverage / Sparkling Wine</option>
                    <option value="keepsake">🕯️ Keepsake / Gift Item</option>
                    <option value="card">💌 Greeting Card</option>
                    <option value="packaging">🎀 Packaging & Ribbon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="499"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                {/* Quick Presets */}
                <div className="mt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Inspiration Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, image: preset.url, category: preset.cat })}
                        className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Preview */}
                {formData.image && (
                  <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Live Preview</p>
                      <p className="text-[11px] text-slate-400">Renders directly in customer customization steps</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (shown under the product card)
                </label>
                <textarea
                  rows={3}
                  placeholder="Artisanal treats crafted with rich belgian cocoa..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-500 text-white"
                  leftIcon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Product' : 'Add to Builder'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Builder Product?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-200">"{itemToDelete.name}"</span>? This will immediately remove it from the custom builder on the live website.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="rose"
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
