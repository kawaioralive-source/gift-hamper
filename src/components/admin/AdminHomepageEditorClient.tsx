'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Eye,
  Save,
  RotateCcw,
  History,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Laptop,
  Smartphone,
  ExternalLink,
  Wand2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface HomepageConfig {
  id?: number;
  hero_headline: string;
  hero_subheadline: string;
  hero_badge_text: string;
  hero_primary_button_text: string;
  hero_primary_button_link: string;
  hero_secondary_button_text: string;
  hero_secondary_button_link: string;
  hero_image_url: string;
  promotional_banner_active: boolean;
  promotional_banner_text: string;
  sections_order: string[];
  sections_visibility: Record<string, boolean>;
  story_title: string;
  story_text: string;
  story_image_url: string;
  status?: string;
}

const DEFAULT_CONFIG: HomepageConfig = {
  hero_headline: 'Unforgettable Gifts, Crafted With Love',
  hero_subheadline: 'Surprise your loved ones, colleagues, and partners with artisan gourmet hampers, premium sparkling wines, and custom handmade keepsakes delivered right to their doorstep.',
  hero_badge_text: 'Handcrafted Gift Experiences',
  hero_primary_button_text: 'Explore Luxury Hampers',
  hero_primary_button_link: '/shop',
  hero_secondary_button_text: 'Build Custom Hamper',
  hero_secondary_button_link: '/customize/new',
  hero_image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80',
  promotional_banner_active: true,
  promotional_banner_text: '🌿 Special Welcome Offer: Use code WELCOME10 for 10% off your first luxury order!',
  sections_order: ['story_highlights', 'hero', 'trust_bar', 'moods', 'promotions', 'occasions', 'featured', 'bestsellers', 'custom_builder', 'corporate', 'testimonials', 'faq', 'story'],
  sections_visibility: {
    story_highlights: true,
    hero: true,
    trust_bar: true,
    moods: true,
    promotions: true,
    occasions: true,
    featured: true,
    bestsellers: true,
    custom_builder: true,
    corporate: true,
    testimonials: true,
    faq: true,
    story: true,
  },
  story_title: 'The Art of Thoughtful Gifting',
  story_text: 'Every hamper is thoughtfully curated by our artisan team. From handcrafted gourmet confectionery to hand-tied satin ribbons, we transform gifting into an unforgettable emotional celebration.',
  story_image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=80',
};

const SECTION_LABELS: Record<string, string> = {
  story_highlights: 'Story Highlights & Circular Category Strip',
  hero: 'Hero Banner Section',
  trust_bar: 'Trust & Luxury Benefits Bar',
  moods: 'Shop by Gifting Mood Tiles',
  promotions: 'Promotional Banner Strip',
  occasions: 'Shop by Occasion Discovery',
  featured: 'Curated Featured Hampers',
  bestsellers: 'Bestselling Gift Collections',
  custom_builder: 'Personalized Custom Builder Banner',
  corporate: 'Corporate & Bulk Gifting Banner',
  testimonials: 'Customer Testimonials & Verified Reviews',
  faq: 'Frequently Asked Questions (FAQ Accordion)',
  story: 'Brand Heritage & Story Section',
};

