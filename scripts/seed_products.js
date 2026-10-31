const fs = require('fs');
const { execSync } = require('child_process');

// Read environment
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const products = [
  {
    name: 'Grand Royal Celebration Hamper',
    slug: 'grand-royal-celebration',
    category: 'Luxury',
    price: 14999,
    original_price: 17999,
    compare_at_price: 17999,
    base_price: 14999,
    rating: 4.9,
    reviews_count: 48,
    stock: 25,
    tag: 'Bestseller',
    description: 'The pinnacle of luxury gifting. Includes imported French sparkling wine, artisanal Swiss chocolate truffles, rosemary truffle crackers, hand-poured lavender soy candle, gold-embossed bespoke keepsake greeting card, and velvet-lined luxury gift trunk.',
    short_description: 'French sparkling wine, Swiss chocolate truffles, rosemary truffle crackers & lavender soy candle.',
    items: JSON.stringify([
      'Imported French Sparkling Wine (750ml)',
      'Handcrafted Swiss Chocolate Truffles (Pack of 16)',
      'Rosemary & Black Truffle Sea Salt Crackers (150g)',
      'Hand-Poured Lavender Botanical Soy Candle (200g)',
      'Bespoke Gold Foil Artisan Greeting Card',
      'Signature KawaiOra Velvet Lined Wooden Trunk'
    ]),
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513885535751-8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Artisanal Chocolate & Wine Opulence',
    slug: 'artisanal-chocolate-wine',
    category: 'Romantic',
    price: 11950,
    original_price: 13500,
    compare_at_price: 13500,
    base_price: 11950,
    rating: 4.8,
    reviews_count: 32,
    stock: 18,
    tag: 'Trending',
    description: 'A romantic pairing of aged reserve Pinot Noir red wine, Belgian handmade praline truffles, sea salt dark chocolate almond bark, roasted hazelnut spread, luxury scented votive, and plush satin gift wrap.',
    short_description: 'Aged Pinot Noir wine, Belgian praline truffles & dark chocolate almond bark.',
    items: JSON.stringify([
      'Reserve Vintage Pinot Noir (750ml)',
      'Belgian Handmade Pralines & Dark Truffles (200g)',
      'Sea Salt Caramel Almond Bark (180g)',
      'Artisanal Hazelnut Cocoa Butter Spread (150g)',
      'Hand-Poured Amber & Vanilla Votive Candle',
      'Luxury Crimson Ribbon Presentation Box'
    ]),
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Executive Corporate Achievement Crate',
    slug: 'executive-corporate-crate',
    category: 'Corporate',
    price: 18900,
    original_price: 21000,
    compare_at_price: 21000,
    base_price: 18900,
    rating: 5.0,
    reviews_count: 19,
    stock: 12,
    tag: 'Corporate Fav',
    description: 'Premium corporate achievement crate crafted for milestones, client appreciation, and executive honors. Features aged single malt scotch, roasted smoked macadamias, Italian full-grain leather journal, brass rollerball pen, and dark espresso beans in a cedarwood box.',
    short_description: 'Single malt scotch, roasted macadamias, Italian leather journal & brass pen.',
    items: JSON.stringify([
      'Single Malt Scotch Whiskey (700ml)',
      'Roasted & Smoked Macadamia Nuts (200g)',
      'Full-Grain Italian Leather Executive Journal',
      'Heavyweight Brass Rollerball Pen in Presentation Case',
      'Arabica Single-Origin Espresso Beans (250g)',
      'Laser-Engraved Artisan Cedar Keepsake Crate'
    ]),
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Sweet Birthday Delight Basket',
    slug: 'sweet-birthday-basket',
    category: 'Birthday',
    price: 7999,
    original_price: 8999,
    compare_at_price: 8999,
    base_price: 7999,
    rating: 4.7,
    reviews_count: 56,
    stock: 30,
    tag: 'Popular',
    description: 'Bring unbridled joy to their special day with handcrafted French macarons, gourmet salted caramel popcorn, birthday party poppers, organic fruit sparkling cider, a miniature plush keepsake bear, and festive celebratory packaging.',
    short_description: 'French macarons, salted caramel popcorn & plush birthday keepsake bear.',
    items: JSON.stringify([
      'Assorted French Macarons Box (Pack of 12)',
      'Gourmet Salted Caramel Artisan Popcorn (150g)',
      'Sparkling Wildberry Fruit Nectar (750ml)',
      'Handmade Soft Plush Birthday Teddy Bear',
      'Gold Glitter Birthday Candle Set & Party Confetti',
      'Vibrant Pastel Birthday Presentation Hamper'
    ]),
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Zen Wellness & Spa Retreat Hamper',
    slug: 'zen-wellness-spa',
    category: 'Wellness',
    price: 9500,
    original_price: 11000,
    compare_at_price: 11000,
    base_price: 9500,
    rating: 4.9,
    reviews_count: 27,
    stock: 20,
    tag: 'Relaxation',
    description: 'Recharge mind, body, and spirit with organic whole-leaf chamomile blossom tea, 100% pure mulberry silk eye mask, Dead Sea eucalyptus bath salts, ultrasound ceramic aromatherapy diffuser, soothing pure lavender oil, and organic honey dipper.',
    short_description: 'Organic chamomile tea, 100% mulberry silk eye mask, bath salts & ceramic diffuser.',
    items: JSON.stringify([
      'Organic Egyptian Chamomile Blossom Tea (100g)',
      'Pure 22-Momme Mulberry Silk Sleep Mask',
      'Dead Sea Mineral Eucalyptus Bath Soak (300g)',
      'Ultrasonic Aromatherapy Ceramic Diffuser',
      '100% Pure Organic French Lavender Essential Oil (15ml)',
      'Eco-Friendly Bamboo & Linen Gift Hamper'
    ]),
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Festival Sunshine & Treats Basket',
    slug: 'festival-sunshine-treats',
    category: 'Festive',
    price: 8550,
    original_price: 9900,
    compare_at_price: 9900,
    base_price: 8550,
    rating: 4.8,
    reviews_count: 41,
    stock: 24,
    tag: 'Festive Special',
    description: 'Spread warmth and celebratory radiance with organic raw mountain honey, Danish golden butter cookies, slow-roasted Californian pistachios, jumbo Medjool dates, saffron threads, and handcrafted golden festive keepsake diyas.',
    short_description: 'Raw mountain honey, Danish butter cookies, roasted pistachios & brass diyas.',
    items: JSON.stringify([
      'Raw Himalayan Wildflower Honey (350g)',
      'Artisanal Danish Butter Cookies in Embossed Tin (300g)',
      'Roasted & Lightly Salted Pistachios (250g)',
      'Premium Medjool Dates Stuffed with Almonds (200g)',
      'Kashmir Mongra Grade Saffron (1g)',
      'Hand-Carved Brass Decorative Festive Diyas (Set of 2)'
    ]),
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Pure Serenity Herbal Aromatherapy Box',
    slug: 'pure-serenity-herbal-box',
    category: 'Wellness',
    price: 6499,
    original_price: 7500,
    compare_at_price: 7500,
    base_price: 6499,
    rating: 4.9,
    reviews_count: 18,
    stock: 22,
    tag: 'New Arrival',
    description: 'A gentle embrace of serenity featuring restorative botanical bath bombs, organic rose petal facial mist, cold-pressed jojoba massage oil, herbal peppermint infusion tea, and natural loofah scrubbers.',
    short_description: 'Lavender & rose bath bombs, organic rose mist, cold-pressed jojoba oil & peppermint tea.',
    items: JSON.stringify([
      'Artisanal Lavender & Rose Bath Bombs (Set of 4)',
      'Organic Damask Rose Petal Facial Hydrating Mist (100ml)',
      'Cold-Pressed Jojoba Botanical Body Oil (120ml)',
      'Organic Whole Peppermint Herbal Infusion (80g)',
      'Natural Egyptian Loofah & Sisal Body Scrubber',
      'Eco-Friendly Recycled Kraft Presentation Gift Box'
    ]),
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80'
    ])
  },
  {
    name: 'Golden Gourmet Caviar & Cheese Trunk',
    slug: 'golden-gourmet-caviar-trunk',
    category: 'Luxury',
    price: 22500,
    original_price: 25000,
    compare_at_price: 25000,
    base_price: 22500,
    rating: 5.0,
    reviews_count: 14,
    stock: 10,
    tag: 'Ultra Luxury',
    description: 'The imperial standard in gastronomy. Featuring sustainable Ossetra Royal Caviar, mother-of-pearl tasting spoons, aged 24-month Parmigiano Reggiano, Spanish saffron infused wildflower honey, black winter truffle carpaccio, and gold leaf water crackers.',
    short_description: 'Imperial Ossetra Caviar, mother-of-pearl spoons, 24-month Parmigiano & black truffle carpaccio.',
    items: JSON.stringify([
      'Sustainable Imperial Ossetra Sturgeon Caviar (50g)',
      'Hand-Carved Mother-of-Pearl Caviar Tasting Spoons (Pair)',
      'Aged 24-Month Parmigiano Reggiano Wedge (250g)',
      'Umbrian Black Winter Truffle Carpaccio (90g)',
      'Spanish Saffron Infused Raw Acacia Honey (200g)',
      'Handcrafted Solid Teakwood Brass-Studded Presentation Trunk'
    ]),
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ])
  }
];

