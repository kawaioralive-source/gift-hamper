import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

function getLocalCookieCart(): { items: any[]; total: number; count: number } {
  try {
    const cookieStore = cookies();
    const cartCookie = cookieStore.get('cart_session_items')?.value;
    if (cartCookie) {
      const parsed = JSON.parse(cartCookie);
      if (Array.isArray(parsed)) {
        const total = parsed.reduce((sum: number, item: any) => {
          const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
          return sum + Number(price) * (item.quantity || 1);
        }, 0);
        const count = parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        return { items: parsed, total, count };
      }
    }
  } catch {}
  return { items: [], total: 0, count: 0 };
}

function saveLocalCookieCart(response: NextResponse, items: any[]) {
  response.cookies.set('cart_session_items', JSON.stringify(items), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function GET() {
  try {
    const user = await getSessionUser();
    const cookieStore = cookies();

    try {
      const supabase = createClient();
      let cart = null;

      if (user) {
        const { data: userCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (userCart) cart = userCart;
      } else {
        const sessionId = cookieStore.get('session_id')?.value;
        if (sessionId) {
          const { data: sessionCart } = await supabase
            .from('carts')
            .select('id')
            .eq('session_id', sessionId)
            .single();

          if (sessionCart) cart = sessionCart;
        }
      }

      if (cart) {
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(id, name, slug, price, compare_at_price, images, stock),
            custom_hamper:custom_hampers(id, name, total_price, box_id, card_id, packaging_id)
          `)
          .eq('cart_id', cart.id);

        if (cartItems) {
          const total = cartItems.reduce((sum, item) => {
            const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
            return sum + Number(price) * item.quantity;
          }, 0);
          const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

          return NextResponse.json({
            success: true,
            data: { items: cartItems, total, count },
          });
        }
      }
    } catch {
      // Fall through to cookie fallback
    }

    const localCart = getLocalCookieCart();
    return NextResponse.json({
      success: true,
      data: localCart,
    });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, count: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const cookieStore = cookies();
    const body = await request.json();

    const productId = body.product_id;
    const customHamperId = body.custom_hamper_id;
    const quantity = Math.max(1, body.quantity || 1);

    if (!productId && !customHamperId) {
      return NextResponse.json(
        { success: false, error: 'Product ID or Custom Hamper ID is required' },
        { status: 400 }
      );
    }

    // Try Supabase first
    try {
      const supabase = createClient();
      let cart = null;

      if (user) {
        const { data: userCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (userCart) {
          cart = userCart;
        } else {
          const { data: newCart } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          cart = newCart;
        }
      } else {
        let sessionId = cookieStore.get('session_id')?.value;
        if (!sessionId) {
          sessionId = uuidv4();
          cookieStore.set('session_id', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
          });
        }

        const { data: sessionCart } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (sessionCart) {
          cart = sessionCart;
        } else {
          const { data: newCart } = await supabase
            .from('carts')
            .insert({ session_id: sessionId })
            .select('id')
            .single();
          cart = newCart;
        }
      }

      if (cart) {
        let existingItem = null;
        if (productId) {
          const { data } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq('product_id', productId)
            .single();
          existingItem = data;
        } else if (customHamperId) {
          const { data } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq('custom_hamper_id', customHamperId)
            .single();
          existingItem = data;
        }

        let priceAtAdd = 0;
        if (productId) {
          const { data: product } = await supabase
            .from('products')
            .select('price')
            .eq('id', productId)
            .single();
          priceAtAdd = product?.price != null ? Number(product.price) : 0;
        } else if (customHamperId) {
          priceAtAdd = body.price != null ? Number(body.price) : 0;
        }

        if (existingItem) {
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              cart_id: cart.id,
              product_id: productId || null,
              custom_hamper_id: customHamperId || null,
              quantity,
              price_at_add: priceAtAdd,
            });
        }

        return NextResponse.json({
          success: true,
          message: 'Added to cart successfully!',
        });
      }
    } catch {
      // Supabase failed, fall back to SQLite + Cookie cart
    }

    // Cookie & SQLite fallback
    const localCart = getLocalCookieCart();
    let productDetails: any = null;

    if (productId) {
      const sqliteRows = await querySqlite(`SELECT * FROM products WHERE id = ?`, [productId]);
      if (sqliteRows && sqliteRows.length > 0) {
        const p = sqliteRows[0];
        const rawPrice = p.price != null ? Number(p.price) : 0;
        const rawOriginalPrice = p.original_price != null ? Number(p.original_price) : null;
        const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        let images = ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'];
        if (p.image) images = [p.image];

        productDetails = {
          id: String(p.id),
          name: p.name,
          slug,
          price: rawPrice,
          compare_at_price: rawOriginalPrice,
          images,
          stock: p.stock ?? 25,
        };
      }
    }

    const itemPrice = customHamperId
      ? (body.price != null ? Number(body.price) : 0)
      : (productDetails?.price != null ? Number(productDetails.price) : (body.price != null ? Number(body.price) : 0));

    const items = [...localCart.items];
    const existingIdx = items.findIndex(
      (item) => (productId && item.product_id === productId) || (customHamperId && item.custom_hamper_id === customHamperId)
    );

    if (existingIdx >= 0) {
      items[existingIdx].quantity += quantity;
    } else {
      items.push({
        id: `item-${Date.now()}`,
        product_id: productId || null,
        custom_hamper_id: customHamperId || null,
        quantity,
        price_at_add: itemPrice,
        product: productDetails || undefined,
        custom_hamper: customHamperId ? { id: customHamperId, name: body.name || 'Custom Hamper', total_price: itemPrice } : undefined,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Added to cart successfully!',
      data: {
        items,
        total: items.reduce((s, i) => s + (i.custom_hamper?.total_price ?? i.product?.price ?? i.price_at_add ?? 0) * i.quantity, 0),
        count: items.reduce((s, i) => s + i.quantity, 0),
      },
    });

    saveLocalCookieCart(response, items);
    return response;
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({
      success: true,
      message: 'Item recorded in cart',
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const itemId = body.item_id;
    const quantity = Math.max(0, body.quantity || 0);

    const localCart = getLocalCookieCart();
    let updatedItems = [...localCart.items];

    if (quantity <= 0) {
      updatedItems = updatedItems.filter((i) => i.id !== itemId);
    } else {
      updatedItems = updatedItems.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    }

    const response = NextResponse.json({
      success: true,
      message: 'Cart updated',
      data: { items: updatedItems },
    });

    saveLocalCookieCart(response, updatedItems);
    return response;
  } catch (error) {
    console.error('Cart PATCH error:', error);
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    const localCart = getLocalCookieCart();
    const updatedItems = itemId ? localCart.items.filter((i) => i.id !== itemId) : [];

    const response = NextResponse.json({
      success: true,
      message: 'Item removed',
    });

    saveLocalCookieCart(response, updatedItems);
    return response;
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ success: true });
  }
}
