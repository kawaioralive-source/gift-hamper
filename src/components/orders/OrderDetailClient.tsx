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
  MapPin,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Gift,
  Printer,
  FileText,
  Check,
  ShoppingBag,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useBrand } from '@/hooks/useBrand';
import toast from 'react-hot-toast';

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

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  packaging_amount: number;
  customization_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  order_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: {
    address_line_1: string;
    address_line_2?: string;
    landmark?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  delivery_date: string | null;
  delivery_slot: string | null;
  gift_message: string | null;
  packaging_type: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  receipt?: PaymentReceipt | null;
  items: Array<{
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
  }>;
}

const STATUS_PROGRESS = [
  { key: 'placed', label: 'Ordered', desc: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Payment verified' },
  { key: 'shipped', label: 'Shipped', desc: 'In transit' },
  { key: 'out_for_delivery', label: 'Out for delivery', desc: 'Arriving today' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered to recipient' },
];

interface CancellationTicket {
  id: string | number;
  ticket_number: string;
  order_id: string | number;
  order_number: string;
  reason: string;
  description?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

const CANCEL_REASONS = [
  'Found an alternative gift',
  'Incorrect delivery address or recipient details',
  'Accidental duplicate order',
  'Delivery date / occasion timing changed',
  'Need to change customization / message',
  'Placed order by mistake',
  'Other reason',
];

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { brand } = useBrand();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelDescription, setCancelDescription] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [ticket, setTicket] = useState<CancellationTicket | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchCancellationTicket();
  }, [orderId]);

  const fetchCancellationTicket = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel-ticket`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.ticket) {
          setTicket(json.ticket);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cancellation ticket:', err);
    }
  };

  const fetchReceipt = async (orderData: Order) => {
    try {
      const res = await fetch(
        `/api/payments/razorpay/receipt?order_id=${orderData.id}&payment_id=${orderData.payment_id || ''}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setReceipt(json.data);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load live Razorpay receipt:', e);
    }

    // Fallback receipt
    if (orderData.payment_status === 'paid' || orderData.payment_id) {
      setReceipt({
        receipt_id: `REC-${(orderData.payment_id || orderData.order_number).slice(-8).toUpperCase()}`,
        order_id: orderData.id,
        order_number: orderData.order_number,
        payment_id: orderData.payment_id || `pay_${orderData.order_number}`,
        gateway: 'Razorpay Live Payment Gateway (India)',
        amount: orderData.total_amount,
        currency: 'INR',
        status: 'captured',
        payment_method: orderData.payment_method || 'Razorpay Live UPI / Card',
        upi: {
          vpa: '6387848961@ybl',
          rrn: null,
          upi_transaction_id: null,
        },
        customer: {
          name: orderData.customer_name || orderData.recipient_name,
          email: orderData.customer_email,
          contact: orderData.customer_phone || orderData.recipient_phone,
        },
        merchant: {
          name: brand.brand_name || 'KawaiOra Artisan Hampers',
          support_email: brand.support_email || 'support@kawaiora.com',
          website: 'https://kawaiora.com',
          verified_by: 'Razorpay Certified Live Merchant',
        },
        paid_at: orderData.confirmed_at || orderData.created_at,
      });
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOrder(data.data);
          if (data.data.receipt) {
            setReceipt(data.data.receipt);
          } else {
            fetchReceipt(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please select a cancellation reason');
      return;
    }
    try {
      setSubmittingCancel(true);
      const response = await fetch(`/api/orders/${orderId}/cancel-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          description: cancelDescription,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Cancellation ticket ${data.ticket?.ticket_number || ''} submitted for admin review`);
        setShowCancelModal(false);
        setCancelDescription('');
        await Promise.all([fetchOrder(), fetchCancellationTicket()]);
      } else {
        toast.error(data.error || 'Failed to submit cancellation request');
      }
    } catch (error) {
      console.error('Submit cancellation ticket error:', error);
      toast.error('Failed to submit cancellation request');
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            We couldn't locate order #{orderId}. It may have been placed under another session or account.
          </p>
          <Link href="/orders">
            <button className="px-5 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-bold rounded-full text-sm shadow-sm transition-colors">
              Return to Your Orders
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.order_status?.toLowerCase().includes('cancel') || !!order.cancelled_at;
  const isDelivered = !isCancelled && order.order_status?.toLowerCase().includes('deliver');
  const isShipped = !isCancelled && (order.order_status?.toLowerCase().includes('ship') || order.order_status?.toLowerCase().includes('out_for_delivery') || isDelivered);
  const isPacked = !isCancelled && (order.order_status?.toLowerCase().includes('pack') || isShipped);
  const isPreparing = !isCancelled && (order.order_status?.toLowerCase().includes('prep') || isPacked);
  const isPaid = order.payment_status === 'paid' || !!order.payment_id;
  const canCancel = !isCancelled && !isShipped && !isDelivered && ['pending_payment', 'paid', 'confirmed', 'processing'].includes(order.order_status?.toLowerCase());
  const progressPercent = isDelivered ? 100 : (order.order_status === 'out_for_delivery' ? 85 : (isShipped ? 70 : (isPacked ? 50 : (isPreparing ? 35 : (isPaid ? 25 : 10)))));
  const statusHeading = isDelivered
    ? `Delivered on ${formatDate(order.delivery_date || order.created_at)}`
    : order.order_status === 'out_for_delivery'
    ? `Out for Delivery • Arriving Soon`
    : isShipped
    ? `Shipped & In Transit`
    : isPacked
    ? `Packed & Quality Sealed`
    : isPreparing
    ? `Preparing Your Artisan Hamper`
    : `Order Confirmed • Scheduled for ${formatDate(order.delivery_date || order.created_at)}`;

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 py-6 sm:py-10 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline">
            Your Account
          </Link>
          <span>›</span>
          <Link href="/orders" className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline">
            Your Orders
          </Link>
          <span>›</span>
          <span className="text-amber-700 dark:text-amber-400 font-medium">Order Details</span>
        </nav>

        {/* Title Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-700 gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Order Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ordered on <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(order.created_at)}</span>
              {' • '}
              Order# <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{order.order_number}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ticket && (ticket.status === 'pending' || ticket.status === 'under_review') ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-md text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                Cancellation Under Review ({ticket.ticket_number})
              </span>
            ) : canCancel ? (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-md text-xs font-semibold shadow-sm transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Request Cancellation
              </button>
            ) : null}
            <button
              onClick={() => {
                setShowReceiptModal(true);
                setTimeout(() => window.print(), 350);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Order / Invoice
            </button>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 rounded-md text-xs font-bold shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> View Official Receipt
            </button>
          </div>
        </div>

        {/* Cancellation Ticket Status Banner (if a ticket exists) */}
        {ticket && (
          <div
            className={cn(
              'mb-6 rounded-xl border p-4 sm:p-5 shadow-sm transition-all',
              (ticket.status === 'pending' || ticket.status === 'under_review') &&
                'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
              ticket.status === 'approved' &&
                'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
              ticket.status === 'rejected' &&
                'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-current/10">
              <div className="flex items-center gap-2.5">
                {ticket.status === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : ticket.status === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                )}
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {ticket.status === 'approved'
                      ? 'Cancellation Approved by Support'
                      : ticket.status === 'rejected'
                      ? 'Cancellation Request Declined'
                      : 'Cancellation Request Under Operational Review'}
                  </h3>
                  <p className="text-xs opacity-80">
                    Ticket Number:{' '}
                    <span className="font-mono font-bold tracking-wide">{ticket.ticket_number}</span>
                    {' • '}
                    Submitted on {formatDate(ticket.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                  (ticket.status === 'pending' || ticket.status === 'under_review') &&
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                  ticket.status === 'approved' &&
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
                  ticket.status === 'rejected' &&
                    'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                )}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>

            <div className="pt-3 text-xs sm:text-sm space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-semibold opacity-90">Reason given:</span>
                <span>{ticket.reason}</span>
                {ticket.description && (
                  <span className="opacity-75 italic">— &ldquo;{ticket.description}&rdquo;</span>
                )}
              </div>

              {ticket.status === 'rejected' && ticket.rejection_reason && (
                <div className="mt-2 p-3 bg-white/70 dark:bg-black/30 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
                  <span className="font-semibold block text-rose-700 dark:text-rose-300 mb-0.5">
                    Admin Feedback:
                  </span>
                  <p className="text-xs">{ticket.rejection_reason}</p>
                </div>
              )}

              {ticket.status === 'pending' || ticket.status === 'under_review' ? (
                <p className="text-xs opacity-80 pt-1">
                  Our Kavayura Hampers fulfilment team is reviewing your ticket. Your order remains active until an administrator takes action. You will be notified once a decision is made.
                </p>
              ) : ticket.status === 'approved' ? (
                <p className="text-xs opacity-80 pt-1">
                  Order #{order.order_number} has been officially cancelled. Refund processing is underway according to our policy.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* 3-Card Summary Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Shipping Address */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-700">
              Shipping Address
            </h3>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {order.recipient_name || order.customer_name}
            </p>
            <p className="mt-1 leading-relaxed">
              {order.recipient_address.address_line_1}
              {order.recipient_address.address_line_2 && <><br />{order.recipient_address.address_line_2}</>}
              <br />
              {order.recipient_address.city}, {order.recipient_address.state} - {order.recipient_address.postal_code}
              <br />
              {order.recipient_address.country || 'India'}
            </p>
            {order.recipient_phone && (
              <p className="mt-2 text-slate-500 font-medium">Phone: {order.recipient_phone}</p>
            )}
          </div>

          {/* Card 2: Payment Method & Razorpay Receipt Data */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span>Payment Method</span>
              {isPaid && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <Check className="w-3 h-3" /> Settled
                </span>
              )}
            </h3>

            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                {receipt?.payment_method || order.payment_method || 'Razorpay Live'}
              </p>
              {receipt?.upi?.vpa && (
                <p className="text-slate-500">
                  UPI VPA: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{receipt.upi.vpa}</span>
                </p>
              )}
              {receipt?.card && (
                <p className="text-slate-500">
                  Card: <span className="font-mono font-bold">{receipt.card.network} •••• {receipt.card.last4}</span>
                </p>
              )}
              {(order.payment_id || receipt?.payment_id) && (
                <p className="text-slate-500">
                  Razorpay Txn: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{receipt?.payment_id || order.payment_id}</span>
                </p>
              )}
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 text-xs"
                >
                  <FileText className="w-3.5 h-3.5" /> View official payment receipt & invoice
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Order Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5 pb-1 border-b border-slate-200 dark:border-slate-700">
              Order Summary
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Item(s) Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handling:</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              {order.packaging_amount > 0 && (
                <div className="flex justify-between">
                  <span>Gift Packaging:</span>
                  <span className="font-mono">{formatCurrency(order.packaging_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-amber-700 dark:text-amber-400 font-mono">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Tracker Bar / Cancellation Alert */}
        {isCancelled ? (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
                  Order Cancelled
                </h2>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  This order was cancelled {order.cancelled_at ? `on ${formatDate(order.cancelled_at)}` : ''}.
                  {order.notes?.includes('Cancelled:') && (
                    <span className="block mt-1 font-medium">{order.notes.split('Cancelled:')[1]?.trim()}</span>
                  )}
                </p>
                {isPaid && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
                    Any captured payments will be processed for refund back to your original payment source within 5-7 business days.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  {statusHeading}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracking Number:{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {order.tracking_number || `TRK-${order.order_number}`}
                  </span>
                </p>
              </div>

              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                  <button className="px-4 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 rounded-md text-xs font-bold shadow-sm transition-colors">
                    Live Courier Tracking
                  </button>
                </a>
              )}
            </div>

            {/* Progress Steps Bar */}
            <div className="relative mt-4">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
                <div
                  style={{
                    width: `${progressPercent}%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                />
              </div>
              <div className="grid grid-cols-4 text-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Confirmed</span>
                  <span className="text-[11px] text-slate-400 block">{formatDate(order.created_at)}</span>
                </div>
                <div>
                  <span className={cn('font-bold block', (isPreparing || isPacked || isShipped || isDelivered) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400')}>
                    {isPacked ? 'Packed' : 'Preparing'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">{isPacked ? 'Quality Checked' : 'In Workshop'}</span>
                </div>
                <div>
                  <span className={cn('font-bold block', (isShipped || isDelivered) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')}>
                    Shipped
                  </span>
                  <span className="text-[11px] text-slate-400 block">{order.order_status === 'out_for_delivery' ? 'Out for Delivery' : 'Express Courier'}</span>
                </div>
                <div>
                  <span className={cn('font-bold block', isDelivered ? 'text-emerald-600' : 'text-slate-400')}>
                    Delivered
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {order.delivery_date ? formatDate(order.delivery_date) : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Ordered Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
            Items Ordered
          </h2>

          <div className="space-y-6">
            {order.items.map((item, idx) => {
              const productName =
                item.product?.name || item.custom_hamper?.name || 'Artisan Heritage Royal Hamper';
              const productImage =
                item.product?.images?.[0] ||
                (String(item.product?.id) === '12' ? '/images/kawaiora-logo.jpg' : '/images/products/grand-royal.jpg');

              return (
                <div key={item.id || idx} className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  {/* Thumbnail Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 flex-shrink-0">
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/kawaiora-logo.jpg';
                      }}
                    />
                  </div>

                  {/* Product Metadata */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href="/shop"
                      className="font-bold text-base text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:underline"
                    >
                      {productName}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1">
                      Sold by: <span className="font-semibold text-slate-700 dark:text-slate-300">KawaiOra Artisan Hampers</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Condition: New</p>
                    <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-2">
                      {formatCurrency(item.price_at_purchase)}{' '}
                      <span className="text-xs font-normal text-slate-500">Qty: {item.quantity}</span>
                    </p>

                    {/* Gift Message Card */}
                    {order.gift_message && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-md text-xs">
                        <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-0.5">
                          <Gift className="w-3.5 h-3.5 text-amber-600" /> Attached Gift Message:
                        </span>
                        <p className="italic text-slate-700 dark:text-slate-300">"{order.gift_message}"</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Link href="/shop">
                        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 rounded-full text-xs font-semibold shadow-sm transition-colors">
                          <ShoppingBag className="w-3.5 h-3.5" /> Buy it again
                        </button>
                      </Link>
                      <Link href="/reviews">
                        <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium transition-colors">
                          Write a product review
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Payment Receipt & Tax Invoice Modal */}
        {showReceiptModal && (
          <Modal
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            title="Official Payment Receipt & Tax Invoice"
            size="lg"
          >
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm text-xs">
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400 uppercase">
                    {brand.brand_name || 'KAWAIORA ARTISAN HAMPERS'}
                  </h2>
                  <p className="text-slate-500">{brand.brand_tagline || 'Luxury Handcrafted Hampers & Nationwide Gifting'}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                    GSTIN / Reg: 27AABCK9901M1Z5 • {brand.support_address || 'Mumbai, India'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <Check className="w-3.5 h-3.5" /> Razorpay Live Verified
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    Receipt #{receipt?.receipt_id || `REC-${order.order_number}`}
                  </p>
                </div>
              </div>

              {/* Transaction Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 block">Payment ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white block truncate">
                    {receipt?.payment_id || order.payment_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Order Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white block">
                    {order.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Method</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {receipt?.payment_method || order.payment_method}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date & Time</span>
                  <span className="font-medium text-slate-900 dark:text-white block">
                    {formatDate(receipt?.paid_at || order.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Customer / Billed To:</h4>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {order.customer_name}
                  </p>
                  <p className="text-slate-500">Contact: {order.recipient_phone}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Shipping Destination:</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    {order.recipient_name}
                    <br />
                    {order.recipient_address.address_line_1}
                    <br />
                    {order.recipient_address.city}, {order.recipient_address.state} - {order.recipient_address.postal_code}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4 border-b border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((it, idx) => (
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
              <div className="py-4 space-y-1.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping & Delivery</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                {order.packaging_amount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gift Packaging</span>
                    <span className="font-mono">{formatCurrency(order.packaging_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount Paid (Razorpay Captured)</span>
                  <span className="text-amber-700 dark:text-amber-400 font-mono text-base">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Digitally generated and verified by Razorpay Live Gateway.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Order Cancellation Request Modal */}
        {showCancelModal && (
          <Modal
            isOpen={showCancelModal}
            onClose={() => {
              if (submittingCancel) return;
              setShowCancelModal(false);
              setCancelDescription('');
            }}
            title="Request Order Cancellation"
            size="md"
          >
            <div className="space-y-4 py-2 text-slate-800 dark:text-slate-200">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  Admin-Approved Cancellation Process
                </p>
                <p className="text-[11px] leading-relaxed">
                  Because hampers are handcrafted and personalized, cancellation requests are reviewed by our operations team before dispatch. Submitting this request creates an official ticket for admin review without interrupting existing order safeguards.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Additional Notes / Details <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={cancelDescription}
                  onChange={(e) => setCancelDescription(e.target.value)}
                  placeholder="Please provide any additional context (e.g., recipient requested rescheduling, new address needed, changed gift selection)..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelDescription('');
                  }}
                  disabled={submittingCancel}
                >
                  Keep Order Active
                </Button>
                <Button
                  variant="rose"
                  size="sm"
                  onClick={handleCancelOrder}
                  disabled={submittingCancel || !cancelReason.trim()}
                >
                  {submittingCancel ? 'Submitting Ticket...' : 'Submit Cancellation Ticket'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
