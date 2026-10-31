'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle2, ArrowLeft, ArrowRight, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface ReviewItem {
  id: string;
  name?: string;
  rating: number;
  title?: string;
  content: string;
  created_at?: string;
  user?: {
    name?: string;
    avatar_url?: string | null;
  };
}

export function CustomerReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rating: 5,
    title: '',
    comment: '',
  });

  const pageSize = 3;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setReviews(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const totalPages = Math.ceil(reviews.length / pageSize);
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    const totalPages = Math.ceil(reviews.length / pageSize);
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1 < totalPages ? prev + 1 : 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment.trim()) {
      toast.error('Please enter your review feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || 'Valued Customer',
          rating: form.rating,
          title: form.title.trim() || 'Verified Experience',
          comment: form.comment.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Thank you! Your review has been submitted.');
        setShowModal(false);
        setForm({ name: '', rating: 5, title: '', comment: '' });
        fetchReviews();
      } else {
        toast.error(json.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const displayedReviews = reviews.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950/50">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            {reviews.length > 0 && (
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {avgRating}/5 based on {reviews.length} verified review{reviews.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Customer Reviews</h2>
          <p className="text-slate-600 dark:text-slate-400 text-base mt-3">
            Real feedback from customers who celebrated their moments with KawaiOra Hampers.
          </p>

          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquarePlus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Write a Review
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card variant="glass" padding="lg" className="max-w-md mx-auto text-center p-8">
            <Star className="w-10 h-10 text-amber-400 mx-auto mb-3 fill-amber-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No reviews yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Be the very first customer to share your thoughts on our artisan hampers!
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageSquarePlus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Share Your Experience
            </Button>
          </Card>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500" id="reviews-grid">
              {displayedReviews.map((review) => {
                const reviewerName = review.user?.name || review.name || 'Verified Buyer';
                const rating = review.rating || 5;

                return (
                  <Card key={review.id} variant="glass" padding="lg" className="flex flex-col h-full hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                            )}
                          />
                        ))}
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1.5" />
                      </div>
                      <Quote className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{review.title}</h4>
                    )}

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-grow">
                      "{review.content}"
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                        {reviewerName[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{reviewerName}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Verified Purchase
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handlePrev}
                  aria-label="Previous reviews"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(idx)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        idx === currentPage ? 'w-6 bg-amber-500' : 'w-2 bg-slate-300 dark:bg-slate-700'
                      )}
                      aria-label={`Go to review page ${idx + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNext}
                  aria-label="Next reviews"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Write a Customer Review"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="label-text block text-xs font-semibold mb-1.5">Your Rating</label>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, rating: i + 1 }))}
                    className={cn(
                      'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition',
                      i < form.rating
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300'
                    )}
                  >
                    <Star className={cn('w-5 h-5', i < form.rating ? 'fill-current' : '')} />
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Your Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rohit Verma"
            />

            <Input
              label="Review Headline"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Stunning presentation and fast delivery!"
            />

            <Textarea
              label="Your Experience"
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Tell others what you loved about the packaging, quality, and service..."
              rows={4}
              required
            />

            <div className="flex gap-3 pt-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={submitting}>
                Submit Review
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
