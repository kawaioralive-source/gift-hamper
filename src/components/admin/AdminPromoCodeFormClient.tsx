'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, Calendar, Copy } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

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

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'categories', label: 'Specific Categories' },
  { value: 'products', label: 'Specific Products' },
  { value: 'customers', label: 'Specific Customers' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function AdminPromoCodeFormClient({ promoCodeId }: { promoCodeId?: string }) {
  const router = useRouter();
  const isEditing = !!promoCodeId;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_limit_per_customer: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
    applies_to: 'all' as 'all' | 'categories' | 'products' | 'customers',
    applicable_ids: '',
  });

  const fetchPromoCode = useCallback(async () => {
    if (!promoCodeId) return;
    
    try {
      const response = await fetch(`/api/admin/promo-codes/${promoCodeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const code = data.data;
          setFormData({
            code: code.code || '',
            description: code.description || '',
            discount_type: code.discount_type || 'percentage',
            discount_value: code.discount_value || 0,
            min_order_amount: code.min_order_amount?.toString() || '',
            max_discount_amount: code.max_discount_amount?.toString() || '',
            usage_limit: code.usage_limit?.toString() || '',
            usage_limit_per_customer: code.usage_limit_per_customer?.toString() || '',
            starts_at: code.starts_at ? code.starts_at.split('T')[0] : '',
            expires_at: code.expires_at ? code.expires_at.split('T')[0] : '',
            is_active: code.is_active ?? true,
            applies_to: code.applies_to || 'all',
            applicable_ids: code.applicable_ids?.join(', ') || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch promo code:', error);
    } finally {
      setLoading(false);
    }
  }, [promoCodeId]);

  useEffect(() => {
    if (isEditing) {
      fetchPromoCode();
    }
  }, [fetchPromoCode, isEditing]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_customer: formData.usage_limit_per_customer ? parseInt(formData.usage_limit_per_customer) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
        applies_to: formData.applies_to,
        applicable_ids: formData.applicable_ids.split(',').map(s => s.trim()).filter(Boolean),
      };

      const url = isEditing 
        ? `/api/admin/promo-codes/${promoCodeId}` 
        : '/api/admin/promo-codes';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Promo code updated successfully!' : 'Promo code created successfully!');
        router.push('/admin/promo-codes');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save promo code');
      }
    } catch (error) {
      console.error('Failed to save promo code:', error);
      toast.error('An unexpected error occurred while saving promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promoCodeId) return;
    
    try {
      const response = await fetch(`/api/admin/promo-codes/${promoCodeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/admin/promo-codes');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Promo Code' : 'Create Promo Code'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {isEditing ? 'Update promotional code details' : 'Create a new promotional code'}
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
        title="Delete Promo Code"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this promo code? This action cannot be undone.
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
                label="Code *"
                placeholder="e.g., WELCOME20"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                required
                maxLength={20}
              />
              <Textarea
                label="Description"
                placeholder="Internal description of this promo code"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Discount Type *"
                  value={formData.discount_type}
                  onChange={(e) => handleChange('discount_type', e.target.value)}
                  options={TYPE_OPTIONS}
                  required
                />
                <Input
                  label="Discount Value *"
                  type="number"
                  step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e) => handleChange('discount_value', formData.discount_type === 'percentage' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                  required
                  helperText={formData.discount_type === 'percentage' ? 'Percentage (0-100)' : 'Fixed amount in INR'}
                />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Conditions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Min Order Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_order_amount}
                onChange={(e) => handleChange('min_order_amount', e.target.value)}
                helperText="Minimum order value to apply"
              />
              <Input
                label="Max Discount Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_discount_amount}
                onChange={(e) => handleChange('max_discount_amount', e.target.value)}
                helperText="Cap on discount (for percentage type)"
              />
              <Input
                label="Total Usage Limit"
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => handleChange('usage_limit', e.target.value)}
                helperText="Leave empty for unlimited"
              />
              <Input
                label="Per Customer Limit"
                type="number"
                min="1"
                value={formData.usage_limit_per_customer}
                onChange={(e) => handleChange('usage_limit_per_customer', e.target.value)}
                helperText="How many times one customer can use"
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Validity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Starts At"
                type="date"
                value={formData.starts_at}
                onChange={(e) => handleChange('starts_at', e.target.value)}
                helperText="Leave empty for immediate"
              />
              <Input
                label="Expires At"
                type="date"
                value={formData.expires_at}
                onChange={(e) => handleChange('expires_at', e.target.value)}
                helperText="Leave empty for no expiry"
              />
              <Select
                label="Status *"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                options={STATUS_OPTIONS}
                required
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Applies To</h2>
            <div className="space-y-4">
              <Select
                label="Applies To *"
                value={formData.applies_to}
                onChange={(e) => handleChange('applies_to', e.target.value)}
                options={APPLIES_TO_OPTIONS}
                required
              />
              {formData.applies_to !== 'all' && (
                <Input
                  label="Applicable IDs"
                  placeholder="Comma separated IDs (categories, products, or customers)"
                  value={formData.applicable_ids}
                  onChange={(e) => handleChange('applicable_ids', e.target.value)}
                  helperText="Enter IDs separated by commas"
                />
              )}
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