import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { createClient } from '@/lib/supabase/server';
import { querySqlite } from '@/lib/sqlite';
import { ProductStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { ProductWithRelations } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

const DEMO_PRODUCTS: Record<string, any> = {
  'grand-royal-celebration': {
    id: '1',
    name: 'Grand Royal Celebration Hamper',
    slug: 'grand-royal-celebration',
    description: 'The pinnacle of luxury gifting. Includes imported French sparkling wine, artisanal Swiss chocolate truffles, rosemary truffle crackers, hand-poured lavender soy candle, gold-embossed bespoke keepsake greeting card, and velvet-lined luxury gift trunk.',
    short_description: 'French sparkling wine, Swiss chocolate truffles, rosemary truffle crackers & lavender soy candle.',
    price: 14999,
    compare_at_price: 17999,
    cost_price: 8000,
    sku: 'ROYAL-001',
    barcode: null,
    weight: 3.5,
    dimensions: '40x30x20 cm',
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513885535751-8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.9,
    review_count: 48,
    stock: 25,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-1',
    occasion_id: 'occ-1',
    recipient_id: 'rec-1',
    tags: ['luxury', 'sparkling wine', 'chocolates'],
    meta_title: 'Grand Royal Celebration Hamper',
    meta_description: 'Luxury gift hamper featuring imported sparkling wine and artisanal truffles.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-1', name: 'Luxury', slug: 'luxury' },
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
    recipient: { id: 'rec-1', name: 'For Couple', slug: 'couple' },
    items: [],
  },
  'artisanal-chocolate-wine': {
    id: '2',
    name: 'Artisanal Chocolate & Wine Opulence',
    slug: 'artisanal-chocolate-wine',
    description: 'A romantic pairing of aged reserve Pinot Noir red wine, Belgian handmade praline truffles, sea salt dark chocolate almond bark, roasted hazelnut spread, luxury scented votive, and plush satin gift wrap.',
    short_description: 'Aged Pinot Noir wine, Belgian praline truffles & dark chocolate almond bark.',
    price: 11950,
    compare_at_price: 13500,
    cost_price: 6000,
    sku: 'WINE-002',
    barcode: null,
    weight: 2.8,
    dimensions: '35x25x18 cm',
    images: [
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.8,
    review_count: 32,
    stock: 18,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-2',
    occasion_id: 'occ-2',
    recipient_id: 'rec-2',
    tags: ['romantic', 'wine', 'truffles'],
    meta_title: 'Artisanal Chocolate & Wine Opulence',
    meta_description: 'Romantic wine and chocolate gift hamper.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-2', name: 'Romantic', slug: 'romantic' },
    occasion: { id: 'occ-2', name: 'Anniversary', slug: 'anniversary' },
    items: [],
  },
  'executive-corporate-crate': {
    id: '3',
    name: 'Executive Corporate Achievement Crate',
    slug: 'executive-corporate-crate',
    description: 'Premium corporate achievement crate crafted for milestones, client appreciation, and executive honors. Features aged single malt scotch, roasted smoked macadamias, Italian full-grain leather journal, brass rollerball pen, and dark espresso beans in a cedarwood box.',
    short_description: 'Single malt scotch, roasted macadamias, Italian leather journal & brass pen.',
    price: 18900,
    compare_at_price: 21000,
    cost_price: 10000,
    sku: 'CORP-003',
    barcode: null,
    weight: 4.0,
    dimensions: '45x35x22 cm',
    images: [
      'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 5.0,
    review_count: 19,
    stock: 12,
    low_stock_threshold: 3,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-3',
    occasion_id: 'occ-3',
    recipient_id: 'rec-3',
    tags: ['corporate', 'whiskey', 'executive'],
    meta_title: 'Executive Corporate Achievement Crate',
    meta_description: 'Luxury executive corporate gift crate.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-3', name: 'Corporate', slug: 'corporate' },
    occasion: { id: 'occ-3', name: 'Corporate', slug: 'corporate' },
    items: [],
  },
  'sweet-birthday-basket': {
    id: '4',
    name: 'Sweet Birthday Delight Basket',
    slug: 'sweet-birthday-basket',
    description: 'Bring unbridled joy to their special day with handcrafted French macarons, gourmet salted caramel popcorn, birthday party poppers, organic fruit sparkling cider, a miniature plush keepsake bear, and festive celebratory packaging.',
    short_description: 'French macarons, salted caramel popcorn & plush birthday keepsake bear.',
    price: 7999,
    compare_at_price: 8999,
    cost_price: 4000,
    sku: 'BDAY-004',
    barcode: null,
    weight: 2.2,
    dimensions: '30x25x15 cm',
    images: [
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.7,
    review_count: 56,
    stock: 30,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    is_active: true,
    status: 'active',
    category_id: 'cat-4',
    occasion_id: 'occ-4',
    recipient_id: 'rec-4',
    tags: ['birthday', 'macarons', 'teddy'],
    meta_title: 'Sweet Birthday Delight Basket',
    meta_description: 'Sweet birthday gift basket with macarons and plush bear.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-4', name: 'Birthday', slug: 'birthday' },
    occasion: { id: 'occ-4', name: 'Birthday', slug: 'birthday' },
    items: [],
  },
  'zen-wellness-spa': {
    id: '5',
    name: 'Zen Wellness & Spa Retreat Hamper',
    slug: 'zen-wellness-spa',
    description: 'Recharge mind, body, and spirit with organic whole-leaf chamomile blossom tea, 100% pure mulberry silk eye mask, Dead Sea eucalyptus bath salts, ultrasound ceramic aromatherapy diffuser, soothing pure lavender oil, and organic honey dipper.',
    short_description: 'Organic chamomile tea, 100% mulberry silk eye mask, bath salts & ceramic diffuser.',
    price: 9500,
    compare_at_price: 11000,
    cost_price: 4500,
    sku: 'ZEN-005',
    barcode: null,
    weight: 2.5,
    dimensions: '32x24x16 cm',
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.9,
    review_count: 27,
    stock: 20,
    low_stock_threshold: 4,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-5',
    occasion_id: 'occ-5',
    recipient_id: 'rec-5',
    tags: ['wellness', 'spa', 'self-care'],
    meta_title: 'Zen Wellness & Spa Retreat Hamper',
    meta_description: 'Relaxing spa and wellness gift hamper.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-5', name: 'Wellness', slug: 'wellness' },
    occasion: { id: 'occ-5', name: 'Wellness', slug: 'wellness' },
    items: [],
  },
  'festival-sunshine-treats': {
    id: '6',
    name: 'Festival Sunshine & Treats Basket',
    slug: 'festival-sunshine-treats',
    description: 'Spread warmth and celebratory radiance with organic raw mountain honey, Danish golden butter cookies, slow-roasted Californian pistachios, jumbo Medjool dates, saffron threads, and handcrafted golden festive keepsake diyas.',
    short_description: 'Raw mountain honey, Danish butter cookies, roasted pistachios & brass diyas.',
    price: 8550,
    compare_at_price: 9900,
    cost_price: 4200,
    sku: 'FEST-006',
    barcode: null,
    weight: 2.6,
    dimensions: '30x25x18 cm',
    images: [
      'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.8,
    review_count: 41,
    stock: 24,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-6',
    occasion_id: 'occ-6',
    recipient_id: 'rec-6',
    tags: ['festive', 'cookies', 'dry fruits'],
    meta_title: 'Festival Sunshine & Treats Basket',
    meta_description: 'Festive treats and holiday gift basket.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-6', name: 'Festive', slug: 'festive' },
    occasion: { id: 'occ-6', name: 'Festival', slug: 'festival' },
    items: [],
  },
  'pure-serenity-herbal-box': {
    id: '7',
    name: 'Pure Serenity Herbal Aromatherapy Box',
    slug: 'pure-serenity-herbal-box',
    description: 'A gentle embrace of serenity featuring restorative botanical bath bombs, organic rose petal facial mist, cold-pressed jojoba massage oil, herbal peppermint infusion tea, and natural loofah scrubbers.',
    short_description: 'Lavender & rose bath bombs, organic rose mist, cold-pressed jojoba oil & peppermint tea.',
    price: 6499,
    compare_at_price: 7500,
    cost_price: 3200,
    sku: 'SER-007',
    barcode: null,
    weight: 2.1,
    dimensions: '28x22x14 cm',
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 4.9,
    review_count: 18,
    stock: 22,
    low_stock_threshold: 4,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    is_active: true,
    status: 'active',
    category_id: 'cat-5',
    occasion_id: 'occ-5',
    recipient_id: 'rec-5',
    tags: ['wellness', 'aromatherapy', 'bath'],
    meta_title: 'Pure Serenity Herbal Aromatherapy Box',
    meta_description: 'Gentle herbal aromatherapy wellness hamper.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-5', name: 'Wellness', slug: 'wellness' },
    occasion: { id: 'occ-5', name: 'Wellness', slug: 'wellness' },
    items: [],
  },
  'golden-gourmet-caviar-trunk': {
    id: '8',
    name: 'Golden Gourmet Caviar & Cheese Trunk',
    slug: 'golden-gourmet-caviar-trunk',
    description: 'The imperial standard in gastronomy. Featuring sustainable Ossetra Royal Caviar, mother-of-pearl tasting spoons, aged 24-month Parmigiano Reggiano, Spanish saffron infused wildflower honey, black winter truffle carpaccio, and gold leaf water crackers.',
    short_description: 'Imperial Ossetra Caviar, mother-of-pearl spoons, 24-month Parmigiano & black truffle carpaccio.',
    price: 22500,
    compare_at_price: 25000,
    cost_price: 12000,
    sku: 'CAV-008',
    barcode: null,
    weight: 4.2,
    dimensions: '42x32x22 cm',
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    videos: [],
    rating: 5.0,
    review_count: 14,
    stock: 10,
    low_stock_threshold: 2,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    is_active: true,
    status: 'active',
    category_id: 'cat-1',
    occasion_id: 'occ-1',
    recipient_id: 'rec-1',
    tags: ['luxury', 'caviar', 'cheese', 'gourmet'],
    meta_title: 'Golden Gourmet Caviar & Cheese Trunk',
    meta_description: 'Imperial luxury caviar, artisan cheese and truffle trunk.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-1', name: 'Luxury', slug: 'luxury' },
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
    items: [],
  }
};

