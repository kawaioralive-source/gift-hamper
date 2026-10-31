import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatCustomItem(row: any) {
  const rawPrice = row.price != null && !isNaN(Number(row.price)) ? Number(row.price) : 299;
  return {
    id: String(row.id),
    name: row.name,
    category: row.category,
    price: rawPrice < 50 ? rawPrice * 100 : rawPrice,
    raw_price: rawPrice,
    image: row.image || row.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    description: row.description || '',
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const id = resolved.id;
    const numId = Number(id);

    const body = await request.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.image !== undefined) updateData.image = body.image;
    if (body.description !== undefined) updateData.description = body.description;

    let updatedItem = null;

    // 1. Supabase update
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('custom_items')
        .update(updateData)
        .eq('id', numId)
        .select()
        .single();

      if (!error && data) {
        updatedItem = formatCustomItem(data);
      }
    } catch (e) {
      console.warn('Supabase update custom_items error:', e);
    }

    // 2. Direct PG update if available
    try {
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:daxmu8-sajgih-seThok@db.qeptxbbzsnzwgulxigle.supabase.co:5432/postgres';
      if (!updatedItem && dbUrl) {
        const { Client } = await import('pg');
        const pgClient = new Client({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
        });
        await pgClient.connect();
        const sets: string[] = [];
        const vals: any[] = [];
        let i = 1;
        for (const [k, v] of Object.entries(updateData)) {
          sets.push(`${k} = $${i}`);
          vals.push(v);
          i++;
        }
        vals.push(numId);
        const res = await pgClient.query(`UPDATE custom_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
        await pgClient.end();
        if (res.rows && res.rows[0]) {
          updatedItem = formatCustomItem(res.rows[0]);
        }
      }
    } catch (e) {
      console.warn('Direct PG update error:', e);
    }

    // 3. SQLite update
    try {
      const sets: string[] = [];
      const vals: any[] = [];
      for (const [k, v] of Object.entries(updateData)) {
        sets.push(`${k} = ?`);
        vals.push(v);
      }
      vals.push(numId);
      await executeSqlite(`UPDATE custom_items SET ${sets.join(', ')} WHERE id = ?`, vals);
      if (!updatedItem) {
        updatedItem = { id: String(numId), ...updateData };
      }
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('Admin custom item update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const resolved = await Promise.resolve(params);
    const id = resolved.id;
    const numId = Number(id);

    // 1. Supabase delete
    try {
      const supabase = createAdminClient();
      await supabase.from('custom_items').delete().eq('id', numId);
    } catch (e) {
      console.error('Supabase delete custom_items error:', e);
    }

    // 2. Direct PG delete
    try {
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:daxmu8-sajgih-seThok@db.qeptxbbzsnzwgulxigle.supabase.co:5432/postgres';
      if (dbUrl) {
        const { Client } = await import('pg');
        const pgClient = new Client({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
        });
        await pgClient.connect();
        await pgClient.query('DELETE FROM custom_items WHERE id = $1', [numId]);
        await pgClient.end();
      }
    } catch (e) {
      console.warn('Direct PG delete error:', e);
    }

    // 3. SQLite delete
    try {
      await executeSqlite('DELETE FROM custom_items WHERE id = ?', [numId]);
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Item deleted permanently from database',
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('Admin custom item delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
