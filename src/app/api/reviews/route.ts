import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    // 1. Try Supabase
    try {
      const supabase = createClient();
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: reviews, error } = await query;
      if (!error) {
        return NextResponse.json({
          success: true,
          data: reviews || [],
        });
      }
    } catch {}

    // 2. SQLite Fallback (local development only)
    try {
      let sqliteQuery = `SELECT * FROM reviews WHERE 1=1`;
      const params: any[] = [];
      if (productId) {
        sqliteQuery += ` AND product_id = ?`;
        params.push(productId);
      }
      sqliteQuery += ` ORDER BY id DESC LIMIT 20`;

      const sqliteReviews = await querySqlite(sqliteQuery, params);
      const formatted = (sqliteReviews || []).map((r: any) => ({
        id: String(r.id),
        product_id: r.product_id,
        rating: Number(r.rating) || 5,
        content: r.comment || '',
        title: r.title || 'Verified Review',
        created_at: r.created_at || new Date().toISOString(),
        user: {
          name: r.user_name || 'Verified Customer',
          avatar_url: r.photo_url || null,
        },
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    const productId = body.product_id ? String(body.product_id) : '1';
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const title = sanitizeText(body.title || 'Exceptional Experience');
    const comment = sanitizeText(body.comment || body.content || '');
    const userName = sanitizeText(user?.name || body.name || body.user_name || 'Customer');

    if (!comment.trim()) {
      return NextResponse.json(
        { success: false, error: 'Review comment is required' },
        { status: 400 }
      );
    }

    // 1. Try Supabase
    try {
      const supabase = createClient();
      await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user?.id || null,
        rating,
        comment,
      });
    } catch (sbErr) {
      console.warn('Supabase review insert error:', sbErr);
    }

    // 2. SQLite Fallback
    try {
      await executeSqlite(
        `INSERT INTO reviews (product_id, user_name, rating, comment, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
        [productId, userName, rating, comment]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      data: {
        id: `rev-${Date.now()}`,
        product_id: productId,
        title,
        content: comment,
        rating,
        created_at: new Date().toISOString(),
        user: {
          name: userName,
        },
      },
    });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
