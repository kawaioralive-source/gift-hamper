'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, Truck, Check, Gift, ShieldCheck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const FREE_SHIPPING_THRESHOLD = 1999;
const FREE_GIFT_THRESHOLD = 3999;

export function CartDrawer() {
  const { cart, isCartDrawerOpen, closeCartDrawer, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPct: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  if (!isCartDrawerOpen) return null;

  const currentTotal = cart.total;
  const freeShippingUnlocked = currentTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingProgress = Math.min(100, Math.round((currentTotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'SPOOKY20') {
      setAppliedPromo({ code: clean, discountPct: 20 });
      toast.success('🎃 Spooky Halloween Code SPOOKY20 applied! 20% off');
    } else if (clean === 'WELCOME10') {
      setAppliedPromo({ code: clean, discountPct: 10 });
      toast.success('Promo code WELCOME10 applied! 10% off');
    } else if (clean === 'KAWAIORA15') {
      setAppliedPromo({ code: clean, discountPct: 15 });
      toast.success('Promo code KAWAIORA15 applied! 15% off');
    } else {
      setPromoError('Invalid coupon code. Try SPOOKY20 or WELCOME10');
    }
  };

  const discountAmount = appliedPromo ? Math.round((currentTotal * appliedPromo.discountPct) / 100) : 0;
  const finalSubtotal = Math.max(0, currentTotal - discountAmount);

  const handleCheckout = () => {
    closeCartDrawer();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-950 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-serif">
                Your Shopping Bag ({cart.count})
              </h2>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Salty-Style Free Shipping & Gift Progress Bar */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {freeShippingUnlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    🎉 You unlocked FREE Express Shipping!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(amountToFreeShipping)}</strong> more for <strong>FREE Express Shipping</strong>
                  </span>
                )}
              </span>
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{shippingProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {cart.items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">Your bag is empty</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Explore our curated artisanal hampers and personalized gift boxes.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    closeCartDrawer();
                    router.push('/shop');
                  }}
                  className="rounded-xl px-5 bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Explore Hampers
                </Button>
              </div>
            ) : (
              cart.items.map((item) => {
                const isCustom = Boolean(item.custom_hamper_id);
                const title = item.product?.name || item.custom_hamper?.name || 'Artisan Hamper';
                const image = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80';
                const itemPrice = item.product?.price ?? item.custom_hamper?.total_price ?? item.price_at_add ?? 0;
                const slug = item.product?.slug;

                return (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 group">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shrink-0 relative">
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {isCustom && (
                        <span className="absolute bottom-1 left-1 bg-black/80 text-[9px] text-amber-300 font-bold px-1 rounded">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          {slug ? (
                            <Link
                              href={`/products/${slug}`}
                              onClick={closeCartDrawer}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 line-clamp-1"
                            >
                              {title}
                            </Link>
                          ) : (
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {title}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition p-0.5"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(itemPrice)}
                          </span>
                          {item.product?.compare_at_price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(item.product.compare_at_price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {formatCurrency(itemPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer: Coupon Code + Totals + Checkout */}
          {cart.items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3.5">
              
              {/* Promo code input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter discount coupon (e.g. WELCOME10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold px-3 shrink-0"
                >
                  Apply
                </Button>
              </form>
              {promoError && <p className="text-[11px] text-rose-500 font-semibold">{promoError}</p>}
              {appliedPromo && (
                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl">
                  <span>Code <strong>{appliedPromo.code}</strong> applied (-{appliedPromo.discountPct}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(currentTotal)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pan-India Delivery</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {freeShippingUnlocked ? 'FREE' : formatCurrency(149)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Estimated Total</span>
                  <span className="text-base text-amber-600 dark:text-amber-400">
                    {formatCurrency(finalSubtotal + (freeShippingUnlocked ? 0 : 149))}
                  </span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <Link
                    href="/cart"
                    onClick={closeCartDrawer}
                    className="text-xs text-slate-500 hover:text-amber-600 underline font-medium"
                  >
                    View detailed cart & shipping options →
                  </Link>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Secure Checkout
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Gift className="w-3 h-3 text-amber-500" /> Free Greeting Card
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
