'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  Gift,
  ExternalLink,
  Receipt,
  Search,
  AlertCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  recipient_name: string;
  recipient_address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  delivery_date: string;
  delivery_time_slot: string;
  gift_message?: string;
  tracking_number?: string;
  tracking_url?: string | null;
  items: Array<{
    id: string;
    name: string;
    slug?: string;
    quantity: number;
    price: number;
    total_price: number;
    image: string;
    custom_items?: any;
  }>;
  receipt?: {
    is_paid: boolean;
    payment_method: string;
    payment_id: string;
    receipt_number: string;
    upi_vpa?: string | null;
    upi_rrn?: string | null;
    gateway: string;
    paid_at?: string;
  } | null;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  avatar_url?: string | null;
  stats: {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    first_order_date?: string | null;
    last_order_date?: string | null;
  };
}

export function AdminCustomerDetailClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteCustomer = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Customer ${customer?.name || customer?.email} deleted successfully.`);
        router.push('/admin/customers');
      } else {
        toast.error(data.error || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Failed to delete customer:', err);
      toast.error('Network error deleting customer');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchCustomerDetails() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/customers/${customerId}`);
        if (!res.ok) {
          throw new Error('Failed to load customer profile');
        }
        const data = await res.json();
        if (data.success && data.data) {
          setCustomer(data.data.customer);
          setOrders(data.data.orders || []);
          if (data.data.orders && data.data.orders.length > 0) {
            setSelectedOrder(data.data.orders[0]);
          }
        } else {
          setError(data.error || 'Customer not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching customer');
      } finally {
        setLoading(false);
      }
    }

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Profile Not Found</h2>
        <p className="text-slate-500">{error || 'Unable to locate customer records.'}</p>
        <Link href="/admin/customers">
          <Button variant="outline" leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('deliver')) return <Badge variant="success">Delivered</Badge>;
    if (s.includes('dispatch') || s.includes('ship')) return <Badge variant="primary">Dispatched</Badge>;
    if (s.includes('process')) return <Badge variant="amber">Processing</Badge>;
    if (s.includes('cancel')) return <Badge variant="rose">Cancelled</Badge>;
    return <Badge variant="default">Confirmed</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('paid')) return <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">Paid</Badge>;
    if (s.includes('fail')) return <Badge variant="rose">Failed</Badge>;
    return <Badge variant="amber">Pending</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}>
              All Customers
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{customer.name}</span>
              <Badge variant={customer.role === 'admin' ? 'primary' : 'amber'} className="text-xs">
                {customer.role.toUpperCase()}
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Patron ID: #{customer.id} • Registered {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={customer.is_active ? 'success' : 'danger'}>
            {customer.is_active ? 'Active Account' : 'Inactive Account'}
          </Badge>
          {customer.role !== 'admin' && customer.email !== 'admin@kawaiora.com' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950/40"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Customer
            </Button>
          )}
        </div>
      </div>

      {/* Customer Quick Stats & Profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lifetime Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{customer.stats.total_orders}</p>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lifetime Spend</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(customer.stats.total_spent)}</p>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Order (AOV)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(customer.stats.average_order_value)}</p>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Order</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {customer.stats.last_order_date ? formatDate(customer.stats.last_order_date) : 'No orders yet'}
            </p>
          </div>
        </Card>
      </div>

      {/* Contact Info Card */}
      <Card variant="outlined" padding="md" className="bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{customer.name}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lifetime Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Customer's Lifetime Orders ({orders.length})
          </h2>
          <span className="text-xs text-slate-500">All orders placed under this account</span>
        </div>

        {orders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700 dark:text-slate-300">No lifetime orders found for this customer.</p>
            <p className="text-xs text-slate-500 mt-1">When this customer places an order, it will appear here with full itemized details.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <Card
                key={order.id || order.order_number}
                variant="elevated"
                padding="lg"
                className="transition border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        Order #{order.order_number}
                      </span>
                      {getStatusBadge(order.order_status)}
                      {getPaymentBadge(order.payment_status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed on {formatDate(order.created_at)} • Payment via {order.payment_method}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-500 block">Total Order Value</span>
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="py-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Artisan Hampers & Items Purchased ({order.items.length})
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.map((item, itIdx) => (
                      <div
                        key={item.id || itIdx}
                        className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {item.slug ? (
                              <Link href={`/products/${item.slug}`} className="hover:text-amber-600 transition">
                                {item.name}
                              </Link>
                            ) : (
                              item.name
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Qty: <strong className="text-slate-800 dark:text-slate-200">{item.quantity}</strong> × {formatCurrency(item.price)}
                          </p>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                            Line Total: {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Shipping Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  {/* Recipient & Address */}
                  <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      Delivery Destination
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">{order.recipient_name}</p>
                    <p className="text-slate-500 mt-0.5">
                      {order.recipient_address.address_line_1}
                      {order.recipient_address.address_line_2 ? `, ${order.recipient_address.address_line_2}` : ''}
                    </p>
                    <p className="text-slate-500">
                      {order.recipient_address.city}, {order.recipient_address.state} - {order.recipient_address.postal_code}
                    </p>
                  </div>

                  {/* Delivery Schedule & Tracking */}
                  <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-4 h-4 text-blue-500" />
                      Express Shipping & Schedule
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      Scheduled: <strong className="text-slate-900 dark:text-white">{order.delivery_date || 'Standard Dispatch'}</strong>
                    </p>
                    <p className="text-slate-500 capitalize">Time Slot: {order.delivery_time_slot}</p>
                    {order.tracking_number && (
                      <p className="text-amber-600 font-mono font-semibold mt-1">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>

                  {/* Payment Receipt */}
                  <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      Razorpay Live Receipt
                    </p>
                    {order.receipt ? (
                      <>
                        <p className="text-slate-700 dark:text-slate-300">
                          Receipt ID: <span className="font-mono font-bold text-slate-900 dark:text-white">{order.receipt.receipt_number}</span>
                        </p>
                        <p className="text-slate-500 font-mono text-[11px] truncate">
                          Txn: {order.receipt.payment_id}
                        </p>
                        {order.receipt.upi_vpa && (
                          <p className="text-emerald-600 font-medium text-[11px] mt-0.5">
                            UPI: {order.receipt.upi_vpa}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold">
                          ✓ Verified Payment Captured
                        </span>
                      </>
                    ) : (
                      <p className="text-slate-500">Method: {order.payment_method}</p>
                    )}
                  </div>
                </div>

                {/* Gift Message */}
                {order.gift_message && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                    <p className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                      <Gift className="w-4 h-4 text-amber-600" />
                      Bespoke Handwritten Gift Message
                    </p>
                    <p className="italic text-slate-700 dark:text-slate-300">"{order.gift_message}"</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete Customer Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Permanent Account Deletion</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Are you sure you want to permanently delete patron{' '}
              <strong className="font-bold underline">{customer?.name}</strong> (
              {customer?.email})?
            </p>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400">
              This action will remove the user profile, all associated addresses, wishlists, shopping carts, and order records. This action cannot be reversed.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="rose"
              onClick={handleDeleteCustomer}
              disabled={deleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
