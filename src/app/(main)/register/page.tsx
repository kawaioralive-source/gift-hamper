'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBrand } from '@/hooks/useBrand';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { brand } = useBrand();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Account created successfully! Welcome, ${data.user?.name || name}!`);
        window.dispatchEvent(new Event('auth-change'));
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get('redirect');
        const targetPath = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : '/';
        window.location.href = targetPath;
      } else {
        toast.error(data.error || 'Failed to create account');
      }
    } catch {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-16 flex justify-center">
      <Card variant="elevated" padding="lg" className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Link href="/" className="inline-block">
              <div className="h-12 px-3 py-1 bg-black rounded-xl border border-slate-900 flex items-center justify-center shadow">
                <img
                  src={brand.logo_url || '/images/kawaiora-logo.png'}
                  alt={brand.brand_short_name || 'KawaiOra'}
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-slate-500">
            Join {brand.brand_short_name || 'KawaiOra'} for exclusive gifting perks & artisan rewards
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:text-amber-600 dark:hover:text-amber-400 text-slate-400 transition focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-amber-500" /> : <Eye className="w-5 h-5" />}
              </button>
            }
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Create Account
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-600 font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
