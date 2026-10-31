'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Package as PackageIcon, CreditCard, RefreshCw, TicketPercent } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

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

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  low_stock_threshold: number;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, stockRes] = await Promise.all([
        fetch(`/api/admin/stats?range=${timeRange}`),
        fetch(`/api/admin/orders?limit=10&sort=created_at.desc`),
        fetch(`/api/admin/products?low_stock=true&limit=10`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) setStats(data.data);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (data.success) setRecentOrders(data.data || []);
      }

      if (stockRes.ok) {
        const data = await stockRes.json();
        if (data.success) setLowStockProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Revenue', value: stats ? formatCurrency(stats.total_revenue) : '—', icon: DollarSign, color: 'emerald', change: '+12.5%', trend: 'up' as const },
    { label: 'Total Orders', value: stats ? stats.total_orders.toLocaleString() : '—', icon: ShoppingCart, color: 'blue', change: '+8.2%', trend: 'up' as const },
    { label: 'Total Customers', value: stats ? stats.total_customers.toLocaleString() : '—', icon: Users, color: 'purple', change: '+5.1%', trend: 'up' as const },
    { label: 'Avg Order Value', value: stats ? formatCurrency(stats.avg_order_value) : '—', icon: DollarSign, color: 'amber', change: '+3.4%', trend: 'up' as const },
    { label: 'Pending Orders', value: stats ? stats.pending_orders.toString() : '—', icon: Clock, color: 'amber', change: null, trend: null },
    { label: 'Low Stock Products', value: stats ? stats.low_stock_products.toString() : '—', icon: AlertCircle, color: 'rose', change: null, trend: null },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(() => (
            <Skeleton key={Math.random()} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Overview of your store performance</p>
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
          <Button onClick={fetchDashboardData} variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">No recent orders</td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-slate-900 dark:text-white">#{order.order_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-900 dark:text-white">{order.customer_name}</p>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">{formatCurrency(order.total_amount)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(order.order_status)} className="text-xs">
                            {getStatusLabel(order.order_status)}
                          </Badge>
                          <Badge variant={getPaymentStatusColor(order.payment_status)} className="text-xs">
                            {getPaymentStatusLabel(order.payment_status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              <AlertCircle className="w-5 h-5 text-rose-500 inline-block mr-2" />
              Low Stock Alerts
            </h2>
            {lowStockProducts.length > 0 && (
              <Badge variant="rose">{lowStockProducts.length} items</Badge>
            )}
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <PackageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">All products well stocked!</p>
              </div>
            ) : (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-3">
                    <PackageIcon className="w-8 h-8 text-rose-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Threshold: {product.low_stock_threshold}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600 dark:text-rose-400">{product.stock} left</p>
                    <Badge variant="rose" className="text-xs mt-1">Reorder needed</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/products/new" className="flex flex-col items-center gap-2 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <Package className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Add Product</span>
          </Link>
          <Link href="/admin/orders" className="flex flex-col items-center gap-2 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <ShoppingCart className="w-6 h-6 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manage Orders</span>
          </Link>
          <Link href="/admin/customers" className="flex flex-col items-center gap-2 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <Users className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Customers</span>
          </Link>
          <Link href="/admin/promo-codes/new" className="flex flex-col items-center gap-2 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <TicketPercent className="w-6 h-6 text-amber-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Create Promo</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, change, trend }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; change: string | null; trend: 'up' | 'down' | null }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  return (
    <Card variant="outlined" padding="lg" className={colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span className={cn('font-medium', trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
          <span className="text-slate-500 dark:text-slate-400">vs last period</span>
        </div>
      )}
    </Card>
  );
}

function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'amber' | 'rose' {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'amber' | 'rose'> = {
    pending_payment: 'warning',
    paid: 'success',
    confirmed: 'primary',
    preparing: 'primary',
    packed: 'primary',
    shipped: 'primary',
    out_for_delivery: 'warning',
    delivered: 'success',
    cancelled: 'danger',
    return_requested: 'warning',
    refund_processing: 'warning',
    refunded: 'secondary',
  };
  return colors[status] || 'default';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    packed: 'Packed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    return_requested: 'Return Requested',
    refund_processing: 'Refund Processing',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

function getPaymentStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'amber' | 'rose' {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'amber' | 'rose'> = {
    pending: 'warning',
    paid: 'success',
    failed: 'danger',
    refunded: 'secondary',
    partially_refunded: 'warning',
  };
  return colors[status] || 'default';
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
    partially_refunded: 'Partial Refund',
  };
  return labels[status] || status;
}