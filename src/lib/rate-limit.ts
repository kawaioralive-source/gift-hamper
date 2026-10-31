import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed per window
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory cache for sliding window rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number; retryAfterSec: number } {
  // Extract client IP address from standard proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1';

  const pathname = request.nextUrl.pathname;
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitMap.set(key, newRecord);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
      retryAfterSec: 0,
    };
  }

  if (record.count >= config.maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
    retryAfterSec: 0,
  };
}

export function createRateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please slow down and try again shortly.',
      retry_after_seconds: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
