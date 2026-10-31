import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatProductDetailAdmin(p: any) {
  const rawPrice = p.price != null && !isNaN(Number(p.price)) ? Number(p.price) : 999;
  const rawOrig = p.original_price != null && !isNaN(Number(p.original_price)) ? Number(p.original_price) : (p.compare_at_price != null && !isNaN(Number(p.compare_at_price)) ? Number(p.compare_at_price) : null);
  const roundedPrice = rawPrice;
  const roundedOrig = rawOrig;
  const img = p.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

  let images = [img];
  if (p.images) {
    try {
      const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
    } catch {}
  }

  const categoryName = typeof p.category === 'object' && p.category?.name ? p.category.name : (p.category || 'Luxury');

  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    price: roundedPrice,
    base_price: roundedPrice,
    compare_at_price: roundedOrig,
    original_price: roundedOrig,
    description: p.description || p.name,
    short_description: p.short_description || p.description || p.name,
    stock: p.stock ?? p.stock_quantity ?? 25,
    stock_quantity: p.stock ?? p.stock_quantity ?? 25,
    sku: p.sku || `HAMPER-${p.id}`,
    status: p.status || 'active',
    tag: p.tag || 'Popular',
    is_featured: true,
    is_bestseller: p.tag === 'Bestseller' || p.is_bestseller === true,
    category: { name: categoryName, slug: categoryName.toLowerCase() },
    category_id: categoryName,
    image: img,
    images,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Try Supabase first
    try {
      const supabase = createClient();
      const numId = Number(id);
      let query = supabase.from('products').select('*');
      if (!isNaN(numId)) {
        query = query.or(`id.eq.${numId},slug.eq.${id}`);
      } else {
        query = query.eq('slug', id);
      }

      const { data: products, error } = await query.limit(1);

      if (!error && products && products.length > 0) {
        return NextResponse.json({
          success: true,
          data: formatProductDetailAdmin(products[0]),
        });
      }
    } catch {}

    const numId = Number(id);
    const queryId = !isNaN(numId) ? numId : id;
    const sqliteProducts = await querySqlite(`SELECT * FROM products WHERE id = ? OR slug = ?`, [queryId, queryId]);
    if (sqliteProducts && sqliteProducts.length > 0) {
      return NextResponse.json({
        success: true,
        data: formatProductDetailAdmin(sqliteProducts[0]),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Admin product fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolved = await Promise.resolve(params);
    const id = resolved.id;
    const body = await request.json();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const numId = Number(id);
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.category_id !== undefined && !body.category) updateData.category = body.category_id;
    if (body.price !== undefined || body.base_price !== undefined) {
      const pVal = Number(body.price ?? body.base_price);
      updateData.price = pVal;
      updateData.base_price = pVal;
    }
    if (body.compare_at_price !== undefined || body.original_price !== undefined) {
      const orig = Number(body.compare_at_price ?? body.original_price) || null;
      updateData.original_price = orig;
      updateData.compare_at_price = orig;
    }
    if (body.description !== undefined || body.short_description !== undefined) {
      updateData.description = body.description || body.short_description;
    }
    if (body.stock !== undefined || body.stock_quantity !== undefined) {
      const sVal = Number(body.stock ?? body.stock_quantity);
      updateData.stock = sVal;
      updateData.stock_quantity = sVal;
    }
    if (body.images && Array.isArray(body.images)) {
      const sanitizedImages = body.images.filter(Boolean).slice(0, 6);
      updateData.images = JSON.stringify(sanitizedImages);
      if (sanitizedImages.length > 0 && !body.image) {
        updateData.image = sanitizedImages[0];
      }
    } else if (body.images) {
      updateData.images = typeof body.images === 'string' ? body.images : JSON.stringify(body.images);
    }
    if (body.image) updateData.image = body.image;
    if (body.tag) updateData.tag = body.tag;

    // Try Supabase first
    try {
      const supabase = createClient();
      let query = supabase.from('products').update(updateData);
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('slug', id);
      }
      const { data: updatedSupabase, error } = await query.select().single();
      if (!error && updatedSupabase) {
        return NextResponse.json({
          success: true,
          message: 'Product updated successfully',
          data: formatProductDetailAdmin(updatedSupabase),
        });
      }
    } catch {}

    // SQLite fallback
    const fields: string[] = [];
    const values: any[] = [];
    if (updateData.name !== undefined) { fields.push('name = ?'); values.push(updateData.name); }
    if (updateData.category !== undefined) { fields.push('category = ?'); values.push(updateData.category); }
    if (updateData.price !== undefined) { fields.push('price = ?'); values.push(updateData.price); }
    if (updateData.original_price !== undefined) { fields.push('original_price = ?'); values.push(updateData.original_price); }
    if (updateData.stock !== undefined) { fields.push('stock = ?'); values.push(updateData.stock); }
    if (updateData.description !== undefined) { fields.push('description = ?'); values.push(updateData.description); }
    if (updateData.image !== undefined) { fields.push('image = ?'); values.push(updateData.image); }
    if (updateData.images !== undefined) { fields.push('images = ?'); values.push(updateData.images); }
    if (updateData.tag !== undefined) { fields.push('tag = ?'); values.push(updateData.tag); }

    if (fields.length > 0) {
      values.push(numId || id);
      await executeSqlite(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const rows = await querySqlite(`SELECT * FROM products WHERE id = ?`, [numId || id]);
    const updated = rows[0] || { id, ...updateData };

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: formatProductDetailAdmin(updated),
    });
  } catch (error) {
    console.error('Admin product update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const numId = Number(id);

    try {
      const supabase = createClient();
      let query = supabase.from('products').delete();
      if (!isNaN(numId)) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('slug', id);
      }
      await query;
    } catch {}

    await executeSqlite(`DELETE FROM products WHERE id = ?`, [numId || id]);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Admin product delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
