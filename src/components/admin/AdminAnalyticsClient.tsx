'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Calendar, Clock, CreditCard, MapPin } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

interface AnalyticsData {
  revenue_over_time: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{ product: { name: string; images: string[]; price: number }; units_sold: number; revenue: number }>;
  top_categories: Array<{ category: { name: string }; revenue: number; orders: number }>;
  top_occasions: Array<{ occasion: { name: string }; revenue: number; orders: number }>;
  customer_metrics: {
    total: number;
    new_this_month: number;
    returning_rate: number;
    avg_lifetime_value: number;
  };
  order_status_distribution: Array<{ status: string; count: number }>;
  payment_method_distribution: Array<{ method: string; count: number; revenue: number }>;
  low_stock_alerts: Array<{ product: { name: string; stock: number; low_stock_threshold: number } }>;
}

interface AdminStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  low_stock_products: number;
  avg_order_value: number;
  conversion_rate: number;
}

export function AdminAnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/stats?range=${timeRange}`),
        fetch(`/api/admin/analytics?range=${timeRange}`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) setStats(data.data);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.success) setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Revenue', value: stats ? formatCurrency(stats.total_revenue) : '—', icon: DollarSign, color: 'emerald', change: '+12.5%', trend: 'up' as const },
    { label: 'Total Orders', value: stats ? stats.total_orders.toLocaleString() : '—', icon: ShoppingCart, color: 'blue', change: '+8.2%', trend: 'up' as const },
    { label: 'Total Customers', value: stats ? stats.total_customers.toLocaleString() : '—', icon: Users, color: 'purple', change: '+5.1%', trend: 'up' as const },
    { label: 'Avg Order Value', value: stats ? formatCurrency(stats.avg_order_value) : '—', icon: DollarSign, color: 'amber', change: '+3.4%', trend: 'up' as const },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(() => <Skeleton key={Math.random()} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Store performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' },
            ]}
            className="w-48"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Revenue Over Time</h2>
          <div className="h-64">
            <RevenueChart data={analytics?.revenue_over_time || []} />
          </div>
        </Card>

        {/* Order Status Distribution */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Status Distribution</h2>
          <div className="h-64">
            <DonutChart 
              data={analytics?.order_status_distribution || []}
              colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280']}
              labels={['Paid', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled']}
            />
          </div>
        </Card>
      </div>

      {/* Top Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {analytics?.top_products?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{item.product.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.units_sold} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.units_sold} units</p>
                </div>
              </div>
            ))}
            {!analytics?.top_products?.length && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No product data available</p>
            )}
          </div>
        </Card>

        {/* Top Categories */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Categories</h2>
          <div className="space-y-4">
            {analytics?.top_categories?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.category.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.orders} orders</p>
                </div>
              </div>
            ))}
            {!analytics?.top_categories?.length && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No category data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Customer Metrics & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Metrics */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Customer Metrics</h2>
          <div className="space-y-4">
            <MetricRow label="Total Customers" value={analytics?.customer_metrics?.total.toLocaleString() || '—'} />
            <MetricRow label="New This Month" value={analytics?.customer_metrics?.new_this_month?.toLocaleString() || '—'} icon={TrendingUp} iconColor="emerald" />
            <MetricRow label="Returning Rate" value={`${analytics?.customer_metrics?.returning_rate || 0}%`} icon={ArrowUpRight} iconColor="blue" />
            <MetricRow label="Avg Lifetime Value" value={formatCurrency(analytics?.customer_metrics?.avg_lifetime_value || 0)} icon={DollarSign} iconColor="amber" />
          </div>
        </Card>

        {/* Payment Methods */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Payment Methods</h2>
          <div className="space-y-3">
            {analytics?.payment_method_distribution?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-900 dark:text-white capitalize">{item.method}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.count} orders</p>
                </div>
              </div>
            ))}
            {!analytics?.payment_method_distribution?.length && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No payment data available</p>
            )}
          </div>
        </Card>

        {/* Top Occasions */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Occasions</h2>
          <div className="space-y-3">
            {analytics?.top_occasions?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{item.occasion.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.orders} orders</p>
                </div>
              </div>
            ))}
            {!analytics?.top_occasions?.length && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No occasion data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, change, trend }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; change: string; trend: 'up' | 'down' }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={cn('rounded-2xl border p-6', colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm">
        <span className={cn('font-medium', trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
          {trend === 'up' ? '↑' : '↓'} {change}
        </span>
        <span className="text-slate-500 dark:text-slate-400">vs last period</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, icon: Icon, iconColor }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; iconColor?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={cn('w-5 h-5', iconColor ? `text-${iconColor}-500` : 'text-amber-500')} />}
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <span className="font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        No revenue data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const width = '100%';

  return (
    <div className="h-full flex items-end justify-between gap-1 px-2">
      {data.map((point, index) => {
        const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: '40px' }}>
            <div 
              className="w-full bg-amber-500 rounded-t transition-all duration-300 hover:bg-amber-400"
              style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
              title={`${new Date(point.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}: ${point.revenue}`}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {new Date(point.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, colors, labels }: { data: Array<{ status: string; count: number }>; colors: string[]; labels: string[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  if (!total) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        No order data available
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg width="192" height="192" viewBox="0 0 192 192">
          <circle cx="96" cy="96" r="70" fill="none" stroke="#e2e8f0" strokeWidth="20" />
          {data.map((item, index) => {
            const percentage = item.count / total;
            const circumference = 2 * Math.PI * 70;
            const offset = circumference * (1 - percentage);
            const startAngle = data.slice(0, index).reduce((sum, d) => sum + d.count / total, 0) * 360;
            
            return (
              <circle
                key={index}
                cx="96"
                cy="96"
                r="70"
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={`${circumference * percentage} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 96 96)`}
                style={{ transformOrigin: '96px 96px' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.reduce((sum, d) => sum + d.count, 0)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 w-full max-w-xs">
        <div className="flex flex-wrap justify-center gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{labels[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}