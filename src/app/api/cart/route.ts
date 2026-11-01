import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

function formatProductObj(p: any) {
  if (!p) return undefined;
  const rawPrice = p.price != null && !isNaN(Number(p.price)) ? Number(p.price) : 999;
  const rawCompare = p.compare_at_price != null && !isNaN(Number(p.compare_at_price))
    ? Number(p.compare_at_price)
    : (p.original_price != null && !isNaN(Number(p.original_price)) ? Number(p.original_price) : null);

  let images: string[] = ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'];
  if (p.images) {
    try {
      const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
    } catch {
      if (p.image) images = [p.image];
    }
  } else if (p.image) {
    images = [p.image];
  }

  return {
    id: String(p.id),
    name: p.name || 'Artisan Hamper',
    slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'hamper',
    price: rawPrice,
    compare_at_price: rawCompare,
    images,
    stock: p.stock ?? p.stock_quantity ?? 25,
  };
}

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

async function enrichCartItems(cartItems: any[], supabase: any) {
  const productIds = cartItems
    .map((it) => it.product_id)
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => !isNaN(id));

  let productsMap = new Map<string, any>();
  if (productIds.length > 0) {
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      if (prods) {
        prods.forEach((p: any) => productsMap.set(String(p.id), formatProductObj(p)));
      }
    } catch {}
  }

  return cartItems.map((it) => {
    const pId = it.product_id ? String(it.product_id) : null;
    const prod = pId ? productsMap.get(pId) || it.product : it.product;
    const itemPrice = it.price_at_add ?? prod?.price ?? 0;

    return {
      id: String(it.id),
      product_id: pId,
      custom_hamper_id: it.custom_hamper_id ? String(it.custom_hamper_id) : null,
      quantity: it.quantity || 1,
      price_at_add: itemPrice,
      product: prod,
      custom_hamper: it.custom_hamper || undefined,
    };
  });
}

