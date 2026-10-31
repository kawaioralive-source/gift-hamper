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

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // 1. Try Supabase
    try {
      const supabase = createAdminClient();
      let query = supabase.from('custom_items').select('*').order('id', { ascending: true });
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const res = NextResponse.json({
          success: true,
          data: data.map(formatCustomItem),
          total: data.length,
        });
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res;
      }
    } catch (e) {
      console.warn('Supabase custom_items fetch warning:', e);
    }

    // 2. SQLite fallback
    let sql = 'SELECT * FROM custom_items WHERE 1=1';
    const params: any[] = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY id ASC';

    const sqliteRows = await querySqlite(sql, params);
    const res = NextResponse.json({
      success: true,
      data: sqliteRows.map(formatCustomItem),
      total: sqliteRows.length,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (error) {
    console.error('Admin custom items GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch custom builder items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, price, image, description } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ success: false, error: 'Name, category, and price are required' }, { status: 400 });
    }

    const numPrice = Number(price);
    const imgUrl = image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80';
    const desc = description || '';

    let createdItem = null;

    // 1. Supabase insert
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('custom_items')
        .insert([{
          name,
          category,
          price: numPrice,
          image: imgUrl,
          description: desc,
        }])
        .select()
        .single();

      if (!error && data) {
        createdItem = formatCustomItem(data);
      }
    } catch (e) {
      console.warn('Supabase insert custom_items notice:', e);
    }

    // 2. Direct PG insert if available
    try {
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:daxmu8-sajgih-seThok@db.qeptxbbzsnzwgulxigle.supabase.co:5432/postgres';
      if (!createdItem && dbUrl) {
        const { Client } = await import('pg');
        const pgClient = new Client({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
        });
        await pgClient.connect();
        const res = await pgClient.query(
          'INSERT INTO custom_items (name, category, price, image, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, category, numPrice, imgUrl, desc]
        );
        await pgClient.end();
        if (res.rows && res.rows[0]) {
          createdItem = formatCustomItem(res.rows[0]);
        }
      }
    } catch (e) {
      console.warn('Direct PG insert error:', e);
    }

    // 3. SQLite insert
    try {
      const sqlRes = await executeSqlite(
        'INSERT INTO custom_items (name, category, price, image, description) VALUES (?, ?, ?, ?, ?)',
        [name, category, numPrice, imgUrl, desc]
      );
      if (!createdItem) {
        createdItem = {
          id: String(sqlRes.lastrowid || Date.now()),
          name,
          category,
          price: numPrice,
          raw_price: numPrice,
          image: imgUrl,
          description: desc,
        };
      }
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Spooky Builder item created successfully',
      data: createdItem,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('Admin custom items POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create Spooky Builder item' }, { status: 500 });
  }
}
