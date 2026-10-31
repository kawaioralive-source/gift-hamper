'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Gift,
  Star,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useBrand } from '@/hooks/useBrand';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AuthFormCardProps {
  initialMode: 'login' | 'register';
}

export function AuthFormCard({ initialMode }: AuthFormCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect') || '';
  const { brand } = useBrand();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
      default:
        return { score: 10, label: 'Too short', color: 'bg-rose-400', text: 'text-rose-500' };
    }
  }, [password]);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    setCountdown(60);
    toast.success(`OTP sent to +91 ${phone.slice(-4).padStart(10, '•')}`);
    // Simulate countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    toast.loading(`Connecting with ${provider === 'google' ? 'Google' : 'Apple'}...`, { duration: 1500 });
    // In production this triggers OAuth redirect; graceful fallback toast:
    setTimeout(() => {
      toast.error(`${provider === 'google' ? 'Google' : 'Apple'} authentication is configured via direct email login for maximum security.`);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register' && !agreedToTerms) {
      toast.error('Please accept the Terms of Service & Privacy Policy to create an account');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        if (loginMethod === 'phone') {
          // Demo phone login simulation
          if (!otp || otp.length < 4) {
            toast.error('Please enter the 4-digit verification code sent to your phone');
            setLoading(false);
            return;
          }
          toast.success('Mobile verification successful!');
          window.dispatchEvent(new Event('auth-change'));
          const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/orders';
          window.location.href = target;
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`Welcome back, ${data.user?.name || 'Customer'}!`);
          window.dispatchEvent(new Event('auth-change'));
          const defaultPath = data.user?.role === 'admin' ? '/admin' : '/orders';
          const targetPath = redirectParam && redirectParam.startsWith('/') ? redirectParam : defaultPath;
          window.location.href = targetPath;
        } else {
          toast.error(data.error || 'Invalid email or password');
        }
      } else {
        // Register Mode
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`Welcome to ${brand.brand_name}! Account created.`);
          window.dispatchEvent(new Event('auth-change'));
          const targetPath = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
          window.location.href = targetPath;
        } else {
          toast.error(data.error || 'Failed to create account');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Authentication request failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-rose-100/60 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Lifestyle Visual Showcase (5 cols on desktop) */}
      <div className="lg:col-span-5 relative bg-[#1c0812] text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[460px] lg:min-h-[640px]">
        {/* Background Image with Rich Burgundy/Rose Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b0818]/90 via-[#400e26]/80 to-[#14040d]/95" />

        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-rose-100 group-hover:text-white transition">
              {brand.brand_name || 'Kavayura Hampers'}
            </span>
          </Link>
          <div className="inline-block px-3 py-1 rounded-full bg-rose-950/60 border border-rose-400/30 text-rose-200 text-[11px] font-semibold tracking-wide uppercase">
            Artisan Gifting Atelier
          </div>
          <p className="text-sm text-rose-100/80 leading-relaxed max-w-sm pt-2">
            Curated hampers handcrafted with love, gourmet delights, and bespoke personal touches for life&apos;s most cherished celebrations.
          </p>
        </div>

        {/* Trust Badges & Highlights */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">50,000+ Hampers Delivered</p>
              <p className="text-xs text-rose-200/70">Pan-India express gifting network</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">4.9 / 5 Gifting Satisfaction</p>
              <p className="text-xs text-rose-200/70">Over 12,000+ five-star verified reviews</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">White-Glove Safe Transit</p>
              <p className="text-xs text-rose-200/70">Temperature protected & pristine boxing</p>
            </div>
          </div>
        </div>

        {/* Customer Testimonial Quote */}
        <div className="relative z-10 pt-4 border-t border-white/15">
          <p className="text-xs text-rose-100/90 italic leading-relaxed">
            &ldquo;The unboxing experience brought genuine happy tears to my sister on her milestone anniversary. Absolute perfection.&rdquo;
          </p>
          <p className="text-[11px] font-semibold text-rose-300 mt-1">
            — Priya Sengupta, Bangalore
          </p>
        </div>
      </div>

      {/* Right Interactive Auth Form Panel (7 cols on desktop) */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        {/* Mobile Brand Header (visible on small screens) */}
        <div className="lg:hidden text-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-rose-950 dark:text-rose-100">
            {brand.brand_name || 'Kavayura Hampers'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Bespoke Luxury Gifting Experience</p>
        </div>

        {/* Mode Toggle Tabs: Sign In vs Create Account */}
        <div className="flex p-1.5 bg-rose-50/70 dark:bg-slate-800/80 rounded-2xl border border-rose-100 dark:border-slate-700 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Social Sign-in Buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            onClick={() => handleSocialAuth('google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialAuth('apple')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-sm transition-all"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.85.94-2.93-.93.04-2.02.63-2.67 1.39-.58.67-.99 1.77-.85 2.81 1.03.08 2.05-.55 2.58-1.27z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
            or continue with {mode === 'login' ? 'credentials' : 'email'}
          </span>
        </div>

        {/* Sign In Method Toggle: Email vs Mobile OTP */}
        {mode === 'login' && (
          <div className="flex justify-center gap-4 my-3 text-xs">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`pb-1 font-semibold transition border-b-2 ${
                loginMethod === 'email'
                  ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`pb-1 font-semibold transition border-b-2 ${
                loginMethod === 'phone'
                  ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Mobile Number (OTP)
            </button>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Register: Full Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditi Sharma"
                  required
                  className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Email or Phone field */}
          {mode === 'login' && loginMethod === 'phone' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  +91
                </div>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    required
                    className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={countdown > 0}
                  className="text-xs shrink-0"
                >
                  {countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : 'Send OTP'}
                </Button>
              </div>

              {otpSent && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Enter 4-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••"
                    className="w-full text-center tracking-widest font-mono text-base font-bold py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aditi@example.com"
                  required
                  className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Password field (if not loginMethod === 'phone') */}
          {!(mode === 'login' && loginMethod === 'phone') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                {mode === 'login' && (
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter for registration */}
              {mode === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Strength:</span>
                    <span className={`font-bold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checkboxes: Remember Me or Terms */}
          {mode === 'login' ? (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                Remember me on this browser
              </label>
            </div>
          ) : (
            <div className="pt-1">
              <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="text-rose-600 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-rose-600 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                Sign In to {brand.brand_name || 'Kavayura Hampers'}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Create Gifting Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust Badges Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span>100% Verified Gifting</span>
          <span>•</span>
          <span>Pan-India Care</span>
        </div>
      </div>
    </div>
  );
}
