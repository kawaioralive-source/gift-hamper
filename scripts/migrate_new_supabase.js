const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:daxmu8-sajgih-seThok@db.qeptxbbzsnzwgulxigle.supabase.co:5432/postgres';

async function migrate() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to new Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected! Creating tables...');

  // 1. Create all necessary tables
  await client.query(`
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      phone VARCHAR(50),
      phone_verified BOOLEAN DEFAULT false,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Products Table
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE,
      category VARCHAR(100) NOT NULL,
      price NUMERIC NOT NULL,
      original_price NUMERIC,
      rating NUMERIC DEFAULT 5.0,
      reviews_count INT DEFAULT 12,
      image TEXT NOT NULL,
      images TEXT NOT NULL,
      description TEXT NOT NULL,
      items TEXT NOT NULL,
      tag VARCHAR(100),
      stock INT DEFAULT 50,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Custom Items Table
    CREATE TABLE IF NOT EXISTS custom_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price NUMERIC NOT NULL,
      image TEXT NOT NULL,
      description TEXT
    );

    -- Orders Table
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      user_id INT,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      recipient_name VARCHAR(255) NOT NULL,
      recipient_phone VARCHAR(50),
      recipient_address TEXT NOT NULL,
      delivery_date VARCHAR(100) NOT NULL,
      delivery_time_slot VARCHAR(100) DEFAULT '10 AM - 1 PM',
      delivery_slot VARCHAR(100) DEFAULT 'morning',
      gift_message TEXT,
      is_surprise_gift INT DEFAULT 0,
      secret_message TEXT DEFAULT '',
      items TEXT NOT NULL,
      subtotal NUMERIC,
      shipping_amount NUMERIC,
      packaging_amount NUMERIC,
      packaging_type VARCHAR(100),
      total_amount NUMERIC NOT NULL,
      payment_status VARCHAR(100) DEFAULT 'paid',
      order_status VARCHAR(100) DEFAULT 'confirmed',
      tracking_number VARCHAR(100),
      payment_method VARCHAR(100) DEFAULT 'Razorpay Live',
      cod_fee NUMERIC DEFAULT 0.0,
      payment_details TEXT DEFAULT '{}',
      payment_id VARCHAR(255),
      session_id VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Items Table
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT,
      quantity INT DEFAULT 1,
      price NUMERIC NOT NULL,
      total_price NUMERIC NOT NULL,
      name VARCHAR(255),
      image TEXT,
      custom_items TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Coupons Table
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      percentage NUMERIC NOT NULL DEFAULT 10.0,
      discount_type VARCHAR(50) DEFAULT 'percentage',
      discount_value NUMERIC DEFAULT 10.0,
      min_spend NUMERIC DEFAULT 0.0,
      max_uses INT DEFAULT 0,
      times_used INT DEFAULT 0,
      expiry_date VARCHAR(100) DEFAULT NULL,
      applicable_category VARCHAR(100) DEFAULT 'all',
      is_active INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Discounts Table (mirrors coupons)
    CREATE TABLE IF NOT EXISTS discounts (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      percentage NUMERIC NOT NULL DEFAULT 10.0,
      discount_type VARCHAR(50) DEFAULT 'percentage',
      discount_value NUMERIC DEFAULT 10.0,
      min_spend NUMERIC DEFAULT 0.0,
      max_uses INT DEFAULT 0,
      times_used INT DEFAULT 0,
      expiry_date VARCHAR(100) DEFAULT NULL,
      applicable_category VARCHAR(100) DEFAULT 'all',
      is_active INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Addresses Table
    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) DEFAULT 'India',
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Reviews Table
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INT,
      user_id INT,
      user_name VARCHAR(255) NOT NULL,
      rating NUMERIC NOT NULL DEFAULT 5.0,
      comment TEXT NOT NULL,
      photo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Wishlists Table
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    -- Wishlist Items Table
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id SERIAL PRIMARY KEY,
      wishlist_id INT,
      product_id INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Carts Table
    CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(100),
      session_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Cart Items Table
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      cart_id INT,
      product_id INT,
      quantity INT DEFAULT 1,
      custom_hamper_id INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Custom Hampers Table
    CREATE TABLE IF NOT EXISTS custom_hampers (
      id SERIAL PRIMARY KEY,
      user_id INT,
      name VARCHAR(255),
      total_price NUMERIC,
      items TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INT,
      amount NUMERIC NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_method VARCHAR(100),
      payment_status VARCHAR(100),
      payment_id VARCHAR(255),
      receipt_number VARCHAR(100),
      details TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Delivery Zones Table
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id SERIAL PRIMARY KEY,
      pincode VARCHAR(20) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      is_serviceable BOOLEAN DEFAULT true,
      shipping_fee NUMERIC DEFAULT 0,
      estimated_days INT DEFAULT 2,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Profiles Table
    CREATE TABLE IF NOT EXISTS profiles (
      id INT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255),
      avatar_url TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- System Config Table
    CREATE TABLE IF NOT EXISTS system_config (
      config_key VARCHAR(100) PRIMARY KEY,
      config_value TEXT NOT NULL
    );

    -- Gift Cards Table
    CREATE TABLE IF NOT EXISTS gift_cards (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      initial_balance NUMERIC NOT NULL,
      current_balance NUMERIC NOT NULL,
      is_active INT DEFAULT 1,
      expiry_date VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Mobile OTP Audit Table
    CREATE TABLE IF NOT EXISTS mobile_otp_audit (
      id SERIAL PRIMARY KEY,
      mobile VARCHAR(50) NOT NULL,
      otp_code VARCHAR(20) NOT NULL,
      status VARCHAR(50) DEFAULT 'VERIFIED',
      user_id INT,
      ip_address VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables created. Granting permissions...');
  await client.query(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
  `);

  // Enable RLS with permissive policies for anon and authenticated
  const tables = [
    'users', 'products', 'custom_items', 'orders', 'order_items', 'coupons',
    'discounts', 'addresses', 'reviews', 'wishlists', 'wishlist_items', 'carts',
    'cart_items', 'custom_hampers', 'payments', 'delivery_zones', 'profiles',
    'system_config', 'gift_cards', 'mobile_otp_audit'
  ];

  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'Allow public access to ${table}'
          ) THEN
            CREATE POLICY "Allow public access to ${table}" ON public.${table}
            FOR ALL TO anon, authenticated, service_role
            USING (true)
            WITH CHECK (true);
          END IF;
        END $$;
      `);
    } catch (e) {
      console.warn(`Policy notice for ${table}:`, e.message);
    }
  }

  console.log('Permissions & RLS policies configured. Seeding data...');

  // Seed Admin user
  const adminHash = await bcrypt.hash('Kawaiora1Himanshu', 10);
  await client.query(`
    INSERT INTO users (id, name, email, password, role, phone, phone_verified)
    VALUES (1, 'KawaiOra Administrator', 'admin@kawaiora.com', $1, 'admin', '+919876543210', true)
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      password = EXCLUDED.password,
      role = EXCLUDED.role;
  `, [adminHash]);
  await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);

  // Seed welcome promo code
  await client.query(`
    INSERT INTO coupons (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, expiry_date, applicable_category, is_active)
    VALUES ('WELCOME10', 10.0, 'percentage', 10.0, 0.0, 0, 0, NULL, 'all', 1)
    ON CONFLICT (code) DO UPDATE SET is_active = 1, percentage = 10.0;

    INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, expiry_date, applicable_category, is_active)
    VALUES ('WELCOME10', 10.0, 'percentage', 10.0, 0.0, 0, 0, NULL, 'all', 1)
    ON CONFLICT (code) DO UPDATE SET is_active = 1, percentage = 10.0;
  `);

  // Seed 8 Artisan Luxury Products
  const products = [
    {
      id: 13,
      name: 'Grand Royal Celebration Hamper',
      slug: 'grand-royal-celebration',
      category: 'Luxury',
      price: 14999,
      original_price: 17999,
      rating: 4.9,
      reviews_count: 48,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'The pinnacle of elegance featuring imported French sparkling wine, artisanal Swiss chocolates, truffle crackers, and handcrafted candles.',
      items: JSON.stringify(['Domaine Vintage Brut 750ml', 'Lindt Excellence Dark Collection 200g', 'Artisanal White Truffle Crackers', 'Hand-poured Soy Candle (Lavender & Vanilla)', 'Gold Satin Gift Box']),
      tag: 'Bestseller',
      stock: 30
    },
    {
      id: 14,
      name: 'Artisanal Chocolate & Wine Opulence',
      slug: 'artisanal-chocolate-wine',
      category: 'Romantic',
      price: 11950,
      original_price: 13500,
      rating: 4.8,
      reviews_count: 32,
      image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Express your feelings with aged Pinot Noir, handcrafted belgian truffles, dark chocolate almond bark, and a plush romantic card.',
      items: JSON.stringify(['Napa Valley Cabernet Sauvignon', 'Belgian Chocolate Truffle Box (16pcs)', 'Organic Raspberry Jam', 'Rose Gold Stainless Tumbler', 'Romantic Greeting Card']),
      tag: 'Trending',
      stock: 25
    },
    {
      id: 15,
      name: 'Executive Corporate Achievement Crate',
      slug: 'executive-corporate-crate',
      category: 'Corporate',
      price: 18900,
      original_price: 21000,
      rating: 5.0,
      reviews_count: 19,
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Make a lasting professional impression with premium single malt whiskey, roasted macadamia nuts, leather journal, and luxury pen set.',
      items: JSON.stringify(['Glenfiddich 12 Year Single Malt', 'Smoked Honey Macadamias 150g', 'Genuine Leather Daily Planner', 'Parker Ballpoint Pen', 'Rustic Oak Wooden Crate']),
      tag: 'Corporate Fav',
      stock: 40
    },
    {
      id: 16,
      name: 'Sweet Birthday Delight Basket',
      slug: 'sweet-birthday-basket',
      category: 'Birthday',
      price: 7999,
      original_price: 8999,
      rating: 4.7,
      reviews_count: 56,
      image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Bring joy on their special day with colorful birthday macarons, gourmet caramel popcorn, birthday confetti, and a soft teddy bear.',
      items: JSON.stringify(['Assorted French Macarons (12pcs)', 'Gourmet Salted Caramel Popcorn', 'Huggy Bear Plushie (8")', 'Sparkling Cider 750ml', 'Custom Birthday Card']),
      tag: 'Popular',
      stock: 50
    },
    {
      id: 17,
      name: 'Zen Wellness & Spa Retreat Hamper',
      slug: 'zen-wellness-spa',
      category: 'Wellness',
      price: 9500,
      original_price: 11000,
      rating: 4.9,
      reviews_count: 27,
      image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Recharge mind and soul with organic herbal chamomile tea, silk eye mask, eucalyptus bath salts, and essential oil diffuser.',
      items: JSON.stringify(['Loose Leaf Chamomile Tea', '100% Mulberry Silk Sleep Mask', 'Dead Sea Eucalyptus Bath Salts', 'Ultrasonic Aroma Diffuser', 'Sandalwood Incense Sticks']),
      tag: 'Relaxation',
      stock: 35
    },
    {
      id: 18,
      name: 'Festival Sunshine & Treats Basket',
      slug: 'festival-sunshine-treats',
      category: 'Festive',
      price: 8550,
      original_price: 9900,
      rating: 4.8,
      reviews_count: 41,
      image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Spread holiday cheer with organic honey, butter cookies, roasted pistachios, dried fruits, and festive golden ornaments.',
      items: JSON.stringify(['Danish Butter Cookies Tin', 'Raw Organic Wildflower Honey', 'Roasted Salted Pistachios 200g', 'Dried Apricots & Figs Box', 'Golden Gift Ornament']),
      tag: 'Festive Special',
      stock: 45
    },
    {
      id: 19,
      name: 'Pure Serenity Herbal Aromatherapy Box',
      slug: 'pure-serenity-herbal-box',
      category: 'Wellness',
      price: 6499,
      original_price: 7499,
      rating: 4.9,
      reviews_count: 18,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Handpicked calming botanicals, herbal infusion blends, and calming amber incense sticks for serene moments.',
      items: JSON.stringify(['Organic Herbal Tisane', 'Handmade Ceramic Mug', 'Amber Glass Soy Candle', 'Natural Incense Sticks']),
      tag: 'Eco-Luxury',
      stock: 20
    },
    {
      id: 20,
      name: 'Golden Gourmet Caviar & Cheese Trunk',
      slug: 'golden-gourmet-caviar-trunk',
      category: 'Luxury',
      price: 22500,
      original_price: 26000,
      rating: 5.0,
      reviews_count: 14,
      image: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'Finest artisanal European cheeses, royal Siberian caviar, mother-of-pearl spoons, and crystal flute glasses.',
      items: JSON.stringify(['Imperial Caviar 50g', 'Aged Truffle Gouda 250g', 'Handcrafted Crystal Flutes', 'Artisan Crispbreads']),
      tag: 'Royal Trunk',
      stock: 15
    }
  ];

  for (const p of products) {
    await client.query(`
      INSERT INTO products (id, name, slug, category, price, original_price, rating, reviews_count, image, images, description, items, tag, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        image = EXCLUDED.image,
        images = EXCLUDED.images,
        description = EXCLUDED.description,
        items = EXCLUDED.items,
        tag = EXCLUDED.tag,
        stock = EXCLUDED.stock;
    `, [p.id, p.name, p.slug, p.category, p.price, p.original_price, p.rating, p.reviews_count, p.image, p.images, p.description, p.items, p.tag, p.stock]);
  }
  await client.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));`);

  // Seed custom items
  const customItems = [
    [1, 'Handwoven Luxury Wicker Basket', 'box', 25.0, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', 'Classic handwoven willow wicker basket with dual leather straps.'],
    [2, 'Midnight Velvet Ribbon Box', 'box', 20.0, 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80', 'Deep midnight black rigid gift box tied with plush crimson velvet ribbon.'],
    [3, 'Rustic Oak Wooden Crate', 'box', 30.0, 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80', 'Solid natural oak keepsake crate with brass hardware and sliding lid.'],
    [4, 'Blush Pink Hexagon Box', 'box', 18.0, 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80', 'Modern geometric gift box in pastel blush with rose gold embossing.'],
    [5, 'French Artisan Macarons (6pcs)', 'treat', 16.0, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80', 'Delicate almond meringue shells filled with pistachio, raspberry & vanilla.'],
    [6, 'Swiss Dark Chocolate Truffles', 'treat', 14.5, 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80', 'Rich 70% cocoa truffles dusted in premium Dutch cocoa powder.'],
    [7, 'Salted Caramel Gourmet Popcorn', 'treat', 8.5, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80', 'Air-popped corn coated in velvety kettle-cooked butter caramel.'],
    [8, 'Smoked Honey Roasted Cashews', 'treat', 10.0, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 'Jumbo cashew nuts slowly roasted with wild mountain honey.'],
    [9, 'Moet & Chandon Imperial Champagne', 'beverage', 65.0, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', '750ml bottle of radiant French champagne with bright fruitiness.'],
    [10, 'Napa Reserve Cabernet Sauvignon', 'beverage', 35.0, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80', 'Full-bodied red wine with aromas of blackberry, cassis and cedar.'],
    [11, 'Organic Earl Grey Loose Tea', 'beverage', 12.0, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', 'Ceylon black tea infused with natural Italian bergamot essential oil.'],
    [12, 'Artisanal Espresso Beans 250g', 'beverage', 14.0, 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80', 'Medium dark roasted 100% Arabica beans from Ethiopian highlands.'],
    [13, 'Hand-poured Amber Soy Candle', 'keepsake', 18.0, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80', 'Clean-burning soy wax in amber jar with French lavender & vanilla notes.'],
    [14, 'Cuddle Teddy Bear Plushie (10")', 'keepsake', 15.0, 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80', 'Ultra-soft plush bear with satin bowtie suitable for all ages.'],
    [15, 'Engraved Stainless Tumbler', 'keepsake', 22.0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', 'Double-wall vacuum insulated rose gold tumbler keeps drinks cold 12h.'],
    [16, 'Fresh Lavender & Rose Bouquet', 'keepsake', 24.0, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80', 'Dried aromatic French lavender stems paired with miniature preserved roses.'],
    [17, 'Gold Foil Calligraphy Greeting Card', 'card', 4.5, 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80', 'Heavyweight cotton cardstock with hand-pressed gold foil embellishment.'],
    [18, 'Minimalist Botanical Gift Card', 'card', 4.0, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', 'Eco-friendly recycled kraft card featuring delicate leaf embossing.']
  ];

  for (const item of customItems) {
    await client.query(`
      INSERT INTO custom_items (id, name, category, price, image, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        image = EXCLUDED.image,
        description = EXCLUDED.description;
    `, item);
  }
  await client.query(`SELECT setval('custom_items_id_seq', (SELECT MAX(id) FROM custom_items));`);

  // Seed sample customer orders
  const orders = [
    {
      id: 27,
      order_number: 'KAW26102001',
      user_id: 1,
      customer_name: 'Ananya Sharma',
      customer_email: 'ananya.sharma@gmail.com',
      customer_phone: '+919820145821',
      recipient_name: 'Ananya Sharma',
      recipient_phone: '+919820145821',
      recipient_address: JSON.stringify({
        address_line_1: '402 Sea Face Towers',
        address_line_2: 'Bandra West, Sea Face Promenade',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400050',
        country: 'India',
      }),
      delivery_date: '2026-10-22',
      delivery_time_slot: 'morning',
      delivery_slot: 'morning',
      gift_message: 'Wishing you a grand celebration filled with warmth, love, and joyful memories!',
      items: JSON.stringify([
        {
          product_id: '13',
          name: 'Grand Royal Celebration Hamper',
          quantity: 1,
          price: 14999,
          total_price: 14999,
          image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        }
      ]),
      total_amount: 14999,
      payment_status: 'paid',
      order_status: 'delivered',
      tracking_number: 'TRK-KAW26102001',
      payment_method: 'Razorpay Live (UPI)',
      payment_details: JSON.stringify({
        id: 'pay_P14999ananya',
        method: 'upi',
        vpa: 'ananya@oksbi',
        order_id: 'order_RZP1499901',
        status: 'captured',
        acquirer_data: { rrn: '984512763201', upi_transaction_id: 'UPI984512763201' },
      })
    }
  ];

  for (const o of orders) {
    await client.query(`
      INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, recipient_name, recipient_phone, recipient_address, delivery_date, delivery_time_slot, delivery_slot, gift_message, items, total_amount, payment_status, order_status, tracking_number, payment_method, payment_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        order_number = EXCLUDED.order_number,
        order_status = EXCLUDED.order_status,
        payment_status = EXCLUDED.payment_status;
    `, [o.id, o.order_number, o.user_id, o.customer_name, o.customer_email, o.customer_phone, o.recipient_name, o.recipient_phone, o.recipient_address, o.delivery_date, o.delivery_time_slot, o.delivery_slot, o.gift_message, o.items, o.total_amount, o.payment_status, o.order_status, o.tracking_number, o.payment_method, o.payment_details]);
  }
  await client.query(`SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));`);

  console.log('Seeding completed successfully!');
  await client.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
