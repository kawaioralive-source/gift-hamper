import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { querySqlite } from '@/lib/sqlite';

export const dynamic = 'force-dynamic';

function formatCustomItems(items: any[]) {
  const formattedItems = items.map((item: any) => ({
    id: String(item.id),
    name: item.name,
    slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    description: item.description || null,
    category: item.category as 'box' | 'treat' | 'beverage' | 'keepsake' | 'card' | 'packaging',
    price: item.price ? (item.price < 50 ? item.price * 100 : item.price) : 299,
    cost_price: null,
    sku: `CI-${item.id}`,
    image_url: item.image || item.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    stock: 50,
    low_stock_threshold: 5,
    track_inventory: true,
    specifications: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const packagingItems = [
    {
      id: 'pkg-1',
      name: 'Signature Botanical Ribbon & Wax Seal',
      slug: 'signature-ribbon-seal',
      description: 'Hand-tied satin ribbon with KawaiOra golden wax emblem',
      category: 'packaging' as const,
      price: 299,
      cost_price: null,
      sku: 'PKG-001',
      image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      stock: 100,
      low_stock_threshold: 10,
      track_inventory: true,
      specifications: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pkg-2',
      name: 'Eco Velvet Gift Bag & Foliage Accents',
      slug: 'eco-velvet-bag',
      description: 'Reusable emerald green velvet pouch with dried eucalyptus sprigs',
      category: 'packaging' as const,
      price: 499,
      cost_price: null,
      sku: 'PKG-002',
      image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80',
      stock: 100,
      low_stock_threshold: 10,
      track_inventory: true,
      specifications: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const all = [...formattedItems, ...packagingItems];

  return {
    box: all.filter(i => i.category === 'box'),
    treat: all.filter(i => i.category === 'treat'),
    beverage: all.filter(i => i.category === 'beverage'),
    keepsake: all.filter(i => i.category === 'keepsake'),
    card: all.filter(i => i.category === 'card'),
    packaging: all.filter(i => i.category === 'packaging'),
  };
}

export async function GET() {
  // 1. Try Supabase first
  try {
    const supabase = createAdminClient();
    const { data: items, error } = await supabase
      .from('custom_items')
      .select('*')
      .order('id', { ascending: true });

    if (!error && Array.isArray(items) && items.length > 0) {
      const res = NextResponse.json({
        success: true,
        data: formatCustomItems(items),
      });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res;
    }
  } catch {}

  // 2. SQLite fallback
  try {
    const sqliteItems = await querySqlite(`SELECT * FROM custom_items`);
    const res = NextResponse.json({
      success: true,
      data: formatCustomItems(sqliteItems),
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (error) {
    console.error('Custom builder fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load custom builder options' },
      { status: 500 }
    );
  }
}