function formatDbProduct(p: any): ProductWithRelations {
  const rawPrice = p.price != null && !isNaN(Number(p.price)) ? Number(p.price) : 999;
  const rawOrig = p.original_price != null && !isNaN(Number(p.original_price))
    ? Number(p.original_price)
    : (p.compare_at_price != null && !isNaN(Number(p.compare_at_price)) ? Number(p.compare_at_price) : null);
  const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  let images = ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'];
  if (p.images) {
    try {
      const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
    } catch {}
  } else if (p.image) {
    images = [p.image];
  }

  const catName = typeof p.category === 'object' && p.category?.name ? p.category.name : (p.category || 'Luxury');

  return {
    id: String(p.id),
    name: p.name,
    slug,
    description: p.description || p.name,
    short_description: p.short_description || p.description || p.name,
    price: rawPrice,
    base_price: rawPrice,
    compare_at_price: rawOrig,
    original_price: rawOrig,
    cost_price: null,
    sku: p.sku || `HAMPER-${p.id}`,
    barcode: null,
    weight: p.weight ? Number(p.weight) : null,
    dimensions: p.dimensions || null,
    images,
    videos: [],
    rating: Number(p.rating) || 4.9,
    review_count: Number(p.reviews_count || p.review_count) || 12,
    stock: p.stock ?? 25,
    low_stock_threshold: 5,
    track_inventory: true,
    allow_backorder: false,
    is_customizable: true,
    is_featured: true,
    is_bestseller: p.tag === 'Bestseller' || p.is_bestseller === true,
    is_new_arrival: p.tag === 'New Arrival' || p.is_new_arrival === true,
    is_active: true,
    status: 'active',
    category_id: 'cat-1',
    occasion_id: 'occ-1',
    recipient_id: 'rec-1',
    tags: p.tags ? (typeof p.tags === 'string' ? p.tags.split(',') : p.tags) : [],
    meta_title: p.name,
    meta_description: p.short_description || p.description || p.name,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 'cat-1', name: catName, slug: catName.toLowerCase() },
    occasion: { id: 'occ-1', name: 'Anniversary', slug: 'anniversary' },
    recipient: { id: 'rec-1', name: 'For Loved Ones', slug: 'loved-ones' },
    items: [],
  } as unknown as ProductWithRelations;
}

