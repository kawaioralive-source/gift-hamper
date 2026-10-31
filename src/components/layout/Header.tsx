'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  User,
  Sparkles,
  WandSparkles,
  ChevronDown,
  LogOut,
  Gift,
  Truck,
  MessageCircle,
  Package,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useBrand } from '@/hooks/useBrand';

const NAV_ITEMS = [
  { href: '/shop', label: 'All Hampers' },
  { href: '/occasions', label: 'Occasions' },
  { href: '/categories', label: 'Collections' },
  { href: '/corporate', label: 'Corporate Gifting' },
];

const POPULAR_SEARCH_TAGS = [
  '🎃 Halloween Hampers',
  '🍫 Belgian Truffles',
  '🍂 Autumn Harvest',
  '🕯️ Gothic Luxe',
  'Corporate Crates',
];

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  compare_at_price?: number;
  image: string;
  category: { name: string } | string;
  tag?: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation & Drawer states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activePromo, setActivePromo] = useState<{ code: string; percentage: number; description?: string } | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const { cart, openCartDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { brand } = useBrand();

  // Scroll detection for header backdrop styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check announcement bar dismissed state
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = sessionStorage.getItem('kav_promo_dismissed');
        if (dismissed === 'true') {
          setAnnouncementDismissed(true);
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Fetch promo discount
  useEffect(() => {
    setMounted(true);
    async function fetchPromo() {
      try {
        const res = await fetch('/api/discounts');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.activePromo) {
            setActivePromo(data.activePromo);
          }
        }
      } catch (e) {
        console.error('Failed to fetch promo', e);
      }
    }
    fetchPromo();
  }, []);

  // Cart & wishlist counts
  const cartCount = mounted
    ? (cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? cart?.count ?? 0)
    : 0;
  const wishlistCount = mounted
    ? (wishlist?.items?.length ?? wishlist?.count ?? 0)
    : 0;

  // User auth state
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
    const handleAuthChange = () => fetchUser();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/login';
  };

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setUserMenuOpen(false);
    setIsSearchFocused(false);
  }, [pathname]);

  // Click outside search popover to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live product search debouncer
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setSearchResults(data.data.slice(0, 5));
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectProduct = (slug: string) => {
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    router.push(`/products/${slug}`);
  };

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try {
      sessionStorage.setItem('kav_promo_dismissed', 'true');
    } catch {}
  };

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl border-b transition-all duration-200 pt-[env(safe-area-inset-top,0px)]',
        isScrolled
          ? 'border-orange-500/30 shadow-lg shadow-orange-950/20'
          : 'border-orange-500/15 shadow-none'
      )}
    >
      {/* 1. TOP PROMOTIONAL ANNOUNCEMENT BAR (Continuous Loop Marquee Moving Right) */}
      {!announcementDismissed && (
        <div className="relative bg-gradient-to-r from-purple-950 via-slate-900 via-orange-950 to-purple-950 border-b border-orange-500/20 text-white text-[11px] sm:text-xs py-2 px-2 font-medium tracking-wide shadow-inner overflow-hidden">
          <div className="w-full mx-auto flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden min-w-0">
              {/* @ts-ignore */}
              <marquee
                direction="right"
                scrollamount="6"
                behavior="scroll"
                loop="-1"
                className="w-full flex items-center gap-6 font-semibold tracking-wide cursor-default"
              >
                <span className="inline-flex items-center gap-6">
                  <span>
                    🎃 <strong>HALLOWEEN SPOOKTACULAR SALE</strong> • Limited Edition <strong>Kawaiora Hampers</strong> • Use Code:{' '}
                    <strong className="text-orange-300 font-bold tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded border border-orange-400/30">
                      SPOOKY20
                    </strong>{' '}
                    (20% Off) 🦇
                  </span>
                  <span>✨ 100% Handcrafted Luxury Keepsake Boxes & Satin Ribbons</span>
                  <span>🚚 Pan-India Express Delivery With Live Tracking</span>
                  <span>📜 Free Textured Handwritten Greeting Card in Wax-Sealed Envelope</span>
                  <span>
                    🎃 Welcome to <strong>Kawaiora Hampers</strong> • Use Code:{' '}
                    <strong className="text-orange-300 font-bold tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded border border-orange-400/30">
                      WELCOME10
                    </strong>{' '}
                    (10% Off) 🎁
                  </span>
                </span>
              {/* @ts-ignore */}
              </marquee>
            </div>
            <button
              onClick={handleDismissAnnouncement}
              className="text-white/70 hover:text-white p-1 rounded-full transition shrink-0 ml-2"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVIGATION BAR */}
      <nav className="w-full px-4 sm:px-6 lg:px-8 xl:px-12" aria-label="Main navigation">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-3 lg:gap-6">
          
          {/* Left: Mobile Menu Hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-200 hover:bg-slate-800 transition"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center shrink-0 group"
              aria-label={`${brand.brand_short_name || 'Kawaiora Hampers'} Home`}
            >
              <div className="h-12 sm:h-14 px-2.5 sm:px-3 py-1 bg-black rounded-xl sm:rounded-2xl border border-orange-500/30 flex items-center justify-center shadow-lg transition group-hover:scale-105 group-hover:border-orange-500/60 shadow-glow-halloween/20">
                <img
                  src={brand.logo_url || '/images/kawaiora-logo.png'}
                  alt={brand.brand_name || 'Kawaiora Hampers'}
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-semibold transition-colors relative py-1',
                  isActive(item.href)
                    ? 'text-orange-400'
                    : 'text-slate-200 hover:text-orange-400'
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-glow-halloween" />
                )}
              </Link>
            ))}

            {/* Custom Builder Pill */}
            <Link
              href="/customize/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-orange-500/20 border border-orange-500/40 text-xs font-bold text-orange-300 hover:bg-orange-500/30 transition shrink-0 shadow-sm"
            >
              <WandSparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>🎃 Spooky Builder</span>
            </Link>
          </div>

          {/* Center-Right: Desktop Search Bar with Live Popover Autocomplete */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xs xl:max-w-sm relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search luxury hampers, chocolates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-900 border border-orange-500/30 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-slate-100 placeholder:text-slate-400 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Desktop Live Autocomplete Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {searchQuery.trim().length === 0 ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                      Popular Searches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                            router.push(`/shop?search=${encodeURIComponent(tag)}`);
                            setIsSearchFocused(false);
                          }}
                          className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 transition"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isSearching ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Searching hampers...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      Matching Hampers
                    </p>
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product.slug)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition text-left group"
                      >
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              {formatCurrency(product.price)}
                            </span>
                            {(product.original_price || product.compare_at_price) && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatCurrency(product.original_price || product.compare_at_price!)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-1.5 text-center text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        View all results for &quot;{searchQuery}&quot; →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No hampers found matching &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 150);
              }}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 transition"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2.5 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition shadow-glow-purple/20"
              aria-label={`Wishlist (${wishlistCount})`}
            >
              <Heart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                {wishlistCount}
              </span>
            </Link>

            {/* Cart Icon (Opens Slide-out Cart Drawer) */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 rounded-xl bg-slate-900 border border-orange-500/30 hover:border-orange-400 text-slate-200 transition flex items-center justify-center group shadow-glow-halloween/20"
              aria-label={`Shopping cart (${cartCount})`}
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                <img src="/images/cart-icon.png" alt="Cart" className="w-full h-full object-contain" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-orange-500/40">
                {cartCount}
              </span>
            </button>

            {/* User Profile / Auth Menu */}
            <div className="relative">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span className="hidden lg:inline text-xs font-bold text-amber-700 dark:text-amber-300 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                </Button>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
              )}

              {/* User Dropdown */}
              {userMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl border shadow-2xl py-2 animate-in fade-in zoom-in-95 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-amber-600 font-bold hover:bg-amber-50 dark:hover:bg-slate-800"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      👑 Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>My Wishlist</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>Regional & Currency</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                      INR
                    </span>
                  </Link>
                  <hr className="my-2 border-slate-200 dark:border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 font-semibold hover:bg-rose-50 dark:hover:bg-slate-800"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. MOBILE SEARCH BAR DRAWER (Opens when search icon is clicked on mobile) */}
      {mobileSearchOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search hampers, gifts, occasions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </form>

          {/* Mobile Instant Results */}
          {searchQuery.trim().length > 0 && (
            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              {isSearching ? (
                <p className="text-center text-xs text-slate-400 py-4">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product.slug)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-left"
                  >
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">No results found</p>
              )}
            </div>
          )}

          {/* Quick Search Suggestions */}
          {!searchQuery && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Trending Searches</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      router.push(`/shop?search=${encodeURIComponent(tag)}`);
                      setMobileSearchOpen(false);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SALTY-INSPIRED MOBILE NAVIGATION DRAWER (Off-canvas) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <div className="h-10 px-2.5 py-1 bg-black rounded-xl border border-slate-900 flex items-center justify-center shadow-md">
                  <img
                    src={brand.logo_url || '/images/kawaiora-logo.png'}
                    alt={brand.brand_name || 'Kawaiora Hampers'}
                    className="h-7 w-auto object-contain"
                  />
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Hamper Highlight Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-b border-amber-500/20">
              <Link
                href="/customize/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                    <WandSparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Build Your Own Hamper</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Curate luxury items & ribbons</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-black">
                  NEW
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition',
                  isActive('/shop')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Gift className="w-4 h-4 text-amber-500" />
                <span>All Gift Hampers</span>
              </Link>

              <Link
                href="/occasions"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition',
                  isActive('/occasions')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>Shop by Occasion</span>
              </Link>

              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition',
                  isActive('/categories')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Collections & Themes</span>
              </Link>

              <Link
                href="/corporate"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition',
                  isActive('/corporate')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Package className="w-4 h-4 text-emerald-500" />
                <span>Corporate & Bulk Gifting</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Track Order</span>
              </Link>

              {/* Wishlist & Cart Quick Chips */}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold text-rose-600 dark:text-rose-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" /> Wishlist
                  </span>
                  <Badge variant="rose" className="h-5 px-1.5 text-[10px]">
                    {wishlistCount}
                  </Badge>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCartDrawer();
                  }}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" /> Cart
                  </span>
                  <Badge variant="amber" className="h-5 px-1.5 text-[10px]">
                    {cartCount}
                  </Badge>
                </button>
              </div>

              {/* Concierge Help Box */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Need gifting guidance?</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Our Hamper Concierge is ready to help you pick the perfect box.
                </p>
                <a
                  href={`https://wa.me/919999999999?text=${encodeURIComponent('Hi MyKavayora, I need help selecting a luxury hamper.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Drawer Footer: User Profile / Auth */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium text-slate-500">Signed in as</span>
                    <span className="text-xs font-bold text-amber-600 truncate max-w-[140px]">{user.name}</span>
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-xs text-amber-600 font-bold"
                    >
                      👑 Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold transition hover:bg-rose-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-black text-xs font-bold shadow-md hover:bg-amber-400 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
