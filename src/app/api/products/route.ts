import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { ProductFilters } from '@/types';

export const dynamic = 'force-dynamic';

function formatProductRow(p: any) {
  const rawPrice = p.price != null && !isNaN(Number(p.price)) ? Number(p.price) : 999;
  const rawOriginalPrice = p.original_price != null && !isNaN(Number(p.original_price)) ? Number(p.original_price) : (p.compare_at_price != null && !isNaN(Number(p.compare_at_price)) ? Number(p.compare_at_price) : null);
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

  let items: any[] = [];
  if (p.items) {
    try {
      items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
    } catch {}
  }

  const categoryName = typeof p.category === 'object' && p.category?.name ? p.category.name : (p.category || 'Luxury');

  return {
    id: String(p.id),
    name: p.name,
    slug,
    short_description: p.short_description || p.description || p.name,
    description: p.description || p.name,
    price: rawPrice,
    base_price: rawPrice,
    compare_at_price: rawOriginalPrice,
    original_price: rawOriginalPrice,
    rating: Number(p.rating) || 5.0,
    review_count: Number(p.reviews_count || p.review_count) || 12,
    reviews_count: Number(p.reviews_count || p.review_count) || 12,
    images,
    image: p.image || images[0],
    items,
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
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
    recipient: { id: 'rec-1', name: 'For Couple', slug: 'couple' },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse filters
  const filters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    occasion: searchParams.get('occasion') || undefined,
    recipient: searchParams.get('recipient') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    in_stock: searchParams.get('in_stock') === 'true',
    is_customizable: searchParams.get('is_customizable') === 'true',
    is_featured: searchParams.get('is_featured') === 'true',
    is_bestseller: searchParams.get('is_bestseller') === 'true',
    is_new_arrival: searchParams.get('is_new_arrival') === 'true',
    tags: searchParams.get('tags')?.split(',').filter(Boolean),
    search: searchParams.get('search') || undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
  };

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 1. Try Supabase first
  try {
    const supabase = createClient();
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (filters.category) {
      const cleanCat = filters.category.trim();
      query = query.or(`category.ilike.%${cleanCat}%,name.ilike.%${cleanCat}%,description.ilike.%${cleanCat}%,tag.ilike.%${cleanCat}%`);
    }
    if (filters.occasion) {
      const cleanOcc = filters.occasion.trim();
      query = query.or(`category.ilike.%${cleanOcc}%,name.ilike.%${cleanOcc}%,description.ilike.%${cleanOcc}%,tag.ilike.%${cleanOcc}%`);
    }
    if (filters.search) {
      const term = filters.search.trim();
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%,tag.ilike.%${term}%`);
    }

    const { data: rawProducts, error, count } = await query;

    if (!error && Array.isArray(rawProducts)) {
      let formattedProducts = rawProducts.map(formatProductRow);

      if (filters.min_price !== undefined) {
        formattedProducts = formattedProducts.filter(p => p.price >= filters.min_price!);
      }
      if (filters.max_price !== undefined) {
        formattedProducts = formattedProducts.filter(p => p.price <= filters.max_price!);
      }
      if (filters.rating !== undefined) {
        formattedProducts = formattedProducts.filter(p => p.rating >= filters.rating!);
      }
      if (filters.in_stock) {
        formattedProducts = formattedProducts.filter(p => p.stock > 0);
      }

      if (filters.sort === 'price_asc') {
        formattedProducts.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        formattedProducts.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'rating') {
        formattedProducts.sort((a, b) => b.rating - a.rating);
      } else if (filters.sort === 'popular') {
        formattedProducts.sort((a, b) => b.review_count - a.review_count);
      }

      const total = count != null ? count : formattedProducts.length;
      const paginated = formattedProducts.slice(from, to + 1);

      const res = NextResponse.json({
        success: true,
        data: paginated,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res;
    }
  } catch {
    // Fall back to SQLite if Supabase is unavailable
  }

  // 2. SQLite fallback
  try {
    let sqliteQuery = `SELECT * FROM products WHERE 1=1`;
    const params: any[] = [];

    if (filters.category) {
      sqliteQuery += ` AND LOWER(category) = ?`;
      params.push(filters.category.toLowerCase());
    }
    if (filters.search) {
      sqliteQuery += ` AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)`;
      params.push(`%${filters.search.toLowerCase()}%`, `%${filters.search.toLowerCase()}%`);
    }

    const sqliteProducts = await querySqlite(sqliteQuery, params);
    let formattedProducts = sqliteProducts.map(formatProductRow);

    if (filters.min_price !== undefined) {
      formattedProducts = formattedProducts.filter(p => p.price >= filters.min_price!);
    }
    if (filters.max_price !== undefined) {
      formattedProducts = formattedProducts.filter(p => p.price <= filters.max_price!);
    }
    if (filters.rating !== undefined) {
      formattedProducts = formattedProducts.filter(p => p.rating >= filters.rating!);
    }
    if (filters.in_stock) {
      formattedProducts = formattedProducts.filter(p => p.stock > 0);
    }

    if (filters.sort === 'price_asc') {
      formattedProducts.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price_desc') {
      formattedProducts.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'rating') {
      formattedProducts.sort((a, b) => b.rating - a.rating);
    } else if (filters.sort === 'popular') {
      formattedProducts.sort((a, b) => b.review_count - a.review_count);
    }

    const total = formattedProducts.length;
    const paginated = formattedProducts.slice(from, to + 1);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    });
  } catch (sqliteErr) {
    console.error('Products fetch error:', sqliteErr);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
