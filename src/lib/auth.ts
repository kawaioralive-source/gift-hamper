import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type { AuthUser, SessionUser } from '@/types';

function getJwtSecret() {
  const secret = (process.env.JWT_SECRET || 'kawaiora_botanical_secret_key_2026_secure').replace(/^\uFEFF/, '').trim();
  return new TextEncoder().encode(secret);
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_EXPIRY = '30d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload && (payload.userId || payload.sub)) {
      return { userId: String(payload.userId || payload.sub) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setAuthCookies(user: AuthUser): Promise<void> {
  const cookieStore = cookies();
  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const authUserCookie = cookieStore.get('auth_user')?.value;

  if (accessToken) {
    const user = await verifyToken(accessToken);
    if (user) {
      return { ...user, access_token: accessToken, refresh_token: refreshToken || '' };
    }
  }

  if (authUserCookie) {
    try {
      const parsed = JSON.parse(authUserCookie);
      if (parsed && (parsed.email || parsed.id)) {
        return {
          id: String(parsed.id),
          email: parsed.email,
          name: parsed.name || 'Administrator',
          role: parsed.role || 'user',
          phone_verified: true,
          access_token: accessToken || '',
          refresh_token: refreshToken || '',
        };
      }
    } catch {}
  }

  return null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}