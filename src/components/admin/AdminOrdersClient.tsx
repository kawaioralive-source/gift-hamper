'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Eye,
  Download,
  Save,
  Loader2,
  Package,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  total_amount: number;
  order_status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  tracking_number: string | null;
  tracking_url: string | null;
  profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DELIVERY_UPDATE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing Hamper' },
  { value: 'packed', label: 'Packed & Quality Sealed' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered to Recipient' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment Statuses' },
  { value: 'paid', label: 'Paid (Captured)' },
  { value: 'pending', label: 'Pending Payment' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const SORT_OPTIONS = [
  { value: 'created_at.desc', label: 'Newest First' },
  { value: 'created_at.asc', label: 'Oldest First' },
  { value: 'total_amount.desc', label: 'Amount: High to Low' },
  { value: 'total_amount.asc', label: 'Amount: Low to High' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'amber',
  paid: 'emerald',
  confirmed: 'blue',
  preparing: 'blue',
  packed: 'indigo',
  shipped: 'purple',
  out_for_delivery: 'orange',
  delivered: 'emerald',
  cancelled: 'rose',
  return_requested: 'amber',
  refund_processing: 'amber',
  refunded: 'slate',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  paid: 'emerald',
  failed: 'rose',
  refunded: 'slate',
  partially_refunded: 'amber',
};

const STATUS_LABELS: Record<string, string> = {
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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_status: '',
    sort: 'created_at.desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.payment_status && { payment_status: filters.payment_status }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleQuickStatusUpdate = async (order: Order, newStatus: string) => {
    // Optimistic local state update
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_status: newStatus } : o));
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Order #${order.order_number} status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, order_status: newStatus } : null);
        }
      } else {
        toast.error(data.error || 'Failed to update delivery status');
        fetchOrders();
      }
    } catch {
      toast.error('Network error updating delivery status');
      fetchOrders();
    }
  };

  if (loading && orders.length === 0) {
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Orders & Delivery Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track customer orders, manage shipments, and update delivery statuses in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="outlined" padding="lg" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Search"
              placeholder="Order #, customer, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Select
              label="Order Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Payment Status"
              value={filters.payment_status}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              options={PAYMENT_STATUS_OPTIONS}
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

      {/* Orders Table */}
      <Card variant="elevated" padding="none">
        {loading && orders.length === 0 ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Order</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Update Delivery Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Payment</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">#{order.order_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center shrink-0">
                            {order.customer_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{order.customer_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{order.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-4 px-4">
                        {/* Direct Delivery Status Update Dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={order.order_status}
                            onChange={(e) => handleQuickStatusUpdate(order, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
                          >
                            {DELIVERY_UPDATE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <Badge variant={STATUS_COLORS[order.order_status] as any} className="text-[10px]">
                            {STATUS_LABELS[order.order_status] || order.order_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={PAYMENT_STATUS_COLORS[order.payment_status] as any} className="text-xs">
                          {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Manage Delivery
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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

            {/* Order Management Modal */}
            <Modal
              isOpen={showDetailModal}
              onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }}
              title={`Delivery & Order Management: #${selectedOrder?.order_number}`}
              size="xl"
            >
              {selectedOrder && (
                <OrderDetailContent
                  order={selectedOrder}
                  onClose={() => { setShowDetailModal(false); setSelectedOrder(null); }}
                  onUpdateSuccess={(updatedOrder) => {
                    setOrders(prev => prev.map(o => o.id === (updatedOrder.id || selectedOrder.id) ? { ...o, ...updatedOrder } : o));
                    setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
                    fetchOrders();
                  }}
                />
              )}
            </Modal>
          </>
        )}
      </Card>
    </div>
  );
}

