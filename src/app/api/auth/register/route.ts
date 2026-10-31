import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { hashPassword, createAccessToken, createRefreshToken } from '@/lib/auth';
import { registerSchema } from '@/validators/schemas';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    const lowerEmail = validated.email.toLowerCase();

    // 1. Try Supabase
    try {
      const supabase = createAdminClient();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', lowerEmail)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists.' },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(validated.password);

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: lowerEmail,
          name: validated.name,
          password: passwordHash,
          role: 'user',
        })
        .select()
        .single();

      if (!userError && user) {
        // Also sync to SQLite for fallback consistency
        try {
          await executeSqlite(
            `INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, 'user', datetime('now'))`,
            [user.id, validated.name, lowerEmail, passwordHash]
          );
        } catch {}

        const authUser = {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: 'user' as const,
          phone: validated.phone || '+919876543210',
          phone_verified: true,
          avatar_url: undefined,
        };

        const accessToken = await createAccessToken(authUser);
        const refreshToken = await createRefreshToken(String(user.id));

        const response = NextResponse.json({
          success: true,
          message: 'Account created successfully!',
          user: authUser,
        });

        response.cookies.set('access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        response.cookies.set('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });

        response.cookies.set('auth_user', JSON.stringify(authUser), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return response;
      } else if (userError) {
        console.warn('Supabase register error:', userError);
      }
    } catch (sbErr) {
      console.warn('Supabase register exception:', sbErr);
    }

    // 2. SQLite Fallback
    const existingSqlite = await querySqlite(`SELECT * FROM users WHERE LOWER(email) = ?`, [lowerEmail]);
    if (existingSqlite && existingSqlite.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);
    await executeSqlite(
      `INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, 'user', datetime('now'))`,
      [validated.name, lowerEmail, passwordHash]
    );

    const newRows = await querySqlite(`SELECT * FROM users WHERE LOWER(email) = ?`, [lowerEmail]);
    const localUser = newRows[0];
    const userId = localUser?.id ? String(localUser.id) : uuidv4();

    const authUser = {
      id: userId,
      email: lowerEmail,
      name: validated.name,
      role: 'user' as const,
      phone: validated.phone || '+919876543210',
      phone_verified: false,
      avatar_url: undefined,
    };

    const accessToken = await createAccessToken(authUser);
    const refreshToken = await createRefreshToken(userId);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: authUser,
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    response.cookies.set('auth_user', JSON.stringify(authUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