export function AdminHomepageEditorClient() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'story' | 'promotions'>('hero');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/homepage-editor');
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data.data,
          sections_visibility: {
            ...DEFAULT_CONFIG.sections_visibility,
            ...(data.data.sections_visibility || {}),
          },
          sections_order: data.data.sections_order || DEFAULT_CONFIG.sections_order,
        });
      }
    } catch {
      console.warn('Failed to load homepage config, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/homepage-editor/history');
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.data || []);
      }
    } catch {
      console.warn('Failed to load homepage history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/homepage-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          version_notes: versionNotes.trim() || 'Homepage layout updated via Visual Editor',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Homepage layout published live!');
        setVersionNotes('');
        await fetchConfig();
      } else {
        toast.error(data.error || 'Failed to publish homepage layout');
      }
    } catch {
      toast.error('Network error publishing homepage');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (historyId: number) => {
    if (!confirm(`Restore homepage layout version #${historyId}?`)) return;

    try {
      const res = await fetch('/api/homepage-editor/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history_id: historyId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Homepage restored successfully!');
        setShowHistoryModal(false);
        await fetchConfig();
      } else {
        toast.error(data.error || 'Failed to restore homepage');
      }
    } catch {
      toast.error('Network error during restore');
    }
  };

  const handleToggleSection = (sectionKey: string) => {
    setConfig((prev) => ({
      ...prev,
      sections_visibility: {
        ...prev.sections_visibility,
        [sectionKey]: !prev.sections_visibility[sectionKey],
      },
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.sections_order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setConfig((prev) => ({
      ...prev,
      sections_order: newOrder,
    }));
  };

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
            <span className="text-xs font-semibold text-slate-500">Homepage Visual Editor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Palette className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Homepage Visual Editor
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Customize hero headlines, promotional banners, section ordering, and brand storytelling live
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchHistory();
              setShowHistoryModal(true);
            }}
            leftIcon={<History className="w-4 h-4 text-slate-500" />}
          >
            Version History
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Publish Homepage
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            {[
              { id: 'hero', label: 'Hero Banner' },
              { id: 'sections', label: 'Section Ordering & Visibility' },
              { id: 'promotions', label: 'Promotional Strip' },
              { id: 'story', label: 'Brand Story' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-all',
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Hero Banner */}
          {activeTab === 'hero' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Hero Section Content & Imagery
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pill Badge Text
                </label>
                <input
                  type="text"
                  value={config.hero_badge_text}
                  onChange={(e) => setConfig({ ...config, hero_badge_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Main Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.hero_headline}
                  onChange={(e) => setConfig({ ...config, hero_headline: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-bold font-serif rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subheadline / Description
                </label>
                <textarea
                  value={config.hero_subheadline}
                  onChange={(e) => setConfig({ ...config, hero_subheadline: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    value={config.hero_primary_button_text}
                    onChange={(e) => setConfig({ ...config, hero_primary_button_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={config.hero_primary_button_link}
                    onChange={(e) => setConfig({ ...config, hero_primary_button_link: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={config.hero_secondary_button_text}
                    onChange={(e) => setConfig({ ...config, hero_secondary_button_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={config.hero_secondary_button_link}
                    onChange={(e) => setConfig({ ...config, hero_secondary_button_link: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Featured Hero Slide Image URL
                </label>
                <input
                  type="text"
                  value={config.hero_image_url}
                  onChange={(e) => setConfig({ ...config, hero_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </Card>
          )}

          {/* Tab 2: Section Ordering & Visibility */}
          {activeTab === 'sections' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Homepage Section Sequence & Visibility
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Use arrows to rearrange section sequence. Toggle switches to enable or hide sections dynamically.
              </p>

              <div className="space-y-2">
                {config.sections_order.map((secKey, idx) => {
                  const isVisible = config.sections_visibility[secKey] !== false;
                  return (
                    <div
                      key={secKey}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-xs flex items-center justify-center text-slate-600 dark:text-slate-300">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {SECTION_LABELS[secKey] || secKey}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">key: {secKey}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Up / Down buttons */}
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === config.sections_order.length - 1}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(secKey)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-bold transition',
                            isVisible
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          )}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Tab 3: Promotional Strip */}
          {activeTab === 'promotions' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Promotional Campaign Strip
              </h2>

              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div>
                  <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    Enable Promotional Banner Strip
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Displays high-visibility coupon and seasonal announcement text across the homepage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      promotional_banner_active: !config.promotional_banner_active,
                    })
                  }
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold transition',
                    config.promotional_banner_active
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                  )}
                >
                  {config.promotional_banner_active ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Promotional Strip Message
                </label>
                <input
                  type="text"
                  value={config.promotional_banner_text}
                  onChange={(e) => setConfig({ ...config, promotional_banner_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </Card>
          )}

          {/* Tab 4: Brand Story */}
          {activeTab === 'story' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Brand Heritage & Story Content
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={config.story_title}
                  onChange={(e) => setConfig({ ...config, story_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story Narrative Text
                </label>
                <textarea
                  value={config.story_text}
                  onChange={(e) => setConfig({ ...config, story_text: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story Feature Image URL
                </label>
                <input
                  type="text"
                  value={config.story_image_url}
                  onChange={(e) => setConfig({ ...config, story_image_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Hero Preview</h3>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    'p-1 rounded text-xs transition',
                    previewDevice === 'desktop' ? 'bg-white dark:bg-slate-900 shadow text-amber-600' : 'text-slate-400'
                  )}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    'p-1 rounded text-xs transition',
                    previewDevice === 'mobile' ? 'bg-white dark:bg-slate-900 shadow text-amber-600' : 'text-slate-400'
                  )}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              {config.promotional_banner_active && (
                <div className="p-2 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border border-amber-500/30 rounded-xl text-[10px] text-center font-bold text-amber-700 dark:text-amber-300">
                  {config.promotional_banner_text}
                </div>
              )}

              <div className="space-y-2 text-center pt-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600">
                  {config.hero_badge_text}
                </span>

                <h3 className="text-xl font-extrabold font-serif text-slate-900 dark:text-white leading-tight">
                  {config.hero_headline}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                  {config.hero_subheadline}
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold shadow-sm">
                    {config.hero_primary_button_text}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                    {config.hero_secondary_button_text}
                  </span>
                </div>
              </div>

              {/* Image Thumbnail */}
              {config.hero_image_url && (
                <div className="h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-3">
                  <img
                    src={config.hero_image_url}
                    alt="Hero Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Homepage Layout Version History"
          size="lg"
        >
          <div className="space-y-4 py-1 text-xs">
            <p className="text-slate-500">
              Restore previous published homepage layouts with one click.
            </p>

            {loadingHistory ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading layout version history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No previous version history found.</div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((it) => (
                  <div key={it.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Layout Version #{it.id}
                        </span>
                        <Badge variant="amber" className="text-[10px]">
                          {formatDate(it.created_at)}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Published by: <span className="font-medium text-slate-700 dark:text-slate-300">{it.published_by}</span>
                      </p>
                      {it.version_notes && (
                        <p className="italic text-amber-700 dark:text-amber-400 text-[11px]">
                          "{it.version_notes}"
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(it.id)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                      className="text-xs shrink-0"
                    >
                      Restore Version
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
