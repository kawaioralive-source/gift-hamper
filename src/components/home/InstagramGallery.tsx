'use client';

import { Instagram, ArrowRight, Heart, MessageSquare, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const INSTAGRAM_POSTS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop',
    likes: 2450,
    comments: 89,
    hashtag: '#KawaiOraMoments',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&h=400&fit=crop',
    likes: 1890,
    comments: 67,
    hashtag: '#GiftGoals',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=400&fit=crop',
    likes: 3200,
    comments: 145,
    hashtag: '#BirthdaySurprise',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop',
    likes: 1560,
    comments: 43,
    hashtag: '#SelfCareSunday',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?w=400&h=400&fit=crop',
    likes: 2100,
    comments: 78,
    hashtag: '#FestivalVibes',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?w=400&h=400&fit=crop',
    likes: 980,
    comments: 34,
    hashtag: '#CorporateGifting',
  },
];

export function InstagramGallery() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-4">
              <Instagram className="w-4 h-4" />
              Follow Us @KawaiOraHampers
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">#KawaiOraMoments</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Share your unboxing moments and get featured</p>
          </div>
          <Button variant="outline" leftIcon={<Instagram className="w-5 h-5" />}>
            <a href="https://instagram.com/kawaiorahampers" target="_blank" rel="noopener noreferrer">
              Follow on Instagram
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INSTAGRAM_POSTS.map((post) => (
            <div
              key={post.id}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl group cursor-pointer',
                'hover:scale-[1.02] transition-transform duration-300'
              )}
            >
              <img
                src={post.image}
                alt={`Instagram post ${post.id}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </div>
                  <Share2 className="w-4 h-4 ml-auto" />
                </div>
                <p className="text-xs text-amber-300 mt-2 font-medium">{post.hashtag}</p>
              </div>
            </div>
          ))}

          {/* CTA Card */}
          <div className="col-span-2 md:col-span-3 lg:col-span-6 relative aspect-square bg-gradient-to-br from-amber-500 to-rose-500 rounded-xl flex flex-col items-center justify-center text-center p-8">
            <Instagram className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Tag Us to Get Featured!</h3>
            <p className="text-white/80 mb-6 max-w-md">
              Share your KawaiOra unboxing moments with #KawaiOraMoments for a chance to be featured and win exciting gifts!
            </p>
            <Button variant="secondary" size="lg" leftIcon={<Instagram className="w-5 h-5" />}>
              <a href="https://instagram.com/kawaiorahampers" target="_blank" rel="noopener noreferrer">
                Follow @KawaiOraHampers
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}