function OrderDetailContent({
  order,
  onClose,
  onUpdateSuccess
}: {
  order: Order;
  onClose: () => void;
  onUpdateSuccess: (updated: Partial<Order> & { id: string }) => void;
}) {
  const [status, setStatus] = useState(order.order_status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || `TRK-${order.order_number}`);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(order.order_status);
    setPaymentStatus(order.payment_status);
    setTrackingNumber(order.tracking_number || `TRK-${order.order_number}`);
  }, [order]);

  const handleSaveDeliveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: status,
          payment_status: paymentStatus,
          tracking_number: trackingNumber,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Delivery status updated to ${STATUS_LABELS[status] || status}!`);
        onUpdateSuccess({
          id: order.id,
          order_status: status,
          payment_status: paymentStatus,
          tracking_number: trackingNumber,
          shipped_at: status === 'shipped' ? new Date().toISOString() : order.shipped_at,
          delivered_at: status === 'delivered' ? new Date().toISOString() : order.delivered_at,
        });
        onClose();
      } else {
        toast.error(data.error || 'Failed to update order status');
      }
    } catch {
      toast.error('Network error saving delivery status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
      {/* Prominent Delivery Status Update Form */}
      <form onSubmit={handleSaveDeliveryUpdate} className="p-5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/50 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Update Delivery Status & Tracking
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Delivery / Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              {DELIVERY_UPDATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="paid">Paid (Captured)</option>
              <option value="pending">Pending Payment</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Courier Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRK-KAW26102403"
              className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md"
            leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {saving ? 'Updating Delivery Status...' : 'Save Delivery Status'}
          </Button>
        </div>
      </form>

      {/* Current Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Current Order State:</span>
          <Badge variant={STATUS_COLORS[order.order_status] as any} className="text-xs">
            {STATUS_LABELS[order.order_status] || order.order_status}
          </Badge>
          <Badge variant={PAYMENT_STATUS_COLORS[order.payment_status] as any} className="text-xs">
            {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
          </Badge>
        </div>
        <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
          Total: {formatCurrency(order.total_amount)}
        </span>
      </div>

      {/* Shipment & Fulfillment Timeline */}
      <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 space-y-4">
        <TimelineItem
          label="Order Placed"
          time={order.created_at}
          completed={true}
          icon="📦"
        />
        <TimelineItem
          label="Payment Verified (Razorpay Live)"
          time={order.confirmed_at}
          completed={!!order.confirmed_at || order.payment_status === 'paid'}
          icon="💳"
        />
        <TimelineItem
          label="Order Confirmed & Prepared"
          time={order.confirmed_at}
          completed={['confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.order_status)}
          icon="✅"
        />
        <TimelineItem
          label="Dispatched / Out for Delivery"
          time={order.shipped_at}
          completed={['shipped', 'out_for_delivery', 'delivered'].includes(order.order_status)}
          icon="🚚"
        />
        <TimelineItem
          label="Delivered to Recipient"
          time={order.delivered_at}
          completed={order.order_status === 'delivered'}
          icon="🏠"
        />
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
        <DetailRow label="Order Number" value={`#${order.order_number}`} />
        <DetailRow label="Date Placed" value={formatDate(order.created_at)} />
        <DetailRow label="Customer" value={order.customer_name} />
        <DetailRow label="Customer Email" value={order.customer_email} />
        <DetailRow label="Total Amount" value={formatCurrency(order.total_amount)} />
        <DetailRow
          label="Live Tracking"
          value={
            order.tracking_number ? (
              <span className="font-mono text-amber-600 font-bold">{order.tracking_number}</span>
            ) : (
              'Not assigned yet'
            )
          }
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function TimelineItem({ label, time, completed, icon }: { label: string; time: string | null; completed: boolean; icon: string }) {
  return (
    <div className="relative flex items-start gap-3">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
        completed ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
      )}>
        {completed ? '✓' : icon}
      </div>
      <div className="flex-1 pt-1">
        <p className={cn('font-medium text-sm', completed ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400')}>
          {label}
        </p>
        {time && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(time).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="text-sm text-slate-900 dark:text-white mt-1 font-medium">{value}</div>
    </div>
  );
}
