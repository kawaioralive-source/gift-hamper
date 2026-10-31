import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';

export const dynamic = 'force-dynamic';

function formatSingleProduct(p: any) {
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
    is_active: true,
    status: 'active',
    is_featured: true,
    is_bestseller: p.tag === 'Bestseller' || p.is_bestseller === true,
    is_customizable: true,
    category: { id: 'cat-1', name: categoryName, slug: categoryName.toLowerCase() },
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
    recipient: { id: 'rec-1', name: 'For Couple', slug: 'couple' },
    reviews: [],
    related_products: [],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // 1. Try Supabase first
    try {
      const supabase = createClient();
      let query = supabase.from('products').select('*');
      const numId = Number(id);
      if (!isNaN(numId)) {
        query = query.or(`id.eq.${numId},slug.eq.${id}`);
      } else {
        query = query.eq('slug', id);
      }

      const { data: products, error } = await query.limit(1);

      if (!error && products && products.length > 0) {
        return NextResponse.json({
          success: true,
          data: formatSingleProduct(products[0]),
        });
      }
    } catch {
      // Continue to SQLite fallback
    }

    // 2. SQLite fallback
    const sqliteProducts = await querySqlite(
      `SELECT * FROM products WHERE id = ? OR slug = ? OR LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) LIKE ?`,
      [id, id, `%${id.toLowerCase()}%`]
    );

    if (sqliteProducts && sqliteProducts.length > 0) {
      return NextResponse.json({
        success: true,
        data: formatSingleProduct(sqliteProducts[0]),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
