'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Package, AlertTriangle, Eye, Edit, Trash2, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  price?: number;
  sale_price: number | null;
  compare_at_price?: number | null;
  sku: string;
  stock_quantity: number;
  stock?: number;
  low_stock_threshold: number;
  status: string;
  is_featured: boolean;
  category_id: string | null;
  occasion_id: string | null;
  images: string[];
  category: { name: string } | null;
  occasion: { name: string } | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'created_at.desc', label: 'Newest First' },
  { value: 'created_at.asc', label: 'Oldest First' },
  { value: 'name.asc', label: 'Name: A-Z' },
  { value: 'name.desc', label: 'Name: Z-A' },
  { value: 'base_price.desc', label: 'Price: High to Low' },
  { value: 'base_price.asc', label: 'Price: Low to High' },
  { value: 'stock_quantity.asc', label: 'Stock: Low to High' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'slate',
  active: 'emerald',
  out_of_stock: 'rose',
  archived: 'slate',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  out_of_stock: 'Out of Stock',
  archived: 'Archived',
};

export function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    low_stock: '',
    sort: 'created_at.desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.low_stock && { low_stock: filters.low_stock }),
      });

      const response = await fetch(`/api/admin/products?${params}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        setShowDeleteModal(false);
        const deletedName = productToDelete.name;
        setProductToDelete(null);
        toast.success(`"${deletedName}" permanently deleted from database`);
        // Refresh product list from database immediately to verify state
        setTimeout(() => fetchProducts(), 300);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Network error deleting product');
    }
  };

  const isLowStock = (product: Product) => {
    return product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
  };

  const isOutOfStock = (product: Product) => {
    return product.stock_quantity === 0;
  };

  const renderTable = () => {
    if (loading && products.length === 0) {
      return (
        <div className="p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No products found</h3>
          <p className="text-slate-500 dark:text-slate-400">Create your first product to get started</p>
          <Link href="/admin/products/new" className="mt-4 inline-block">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Product</Button>
          </Link>
        </div>
      );
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Occasion</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                return (
                  <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {product.category?.name || '—'}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                      {formatCurrency(product.base_price || product.price || 0)}
                      {product.compare_at_price && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 line-through">
                          {formatCurrency(product.compare_at_price)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          isOutOfStock(product) ? 'text-rose-600' : isLowStock(product) ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                        )}>
                          {product.stock_quantity ?? product.stock ?? 0}
                        </span>
                        {isLowStock(product) && (
                          <Badge variant="warning" size="sm" dot>Low Stock</Badge>
                        )}
                        {isOutOfStock(product) && (
                          <Badge variant="danger" size="sm">Out of Stock</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={STATUS_COLORS[product.status] as any} className="text-xs">
                        {STATUS_LABELS[product.status] || product.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {product.occasion?.name || '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product)} aria-label="View product">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm" aria-label="Edit product">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)} className="text-rose-600 hover:text-rose-700" aria-label="Delete product">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                Previous
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.total_pages} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && products.length === 0) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage products and inventory</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/spooky-builder">
            <Button
              variant="outline"
              className="border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 shadow-sm"
              leftIcon={<Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />}
            >
              🎃 Spooky Builder Items
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
          <Link href="/admin/products/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="outlined" padding="lg" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              label="Search"
              placeholder="Name, SKU..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Stock"
              value={filters.low_stock}
              onChange={(e) => handleFilterChange('low_stock', e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'low', label: 'Low Stock' },
                { value: 'out', label: 'Out of Stock' },
              ]}
            />
            <Select
              label="Sort By"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              options={SORT_OPTIONS}
            />
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card variant="elevated" padding="none">
        {renderTable()}
      </Card>

      {/* Product Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedProduct(null); }}
        title={selectedProduct?.name}
        size="xl"
      >
        {selectedProduct && (
          <ProductDetailContent product={selectedProduct} onClose={() => { setShowDetailModal(false); setSelectedProduct(null); }} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setProductToDelete(null); }}
        title="Delete Product"
        size="sm"
      >
        {productToDelete && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setProductToDelete(null); }}>
                Cancel
              </Button>
              <Button variant="rose" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProductDetailContent({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header with image */}
      <div className="flex gap-4">
        <div className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-16 h-16 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">{product.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">SKU: {product.sku}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={STATUS_COLORS[product.status] as any}>{STATUS_LABELS[product.status] || product.status}</Badge>
            {product.is_featured && <Badge variant="amber">Featured</Badge>}
            {isLowStock(product) && <Badge variant="warning" dot>Low Stock</Badge>}
            {isOutOfStock(product) && <Badge variant="danger">Out of Stock</Badge>}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <DetailRow label="Base Price" value={formatCurrency(product.base_price)} />
        <DetailRow label="Sale Price" value={product.sale_price ? formatCurrency(product.sale_price) : '—'} />
        <DetailRow label="Category" value={product.category?.name || '—'} />
        <DetailRow label="Occasion" value={product.occasion?.name || '—'} />
        <DetailRow label="Stock Quantity" value={product.stock_quantity.toString()} />
        <DetailRow label="Low Stock Threshold" value={product.low_stock_threshold.toString()} />
        <DetailRow label="Created" value={formatDate(product.created_at)} />
        <DetailRow label="Updated" value={formatDate(product.updated_at)} />
      </div>

      {/* Description */}
      {product.description && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {product.short_description && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Short Description</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{product.short_description}</p>
        </div>
      )}

      {/* Additional Images */}
      {product.images && product.images.length > 1 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Additional Images</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.slice(1).map((image, index) => (
              <img key={index} src={image} alt={`${product.name} ${index + 2}`} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function isLowStock(product: Product) {
  return product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
}

function isOutOfStock(product: Product) {
  return product.stock_quantity === 0;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}