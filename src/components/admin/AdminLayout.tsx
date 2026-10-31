'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, TicketPercent, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, Sparkles, Building2, Crown, Palette, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useBrand } from '@/hooks/useBrand';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/spooky-builder', label: '🎃 Spooky Builder', icon: Sparkles },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/cancellation-tickets', label: 'Cancellation Tickets', icon: ShieldAlert },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/corporate', label: 'Corporate Leads', icon: Building2 },
  { href: '/admin/brand', label: 'Brand Identity', icon: Crown },
  { href: '/admin/images', label: 'Website Images', icon: ImageIcon },
  { href: '/admin/homepage-editor', label: 'Homepage Editor', icon: Palette },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: TicketPercent },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { brand } = useBrand();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          const role = data.data?.role || data.user?.role;
          if (!data.success || role !== 'admin') {
            router.push('/');
          }
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/login';
    }
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getPageTitle = () => {
    if (pathname === '/admin/settings') return 'Settings';
    const current = NAV_ITEMS.find(item => isItemActive(item.href));
    return current?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex w-full max-w-full overflow-x-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0', collapsed && 'justify-center')}>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-10 px-2 py-0.5 bg-black rounded-lg border border-slate-900 flex items-center justify-center shadow">
              <img
                src={brand.logo_url || '/images/kawaiora-logo.png'}
                alt={brand.brand_short_name || 'KawaiOra'}
                className="h-7 w-auto object-contain"
              />
            </div>
            {!collapsed && (
              <span className="font-bold text-xs uppercase tracking-wider text-amber-500">
                {brand.brand_short_name || 'Admin'}
              </span>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain" role="navigation" aria-label="Admin navigation">
          {NAV_ITEMS.map(item => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-amber-600 dark:text-amber-400')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Fixed Area: Settings & Logout (permanently anchored at left bottom) */}
        <div className="flex-shrink-0 mt-auto p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
          <Link
            href="/admin/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              pathname === '/admin/settings'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className={cn('w-5 h-5 flex-shrink-0', pathname === '/admin/settings' && 'text-amber-600 dark:text-amber-400')} />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold cursor-pointer',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 min-w-0 w-full overflow-x-hidden flex flex-col transition-all duration-300',
        collapsed ? 'lg:ml-20' : 'lg:ml-64'
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" target="_blank">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  View Storefront
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 font-semibold"
                aria-label="Sign out of admin"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
