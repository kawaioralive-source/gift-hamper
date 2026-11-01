'use client';

import { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Save,
  RotateCcw,
  History,
  Eye,
  Upload,
  Check,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Sliders,
  ExternalLink,
  Laptop,
  Smartphone,
  Sun,
  Moon,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBrand, BrandConfig, DEFAULT_BRAND_CONFIG } from '@/context/BrandContext';
import toast from 'react-hot-toast';

interface BrandHistoryItem {
  id: number;
  config_id?: number;
  brand_name: string;
  brand_short_name: string;
  brand_tagline?: string;
  logo_url?: string;
  logo_mobile_url?: string;
  favicon_url?: string;
  support_email?: string;
  support_phone?: string;
  primary_color?: string;
  accent_color?: string;
  version_notes?: string;
  changed_by: string;
  created_at: string;
}

export function AdminBrandClient() {
  const { brand: activeBrand, refreshBrand } = useBrand();

  const [form, setForm] = useState<BrandConfig>(activeBrand);
  const [versionNotes, setVersionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<BrandHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.urls?.[0]) {
        const uploadedUrl = data.urls[0];
        if (isMobile) {
          setForm(prev => ({ ...prev, logo_mobile_url: uploadedUrl }));
        } else {
          setForm(prev => ({ ...prev, logo_url: uploadedUrl }));
        }
        toast.success('Logo uploaded! Preview updated.');
      } else {
        toast.error(data.error || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Network error during logo upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    setForm(activeBrand);
  }, [activeBrand]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/brand/history');
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.data || []);
      }
    } catch {
      console.warn('Failed to load brand version history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    fetchHistory();
    setShowHistoryModal(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand_name.trim()) {
      toast.error('Primary brand name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          version_notes: versionNotes.trim() || `Updated brand name to "${form.brand_name}"`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Brand identity published globally!');
        setVersionNotes('');
        await refreshBrand();
        window.dispatchEvent(new Event('brand-identity-updated'));
      } else {
        toast.error(data.error || 'Failed to update brand identity');
      }
    } catch {
      toast.error('Network error publishing brand identity');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (historyId: number) => {
    if (!confirm(`Are you sure you want to rollback to brand identity version #${historyId}?`)) {
      return;
    }

    setRestoringId(historyId);
    try {
      const res = await fetch('/api/brand/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history_id: historyId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Brand identity restored successfully!');
        setShowHistoryModal(false);
        await refreshBrand();
        window.dispatchEvent(new Event('brand-identity-updated'));
      } else {
        toast.error(data.error || 'Failed to restore brand identity version');
      }
    } catch {
      toast.error('Network error during rollback');
    } finally {
      setRestoringId(null);
    }
  };

  const handleReset = () => {
    setForm(activeBrand);
    toast('Form reset to currently active brand identity', { icon: '🔄' });
  };

  const hasUnsavedChanges =
    form.brand_name !== activeBrand.brand_name ||
    form.brand_short_name !== activeBrand.brand_short_name ||
    form.brand_tagline !== activeBrand.brand_tagline ||
    form.logo_url !== activeBrand.logo_url ||
    form.logo_mobile_url !== activeBrand.logo_mobile_url ||
    form.support_email !== activeBrand.support_email ||
    form.support_phone !== activeBrand.support_phone ||
    form.announcement_text !== activeBrand.announcement_text;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Website Management
            </span>
            <span className="text-slate-400">›</span>
            <span className="text-xs font-semibold text-slate-500">Brand Identity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Crown className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Global Brand Identity Management
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Centralized control over your store's primary brand name, logos, contact identity, and global headers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistory}
            leftIcon={<History className="w-4 h-4 text-slate-500" />}
          >
            Version History & Rollback
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            isLoading={saving}
            disabled={!hasUnsavedChanges}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Publish Brand Changes
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-in">
          <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              You have unsaved changes in your brand configuration. Click <strong>"Publish Brand Changes"</strong> to sync them across the entire platform globally.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-8">
              Discard Changes
            </Button>
            <Button variant="primary" size="sm" onClick={handlePublish} isLoading={saving} className="text-xs h-8">
              Publish Now
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Core Brand Naming */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Primary Brand Identity
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Primary Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.brand_name}
                  onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                  placeholder="e.g. KawaiOra Artisan Hampers"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Appears in document headers, legal disclaimers, invoices, notifications, and metadata.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Brand Name / Lockup
                  </label>
                  <input
                    type="text"
                    value={form.brand_short_name}
                    onChange={(e) => setForm({ ...form, brand_short_name: e.target.value })}
                    placeholder="e.g. KawaiOra"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used for compact mobile headers and badge tags.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color || '#d97706'}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="w-10 h-10 p-1 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      value={form.primary_color || '#d97706'}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Tagline & Mission
                </label>
                <textarea
                  value={form.brand_tagline}
                  onChange={(e) => setForm({ ...form, brand_tagline: e.target.value })}
                  placeholder="e.g. Artisan Handcrafted Hampers & Nationwide Luxury Gifting"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Top Announcement Strip Banner Text
                </label>
                <input
                  type="text"
                  value={form.announcement_text}
                  onChange={(e) => setForm({ ...form, announcement_text: e.target.value })}
                  placeholder="e.g. 🌿 KAWAIORA Artisan Hampers | Nationwide Express Delivery & Handcrafted Luxury Gifts"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Logo Management */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              Brand Logo & Favicon Assets
            </h2>

            <div className="space-y-5">
              {/* Primary Desktop Logo Upload & URL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Primary Desktop Logo <span className="text-rose-500">*</span>
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={(e) => handleLogoFileUpload(e, false)}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="/images/kawaiora-logo.png or https://..."
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Logo Preview Strip */}
                {form.logo_url && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center">
                      <span className="text-[10px] font-semibold text-slate-400 mb-1.5">Light Background</span>
                      <img
                        src={form.logo_url}
                        alt="Desktop Logo Light"
                        className="h-10 w-auto object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/kawaiora-logo.png';
                        }}
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center">
                      <span className="text-[10px] font-semibold text-slate-500 mb-1.5">Dark Background</span>
                      <img
                        src={form.logo_url}
                        alt="Desktop Logo Dark"
                        className="h-10 w-auto object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/kawaiora-logo.png';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Recommended: Transparent PNG, WebP or SVG format, height 48px to 64px.
                </p>
              </div>

              {/* Mobile Logo Upload & URL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Mobile Compact Logo (Optional)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mobile Logo</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={(e) => handleLogoFileUpload(e, true)}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={form.logo_mobile_url}
                  onChange={(e) => setForm({ ...form, logo_mobile_url: e.target.value })}
                  placeholder="/images/kawaiora-logo.png"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Official Contact & Fulfilment Channels */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-600" />
              Official Support & Gifting Concierge
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={form.support_email}
                  onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                  placeholder="support@kawaiora.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Phone / Hotline
                </label>
                <input
                  type="text"
                  value={form.support_phone}
                  onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
                  placeholder="+91 98201 45821"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Atelier / Registered Location
                </label>
                <input
                  type="text"
                  value={form.support_address}
                  onChange={(e) => setForm({ ...form, support_address: e.target.value })}
                  placeholder="Mumbai, Maharashtra, India"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 4: Version Changelog Notes */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Publishing Audit Notes
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Describe this identity revision for your administrative history and rollback log.
            </p>
            <input
              type="text"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="e.g. Updated festive brand lockup and high-res SVG logo"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </Card>
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Identity Preview</h3>
              </div>

              {/* View & Theme Switches */}
              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('desktop')}
                    className={cn('p-1 rounded text-xs transition', previewTab === 'desktop' ? 'bg-white dark:bg-slate-900 shadow text-amber-600' : 'text-slate-400')}
                    title="Desktop Preview"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('mobile')}
                    className={cn('p-1 rounded text-xs transition', previewTab === 'mobile' ? 'bg-white dark:bg-slate-900 shadow text-amber-600' : 'text-slate-400')}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme('light')}
                    className={cn('p-1 rounded text-xs transition', previewTheme === 'light' ? 'bg-white shadow text-amber-600' : 'text-slate-400')}
                    title="Light Background"
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme('dark')}
                    className={cn('p-1 rounded text-xs transition', previewTheme === 'dark' ? 'bg-slate-900 shadow text-amber-400' : 'text-slate-400')}
                    title="Dark Background"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Header Preview */}
            <div className="mt-4 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Storefront Header Preview
              </span>

              <div
                className={cn(
                  'rounded-xl border transition-all overflow-hidden shadow-sm',
                  previewTheme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                )}
              >
                {/* Announcement bar simulation */}
                <div className="bg-gradient-to-r from-rose-950 via-crimson-900 to-rose-950 text-white text-[10px] py-1.5 px-3 text-center truncate">
                  {form.announcement_text || '🌿 Nationwide Express Delivery & Handcrafted Luxury Gifts'}
                </div>

                {/* Header Navbar simulation */}
                <div className="p-3 flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-10 px-2 py-0.5 bg-transparent rounded-lg flex items-center justify-center">
                      <img
                        src={form.logo_url || '/images/kawaiora-logo.png'}
                        alt={form.brand_name}
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/kawaiora-logo.png';
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span className="hidden sm:inline">Shop Hampers</span>
                    <span className="hidden sm:inline">Occasions</span>
                    <span className="text-amber-600 font-bold">Custom Builder</span>
                  </div>
                </div>

                {/* Simulated Hero Snippet */}
                <div className="p-4 text-center space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                    Handcrafted Gift Experiences
                  </span>
                  <h4 className="text-base font-extrabold font-serif">
                    Unforgettable Gifts by {form.brand_short_name || form.brand_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {form.brand_tagline}
                  </p>
                </div>
              </div>

              {/* Simulated Invoice Receipt Snippet */}
              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Official Invoice & Document Lockup
                </span>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                  <p className="font-extrabold text-amber-700 dark:text-amber-400 tracking-tight text-sm uppercase">
                    {form.brand_name}
                  </p>
                  <p className="text-[11px] text-slate-500">{form.brand_tagline}</p>
                  <p className="text-[10px] text-slate-400">
                    Contact: {form.support_email} • {form.support_phone}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Version History & Rollback Modal */}
      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Brand Identity Version History & Rollback"
          size="lg"
        >
          <div className="space-y-4 py-1 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Review previous published versions of your store's brand identity. You can restore any historical version with one click.
            </p>

            {loadingHistory ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading version audit history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No previous version history recorded yet.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.brand_name}
                        </span>
                        <Badge variant="amber" className="text-[10px]">
                          v#{item.id}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Tagline: {item.brand_tagline || 'None'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Changed by <span className="font-medium text-slate-600 dark:text-slate-300">{item.changed_by}</span> on {formatDate(item.created_at)}
                      </p>
                      {item.version_notes && (
                        <p className="text-[11px] italic text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/50">
                          "{item.version_notes}"
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={restoringId === item.id}
                      onClick={() => handleRestoreVersion(item.id)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                      className="text-xs shrink-0"
                    >
                      Rollback to this version
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