async function run() {
  console.log('--- 1. Resetting Supabase Products ---');
  await supabase.from('products').delete().neq('id', 0);
  const { data: supaData, error: supaErr } = await supabase.from('products').insert(products).select();
  if (supaErr) {
    console.error('Supabase insert error:', supaErr);
  } else {
    console.log('Successfully inserted', supaData.length, 'products into Supabase!');
  }

  console.log('--- 2. Resetting SQLite Products ---');
  const pythonScript = `
import sqlite3, json
conn = sqlite3.connect('gifthampers.db')
cur = conn.cursor()
cur.execute('DELETE FROM products')
with open('temp_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)
for p in products:
    cur.execute('''
        INSERT INTO products (name, slug, category, price, original_price, rating, reviews_count, image, images, description, items, tag, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (p['name'], p['slug'], p['category'], p['price'], p['original_price'], p['rating'], p['reviews_count'], p['image'], p['images'], p['description'], p['items'], p['tag'], p['stock']))
conn.commit()
cur.execute('SELECT count(*), name, slug FROM products GROUP BY slug')
print('SQLite successfully seeded:', cur.fetchall())
`;
  fs.writeFileSync('temp_products.json', JSON.stringify(products));
  fs.writeFileSync('temp_seed.py', pythonScript);
  const out = execSync('python temp_seed.py', { encoding: 'utf8' });
  console.log(out);
  fs.unlinkSync('temp_products.json');
  fs.unlinkSync('temp_seed.py');
  console.log('--- Products Reset Complete! ---');
}

run();
