'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, TicketPercent, Copy, Check, X, Calendar, Trash2, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  applies_to: 'all' | 'categories' | 'products' | 'customers';
  applicable_ids: string[];
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
  { value: 'upcoming', label: 'Upcoming' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const SORT_OPTIONS = [
  { value: 'created_at.desc', label: 'Newest First' },
  { value: 'created_at.asc', label: 'Oldest First' },
  { value: 'code.asc', label: 'Code: A-Z' },
];

export function AdminPromoCodesClient() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    sort: 'created_at.desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<PromoCode | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (code: PromoCode) => {
    setTogglingId(code.id);
    const newActiveState = !code.is_active;
    try {
      const response = await fetch(`/api/admin/promo-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActiveState }),
      });

      if (response.ok) {
        setPromoCodes(prev =>
          prev.map(p => {
            if (p.id === code.id) {
              return { ...p, is_active: newActiveState };
            }
            if (newActiveState) {
              return { ...p, is_active: false };
            }
            return p;
          })
        );
        toast.success(
          newActiveState
            ? `Promo code "${code.code}" is now live on the storefront banner!`
            : `Promo code "${code.code}" has been deactivated.`
        );
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to update promo code status');
      }
    } catch (error) {
      console.error('Failed to toggle promo code:', error);
      toast.error('Network error updating promo code status');
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [filters, pagination.page]);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
      });

      const response = await fetch(`/api/admin/promo-codes?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromoCodes(data.data);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
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

  const handleViewCode = (code: PromoCode) => {
    setSelectedCode(code);
    setShowDetailModal(true);
  };

  const handleDeleteCode = (code: PromoCode) => {
    setCodeToDelete(code);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!codeToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/promo-codes/${codeToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPromoCodes(prev => prev.filter(p => p.id !== codeToDelete.id));
        setShowDeleteModal(false);
        setCodeToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getStatus = (code: PromoCode): { label: string; color: string } => {
    const now = new Date();
    const startsAt = code.starts_at ? new Date(code.starts_at) : null;
    const expiresAt = code.expires_at ? new Date(code.expires_at) : null;
    
    if (!code.is_active) return { label: 'Inactive', color: 'slate' };
    if (startsAt && startsAt > now) return { label: 'Upcoming', color: 'blue' };
    if (expiresAt && expiresAt < now) return { label: 'Expired', color: 'rose' };
    if (code.usage_limit && code.used_count >= code.usage_limit) return { label: 'Exhausted', color: 'amber' };
    return { label: 'Active', color: 'emerald' };
  };

  const renderTable = () => {
    if (loading && promoCodes.length === 0) {
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

    if (promoCodes.length === 0) {
      return (
        <div className="p-12 text-center">
          <TicketPercent className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No promo codes found</h3>
          <p className="text-slate-500 dark:text-slate-400">Create your first promo code to get started</p>
          <Link href="/admin/promo-codes/new" className="mt-4 inline-block">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Promo Code</Button>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Value</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Usage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Validity</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map(code => {
                const status = getStatus(code);
                return (
                  <tr key={code.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm text-amber-600 dark:text-amber-400 font-bold">
                            {code.code}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)} className="h-6 w-6 p-0" aria-label="Copy code">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        {code.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{code.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={code.discount_type === 'percentage' ? 'primary' : 'amber'} className="text-xs">
                        {code.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}%` 
                        : formatCurrency(code.discount_value)
                      }
                      {code.max_discount_amount && code.discount_type === 'percentage' && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">(max {formatCurrency(code.max_discount_amount)})</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {code.used_count} / {code.usage_limit || '∞'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(code)}
                        disabled={togglingId === code.id}
                        title={code.is_active ? "Click to deactivate" : "Click to activate this promo code (will feature in top banner)"}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer shadow-sm border",
                          code.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}
                      >
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          code.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        )} />
                        {togglingId === code.id ? 'Updating...' : code.is_active ? 'Active (Live)' : 'Inactive (Set Active)'}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {code.starts_at ? formatDate(code.starts_at) : '—'} → {code.expires_at ? formatDate(code.expires_at) : 'No expiry'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewCode(code)} aria-label="View code">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Link href={`/admin/promo-codes/${code.id}/edit`}>
                          <Button variant="ghost" size="sm" aria-label="Edit code">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCode(code)} className="text-rose-600 hover:text-rose-700" aria-label="Delete code">
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
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} promo codes
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

  if (loading && promoCodes.length === 0) {
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Promo Codes</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage promotional codes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
          <Link href="/admin/promo-codes/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Promo Code</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="outlined" padding="lg" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Search"
              placeholder="Code, description..."
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
              label="Type"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={TYPE_OPTIONS}
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

      {/* Promo Codes Table */}
      <Card variant="elevated" padding="none">
        {renderTable()}
      </Card>

      {/* Promo Code Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCode(null); }}
        title={`Promo Code: ${selectedCode?.code}`}
        size="lg"
      >
        {selectedCode && (
          <PromoCodeDetailContent code={selectedCode} onClose={() => { setShowDetailModal(false); setSelectedCode(null); }} copyCode={copyCode} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCodeToDelete(null); }}
        title="Delete Promo Code"
        size="sm"
      >
        {codeToDelete && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{codeToDelete.code}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setCodeToDelete(null); }}>
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

function PromoCodeDetailContent({ code, onClose, copyCode }: { code: PromoCode; onClose: () => void; copyCode: (code: string) => void }) {
  const status = getStatus(code);
  
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <code className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-xl text-amber-600 dark:text-amber-400 font-bold">
            {code.code}
          </code>
          <Badge variant={status.color as any} className="ml-2">{status.label}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)} leftIcon={<Copy className="w-4 h-4" />}>
          Copy Code
        </Button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <DetailRow label="Type" value={code.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'} />
        <DetailRow label="Value" value={code.discount_type === 'percentage' ? `${code.discount_value}%` : formatCurrency(code.discount_value)} />
        <DetailRow label="Min Order" value={code.min_order_amount ? formatCurrency(code.min_order_amount) : 'No minimum'} />
        <DetailRow label="Max Discount" value={code.max_discount_amount ? formatCurrency(code.max_discount_amount) : 'No limit'} />
        <DetailRow label="Usage Limit" value={code.usage_limit ? `${code.used_count} / ${code.usage_limit}` : 'Unlimited'} />
        <DetailRow label="Per Customer Limit" value={code.usage_limit_per_customer ? code.usage_limit_per_customer.toString() : 'Unlimited'} />
        <DetailRow label="Applies To" value={code.applies_to} />
        <DetailRow label="Created" value={formatDate(code.created_at)} />
      </div>

      {/* Validity */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <DetailRow label="Starts At" value={code.starts_at ? formatDate(code.starts_at) : 'Immediate'} />
        <DetailRow label="Expires At" value={code.expires_at ? formatDate(code.expires_at) : 'Never'} />
        <DetailRow label="Used Count" value={code.used_count.toString()} />
        <DetailRow label="Active" value={code.is_active ? 'Yes' : 'No'} />
      </div>

      {/* Applicable Items */}
      {code.applies_to !== 'all' && code.applicable_ids.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Applicable Items</p>
          <div className="flex flex-wrap gap-2">
            {code.applicable_ids.map((id, index) => (
              <Badge key={index} variant="default" className="text-xs">{id}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {code.description && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{code.description}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function getStatus(code: PromoCode): { label: string; color: string } {
  const now = new Date();
  const startsAt = code.starts_at ? new Date(code.starts_at) : null;
  const expiresAt = code.expires_at ? new Date(code.expires_at) : null;
  
  if (!code.is_active) return { label: 'Inactive', color: 'slate' };
  if (startsAt && startsAt > now) return { label: 'Upcoming', color: 'blue' };
  if (expiresAt && expiresAt < now) return { label: 'Expired', color: 'rose' };
  if (code.usage_limit && code.used_count >= code.usage_limit) return { label: 'Exhausted', color: 'amber' };
  return { label: 'Active', color: 'emerald' };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}