export async function GET() {
  try {
    const user = await getSessionUser();
    const cookieStore = cookies();
    const supabase = createClient();

    try {
      let cart = null;
      const sessionId = cookieStore.get('session_id')?.value;
      if (user) {
        const { data: userCart, error } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        cart = userCart;
      } else if (sessionId) {
        const { data: sessionCart, error } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();
        if (error) throw error;
        cart = sessionCart;
      }

      if (cart) {
        const { data: rawCartItems, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id);
        if (error) throw error;
        const enriched = await enrichCartItems(rawCartItems || [], supabase);
        const total = enriched.reduce((sum, item) => {
          const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
          return sum + Number(price) * item.quantity;
        }, 0);
        const count = enriched.reduce((sum, item) => sum + item.quantity, 0);

        return NextResponse.json({
          success: true,
          data: { items: enriched, total, count, source: user ? 'account' : 'session' },
        });
      }

      if (user) {
        return NextResponse.json({
          success: true,
          data: { items: [], total: 0, count: 0, source: 'account' },
        });
      }
    } catch (e) {
      console.warn('Supabase cart GET warning:', e);
    }

    const localCart = getLocalCookieCart();
    return NextResponse.json({
      success: true,
      data: { ...localCart, source: 'cookie' },
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
    const providedProduct = body.productDetails || body.product || null;

    if (!productId && !customHamperId) {
      return NextResponse.json(
        { success: false, error: 'Product ID or Custom Hamper ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let finalItems: any[] = [];
    let sessionIdToSet: string | null = null;
    let resolvedProduct: any = null;
    let productLookupFailed = false;

    if (productId) {
      try {
        let productQuery = supabase.from('products').select('*');
        const productSlug = String(providedProduct?.slug || '').trim();
        const numericId = Number(productId);
        if (productSlug) {
          productQuery = productQuery.eq('slug', productSlug);
        } else if (Number.isFinite(numericId)) {
          productQuery = productQuery.eq('id', numericId);
        } else {
          productQuery = productQuery.eq('slug', String(productId));
        }
        const { data, error } = await productQuery.maybeSingle();
        if (error) throw error;
        resolvedProduct = data;
      } catch (error) {
        productLookupFailed = true;
        console.warn('Could not resolve cart product before save:', error);
      }

      if (!resolvedProduct && !productLookupFailed) {
        return NextResponse.json(
          { success: false, error: 'This product is no longer available. Refresh the page and try again.' },
          { status: 404 }
        );
      }
    }

    // 1. Try Supabase Cart Persistence
    try {
      if (productId && !resolvedProduct) throw new Error('Product lookup unavailable; using cart fallback.');
      let cart = null;
      if (user) {
        const { data: userCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

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
          sessionIdToSet = sessionId;
        }

        const { data: sessionCart } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();

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

      if (cart && (!productId || resolvedProduct)) {
        const validProductId = resolvedProduct?.id ?? null;
        const priceAtAdd = resolvedProduct?.price != null
          ? Number(resolvedProduct.price)
          : Number(body.price) || (providedProduct?.price ? Number(providedProduct.price) : 0);

        let existingItem = null;
        if (validProductId !== null) {
          const { data } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq('product_id', validProductId)
            .maybeSingle();
          existingItem = data;
        } else if (customHamperId) {
          const numCustom = Number(customHamperId);
          if (!isNaN(numCustom)) {
            const { data } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('cart_id', cart.id)
              .eq('custom_hamper_id', numCustom)
              .maybeSingle();
            existingItem = data;
          }
        }

        if (existingItem) {
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
        } else {
          const insertPayload: any = {
            cart_id: cart.id,
            product_id: validProductId,
            quantity,
            price_at_add: priceAtAdd,
          };
          const numCustom = Number(customHamperId);
          if (!isNaN(numCustom)) {
            insertPayload.custom_hamper_id = numCustom;
          }
          await supabase.from('cart_items').insert(insertPayload);
        }

        const { data: rawCartItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id);

        if (rawCartItems && rawCartItems.length > 0) {
          finalItems = await enrichCartItems(rawCartItems, supabase);
        }
      }
    } catch (sbErr) {
      console.warn('Supabase cart persistence warning:', sbErr);
    }

    // 2. Cookie Fallback (or supplement)
    if (finalItems.length === 0) {
      const localCart = getLocalCookieCart();
      const currentItems = [...localCart.items];

      let formattedProd = formatProductObj(providedProduct);
      if (!formattedProd && productId) {
        try {
          const sqliteRows = await querySqlite(`SELECT * FROM products WHERE id = ? OR slug = ?`, [productId, productId]);
          if (sqliteRows && sqliteRows.length > 0) {
            formattedProd = formatProductObj(sqliteRows[0]);
          }
        } catch {}
      }

      const itemPrice = Number(body.price) || formattedProd?.price || 0;
      const existingIdx = currentItems.findIndex(
        (it) => (productId && (it.product_id === productId || it.product?.id === productId || it.product?.slug === productId))
      );

      if (existingIdx >= 0) {
        currentItems[existingIdx].quantity += quantity;
        if (formattedProd) {
          currentItems[existingIdx].product = formattedProd;
        }
      } else {
        currentItems.push({
          id: `item-${Date.now()}`,
          product_id: productId || null,
          custom_hamper_id: customHamperId || null,
          quantity,
          price_at_add: itemPrice,
          product: formattedProd,
          custom_hamper: customHamperId ? { id: customHamperId, name: body.name || 'Custom Hamper', total_price: itemPrice } : undefined,
        });
      }

      finalItems = currentItems;
    }

    const total = finalItems.reduce((sum, item) => {
      const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
      return sum + Number(price) * item.quantity;
    }, 0);
    const count = finalItems.reduce((sum, item) => sum + item.quantity, 0);

    const response = NextResponse.json({
      success: true,
      message: 'Added to cart successfully!',
      data: { items: finalItems, total, count },
    });

    if (sessionIdToSet) {
      response.cookies.set('session_id', sessionIdToSet, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }
    saveLocalCookieCart(response, finalItems);
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
    const user = await getSessionUser();
    const cookieStore = cookies();
    const body = await request.json();
    const itemId = body.item_id;
    const quantity = Math.max(0, body.quantity || 0);

    const supabase = createClient();
    try {
      const numItemId = Number(itemId);
      if (!isNaN(numItemId)) {
        if (quantity === 0) {
          await supabase.from('cart_items').delete().eq('id', numItemId);
        } else {
          await supabase.from('cart_items').update({ quantity }).eq('id', numItemId);
        }
      }
    } catch {}

    const localCart = getLocalCookieCart();
    let updated = [...localCart.items];
    if (quantity === 0) {
      updated = updated.filter((it) => it.id !== itemId);
    } else {
      updated = updated.map((it) => (it.id === itemId ? { ...it, quantity } : it));
    }

    const total = updated.reduce((s, i) => s + (i.custom_hamper?.total_price ?? i.product?.price ?? i.price_at_add ?? 0) * i.quantity, 0);
    const count = updated.reduce((s, i) => s + i.quantity, 0);

    const response = NextResponse.json({
      success: true,
      data: { items: updated, total, count },
    });
    saveLocalCookieCart(response, updated);
    return response;
  } catch (err) {
    console.error('Cart PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update quantity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const supabase = createClient();

    if (itemId) {
      try {
        const numItemId = Number(itemId);
        if (!isNaN(numItemId)) {
          await supabase.from('cart_items').delete().eq('id', numItemId);
        }
      } catch {}

      const localCart = getLocalCookieCart();
      const updated = localCart.items.filter((it) => it.id !== itemId);
      const total = updated.reduce((s, i) => s + (i.custom_hamper?.total_price ?? i.product?.price ?? i.price_at_add ?? 0) * i.quantity, 0);
      const count = updated.reduce((s, i) => s + i.quantity, 0);

      const response = NextResponse.json({
        success: true,
        data: { items: updated, total, count },
      });
      saveLocalCookieCart(response, updated);
      return response;
    } else {
      // Clear entire cart
      try {
        const user = await getSessionUser();
        if (user) {
          const { data: c } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
          if (c) await supabase.from('cart_items').delete().eq('cart_id', c.id);
        }
      } catch {}

      const response = NextResponse.json({
        success: true,
        data: { items: [], total: 0, count: 0 },
      });
      saveLocalCookieCart(response, []);
      return response;
    }
  } catch (err) {
    console.error('Cart DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
