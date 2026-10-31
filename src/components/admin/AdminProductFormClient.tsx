'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, Upload, Star, ChevronLeft, ChevronRight, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'archived', label: 'Archived' },
];

export function AdminProductFormClient({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEditing = !!productId;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Multi-image management state (up to 6 images)
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    base_price: 0,
    sale_price: '',
    compare_at_price: '',
    sku: '',
    stock_quantity: 0,
    low_stock_threshold: 5,
    track_inventory: true,
    status: 'draft' as string,
    is_featured: false,
    is_customizable: false,
    is_bestseller: false,
    is_new_arrival: false,
    category_id: '',
    occasion_id: '',
    recipient_id: '',
    tags: '',
    image: '',
    weight: '',
    dimensions: '',
  });

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const product = data.data;

          const initialImages: string[] = [];
          if (Array.isArray(product.images) && product.images.length > 0) {
            initialImages.push(...product.images);
          } else if (product.image) {
            initialImages.push(product.image);
          }
          setImages(initialImages.slice(0, 6));

          setFormData({
            name: product.name || '',
            slug: product.slug || '',
            description: product.description || '',
            short_description: product.short_description || '',
            base_price: product.base_price || product.price || 0,
            sale_price: product.sale_price?.toString() || '',
            compare_at_price: product.compare_at_price?.toString() || product.original_price?.toString() || '',
            sku: product.sku || '',
            stock_quantity: product.stock_quantity ?? product.stock ?? 0,
            low_stock_threshold: product.low_stock_threshold || 5,
            track_inventory: product.track_inventory ?? true,
            status: product.status || 'active',
            is_featured: product.is_featured ?? false,
            is_customizable: product.is_customizable ?? false,
            is_bestseller: product.is_bestseller ?? false,
            is_new_arrival: product.is_new_arrival ?? false,
            category_id: product.category?.name || product.category_id || '',
            occasion_id: product.occasion?.name || product.occasion_id || '',
            recipient_id: product.recipient?.name || product.recipient_id || '',
            tags: product.tags?.join(', ') || product.tag || '',
            image: product.image || product.images?.[0] || '',
            weight: product.weight?.toString() || '',
            dimensions: product.dimensions || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [fetchProduct, isEditing]);

  const handleFilesUpload = async (files: FileList | File[]) => {
    const availableSlots = 6 - images.length;
    if (availableSlots <= 0) {
      toast.error('Maximum limit of 6 images reached for this product.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    if (!filesToUpload.length) return;

    setUploadingImages(true);
    const uploadToast = toast.loading(`Uploading ${filesToUpload.length} image(s)...`);

    try {
      const uploadData = new FormData();
      for (const file of filesToUpload) {
        uploadData.append('images', file);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setImages(prev => [...prev, ...json.data].slice(0, 6));
          toast.success(`Successfully uploaded ${json.data.length} image(s)!`, { id: uploadToast });
        } else {
          toast.error(json.error || 'Failed to upload images', { id: uploadToast });
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || 'Upload failed', { id: uploadToast });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Network error during image upload', { id: uploadToast });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= 6) {
      toast.error('Maximum 6 images allowed per product.');
      return;
    }
    setImages(prev => [...prev, trimmed].slice(0, 6));
    setUrlInput('');
    toast.success('Image URL added!');
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [target, ...remaining];
    });
    toast.success('Set as primary cover image');
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalImages = images.filter(Boolean).slice(0, 6);
      const primaryImage = finalImages[0] || formData.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        short_description: formData.short_description || null,
        price: formData.base_price,
        base_price: formData.base_price,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        original_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        sku: formData.sku,
        stock: formData.stock_quantity,
        stock_quantity: formData.stock_quantity,
        low_stock_threshold: formData.low_stock_threshold,
        track_inventory: formData.track_inventory,
        status: formData.status,
        is_featured: formData.is_featured,
        is_customizable: formData.is_customizable,
        is_bestseller: formData.is_bestseller,
        is_new_arrival: formData.is_new_arrival,
        category: formData.category_id || 'Luxury',
        category_id: formData.category_id || null,
        occasion_id: formData.occasion_id || null,
        recipient_id: formData.recipient_id || null,
        image: primaryImage,
        images: finalImages.length > 0 ? finalImages : [primaryImage],
        tag: formData.is_bestseller ? 'Bestseller' : (formData.is_new_arrival ? 'New Arrival' : 'Popular'),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions || null,
      };

      const url = isEditing 
        ? `/api/admin/products/${productId}` 
        : '/api/admin/products';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
        router.push('/admin/products');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/admin/products');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Product' : 'Create Product'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {isEditing ? 'Update product details' : 'Add a new product to the catalog'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <Button variant="outline" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="w-4 h-4" />} className="text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-400">
              Delete
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="rose" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Product Name *"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  if (!formData.slug || formData.slug === generateSlug(formData.name)) {
                    handleChange('slug', generateSlug(e.target.value));
                  }
                }}
                required
              />
              <Input
                label="Slug *"
                placeholder="Auto-generated from name"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                required
                helperText="URL-friendly identifier. Auto-generated from name."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SKU *"
                  placeholder="Unique stock keeping unit"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                  required
                />
                <Select
                  label="Status *"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  options={STATUS_OPTIONS}
                  required
                />
              </div>
              <Textarea
                label="Description"
                placeholder="Full product description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={6}
              />
              <Textarea
                label="Short Description"
                placeholder="Brief summary for listings"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                rows={3}
              />
            </div>
          </Card>

          {/* Product Images & Quality Gallery Card (Up to 6 images) */}
          <Card variant="elevated" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  Product Images & Quality Gallery
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({images.length}/6 uploaded)
                  </span>
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Upload up to 6 high-resolution photos for optimal product inspection. The first image is the primary cover; remaining photos allow buyers to inspect hamper craftsmanship, packaging, and item contents.
                </p>
              </div>
              <Badge variant={images.length === 6 ? 'secondary' : 'amber'} className="self-start sm:self-auto font-medium">
                {images.length === 6 ? 'Max 6/6 Reached' : `${6 - images.length} slots available`}
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length) {
                    handleFilesUpload(e.dataTransfer.files);
                  }
                }}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative",
                  dragOver
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/60 dark:bg-slate-900/40",
                  images.length >= 6 ? "opacity-60 pointer-events-none" : ""
                )}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={images.length >= 6 || uploadingImages}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFilesUpload(e.target.files);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="product-images-input"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Uploading high quality image files...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {images.length >= 6 ? 'Maximum 6 product images uploaded' : 'Click or drag & drop to upload images'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        PNG, JPG, WebP up to 5MB each. You can select multiple files (up to 6 total).
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Paste Direct URL Option */}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Or paste an external image URL (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={images.length >= 6 || uploadingImages}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim() || images.length >= 6 || uploadingImages}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add URL
                </Button>
              </div>

              {/* 6-Slot Quality Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
                  const img = images[slotIndex];
                  const isCover = slotIndex === 0 && !!img;

                  if (img) {
                    return (
                      <div
                        key={slotIndex}
                        className={cn(
                          "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group bg-slate-100 dark:bg-slate-800 shadow-sm",
                          isCover ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <img
                          src={img}
                          alt={`Product view ${slotIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10">
                            <Star className="w-2.5 h-2.5 fill-current" /> Cover
                          </div>
                        )}

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-20">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                              #{slotIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slotIndex)}
                              className="p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition shadow"
                              title="Delete this image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            {slotIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(slotIndex, slotIndex - 1)}
                                className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-xs"
                                title="Move left"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(slotIndex)}
                                className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-[10px]"
                                title="Make this image the main cover"
                              >
                                Make Cover
                              </button>
                            )}
                            {slotIndex < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(slotIndex, slotIndex + 1)}
                                className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-xs"
                                title="Move right"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot (Allows clicking to trigger file input)
                  return (
                    <label
                      key={slotIndex}
                      htmlFor="product-images-input"
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 hover:border-amber-400 hover:text-amber-500 transition cursor-pointer p-2 text-center"
                    >
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-medium">Slot {slotIndex + 1}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Base Price (INR) *"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
                required
              />
              <Input
                label="Sale Price (INR)"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => handleChange('sale_price', e.target.value)}
                helperText="Optional discounted price"
              />
              <Input
                label="Compare At Price (INR)"
                type="number"
                step="0.01"
                min="0"
                value={formData.compare_at_price}
                onChange={(e) => handleChange('compare_at_price', e.target.value)}
                helperText="Original price for discount display"
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Stock Quantity *"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                required
              />
              <Input
                label="Low Stock Threshold"
                type="number"
                min="1"
                value={formData.low_stock_threshold}
                onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.track_inventory}
                    onChange={(e) => handleChange('track_inventory', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Inventory</span>
                </label>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Categories & Relations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Category"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                options={[{ value: '', label: 'Select Category' }]}
              />
              <Select
                label="Occasion"
                value={formData.occasion_id}
                onChange={(e) => handleChange('occasion_id', e.target.value)}
                options={[{ value: '', label: 'Select Occasion' }]}
              />
              <Select
                label="Recipient"
                value={formData.recipient_id}
                onChange={(e) => handleChange('recipient_id', e.target.value)}
                options={[{ value: '', label: 'Select Recipient' }]}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}