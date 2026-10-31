'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface TicketItem {
  id: number | string;
  ticket_number: string;
  order_id: number | string;
  order_number: string;
  reason: string;
  description?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes?: string | null;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  resolved_at?: string | null;
  order?: {
    id: number | string;
    order_number: string;
    total_amount: number;
    order_status: string;
    payment_status: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    created_at: string;
    items?: Array<{
      id: string;
      quantity: number;
      price_at_purchase: number;
      total_price: number;
      product?: {
        name: string;
      } | null;
    }>;
  };
}

interface Counts {
  all: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export function AdminCancellationTicketsClient() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [counts, setCounts] = useState<Counts>({
    all: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal inspection & action states
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'review' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/cancellation-tickets?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTickets(json.tickets || []);
          if (json.counts) {
            setCounts(json.counts);
          }
        }
      } else {
        toast.error('Failed to load cancellation tickets');
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleApprove = async () => {
    if (!selectedTicket) return;
    try {
      setProcessingAction(true);
      const res = await fetch(`/api/admin/cancellation-tickets/${selectedTicket.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket ${selectedTicket.ticket_number} approved. Order cancelled & inventory restored.`);
        setSelectedTicket(null);
        setActionType(null);
        setAdminNote('');
        fetchTickets();
      } else {
        toast.error(data.error || 'Failed to approve ticket');
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Failed to approve ticket');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory to explain why the order cannot be cancelled.');
      return;
    }
    try {
      setProcessingAction(true);
      const res = await fetch(`/api/admin/cancellation-tickets/${selectedTicket.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket ${selectedTicket.ticket_number} rejected. Order remains active.`);
        setSelectedTicket(null);
        setActionType(null);
        setRejectionReason('');
        setAdminNote('');
        fetchTickets();
      } else {
        toast.error(data.error || 'Failed to reject ticket');
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Failed to reject ticket');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Cancellation Tickets
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review customer cancellation requests. Orders and inventory are only modified when you explicitly approve.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets()}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Orders →
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            All
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/30'
            )}
          >
            Pending Review
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px]',
              statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-200/70 text-amber-900'
            )}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30'
            )}
          >
            Approved
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px]',
              statusFilter === 'approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/70 text-emerald-900'
            )}>
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950/30'
            )}
          >
            Rejected
            <span className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px]',
              statusFilter === 'rejected' ? 'bg-rose-700 text-white' : 'bg-rose-200/70 text-rose-900'
            )}>
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket, order#, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading cancellation tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              No cancellation tickets found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter !== 'all'
                ? `No requests matching status "${statusFilter}".`
                : 'All orders are operating normally with no active cancellation requests.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {t.ticket_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {t.order_number}
                        </span>
                        <Link
                          href={`/admin/orders`}
                          title="View order in Admin"
                          className="text-slate-400 hover:text-amber-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      {t.order?.total_amount && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatCurrency(t.order.total_amount)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {t.order?.customer_name || 'Customer'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t.order?.customer_email || '—'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {t.reason}
                      </p>
                      {t.description && (
                        <p className="text-[11px] text-slate-500 truncate" title={t.description}>
                          {t.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                          t.status === 'pending' &&
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
                          t.status === 'under_review' &&
                            'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
                          t.status === 'approved' &&
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
                          t.status === 'rejected' &&
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        )}
                      >
                        {t.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                        {t.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {t.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(t.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={t.status === 'pending' ? 'rose' : 'outline'}
                        onClick={() => {
                          setSelectedTicket(t);
                          setActionType(null);
                        }}
                        className="text-xs h-7 px-2.5 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        {t.status === 'pending' ? 'Review & Decide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Action Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => {
            if (processingAction) return;
            setSelectedTicket(null);
            setActionType(null);
            setRejectionReason('');
            setAdminNote('');
          }}
          title={`Cancellation Ticket: ${selectedTicket.ticket_number}`}
          size="lg"
        >
          <div className="space-y-5 text-slate-800 dark:text-slate-200 text-xs">
            {/* Top Status & Order Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Status</span>
                <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Order Number</span>
                <span className="font-mono font-bold">{selectedTicket.order_number}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Current Order Status</span>
                <span className="font-medium capitalize">
                  {selectedTicket.order?.order_status || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Order Value</span>
                <span className="font-mono font-bold text-amber-600">
                  {selectedTicket.order?.total_amount ? formatCurrency(selectedTicket.order.total_amount) : '—'}
                </span>
              </div>
            </div>

            {/* Customer Reason Details */}
            <div className="space-y-1.5 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <span className="font-bold text-amber-900 dark:text-amber-300 block">
                Customer Reason:
              </span>
              <p className="font-medium text-slate-900 dark:text-white">
                {selectedTicket.reason}
              </p>
              {selectedTicket.description && (
                <p className="text-slate-600 dark:text-slate-300 italic pt-1">
                  &ldquo;{selectedTicket.description}&rdquo;
                </p>
              )}
            </div>

            {/* Customer & Shipping info */}
            {selectedTicket.order && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                    Customer Information
                  </span>
                  <p>{selectedTicket.order.customer_name}</p>
                  <p>{selectedTicket.order.customer_email}</p>
                  <p>{selectedTicket.order.customer_phone || ''}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                    Payment Status
                  </span>
                  <p className="capitalize font-mono font-medium text-emerald-600">
                    {selectedTicket.order.payment_status}
                  </p>
                </div>
              </div>
            )}

            {/* Prior Admin Notes or Rejection Reason if any */}
            {selectedTicket.rejection_reason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 text-rose-900 dark:text-rose-200">
                <span className="font-bold block mb-1">Rejection Reason Provided to Customer:</span>
                <p>{selectedTicket.rejection_reason}</p>
              </div>
            )}

            {selectedTicket.admin_notes && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                <span className="font-bold block mb-1">Internal Admin Notes:</span>
                <p>{selectedTicket.admin_notes}</p>
              </div>
            )}

            {/* Action Form (Only shown if pending/under_review or if choosing action) */}
            {(selectedTicket.status === 'pending' || selectedTicket.status === 'under_review') && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Administrator Decision
                </h4>

                {actionType === 'approve' ? (
                  <div className="space-y-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-xs">
                      ⚠️ Approving this cancellation ticket will:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-emerald-800 dark:text-emerald-300/80 space-y-0.5">
                      <li>Mark the order as officially cancelled</li>
                      <li>Safely increment product stock in the database back to inventory</li>
                      <li>Allow your accounts team to issue a refund</li>
                    </ul>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Optional Internal Notes:
                      </label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="e.g. Approved per customer call before dispatch"
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionType(null)}
                        disabled={processingAction}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="emerald"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleApprove}
                        disabled={processingAction}
                      >
                        {processingAction ? 'Approving...' : 'Confirm Approval & Cancel Order'}
                      </Button>
                    </div>
                  </div>
                ) : actionType === 'reject' ? (
                  <div className="space-y-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 dark:text-rose-300 text-xs">
                      Reject Cancellation Request:
                    </p>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300/80">
                      The order and inventory will remain unchanged. The customer will see your explanation on their order details screen.
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Reason for Rejection <span className="text-rose-500">*</span>:
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Order is already packed and dispatched with courier tracking. Cannot be cancelled at this stage."
                        className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionType(null)}
                        disabled={processingAction}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="rose"
                        onClick={handleReject}
                        disabled={processingAction || !rejectionReason.trim()}
                      >
                        {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => setActionType('reject')}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject Cancellation
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setActionType('approve')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve & Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
