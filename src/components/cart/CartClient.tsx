'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, Heart, ArrowLeft, Shield, Truck, Sparkles, Gift } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useCart, CartItem } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';

export function CartClient() {
  const router = useRouter();
  const { cart, loading, updateQuantity, removeFromCart, addToCart, clearCart, refreshCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  useEffect(() => {
    refreshCart();
    try {
      const stored = localStorage.getItem('kawaiora_discount');
      if (stored) {
        setDiscount(JSON.parse(stored));
      }
      const storedSaved = localStorage.getItem('kawaiora_saved_for_later');
      if (storedSaved) {
        setSavedItems(JSON.parse(storedSaved));
      }
    } catch {}
  }, [refreshCart]);

  const handleSaveForLater = (item: CartItem) => {
    const updated = [item, ...savedItems.filter(s => s.id !== item.id)];
    setSavedItems(updated);
    try {
      localStorage.setItem('kawaiora_saved_for_later', JSON.stringify(updated));
    } catch {}
    removeFromCart(item.id);
    toast.success('Moved to Saved for Later');
  };

  const handleMoveToCart = async (savedItem: any) => {
    if (savedItem.product_id) {
      await addToCart(savedItem.product_id, undefined, 1, savedItem.product);
    } else if (savedItem.custom_hamper_id) {
      await addToCart(undefined, savedItem.custom_hamper_id, 1, savedItem.custom_hamper);
    }
    const updated = savedItems.filter(s => s.id !== savedItem.id);
    setSavedItems(updated);
    try {
      localStorage.setItem('kawaiora_saved_for_later', JSON.stringify(updated));
    } catch {}
    toast.success('Item moved back to cart!');
  };

  const handleRemoveSaved = (id: string) => {
    const updated = savedItems.filter(s => s.id !== id);
    setSavedItems(updated);
    try {
      localStorage.setItem('kawaiora_saved_for_later', JSON.stringify(updated));
    } catch {}
    toast.success('Item removed from Saved for Later');
  };

  if (loading && cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const discountAmount = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
  const freeShippingThreshold = 1999;
  const shipping = (subtotal >= freeShippingThreshold || subtotal === 0) ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount + shipping);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const isEmpty = cart.items.length === 0;

  const handleApplyDiscount = (disc: { code: string; percent: number } | null) => {
    setDiscount(disc);
    if (disc) {
      localStorage.setItem('kawaiora_discount', JSON.stringify(disc));
    } else {
      localStorage.removeItem('kawaiora_discount');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container-custom px-4">
        {/* Free Shipping Progress Meter */}
        {!isEmpty && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Truck className="w-4 h-4 text-amber-600" />
                {subtotal >= freeShippingThreshold
                  ? '🎉 Congratulations! You unlocked FREE Express Luxury Delivery!'
                  : `Add ${formatCurrency(remainingForFreeShipping)} more to get FREE Delivery!`}
              </span>
              <span className="text-amber-600 dark:text-amber-400">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/15 to-rose-500/15 border border-amber-500/30 p-1 flex items-center justify-center shadow-sm">
              <img src="/images/cart-icon.png" alt="Cart" className="w-full h-full object-contain" />
            </div>
            Shopping Cart
            {cart.count > 0 && (
              <Badge variant="amber" className="ml-2">{cart.count} {cart.count === 1 ? 'item' : 'items'}</Badge>
            )}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Review your items and proceed to checkout</p>
        </div>

        {isEmpty ? (
          <div>
            <EmptyCart />
            {savedItems.length > 0 && (
              <SavedForLaterSection
                items={savedItems}
                onMoveToCart={handleMoveToCart}
                onRemove={handleRemoveSaved}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <CartItemsList
                items={cart.items}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onSaveForLater={handleSaveForLater}
                onMoveToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
              />
              <CartPromoCode
                discount={discount}
                onApplyDiscount={handleApplyDiscount}
              />

              {/* Saved for Later Section */}
              {savedItems.length > 0 && (
                <SavedForLaterSection
                  items={savedItems}
                  onMoveToCart={handleMoveToCart}
                  onRemove={handleRemoveSaved}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <CartSummary
                subtotal={subtotal}
                discount={discount}
                discountAmount={discountAmount}
                shipping={shipping}
                total={total}
                onCheckout={() => router.push('/checkout')}
                disabled={cart.items.length === 0}
              />
              <CartTrustBadges />
              <ContinueShopping />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <Card variant="glass" padding="lg" className="text-center max-w-lg mx-auto py-12 px-6">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
        <img
          src="/images/luxury-cart.png"
          alt="KawaiOra Artisan Shopping Cart"
          className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Your Shopping Cart is Empty</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm sm:text-base">
        Your bespoke hamper basket is waiting to be filled with handcrafted gourmet delicacies and artisan gifts.
      </p>
      <Link href="/shop">
        <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 px-8" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
          Explore Curated Hampers
        </Button>
      </Link>
    </Card>
  );
}

function CartItemsList({
  items,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  onMoveToWishlist,
  isInWishlist,
}: {
  items: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (item: CartItem) => void;
  onMoveToWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onSaveForLater={onSaveForLater}
          onMoveToWishlist={onMoveToWishlist}
          isInWishlist={isInWishlist}
        />
      ))}
    </div>
  );
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  onMoveToWishlist,
  isInWishlist,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (item: CartItem) => void;
  onMoveToWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}) {
  const isCustom = !!item.custom_hamper_id;
  const product = item.product;
  const customHamper = item.custom_hamper;

  const title = isCustom ? customHamper?.name || 'Custom Hamper' : product?.name || 'Artisan Gift Hamper';
  const price = isCustom ? (customHamper?.total_price ?? item.price_at_add ?? 0) : (product?.price ?? item.price_at_add ?? 0);
  const compareAtPrice = product?.compare_at_price;
  const image = isCustom
    ? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300'
    : product?.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
  const itemTotal = price * item.quantity;
  const stock = product?.stock || 25;
  const inWishlist = product ? isInWishlist(product.id) : false;

  return (
    <Card variant="glass" padding="md" className="transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex gap-4 sm:gap-6">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          {isCustom && (
            <Badge variant="amber" className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5">
              Custom
            </Badge>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 hover:text-amber-600 transition">
                  {product?.slug ? <Link href={`/products/${product.slug}`}>{title}</Link> : title}
                </h3>
                {isCustom ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Handcrafted custom selection</p>
                ) : (
                  <Badge variant={stock > 0 ? 'success' : 'rose'} className="mt-1 text-[10px]">
                    {stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => product && onMoveToWishlist(product.id)}
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0',
                  inWishlist
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                )}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={cn('w-5 h-5', inWishlist ? 'fill-current' : '')} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <QuantitySelector
                  value={item.quantity}
                  onChange={(qty) => onUpdateQuantity(item.id, qty)}
                  max={stock}
                />
              </div>

              <div className="text-right">
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {formatCurrency(itemTotal)}
                </div>
                {compareAtPrice && price && compareAtPrice > price && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 line-through">
                    {formatCurrency(compareAtPrice * item.quantity)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => onRemove(item.id)}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => onSaveForLater(item)}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition"
            >
              Save for later
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuantitySelector({ value, onChange, max = 99 }: { value: number; onChange: (qty: number) => void; max?: number }) {
  return (
    <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const qty = Math.max(1, Math.min(max, parseInt(e.target.value) || 1));
          onChange(qty);
        }}
        className="w-14 text-center border-0 focus:ring-0 bg-transparent text-sm font-semibold"
        min={1}
        max={max}
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function CartPromoCode({
  discount,
  onApplyDiscount,
}: {
  discount: { code: string; percent: number } | null;
  onApplyDiscount: (disc: { code: string; percent: number } | null) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/discounts?code=${encodeURIComponent(code.trim())}`);
      const data = await response.json();
      if (response.ok && data.success && data.valid) {
        const percent = data.data.percentage || data.data.discount_value || 10;
        onApplyDiscount({ code: data.data.code, percent });
        toast.success(`Promo code ${data.data.code} applied (${percent}% off)!`);
        setCode('');
      } else {
        setError(data.error || 'Invalid or inactive promo code');
      }
    } catch {
      setError('Failed to validate promo code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onApplyDiscount(null);
    toast.success('Promo code removed');
  };

  return (
    <Card variant="outlined" padding="lg" className="mt-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Promo Code</h3>
      {discount ? (
        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            {discount.code} applied! ({discount.percent}% discount)
          </span>
          <button onClick={handleRemove} className="text-xs text-rose-500 hover:underline font-medium">
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            placeholder="Try code: WELCOME10"
            className="flex-1"
          />
          <Button onClick={handleApply} disabled={loading}>
            {loading ? 'Checking...' : 'Apply'}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}
    </Card>
  );
}

function CartSummary({
  subtotal,
  discount,
  discountAmount,
  shipping,
  total,
  onCheckout,
  disabled,
}: {
  subtotal: number;
  discount: { code: string; percent: number } | null;
  discountAmount: number;
  shipping: number;
  total: number;
  onCheckout: () => void;
  disabled: boolean;
}) {
  const savings = shipping === 0 ? 99 : 0;

  return (
    <div className="sticky top-24 space-y-6">
      <Card variant="elevated" padding="lg">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Order Summary</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Promo Discount ({discount?.code})</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">Free</span>
              ) : (
                formatCurrency(shipping)
              )}
            </span>
          </div>

          {savings > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
              <span>You saved</span>
              <span>{formatCurrency(savings)} on shipping</span>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-600 dark:text-amber-400">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <Button
            onClick={onCheckout}
            disabled={disabled}
            className="w-full"
            size="lg"
          >
            Proceed to Checkout
          </Button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Secure checkout powered by Razorpay & Stripe
          </p>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>100% Secure SSL encrypted payment</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CartTrustBadges() {
  return (
    <Card variant="glass" padding="md">
      <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Express nationwide delivery with real-time tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Signature satin ribbon and gold foil greeting card</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Handcrafted gourmet items sealed for maximum freshness</span>
        </div>
      </div>
    </Card>
  );
}

function ContinueShopping() {
  return (
    <Link href="/shop" className="block text-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition">
      ← Continue Browsing Hampers
    </Link>
  );
}

function SavedForLaterSection({
  items,
  onMoveToCart,
  onRemove,
}: {
  items: any[];
  onMoveToCart: (item: any) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-amber-600" />
        Saved for Later ({items.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const title = item.product?.name || item.custom_hamper?.name || 'Artisan Hamper';
          const price = item.product?.price || item.custom_hamper?.total_price || item.price_at_add || 0;
          const image = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';

          return (
            <Card key={item.id} variant="glass" padding="sm" className="flex gap-4 items-center">
              <img src={image} alt={title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{title}</p>
                <p className="text-sm font-bold text-amber-600 mt-1">{formatCurrency(price)}</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => onMoveToCart(item)}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-xs text-slate-400 hover:text-rose-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
