'use client';

import { useState } from 'react';
import { Save, Loader2, Database, Users, Shield, Bell, Globe, CreditCard, Truck, Box, Palette, Key, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/context/CurrencyContext';
import toast from 'react-hot-toast';

interface SettingTab {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const SETTING_TABS: SettingTab[] = [
  { value: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
  { value: 'store', label: 'Store', icon: <Box className="w-4 h-4" /> },
  { value: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'shipping', label: 'Shipping', icon: <Truck className="w-4 h-4" /> },
  { value: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { value: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { value: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { value: 'advanced', label: 'Advanced', icon: <Database className="w-4 h-4" /> },
];

export function AdminSettingsClient() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const { currentCurrency, setCurrency } = useCurrency();

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setSaving(false);
    toast.success('Admin store settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Configure your store settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1">
          {SETTING_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Store Name"
                  placeholder="KawaiOra Artisan Hampers"
                  defaultValue="KawaiOra Artisan Hampers"
                />
                <Input
                  label="Store Email"
                  placeholder="contact@kawaiora.com"
                  type="email"
                  defaultValue="contact@kawaiora.com"
                />
              </div>
              <Input
                label="Store Phone"
                placeholder="+91 98765 43210"
                defaultValue="+91 98765 43210"
              />
              <Textarea
                label="Store Description"
                placeholder="Brief description of your store"
                defaultValue="Premium artisan gift hampers for every occasion"
                rows={3}
              />
              <Input
                label="Store URL"
                placeholder="https://kawaiora.com"
                defaultValue="https://kawaiora.com"
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Localization & Currency</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Store Display Currency"
                value={currentCurrency.code}
                onChange={(e) => setCurrency(e.target.value)}
                options={SUPPORTED_CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.flag} ${c.code} (${c.symbol}) - ${c.name}`,
                }))}
              />
              <Select
                label="Default Language"
                defaultValue="en"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'Hindi' },
                ]}
              />
              <Select
                label="Timezone"
                defaultValue="Asia/Kolkata"
                options={[
                  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Store Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Put store in maintenance mode</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Allow Guest Checkout</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Customers can checkout without account</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Require Email Verification</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Customers must verify email before ordering</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Enable Wishlist</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allow customers to save products</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Enable Reviews</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allow customers to review products</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">SEO Settings</h2>
            <div className="space-y-4">
              <Input
                label="Meta Title"
                placeholder="KawaiOra Artisan Hampers - Premium Gift Hampers"
                defaultValue="KawaiOra Artisan Hampers | Premium Gift Hampers for Every Occasion"
              />
              <Textarea
                label="Meta Description"
                placeholder="Discover thoughtfully curated artisan gift hampers..."
                defaultValue="Discover thoughtfully curated artisan gift hampers for birthdays, anniversaries, weddings, corporate gifting, and more. Premium packaging, personalized messages, and reliable delivery across India."
                rows={3}
              />
              <Input
                label="Meta Keywords"
                placeholder="gift hampers, birthday gifts, anniversary gifts, corporate gifts"
                defaultValue="gift hampers, birthday gifts, anniversary gifts, corporate gifts, wedding hampers, personalized gifts, luxury gift boxes"
              />
              <Input
                label="OG Image URL"
                placeholder="https://example.com/og-image.jpg"
                defaultValue="/og-image.jpg"
              />
            </div>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Razorpay Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Razorpay Standard Checkout</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enable Razorpay payments</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <Input
                label="Razorpay Key ID"
                placeholder="rzp_test_..."
                type="password"
                defaultValue="rzp_test_..."
              />
              <Input
                label="Razorpay Key Secret"
                placeholder="••••••••"
                type="password"
              />
              <Input
                label="Razorpay Webhook Secret"
                placeholder="••••••••"
                type="password"
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Stripe Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Stripe Payment Intents</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enable Stripe payments</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <Input
                label="Stripe Publishable Key"
                placeholder="pk_test_..."
                type="password"
                defaultValue="pk_test_..."
              />
              <Input
                label="Stripe Secret Key"
                placeholder="sk_test_..."
                type="password"
              />
              <Input
                label="Stripe Webhook Secret"
                placeholder="whsec_..."
                type="password"
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Payment Options</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Cash on Delivery (COD)</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allow COD for orders below ₹5000</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <Input
                label="COD Limit (INR)"
                type="number"
                defaultValue="5000"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Auto Capture Payments</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Automatically capture authorized payments</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Shipping Zones</h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure shipping rates for different regions</p>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-900 dark:text-white">India (Default Zone)</h3>
                  <Badge variant="amber">Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Free Shipping Threshold"
                    type="number"
                    defaultValue="999"
                    helperText="Orders above this amount get free shipping"
                  />
                  <Input
                    label="Standard Shipping Rate"
                    type="number"
                    defaultValue="99"
                    helperText="Flat rate for standard delivery"
                  />
                  <Input
                    label="Express Shipping Rate"
                    type="number"
                    defaultValue="199"
                    helperText="Flat rate for express delivery"
                  />
                  <Input
                    label="COD Fee"
                    type="number"
                    defaultValue="50"
                    helperText="Additional fee for COD orders"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Delivery Slots</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Enable Delivery Slots</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allow customers to choose delivery date/time</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Min Days Advance"
                  type="number"
                  defaultValue="1"
                  helperText="Minimum days in advance for scheduling"
                />
                <Input
                  label="Max Days Advance"
                  type="number"
                  defaultValue="30"
                  helperText="Maximum days in advance for scheduling"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Morning Slot"
                  defaultValue="9-12"
                  options={[
                    { value: '9-12', label: '9 AM - 12 PM' },
                    { value: '10-13', label: '10 AM - 1 PM' },
                  ]}
                />
                <Select
                  label="Afternoon Slot"
                  defaultValue="12-15"
                  options={[
                    { value: '12-15', label: '12 PM - 3 PM' },
                    { value: '13-16', label: '1 PM - 4 PM' },
                  ]}
                />
                <Select
                  label="Evening Slot"
                  defaultValue="15-18"
                  options={[
                    { value: '15-18', label: '3 PM - 6 PM' },
                    { value: '16-19', label: '4 PM - 7 PM' },
                  ]}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Email Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Order Confirmation', desc: 'Send when order is placed' },
                { label: 'Order Confirmed', desc: 'Send when order is confirmed' },
                { label: 'Order Shipped', desc: 'Send with tracking details' },
                { label: 'Out for Delivery', desc: 'Send when order is out for delivery' },
                { label: 'Order Delivered', desc: 'Send when order is delivered' },
                { label: 'Order Cancelled', desc: 'Send when order is cancelled' },
                { label: 'Refund Processed', desc: 'Send when refund is issued' },
                { label: 'Low Stock Alert', desc: 'Notify admin when stock is low' },
                { label: 'New Customer', desc: 'Notify admin on new registration' },
                { label: 'Weekly Report', desc: 'Send weekly sales report to admin' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              ))}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">SMS Notifications</h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure SMS provider (Twilio, MSG91, etc.)</p>
              {[
                { label: 'Order Confirmation SMS', desc: 'Send SMS when order is placed' },
                { label: 'Order Shipped SMS', desc: 'Send SMS with tracking' },
                { label: 'Order Delivered SMS', desc: 'Send SMS on delivery' },
                { label: 'OTP Verification', desc: 'Send OTP for phone verification' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Admin Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Require 2FA for admin login</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Session Timeout</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Auto logout after inactivity</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <Input
                label="Session Timeout (minutes)"
                type="number"
                defaultValue="60"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">IP Whitelist</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Restrict admin access to specific IPs</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <Textarea
                label="Allowed IP Addresses"
                placeholder="192.168.1.1, 10.0.0.1 (one per line)"
                rows={3}
              />
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">API Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Rate Limiting</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enable API rate limiting</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Requests per Minute"
                  type="number"
                  defaultValue="100"
                />
                <Input
                  label="Burst Limit"
                  type="number"
                  defaultValue="20"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">CORS Allowed Origins</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Comma-separated list of allowed origins</p>
                </div>
              </div>
              <Textarea
                placeholder="https://kawaiora.com, https://admin.kawaiora.com"
                defaultValue="https://kawaiora.com"
                rows={2}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Theme Settings</h2>
            <div className="space-y-4">
              <Select
                label="Default Theme"
                defaultValue="system"
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Custom Colors</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Override default color scheme</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Primary Color"
                  type="color"
                  defaultValue="#f59e0b"
                />
                <Input
                  label="Secondary Color"
                  type="color"
                  defaultValue="#92400e"
                />
                <Input
                  label="Accent Color"
                  type="color"
                  defaultValue="#fbbf24"
                />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Branding</h2>
            <div className="space-y-4">
              <Input
                label="Logo URL (Light)"
                placeholder="https://example.com/logo-light.svg"
              />
              <Input
                label="Logo URL (Dark)"
                placeholder="https://example.com/logo-dark.svg"
              />
              <Input
                label="Favicon URL"
                placeholder="https://example.com/favicon.ico"
                defaultValue="/favicon.ico"
              />
            </div>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Database</h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Database connection settings (configure in .env)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Connection Pool Size"
                  type="number"
                  defaultValue="20"
                  disabled
                />
                <Input
                  label="Query Timeout (ms)"
                  type="number"
                  defaultValue="30000"
                  disabled
                />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Cache & Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Redis Caching</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enable Redis for caching</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <Input
                label="Redis URL"
                placeholder="redis://localhost:6379"
                disabled
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">CDN Enabled</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Use CDN for static assets</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Webhooks</h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure webhook endpoints for external integrations</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Order Webhook URL"
                    placeholder="https://your-app.com/webhooks/orders"
                  />
                  <Input
                    label="Customer Webhook URL"
                    placeholder="https://your-app.com/webhooks/customers"
                  />
                  <Input
                    label="Product Webhook URL"
                    placeholder="https://your-app.com/webhooks/products"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Webhook Secret</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Secret for verifying webhook signatures</p>
                  </div>
                  <Input
                    type="password"
                    placeholder="whsec_..."
                    style={{ maxWidth: '300px' }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}