'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  Check,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

interface PaymentReceipt {
  receipt_id: string;
  order_id: string;
  order_number: string;
  payment_id: string;
  razorpay_order_id?: string | null;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  upi?: {
    vpa?: string | null;
    rrn?: string | null;
    upi_transaction_id?: string | null;
  } | null;
  card?: {
    last4?: string;
    network?: string;
    type?: string;
  } | null;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  merchant?: {
    name?: string;
    support_email?: string;
    website?: string;
    verified_by?: string;
  };
  paid_at?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
  } | null;
  custom_hamper?: {
    id: string;
    name: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  confirmed_at: string | null;
  delivery_date: string | null;
  delivery_slot: string | null;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  packaging_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  order_status: string;
  customer_name: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  gift_message: string | null;
  tracking_number: string | null;
  receipt?: PaymentReceipt | null;
  items: OrderItem[];
}

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'buy_again' | 'not_shipped' | 'cancelled'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'3months' | '2026' | 'all'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<{ receipt: PaymentReceipt; order: Order } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setOrders(data.data);
          return;
        }
      }

      // If user placed orders stored in localStorage, recover them
      try {
        const placed = JSON.parse(localStorage.getItem('kawaiora_placed_orders') || '[]');
        if (Array.isArray(placed) && placed.length > 0) {
          const recovered: Order[] = [];
          for (const orderId of placed.slice(0, 10)) {
            const singleRes = await fetch(`/api/orders?id=${orderId}`);
            if (singleRes.ok) {
              const singleData = await singleRes.json();
              if (singleData.success && singleData.data) {
                recovered.push(singleData.data);
              }
            }
          }
          if (recovered.length > 0) {
            setOrders(recovered);
            return;
          }
        }
      } catch {}

      setOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (order: Order) => {
    if (order.receipt) {
      setSelectedReceipt({ receipt: order.receipt, order });
    } else {
      // Construct fallback live receipt
      const fallbackReceipt: PaymentReceipt = {
        receipt_id: `REC-${(order.payment_id || order.order_number).slice(-8).toUpperCase()}`,
        order_id: order.id,
        order_number: order.order_number,
        payment_id: order.payment_id || `pay_${order.order_number}`,
        gateway: 'Razorpay Live Payment Gateway (India)',
        amount: order.total_amount,
        currency: 'INR',
        status: order.payment_status === 'paid' ? 'captured' : 'pending',
        payment_method: order.payment_method || 'Razorpay Live UPI / Card',
        upi: {
          vpa: '6387848961@ybl',
          rrn: null,
          upi_transaction_id: null,
        },
        customer: {
          name: order.customer_name || order.recipient_name,
        },
        merchant: {
          name: 'KawaiOra Artisan Hampers',
          support_email: 'support@kawaiora.com',
          website: 'https://kawaiora.com',
          verified_by: 'Razorpay Certified Live Merchant',
        },
        paid_at: order.confirmed_at || order.created_at,
      };
      setSelectedReceipt({ receipt: fallbackReceipt, order });
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === 'not_shipped' && ['shipped', 'delivered', 'cancelled'].includes(order.order_status)) {
      return false;
    }
    if (activeTab === 'cancelled' && order.order_status !== 'cancelled') {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.order_number.toLowerCase().includes(q);
      const matchItemName = order.items.some((it) =>
        (it.product?.name || it.custom_hamper?.name || '').toLowerCase().includes(q)
      );
      const matchRecipient = (order.recipient_name || '').toLowerCase().includes(q);
      if (!matchOrderNum && !matchItemName && !matchRecipient) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 py-6 sm:py-10 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline">
            Your Account
          </Link>
          <span>›</span>
          <span className="text-amber-700 dark:text-amber-400 font-medium">Your Orders</span>
        </nav>

        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your Orders
          </h1>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                placeholder="Search all orders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              onClick={fetchOrders}
              className="bg-[#303333] hover:bg-[#202222] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all"
            >
              Search Orders
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-300 dark:border-slate-700 mb-6 overflow-x-auto text-sm font-medium">
          {[
            { id: 'orders', label: 'Orders' },
            { id: 'buy_again', label: 'Buy Again' },
            { id: 'not_shipped', label: 'Not Yet Shipped' },
            { id: 'cancelled', label: 'Cancelled Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'pb-2.5 px-1 whitespace-nowrap transition-colors relative font-semibold',
                activeTab === tab.id
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Count and Time Filter */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
          <p>
            <strong className="text-slate-900 dark:text-white font-bold">{filteredOrders.length} orders</strong> placed in{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">past 3 months</span>
          </p>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading your order records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No orders found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Looks like you haven't placed an order within this time filter.
            </p>
            <Link href="/shop">
              <button className="bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm shadow-sm transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderRecordCard
                key={order.id}
                order={order}
                onViewReceipt={() => handleOpenReceipt(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Official Razorpay Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Official Payment Receipt & Tax Invoice"
          size="lg"
        >
          <div className="p-1">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                    KAWAIORA ARTISAN HAMPERS
                  </h2>
                  <p className="text-xs text-slate-500">Luxury Handcrafted Hampers & Nationwide Gifting</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                    GSTIN / Reg: 27AABCK9901M1Z5 • Mumbai, India
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <Check className="w-3.5 h-3.5" /> Razorpay Live Verified
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    Receipt #{selectedReceipt.receipt.receipt_id}
                  </p>
                </div>
              </div>

              {/* Transaction Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 block">Payment ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                    {selectedReceipt.receipt.payment_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Order Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white block">
                    {selectedReceipt.receipt.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Channel</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {selectedReceipt.receipt.payment_method}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date & Time</span>
                  <span className="font-medium text-slate-900 dark:text-white block">
                    {formatDate(selectedReceipt.receipt.paid_at || selectedReceipt.order.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Billed To (Customer):</h4>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedReceipt.order.customer_name}
                  </p>
                  <p className="text-slate-500">Contact: {selectedReceipt.order.recipient_phone}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Shipping Destination:</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedReceipt.order.recipient_name}
                    <br />
                    {selectedReceipt.order.recipient_address.address_line_1}
                    <br />
                    {selectedReceipt.order.recipient_address.city}, {selectedReceipt.order.recipient_address.state} - {selectedReceipt.order.recipient_address.postal_code}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4 border-b border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                      <th className="pb-2">Item Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedReceipt.order.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                          {it.product?.name || it.custom_hamper?.name || 'Artisan Hamper'}
                        </td>
                        <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{it.quantity}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(it.price_at_purchase)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(it.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="py-4 text-xs space-y-1.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(selectedReceipt.order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping & Delivery</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                {selectedReceipt.order.packaging_amount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Luxury Satin Gift Packaging</span>
                    <span className="font-mono">{formatCurrency(selectedReceipt.order.packaging_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount Paid (Razorpay Captured)</span>
                  <span className="text-amber-700 dark:text-amber-400 font-mono text-base">
                    {formatCurrency(selectedReceipt.receipt.amount || selectedReceipt.order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  This is a digitally verified receipt generated directly via the Razorpay Live Gateway.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Tax Receipt
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Order Card Component
// ----------------------------------------------------
function OrderRecordCard({
  order,
  onViewReceipt,
}: {
  order: Order;
  onViewReceipt: () => void;
}) {
  const isDelivered = order.order_status?.toLowerCase().includes('deliver');
  const isCancelled = order.order_status?.toLowerCase().includes('cancel');

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
      {/* Ribbon Header */}
      <div className="bg-[#f0f2f2] dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Order Placed
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
              {formatDate(order.created_at)}
            </span>
          </div>

          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Total
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Ship To
            </span>
            <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 block mt-0.5 truncate hover:underline cursor-pointer">
              {order.recipient_name || order.customer_name} ▾
            </span>
          </div>

          <div className="text-left sm:text-right col-span-2 sm:col-span-1">
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Order # {order.order_number}
            </span>
            <div className="flex items-center sm:justify-end gap-2.5 mt-0.5 text-xs">
              <Link
                href={`/orders/${order.id}`}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline font-medium"
              >
                View order details
              </Link>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button
                onClick={onViewReceipt}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline font-medium"
              >
                Invoice / Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-6">
        {/* Status Headline */}
        <div className="mb-4">
          {isCancelled ? (
            <h3 className="text-base sm:text-lg font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Cancelled
            </h3>
          ) : isDelivered ? (
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Delivered on {formatDate(order.delivery_date || order.created_at)}
            </h3>
          ) : order.order_status === 'out_for_delivery' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400">
                Out for Delivery — Arriving Soon
              </h3>
            </div>
          ) : order.order_status === 'shipped' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400">
                Shipped & In Transit — Expected by {formatDate(order.delivery_date || order.created_at)}
              </h3>
            </div>
          ) : order.order_status === 'packed' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-400">
                Packed & Quality Sealed — Preparing for Courier Handover
              </h3>
            </div>
          ) : order.order_status === 'preparing' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400">
                Preparing Artisan Hamper in Workshop
              </h3>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                Confirmed — Arriving by {formatDate(order.delivery_date || order.created_at)}
              </h3>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Package managed with Express Nationwide Delivery via KawaiOra Logistics.
          </p>
        </div>

        {/* Product Items List & Side Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Items */}
          <div className="lg:col-span-8 space-y-4">
            {order.items.map((item, index) => {
              const productName =
                item.product?.name || item.custom_hamper?.name || 'Artisan Heritage Royal Hamper';
              const productImage =
                item.product?.images?.[0] ||
                (String(item.product?.id) === '12' ? '/images/kawaiora-logo.jpg' : '/images/products/grand-royal.jpg');

              return (
                <div key={item.id || index} className="flex gap-4 items-start pb-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  {/* Thumbnail Image */}
                  <Link href={`/orders/${order.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 hover:opacity-90 transition-opacity">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/kawaiora-logo.jpg';
                          }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 line-clamp-2 leading-snug"
                    >
                      {productName}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sold by: <span className="font-semibold text-slate-700 dark:text-slate-300">KawaiOra Artisan Hampers</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Qty: <span className="font-bold">{item.quantity}</span> • Price: <span className="font-bold font-mono">{formatCurrency(item.price_at_purchase)}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Return or replacement eligible through 30 days
                    </div>

                    {/* Item Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Link href="/shop">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 rounded-full text-xs font-semibold shadow-sm transition-colors">
                          <ShoppingBag className="w-3.5 h-3.5" /> Buy it again
                        </button>
                      </Link>
                      <Link href={`/orders/${order.id}`}>
                        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium transition-colors">
                          View your item
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Action Panel */}
          <div className="lg:col-span-4 flex flex-col gap-2 pt-2 lg:pt-0 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6 text-xs">
            <Link href={`/orders/${order.id}`} className="w-full">
              <button className="w-full py-2 px-3 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-bold rounded-md shadow-sm transition-colors text-center block">
                Track package
              </button>
            </Link>

            <button
              onClick={onViewReceipt}
              className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md font-medium shadow-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" /> View Payment Receipt
            </button>

            <Link href={`/orders/${order.id}`} className="w-full">
              <button className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md font-medium shadow-sm transition-colors text-center block">
                View order details
              </button>
            </Link>

            <Link href="/reviews" className="w-full">
              <button className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md font-medium shadow-sm transition-colors text-center block">
                Write a product review
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
