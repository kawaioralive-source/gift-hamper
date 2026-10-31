'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Package,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface CorporateInquiry {
  id: string | number;
  reference_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  quantity: number;
  budget_range: string;
  occasion: string;
  delivery_locations: string;
  customization_requirements?: string | null;
  expected_delivery_date?: string | null;
  status: 'new' | 'contacted' | 'proposal_sent' | 'confirmed' | 'closed';
  notes?: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'rose',
  contacted: 'amber',
  proposal_sent: 'blue',
  confirmed: 'emerald',
  closed: 'slate',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  proposal_sent: 'Proposal Sent',
  confirmed: 'Confirmed & Closed',
  closed: 'Archived',
};

export function AdminCorporateClient() {
  const [inquiries, setInquiries] = useState<CorporateInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<CorporateInquiry | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corporate');
      const data = await res.json();
      if (res.ok && data.success) {
        setInquiries(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load corporate inquiries');
      }
    } catch {
      toast.error('Network error loading inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (inquiryId: string | number, newStatus: string, notes?: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/corporate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inquiryId,
          status: newStatus,
          ...(notes !== undefined ? { notes } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Inquiry status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        setInquiries((prev) =>
          prev.map((it) =>
            it.id === inquiryId ? { ...it, status: newStatus as any, ...(notes !== undefined ? { notes } : {}) } : it
          )
        );
        if (selectedInquiry && selectedInquiry.id === inquiryId) {
          setSelectedInquiry((prev) =>
            prev ? { ...prev, status: newStatus as any, ...(notes !== undefined ? { notes } : {}) } : null
          );
        }
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.company_name.toLowerCase().includes(search.toLowerCase()) ||
      inq.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      inq.reference_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVolume = inquiries.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const newLeads = inquiries.filter((it) => it.status === 'new').length;
  const activeProposals = inquiries.filter((it) => it.status === 'proposal_sent' || it.status === 'contacted').length;
  const closedDeals = inquiries.filter((it) => it.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Corporate & Bulk Inquiries
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage bespoke corporate gifting requests, volume quotations, and enterprise bulk orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInquiries}
          leftIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
        >
          Refresh Leads
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Inquiries</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{newLeads}</p>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Discussion</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeProposals}</p>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Deals</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{closedDeals}</p>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Volume</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalVolume.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, contact person, email, or ref code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="new">New Leads</option>
              <option value="contacted">Contacted</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="confirmed">Confirmed Deals</option>
              <option value="closed">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inquiries Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading enterprise corporate inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Corporate Inquiries Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              New bulk inquiries submitted through the corporate portal will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Company & Contact</th>
                  <th className="py-3.5 px-4">Volume & Tier</th>
                  <th className="py-3.5 px-4">Occasion & Budget</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredInquiries.map((inq) => {
                  const tierDiscount =
                    inq.quantity >= 250 ? '20% Enterprise' : inq.quantity >= 100 ? '15% Volume' : inq.quantity >= 50 ? '10% Tier' : 'Bespoke';

                  return (
                    <tr key={inq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {inq.reference_code}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{inq.company_name}</p>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{inq.contact_person}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {inq.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {inq.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {inq.quantity} Hampers
                        </span>
                        <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          {tierDiscount} Discount
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{inq.occasion}</p>
                        <p className="text-[11px] text-slate-500">{inq.budget_range}</p>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateStatus(inq.id, e.target.value)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer shadow-sm"
                        >
                          <option value="new">🔴 New Lead</option>
                          <option value="contacted">🟡 Contacted</option>
                          <option value="proposal_sent">🔵 Proposal Sent</option>
                          <option value="confirmed">🟢 Confirmed Deal</option>
                          <option value="closed">⚪ Archived</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(inq.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setEditingNotes(inq.notes || '');
                          }}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Corporate Lead: ${selectedInquiry.reference_code}`}
          size="lg"
        >
          <div className="space-y-5 py-1 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedInquiry.company_name}
                </h3>
                <p className="text-slate-500">Contact: {selectedInquiry.contact_person}</p>
              </div>
              <Badge variant={STATUS_COLORS[selectedInquiry.status] as any} className="text-xs font-bold px-3 py-1">
                {STATUS_LABELS[selectedInquiry.status] || selectedInquiry.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contact Information</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">Email: <a href={`mailto:${selectedInquiry.email}`} className="text-amber-600 hover:underline">{selectedInquiry.email}</a></p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">Phone: <a href={`tel:${selectedInquiry.phone}`} className="text-amber-600 hover:underline">{selectedInquiry.phone}</a></p>
                <p className="text-slate-500">Delivery Scope: {selectedInquiry.delivery_locations}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Order Parameters</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">Quantity: <strong className="text-amber-600 font-bold">{selectedInquiry.quantity} Units</strong></p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">Target Budget: {selectedInquiry.budget_range}</p>
                <p className="text-slate-500">Target Delivery: {selectedInquiry.expected_delivery_date ? formatDate(selectedInquiry.expected_delivery_date) : 'Flexible Timeline'}</p>
              </div>
            </div>

            {selectedInquiry.customization_requirements && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block mb-1">
                  Customization & Branding Specifications
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.customization_requirements}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Internal Concierge Notes & Quotation Status
              </label>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                rows={3}
                placeholder="Log internal conversation, custom quotation sent amount, product combinations selected..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Update Lead:</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleUpdateStatus(selectedInquiry.id, e.target.value, editingNotes)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="new">🔴 New Lead</option>
                  <option value="contacted">🟡 Contacted</option>
                  <option value="proposal_sent">🔵 Proposal Sent</option>
                  <option value="confirmed">🟢 Confirmed Deal</option>
                  <option value="closed">⚪ Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={updatingStatus}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, selectedInquiry.status, editingNotes)}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
