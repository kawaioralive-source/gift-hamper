import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatProductRowAdmin(p: any) {
  const rawPrice = p.price != null && !isNaN(Number(p.price)) ? Number(p.price) : 999;
  const rawOriginalPrice = p.original_price != null && !isNaN(Number(p.original_price)) ? Number(p.original_price) : (p.compare_at_price != null && !isNaN(Number(p.compare_at_price)) ? Number(p.compare_at_price) : null);
  const roundedPrice = rawPrice;
  const roundedOrig = rawOriginalPrice;
  const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  let images = ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'];
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

  const categoryName = typeof p.category === 'object' && p.category?.name ? p.category.name : (p.category || 'Luxury');

  return {
    id: String(p.id),
    name: p.name,
    slug,
    short_description: p.short_description || p.description || p.name,
    description: p.description || p.name,
    price: roundedPrice,
    base_price: roundedPrice,
    compare_at_price: roundedOrig,
    original_price: roundedOrig,
    rating: Number(p.rating) || 4.8,
    review_count: Number(p.reviews_count || p.review_count) || 12,
    images,
    image: p.image || images[0],
    stock: p.stock ?? p.stock_quantity ?? 25,
    stock_quantity: p.stock ?? p.stock_quantity ?? 25,
    low_stock_threshold: p.low_stock_threshold || 5,
    sku: p.sku || `HAMPER-${p.id}`,
    is_active: true,
    status: 'active',
    is_featured: true,
    is_bestseller: p.tag === 'Bestseller' || p.is_bestseller === true,
    is_customizable: true,
    category: { id: 'cat-1', name: categoryName, slug: categoryName.toLowerCase() },
    category_id: categoryName,
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
  };
}

async function getSqliteProducts(search?: string | null) {
  let sqliteQuery = `SELECT * FROM products WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    sqliteQuery += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const sqliteProducts = await querySqlite(sqliteQuery, params);
  return sqliteProducts.map(formatProductRowAdmin);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 1. Try Supabase
    try {
      const supabase = createClient();
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: products, error, count } = await query;
      if (!error && Array.isArray(products)) {
        const response = NextResponse.json({
          success: true,
          data: products.map(formatProductRowAdmin),
          pagination: {
            page,
            limit,
            total: count != null ? count : products.length,
            total_pages: Math.ceil((count != null ? count : products.length) / limit) || 1,
          },
        });
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return response;
      }
    } catch {
      // Supabase failed, fall through to SQLite
    }

    const formattedProducts = await getSqliteProducts(search);
    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        page: 1,
        limit,
        total: formattedProducts.length,
        total_pages: 1,
      },
    });
  } catch (error) {
    console.error('Admin products API error:', error);
    try {
      const formattedProducts = await getSqliteProducts();
      return NextResponse.json({
        success: true,
        data: formattedProducts,
        pagination: { page: 1, limit: 20, total: formattedProducts.length, total_pages: 1 },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const name = body.name || 'New Artisan Hamper';
    const price = (body.price !== undefined && !isNaN(Number(body.price))) ? Number(body.price) : ((body.base_price !== undefined && !isNaN(Number(body.base_price))) ? Number(body.base_price) : 4999);
    const originalPrice = (body.compare_at_price !== undefined && !isNaN(Number(body.compare_at_price))) ? Number(body.compare_at_price) : ((body.original_price !== undefined && !isNaN(Number(body.original_price))) ? Number(body.original_price) : null);
    const category = body.category || body.category_id || 'Luxury';
    const description = body.description || body.short_description || name;
    const stock = Number(body.stock ?? body.stock_quantity ?? 20);
    const rawImages: string[] = Array.isArray(body.images) && body.images.length > 0
      ? body.images.filter(Boolean).slice(0, 6)
      : (body.image ? [body.image] : ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80']);
    const image = rawImages[0];
    const imagesJson = JSON.stringify(rawImages);
    const tag = body.tag || (body.is_bestseller ? 'Bestseller' : (body.is_new_arrival ? 'New Arrival' : 'Popular'));

    // Try Supabase first
    try {
      const supabase = createClient();
      const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name,
          slug,
          category,
          price,
          original_price: originalPrice,
          description,
          stock,
          image,
          images: imagesJson,
          items: '[]',
          tag,
          rating: 5.0,
          reviews_count: 1,
        })
        .select()
        .single();

      if (!error && product) {
        return NextResponse.json({
          success: true,
          message: 'Product created successfully',
          data: formatProductRowAdmin(product),
        });
      }
      if (error) {
        console.warn('Supabase product insert error, falling back:', error);
      }
    } catch (e) {
      console.warn('Supabase product insert exception:', e);
    }

    // SQLite fallback - persist into gifthampers.db
    const execRes = await executeSqlite(
      `INSERT INTO products (name, category, price, original_price, stock, description, image, items, tag, rating, reviews_count, images) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, 5.0, 1, ?)`,
      [name, category, price, originalPrice, stock, description, image, tag, imagesJson]
    );

    let newId = execRes.lastrowid ? String(execRes.lastrowid) : null;
    if (!newId) {
      const latestRows = await querySqlite(`SELECT id FROM products ORDER BY id DESC LIMIT 1`);
      newId = latestRows[0]?.id ? String(latestRows[0].id) : `prod-${Date.now()}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: newId,
        name,
        price,
        compare_at_price: originalPrice,
        category: { id: 'cat-1', name: category, slug: category.toLowerCase() },
        stock,
        description,
        image,
        images: rawImages,
        tag,
      },
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
