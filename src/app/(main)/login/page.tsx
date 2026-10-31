import { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export const metadata: Metadata = {
  title: 'Sign In | Kavayura Hampers',
  description: 'Sign in to your Kavayura Hampers account to track orders, save bespoke gift hampers, and manage deliveries.',
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 sm:py-16 px-4 bg-gradient-to-b from-[#faf5f6] via-white to-[#fbf7f8] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Suspense fallback={<div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />}>
        <AuthFormCard initialMode="login" />
      </Suspense>
    </div>
  );
}