async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  // 1. Try Supabase
  try {
    const supabase = createClient();
    const { data: dbProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && dbProduct) {
      return formatDbProduct(dbProduct);
    }
  } catch {}

  // 2. Try SQLite
  try {
    const sqliteProducts = await querySqlite('SELECT * FROM products WHERE slug = ? OR id = ? LIMIT 1', [slug, slug]);
    if (sqliteProducts && sqliteProducts.length > 0) {
      return formatDbProduct(sqliteProducts[0]);
    }
  } catch {}

  // 3. Thematic fallback
  return (DEMO_PRODUCTS[slug] || null) as unknown as ProductWithRelations | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (product) {
    return {
      title: product.name,
      description: product.short_description || `Shop ${product.name} - KawaiOra Artisan Hampers`,
    };
  }

  return { title: 'Product Details | KawaiOra Artisan Hampers' };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const found = await getProductBySlug(slug);
  const activeProduct: ProductWithRelations = (found || DEMO_PRODUCTS['grand-royal-celebration']) as unknown as ProductWithRelations;

  const reviews: any[] = [];
  const relatedProducts: any[] = Object.values(DEMO_PRODUCTS).filter((p) => p.slug !== slug);

  return (
    <>
      <ProductStructuredData
        name={activeProduct.name}
        description={activeProduct.description || activeProduct.short_description || ''}
        images={activeProduct.images || []}
        price={activeProduct.price}
        currency="INR"
        availability={activeProduct.stock > 0 ? 'InStock' : 'OutOfStock'}
        sku={activeProduct.sku || undefined}
        brand="KawaiOra Artisan Hampers"
        category={activeProduct.category?.name}
        rating={activeProduct.rating}
        reviewCount={activeProduct.review_count}
        url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://hamper-snowy.vercel.app'}/products/${activeProduct.slug}`}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hamper-snowy.vercel.app'}/` },
          { name: 'Shop', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hamper-snowy.vercel.app'}/shop` },
          { name: activeProduct.category?.name || 'Products', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hamper-snowy.vercel.app'}/shop?category=${activeProduct.category?.slug}` },
          { name: activeProduct.name, url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hamper-snowy.vercel.app'}/products/${activeProduct.slug}` },
        ]}
      />
      <ProductDetailClient
        initialProduct={activeProduct}
        initialReviews={reviews}
        initialRelatedProducts={relatedProducts}
      />
    </>
  );
}
