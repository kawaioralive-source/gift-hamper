'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Clock,
  Package,
  ShoppingBag,
  ExternalLink,
  X,
  MapPin,
  Receipt,
  Truck,
  Gift,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  last_login: string | null;
  _count?: {
    orders: number;
    total_spent: number;
  };
}

interface LifetimeOrder {
  id: string;
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  recipient_name: string;
  recipient_address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  delivery_date: string;
  delivery_time_slot: string;
  gift_message?: string;
  tracking_number?: string;
  items: Array<{
    id: string;
    name: string;
    slug?: string;
    quantity: number;
    price: number;
    total_price: number;
    image: string;
  }>;
  receipt?: {
    is_paid: boolean;
    receipt_number: string;
    payment_id: string;
    upi_vpa?: string | null;
  } | null;
}

export function AdminCustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sort: 'created_at.desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal / Drawer state for viewing customer lifetime orders
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerCustomer, setDrawerCustomer] = useState<any | null>(null);
  const [drawerOrders, setDrawerOrders] = useState<LifetimeOrder[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Deletion modal state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Customer ${customerToDelete.name || customerToDelete.email} has been deleted.`);
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        if (selectedCustomerId === customerToDelete.id) {
          handleCloseDrawer();
        }
        setCustomerToDelete(null);
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

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters, pagination.page]);

  const handleOpenCustomerDrawer = async (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setDrawerCustomer(customer);
    setDrawerOrders([]);
    setDrawerLoading(true);

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDrawerCustomer(json.data.customer);
          setDrawerOrders(json.data.orders || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch customer lifetime orders:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    setDrawerCustomer(null);
    setDrawerOrders([]);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const ROLE_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const SORT_OPTIONS = [
    { value: 'created_at.desc', label: 'Newest First' },
    { value: 'created_at.asc', label: 'Oldest First' },
    { value: 'name.asc', label: 'Name: A-Z' },
    { value: 'total_spent.desc', label: 'Spent: High to Low' },
  ];

  if (loading && customers.length === 0) {
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage patrons and view lifetime purchase histories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
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
              placeholder="Name, email, phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Select
              label="Role"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              options={ROLE_OPTIONS}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={STATUS_OPTIONS}
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

      {/* Customers Table */}
      <Card variant="elevated" padding="none">
        {loading && customers.length === 0 ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No customers found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Orders</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lifetime Spent</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joined</th>
                    <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customers.map(customer => (
                    <tr
                      key={customer.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                      onClick={() => handleOpenCustomerDrawer(customer)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                            {customer.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                              {customer.name}
                            </p>
                            <span className="text-xs text-slate-400">ID: #{customer.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{customer.email}</p>
                        {customer.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={customer.role === 'admin' ? 'primary' : 'amber'} className="text-xs capitalize">
                          {customer.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={customer.is_active ? 'success' : 'danger'} className="text-xs">
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <ShoppingBag className="w-4 h-4 text-amber-500" />
                          <span>{customer._count?.orders || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatCurrency(customer._count?.total_spent || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenCustomerDrawer(customer)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                          >
                            View
                          </Button>
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Open dedicated page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                          {customer.role !== 'admin' && customer.email !== 'admin@kawaiora.com' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCustomerToDelete(customer)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5"
                              title="Delete customer"
                              aria-label="Delete customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
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
          </>
        )}
      </Card>

      {/* Customer Lifetime Orders Slide-over Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-500/30">
                  {drawerCustomer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {drawerCustomer?.name || 'Customer Profile'}
                    </h3>
                    <Badge variant={drawerCustomer?.role === 'admin' ? 'primary' : 'amber'} className="text-xs">
                      {drawerCustomer?.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {drawerCustomer?.email} • {drawerCustomer?.phone || '+91 98201 45821'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {drawerCustomer?.role !== 'admin' && drawerCustomer?.email !== 'admin@kawaiora.com' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomerToDelete(drawerCustomer)}
                    className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950/40"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Customer
                  </Button>
                )}
                <Link href={`/admin/customers/${selectedCustomerId}`}>
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Full Page
                  </Button>
                </Link>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lifetime Summary KPI Cards */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Orders</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {drawerCustomer?.stats?.total_orders ?? drawerOrders.length}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Lifetime Spend</p>
                  <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrency(drawerCustomer?.stats?.total_spent ?? drawerOrders.reduce((s, o) => s + o.total_amount, 0))}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Order</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(drawerCustomer?.stats?.average_order_value ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  Lifetime Orders ({drawerOrders.length})
                </h4>
                <span className="text-xs text-slate-500">Full order & receipt details</span>
              </div>

              {drawerLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                  ))}
                </div>
              ) : drawerOrders.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">No lifetime orders yet</p>
                  <p className="text-xs text-slate-500 mt-1">This customer has not placed any orders yet.</p>
                </div>
              ) : (
                drawerOrders.map(order => (
                  <div
                    key={order.id || order.order_number}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    {/* Order header row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            #{order.order_number}
                          </span>
                          <Badge variant={order.order_status === 'delivered' ? 'success' : 'amber'} className="text-[11px] capitalize">
                            {order.order_status}
                          </Badge>
                          <Badge variant="success" className="text-[11px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            {order.payment_status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(order.created_at)} • via {order.payment_method}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Order items list */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Items Purchased</p>
                      {order.items.map((it, idx) => (
                        <div
                          key={it.id || idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                            <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-slate-900 dark:text-white truncate">
                              {it.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Qty: <strong>{it.quantity}</strong> × {formatCurrency(it.price)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatCurrency(it.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Payment Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          Destination:
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{order.recipient_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {order.recipient_address?.address_line_1}, {order.recipient_address?.city} ({order.recipient_address?.postal_code})
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                          <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                          Razorpay Live Receipt:
                        </p>
                        {order.receipt ? (
                          <>
                            <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {order.receipt.receipt_number}
                            </p>
                            <p className="text-[11px] text-emerald-600 font-medium truncate">
                              ✓ Verified: {order.receipt.payment_id}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-500">Method: {order.payment_method}</p>
                        )}
                      </div>
                    </div>

                    {order.gift_message && (
                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                        <p className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          Gift Note:
                        </p>
                        <p className="italic text-slate-700 dark:text-slate-300">"{order.gift_message}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <span className="text-xs text-slate-500">Patron record #{drawerCustomer?.id}</span>
              <Button variant="outline" size="sm" onClick={handleCloseDrawer}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={!!customerToDelete}
        onClose={() => !deleting && setCustomerToDelete(null)}
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
              <strong className="font-bold underline">{customerToDelete?.name}</strong> (
              {customerToDelete?.email})?
            </p>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400">
              This action will remove the user profile, all associated addresses, wishlists, shopping carts, and customer history. This action cannot be reversed.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setCustomerToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="rose"
              onClick={handleConfirmDelete}
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
