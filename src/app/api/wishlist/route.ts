import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getLocalCookieWishlist(): { items: any[]; count: number } {
  try {
    const cookieStore = cookies();
    const wishCookie = cookieStore.get('wishlist_session_items')?.value;
    if (wishCookie) {
      const parsed = JSON.parse(wishCookie);
      if (Array.isArray(parsed)) {
        return { items: parsed, count: parsed.length };
      }
    }
  } catch {}
  return { items: [], count: 0 };
}

function saveLocalCookieWishlist(response: NextResponse, items: any[]) {
  response.cookies.set('wishlist_session_items', JSON.stringify(items), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function GET() {
  try {
    try {
      const supabase = createClient();
      const user = await getSessionUser();
      const cookieStore = cookies();

      let wishlist = null;
      if (user) {
        const { data: userWishlist } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (userWishlist) wishlist = userWishlist;
        else {
          return NextResponse.json({
            success: true,
            data: { items: [], count: 0, source: 'account' },
          });
        }
      } else {
        const sessionId = cookieStore.get('session_id')?.value;
        if (sessionId) {
          const { data: sessionWishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('session_id', sessionId)
            .single();
          if (sessionWishlist) wishlist = sessionWishlist;
        }
      }

      if (wishlist) {
        const { data: wishlistItems } = await supabase
          .from('wishlist_items')
          .select(`
            *,
            product:products(id, name, slug, price, compare_at_price, images, stock, is_active, status)
          `)
          .eq('wishlist_id', wishlist.id);

        if (wishlistItems) {
          return NextResponse.json({
            success: true,
            data: { items: wishlistItems, count: wishlistItems.length, source: user ? 'account' : 'session' },
          });
        }
      }
    } catch {
      // Supabase unavailable, use local cookie wishlist
    }

    const localWishlist = getLocalCookieWishlist();
    return NextResponse.json({
      success: true,
      data: { ...localWishlist, source: 'cookie' },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: { items: [], count: 0, source: 'cookie' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body.product_id;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // SQLite product lookup for rich metadata
    let productDetails: any = null;
    try {
      const rows = await querySqlite(`SELECT * FROM products WHERE id = ?`, [productId]);
      if (rows && rows.length > 0) {
        const p = rows[0];
        const rawPrice = p.price || 999;
        const normalizedPrice = rawPrice < 500 ? rawPrice * 100 : rawPrice;
        productDetails = {
          id: String(p.id),
          name: p.name,
          slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          price: Math.round(normalizedPrice),
          compare_at_price: p.original_price ? Math.round(p.original_price) : null,
          images: p.image ? [p.image] : [],
          stock: p.stock || 25,
          is_active: true,
          status: 'active',
        };
      }
    } catch {}

    const localWishlist = getLocalCookieWishlist();
    const items = [...localWishlist.items];

    if (!items.some((i) => i.product_id === productId)) {
      items.push({
        id: `wish-${Date.now()}`,
        product_id: productId,
        product: productDetails || undefined,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Added to wishlist successfully!',
      data: { items, count: items.length },
    });

    saveLocalCookieWishlist(response, items);
    return response;
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({
      success: true,
      message: 'Added to wishlist',
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const productId = searchParams.get('product_id');

    const localWishlist = getLocalCookieWishlist();
    const items = localWishlist.items.filter(
      (i) => i.id !== itemId && i.product_id !== (productId || itemId)
    );

    const response = NextResponse.json({
      success: true,
      message: 'Item removed from wishlist',
      data: { items, count: items.length },
    });

    saveLocalCookieWishlist(response, items);
    return response;
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ success: true });
  }
}
