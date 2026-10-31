import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  // Clear all authentication & session cookies across root path
  const cookieOptions = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax' as const,
  };

  response.cookies.set('access_token', '', cookieOptions);
  response.cookies.set('refresh_token', '', cookieOptions);
  response.cookies.set('auth_user', '', { ...cookieOptions, httpOnly: false });

  return response;
}
