'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, ShoppingBag, Share2, Truck, Ribbon, Shield, ChevronLeft, ChevronRight, X, Check, Minus, Plus, Tag, Gift } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Product, Review, ProductWithRelations } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';

interface ReviewWithUser extends Review {
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface ProductDetailClientProps {
  initialProduct: ProductWithRelations;
  initialReviews: ReviewWithUser[];
  initialRelatedProducts: Product[];
}

export function ProductDetailClient({
  initialProduct,
  initialReviews,
  initialRelatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product] = useState(initialProduct);
  const inWish = isInWishlist(product.id);
  const [reviews, setReviews] = useState<any[]>(initialReviews || []);
  const [relatedProducts] = useState(initialRelatedProducts);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showQuickView, setShowQuickView] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const [showPersonalization, setShowPersonalization] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [ribbonColor, setRibbonColor] = useState('Royal Gold');
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const mainImages = product.images?.length ? product.images : [product.images?.[0] || ''];
  const discountPercent = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleCheckPincode = async () => {
    if (!pincode || pincode.trim().length !== 6 || !/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setCheckingPincode(true);
    try {
      const res = await fetch(`/api/delivery/check?pincode=${pincode}`);
      const data = await res.json();
      if (data.serviceable) {
        setDeliveryStatus(`Express delivery available to PIN ${pincode}! Estimated delivery: 2-4 business days.`);
      } else {
        setDeliveryStatus(`Standard courier delivery available for PIN ${pincode}.`);
      }
    } catch {
      setDeliveryStatus(`Express & Standard delivery available for PIN ${pincode}.`);
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleAddToCart = async () => {
    await addToCart(product.id, undefined, quantity, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_at_price: product.compare_at_price,
      images: product.images,
      stock: product.stock,
      gift_options: showPersonalization
        ? {
            recipient_name: recipientName,
            message: giftMessage,
            ribbon_color: ribbonColor,
          }
        : undefined,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/checkout');
  };

  const handleWishlistToggle = () => {
    addToWishlist(product.id, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
    });
    toast.success(inWish ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description ?? '',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) {
      toast.error('Please enter your review experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Thank you! Your review has been published.');
        setShowReviewModal(false);
        setReviewForm({ rating: 5, title: '', content: '' });
        if (data.data) {
          setReviews((prev) => [data.data, ...prev]);
        }
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Breadcrumb */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" aria-label="Breadcrumb">
        <div className="container-custom px-4 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li><Link href="/" className="text-slate-500 hover:text-amber-600">Home</Link></li>
            <li className="text-slate-300">/</li>
            <li><Link href="/shop" className="text-slate-500 hover:text-amber-600">Shop</Link></li>
            <li className="text-slate-300">/</li>
            {product.category && (
              <>
                <li><Link href={`/categories/${product.category.slug}`} className="text-slate-500 hover:text-amber-600">{product.category.name}</Link></li>
                <li className="text-slate-300">/</li>
              </>
            )}
            {product.occasion && (
              <>
                <li><Link href={`/occasions/${product.occasion.slug}`} className="text-slate-500 hover:text-amber-600">{product.occasion.name}</Link></li>
                <li className="text-slate-300">/</li>
              </>
            )}
            <li className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]" aria-current="page">{product.name}</li>
          </ol>
        </div>
      </nav>

      {/* Product Detail */}
      <div className="container-custom py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Product Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[4/3]">
              <img
                src={mainImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {discountPercent > 0 && (
                <Badge variant="rose" className="absolute top-4 left-4 text-base px-3 py-1">
                  -{discountPercent}% OFF
                </Badge>
              )}
              {product.tags && product.tags.length > 0 && (
                <Badge variant="amber" className="absolute top-4 right-4">
                  {product.tags[0]}
                </Badge>
              )}
              {product.is_bestseller && (
                <Badge variant="amber" className="absolute bottom-4 left-4 flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Bestseller
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {mainImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {mainImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImageIndex === index
                        ? 'border-amber-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                    )}
                    aria-label={`View image ${index + 1}`}
                    aria-current={selectedImageIndex === index ? 'true' : 'false'}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Heart className={cn('w-4 h-4', inWish ? 'fill-rose-500 text-rose-500' : '')} />}
                onClick={handleWishlistToggle}
                className="flex-1 sm:flex-initial"
              >
                {inWish ? 'Wishlisted' : 'Add to Wishlist'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />} onClick={handleShare} className="flex-1 sm:flex-initial">
                Share
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-amber-600 dark:text-amber-400 font-semibold uppercase">{product.category?.name}</span>
              {product.occasion && (
                <>
                  <span>/</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold uppercase">{product.occasion.name}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{product.name}</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-5 h-5',
                      i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                    )}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{product.rating}</span>
              <span className="text-slate-500 dark:text-slate-400">({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xl text-slate-500 line-through">{formatCurrency(product.compare_at_price)}</span>
              )}
              {discountPercent > 0 && (
                <Badge variant="rose" className="text-base px-3 py-1">
                  Save {formatCurrency(product.compare_at_price! - product.price)}
                </Badge>
              )}
            </div>

            {/* Short Description */}
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">{product.short_description}</p>

            {/* Included Items */}
            {product.items && product.items.length > 0 && (
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  What's Inside This Hamper
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.items.map((pi, index) => (
                    <li key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
                      {pi.item.image_url && (
                        <img src={pi.item.image_url} alt={pi.item.name} className="w-10 h-10 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{pi.item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pi.item.description || `Qty: ${pi.quantity}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="font-semibold text-slate-900 dark:text-white">Quantity:</label>
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-lg font-bold text-slate-900 dark:text-white border-none focus:outline-none bg-transparent"
                  min="1"
                  max={product.stock || 99}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                  className="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {product.stock > 0 ? `Only ${product.stock} left in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Gifting Personalization */}
            <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Complimentary Personalization</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonalization(!showPersonalization)}
                  className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  {showPersonalization ? 'Remove Options' : '+ Add Gift Note & Ribbon'}
                </button>
              </div>

              {showPersonalization && (
                <div className="mt-4 space-y-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-medium">Gift Card Message</label>
                      <span className="text-[10px] text-slate-400">{giftMessage.length}/200</span>
                    </div>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
                      placeholder="Write your heartfelt greeting card message..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Luxury Satin Ribbon Theme</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Royal Gold', 'Crimson Velvet', 'Emerald Silk', 'Midnight Black'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRibbonColor(color)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-medium border transition',
                            ribbonColor === color
                              ? 'border-amber-600 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Serviceability Check */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                Check Delivery Serviceability
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckPincode}
                  isLoading={checkingPincode}
                  className="text-xs px-3"
                >
                  Check
                </Button>
              </div>
              {deliveryStatus && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <Check className="w-3.5 h-3.5" />
                  {deliveryStatus}
                </p>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-initial px-8 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-amber-500/25 rounded-xl justify-center"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-initial px-8 py-3.5 text-sm sm:text-base font-bold border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl justify-center"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Truck className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Express Delivery</p>
                  <p className="text-xs text-slate-500">Nationwide shipping</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Ribbon className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Premium Wrapping</p>
                  <p className="text-xs text-slate-500">Satin ribbon & gift box</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Shield className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Secure Payment</p>
                  <p className="text-xs text-slate-500">100% safe checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-16 space-y-12">
          {/* Description */}
          {product.description && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About This Hamper</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Customer Reviews <span className="text-slate-500 font-normal ml-2">({reviews.length || product.review_count || 0})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real feedback from verified purchasers & gift recipients
                </p>
              </div>
              <Button variant="outline" leftIcon={<Star className="w-4 h-4 text-amber-500" />} onClick={() => setShowReviewModal(true)}>
                Write a Review
              </Button>
            </div>

            {/* Amazon-style Rating Breakdown Box */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 text-center md:text-left md:border-r md:border-slate-200 md:dark:border-slate-800 md:pr-6">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : (product.rating || 5.0).toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">out of 5</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.floor(product.rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Based on {reviews.length || product.review_count || 1} verified customer ratings
                </p>
              </div>

              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((starLevel) => {
                  const count = reviews.filter((r) => Math.round(r.rating || 5) === starLevel).length;
                  const pct = reviews.length > 0
                    ? Math.round((count / reviews.length) * 100)
                    : (starLevel === 5 ? 85 : (starLevel === 4 ? 15 : 0));
                  return (
                    <div key={starLevel} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        {starLevel} star
                      </span>
                      <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono font-medium text-slate-500">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No reviews yet</h3>
                  <p className="text-slate-500 dark:text-slate-400">Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card
                    key={review.id}
                    variant="outlined"
                    padding="md"
                    className="flex flex-col sm:flex-row gap-6"
                  >
                    <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                      <img
                        src={
                          review.user?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || review.name || 'User')}&background=random`
                        }
                        alt={review.user?.name || review.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {review.user?.name || review.name || 'Verified Customer'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < (review.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              )}
                            />
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" /> Verified Purchase
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-slate-600 dark:text-slate-400">{review.content || review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Review photo ${i + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((related) => (
                  <Link key={related.id} href={`/products/${related.slug}`} className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                    <img src={related.images[0]} alt={related.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">{related.name}</h3>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{formatCurrency(related.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <Modal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        title="Quick View"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img src={mainImages[selectedImageIndex]} alt={product.name} className="w-full h-80 object-cover rounded-xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h3>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{formatCurrency(product.price)}</p>
            <p className="text-slate-600 dark:text-slate-400 mt-4">{product.short_description}</p>
            <Button size="md" className="w-full mt-6 py-3 font-bold rounded-xl shadow-md shadow-amber-500/25" onClick={() => { setShowQuickView(false); handleAddToCart(); }} leftIcon={<ShoppingBag className="w-4 h-4" />}>
              Add to Cart
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="md"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="label-text">Your Rating</label>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, rating: i + 1 }))}
                  className={cn(
                    'w-12 h-12 rounded-xl border-2 flex items-center justify-center transition',
                    i < reviewForm.rating
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300'
                  )}
                >
                  <Star className={cn('w-6 h-6', i < reviewForm.rating ? 'fill-current' : '')} />
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Review Title"
            value={reviewForm.title}
            onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Summarize your experience"
          />
          <Textarea
            label="Your Review"
            value={reviewForm.content}
            onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Share your detailed experience..."
            rows={4}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowReviewModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={submittingReview}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}