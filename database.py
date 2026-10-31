import sqlite3
import hashlib
import json
import os

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except Exception:
    pass

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://qeptxbbzsnzwgulxigle.supabase.co')
SUPABASE_PUBLISHABLE_KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_UvAnIPMAC2g7ayTrg0duUw_ekACengE')
SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY', '')
SUPABASE_JWKS_URL = os.environ.get('SUPABASE_JWKS_URL', 'https://qeptxbbzsnzwgulxigle.supabase.co/auth/v1/.well-known/jwks.json')
SUPABASE_KEY = SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY

SUPABASE_DB_HOST = os.environ.get('SUPABASE_DB_HOST', 'aws-0-ap-south-1.pooler.supabase.com')
SUPABASE_DB_USER = os.environ.get('SUPABASE_DB_USER', 'postgres.mitqeainyathndvbzsrr')
SUPABASE_DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', 'ItShouldBeADifficultPassword')
SUPABASE_DB_NAME = os.environ.get('SUPABASE_DB_NAME', 'postgres')
SUPABASE_DB_PORT = int(os.environ.get('SUPABASE_DB_PORT', 5432))

def get_pg_connection():
    try:
        import pg8000.native
        return pg8000.native.Connection(
            user=SUPABASE_DB_USER,
            password=SUPABASE_DB_PASS,
            host=SUPABASE_DB_HOST,
            port=SUPABASE_DB_PORT,
            database=SUPABASE_DB_NAME,
            ssl_context=True
        )
    except Exception as e:
        print("Supabase PG connection error:", e)
        return None

def query_supabase_pg(sql, **kwargs):
    conn = get_pg_connection()
    if conn:
        try:
            res = conn.run(sql, **kwargs)
            conn.close()
            return res
        except Exception as e:
            print("PostgreSQL Query Error:", e)
            try:
                conn.close()
            except Exception:
                pass
    return None


def get_supabase_client():
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        return None

def supabase_rest_request(table_name, method='GET', payload=None, params=''):
    import urllib.request
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table_name}{params}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    data_bytes = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content) if content else True
    except Exception as e:
        return None

DB_FILE = os.path.join(os.path.dirname(__file__), 'gifthampers.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Products table (Hampers) - now with 'images' JSON text
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 12,
        image TEXT NOT NULL,
        images TEXT NOT NULL, -- JSON list of multiple image URLs
        description TEXT NOT NULL,
        items TEXT NOT NULL, -- JSON list of included items
        tag TEXT,
        stock INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Migration check: Add 'images' column if upgrading existing database
    cursor.execute("PRAGMA table_info(products)")
    columns = [col['name'] for col in cursor.fetchall()]
    if 'images' not in columns:
        cursor.execute("ALTER TABLE products ADD COLUMN images TEXT")
        # Populate existing rows' images with [image]
        cursor.execute("SELECT id, image FROM products")
        rows = cursor.fetchall()
        for r in rows:
            cursor.execute("UPDATE products SET images = ? WHERE id = ?", (json.dumps([r['image']]), r['id']))

    # System Config Table (For Cloudinary, Payment Credentials & System Settings)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS system_config (
        config_key TEXT PRIMARY KEY,
        config_value TEXT NOT NULL
    )
    ''')

    # Seed default Payment Configuration in system_config if missing
    cursor.execute("SELECT config_value FROM system_config WHERE config_key = 'payment_mode'")
    if not cursor.fetchone():
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('payment_mode', 'sandbox')")
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('merchant_upi_id', '7686008@ybl')")
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('stripe_pub_key', 'pk_test_51MockStripeKeyKawaiOra2026')")
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('stripe_secret_key', 'sk_test_51MockStripeKeyKawaiOra2026')")
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('razorpay_key_id', 'rzp_test_KawaiOra2026')")
        cursor.execute("INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES ('razorpay_key_secret', 'secret_KawaiOra2026')")

    # Custom Builder Items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS custom_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL, -- 'box', 'treat', 'beverage', 'keepsake', 'card'
        price REAL NOT NULL,
        image TEXT NOT NULL,
        description TEXT
    )
    ''')

    # Orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        gift_message TEXT,
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'Paid (Stripe)',
        order_status TEXT DEFAULT 'Processing',
        tracking_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Mobile OTP Audit Security Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS mobile_otp_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mobile TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        status TEXT DEFAULT 'VERIFIED',
        user_id INTEGER,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute("SELECT COUNT(*) FROM mobile_otp_audit")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO mobile_otp_audit (mobile, otp_code, status, user_id, ip_address) VALUES ('+919876543210', '784920', 'VERIFIED', 2, '192.168.1.8')")
        cursor.execute("INSERT INTO mobile_otp_audit (mobile, otp_code, status, user_id, ip_address) VALUES ('+917686008999', '419203', 'VERIFIED', 3, '192.168.1.15')")

    # Wishlists table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS wishlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
    )
    ''')

    # Product Reviews & Ratings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        rating REAL NOT NULL DEFAULT 5.0,
        comment TEXT NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )
    ''')

    # Migration check for orders table: Add delivery_time_slot, is_surprise_gift, secret_message, payment_method, cod_fee, payment_details
    cursor.execute("PRAGMA table_info(orders)")
    ord_columns = [col['name'] for col in cursor.fetchall()]
    if 'delivery_time_slot' not in ord_columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_time_slot TEXT DEFAULT '10 AM - 1 PM'")
        cursor.execute("ALTER TABLE orders ADD COLUMN is_surprise_gift INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE orders ADD COLUMN secret_message TEXT DEFAULT ''")
    if 'payment_method' not in ord_columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Credit Card (Stripe)'")
        cursor.execute("ALTER TABLE orders ADD COLUMN cod_fee REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_details TEXT DEFAULT '{}'")

    # Gift Cards / Store Credit Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS gift_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        initial_balance REAL NOT NULL,
        current_balance REAL NOT NULL,
        is_active INTEGER DEFAULT 1,
        expiry_date TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Seed default gift cards if empty
    cursor.execute("SELECT COUNT(*) FROM gift_cards")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('GIFT500', 500.0, 500.0, 1)")
        cursor.execute("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('HAMPER1000', 1000.0, 1000.0, 1)")
        cursor.execute("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('LUXURY2000', 2000.0, 2000.0, 1)")

    # Seed default reviews if empty
    cursor.execute("SELECT COUNT(*) FROM reviews")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO reviews (product_id, user_name, rating, comment, photo_url) VALUES (1, 'Ananya Sharma', 5.0, 'Absolutely stunning hamper! The Champagne and Swiss chocolates made my anniversary unforgettable. Packaging was pure perfection.', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300')")
        cursor.execute("INSERT INTO reviews (product_id, user_name, rating, comment, photo_url) VALUES (1, 'Rahul Mehta', 5.0, 'Delivered right on time with express ribbon wrapping. My partner loved the hand-poured candle!', NULL)")
        cursor.execute("INSERT INTO reviews (product_id, user_name, rating, comment, photo_url) VALUES (2, 'Priya Kapoor', 4.8, 'The Cabernet Sauvignon red wine paired wonderfully with Belgian truffles. Highly recommend!', 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=300')")
        cursor.execute("INSERT INTO reviews (product_id, user_name, rating, comment, photo_url) VALUES (4, 'Vikram Malhotra', 5.0, 'Bought the Sweet Birthday Basket for my sister. The teddy plushie and french macarons were super cute!', NULL)")

    # Discounts table with rich customization fields
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        percentage REAL NOT NULL DEFAULT 10.0,
        discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
        discount_value REAL DEFAULT 10.0,
        min_spend REAL DEFAULT 0.0,
        max_uses INTEGER DEFAULT 0, -- 0 = unlimited
        times_used INTEGER DEFAULT 0,
        expiry_date TEXT DEFAULT NULL,
        applicable_category TEXT DEFAULT 'all',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Migration check for existing discounts table
    cursor.execute("PRAGMA table_info(discounts)")
    disc_columns = [col['name'] for col in cursor.fetchall()]
    if 'discount_type' not in disc_columns:
        cursor.execute("ALTER TABLE discounts ADD COLUMN discount_type TEXT DEFAULT 'percentage'")
        cursor.execute("ALTER TABLE discounts ADD COLUMN discount_value REAL DEFAULT 10.0")
        cursor.execute("ALTER TABLE discounts ADD COLUMN min_spend REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE discounts ADD COLUMN max_uses INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE discounts ADD COLUMN times_used INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE discounts ADD COLUMN expiry_date TEXT DEFAULT NULL")
        cursor.execute("ALTER TABLE discounts ADD COLUMN applicable_category TEXT DEFAULT 'all'")

    # Seed default discounts if empty
    cursor.execute("SELECT COUNT(*) FROM discounts")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('WELCOME10', 10.0, 'percentage', 10.0, 0.0, 0, 3, 'all', 1)")
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('KAWAI15', 15.0, 'percentage', 15.0, 0.0, 0, 5, 'all', 1)")
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('FESTIVE25', 25.0, 'percentage', 25.0, 100.0, 100, 12, 'all', 1)")
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('KAWAIORA15', 15.0, 'percentage', 15.0, 50.0, 50, 8, 'all', 1)")
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('LUXURY50', 0.0, 'fixed', 50.0, 150.0, 20, 2, 'Luxury', 1)")

    # Ensure admin@kawaiora.com and KAWAI15 exist
    cursor.execute("SELECT id FROM users WHERE email = 'admin@kawaiora.com'")
    if not cursor.fetchone():
        admin_pw = hash_password('admin123')
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                       ('KawaiOra Concierge Admin', 'admin@kawaiora.com', admin_pw, 'admin'))

    cursor.execute("SELECT id FROM discounts WHERE code = 'KAWAI15'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES ('KAWAI15', 15.0, 'percentage', 15.0, 0.0, 0, 0, 'all', 1)")

    conn.commit()

    # Seed data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] <= 1:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()

    admin_pw = hash_password('admin123')
    user_pw = hash_password('user123')

    cursor.execute("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                   ('Concierge Admin', 'admin@kawaiora.com', admin_pw, 'admin'))
    cursor.execute("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                   ('Admin Manager', 'admin@gifthampers.com', admin_pw, 'admin'))
    cursor.execute("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                   ('Sarah Jenkins', 'sarah@example.com', user_pw, 'user'))

    # Seed Hampers with multiple photos each!
    hampers = [
        (
            'Grand Royal Celebration Hamper',
            'Luxury',
            149.99,
            179.99,
            4.9,
            48,
            'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80'
            ]),
            'The pinnacle of elegance featuring imported French sparkling wine, artisanal Swiss chocolates, truffle crackers, and handcrafted candles.',
            json.dumps(['Domaine Vintage Brut 750ml', 'Lindt Excellence Dark Collection 200g', 'Artisanal White Truffle Crackers', 'Hand-poured Soy Candle (Lavender & Vanilla)', 'Gold Satin Gift Box']),
            'Bestseller',
            30
        ),
        (
            'Artisanal Chocolate & Wine Opulence',
            'Romantic',
            119.50,
            135.00,
            4.8,
            32,
            'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80'
            ]),
            'Express your feelings with aged Pinot Noir, handcrafted belgian truffles, dark chocolate almond bark, and a plush romantic card.',
            json.dumps(['Napa Valley Cabernet Sauvignon', 'Belgian Chocolate Truffle Box (16pcs)', 'Organic Raspberry Jam', 'Rose Gold Stainless Tumbler', 'Romantic Greeting Card']),
            'Trending',
            25
        ),
        (
            'Executive Corporate Achievement Crate',
            'Corporate',
            189.00,
            210.00,
            5.0,
            19,
            'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
            ]),
            'Make a lasting professional impression with premium single malt whiskey, roasted macadamia nuts, leather journal, and luxury pen set.',
            json.dumps(['Glenfiddich 12 Year Single Malt', 'Smoked Honey Macadamias 150g', 'Genuine Leather Daily Planner', 'Parker Ballpoint Pen', 'Rustic Oak Wooden Crate']),
            'Corporate Fav',
            40
        ),
        (
            'Sweet Birthday Delight Basket',
            'Birthday',
            79.99,
            89.99,
            4.7,
            56,
            'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80'
            ]),
            'Bring joy on their special day with colorful birthday macarons, gourmet caramel popcorn, birthday confetti, and a soft teddy bear.',
            json.dumps(['Assorted French Macarons (12pcs)', 'Gourmet Salted Caramel Popcorn', 'Huggy Bear Plushie (8")', 'Sparkling Cider 750ml', 'Custom Birthday Card']),
            'Popular',
            50
        ),
        (
            'Zen Wellness & Spa Retreat Hamper',
            'Wellness',
            95.00,
            110.00,
            4.9,
            27,
            'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
            ]),
            'Recharge mind and soul with organic herbal chamomile tea, silk eye mask, eucalyptus bath salts, and essential oil diffuser.',
            json.dumps(['Loose Leaf Chamomile Tea', '100% Mulberry Silk Sleep Mask', 'Dead Sea Eucalyptus Bath Salts', 'Ultrasonic Aroma Diffuser', 'Sandalwood Incense Sticks']),
            'Relaxation',
            35
        ),
        (
            'Festival Sunshine & Treats Basket',
            'Festive',
            85.50,
            99.00,
            4.8,
            41,
            'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
            json.dumps([
                'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80'
            ]),
            'Spread holiday cheer with organic honey, butter cookies, roasted pistachios, dried fruits, and festive golden ornaments.',
            json.dumps(['Danish Butter Cookies Tin', 'Raw Organic Wildflower Honey', 'Roasted Salted Pistachios 200g', 'Dried Apricots & Figs Box', 'Golden Gift Ornament']),
            'Festive Special',
            45
        )
    ]

    cursor.executemany('''
    INSERT INTO products (name, category, price, original_price, rating, reviews_count, image, images, description, items, tag, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', hampers)

    # Seed Custom Items
    custom_items = [
        ('Handwoven Luxury Wicker Basket', 'box', 25.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80', 'Classic rustic woven basket with silk lining'),
        ('Midnight Velvet Ribbon Box', 'box', 20.00, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80', 'Matte black magnetic closure box with gold foil'),
        ('Rustic Oak Wooden Crate', 'box', 30.00, 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=400&q=80', 'Solid oak eco-friendly crate with laser engraving'),
        ('Blush Pink Hexagon Box', 'box', 18.00, 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80', 'Chic hexagonal box tied with satin bow'),
        ('French Artisan Macarons (6pcs)', 'treat', 16.00, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=400&q=80', 'Assorted pistachios, vanilla, & raspberry macarons'),
        ('Swiss Dark Chocolate Truffles', 'treat', 14.50, 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=400&q=80', 'Rich 70% cocoa truffles dusted in gold dust'),
        ('Salted Caramel Gourmet Popcorn', 'treat', 8.50, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=400&q=80', 'Handcrafted crunchy caramel popcorn'),
        ('Smoked Honey Roasted Cashews', 'treat', 10.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', 'Premium jumbo cashews with raw honey glazed'),
        ('Moët & Chandon Imperial Champagne', 'beverage', 65.00, 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=400&q=80', 'Classic 750ml French Champagne'),
        ('Napa Reserve Cabernet Sauvignon', 'beverage', 35.00, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80', 'Full-bodied California red wine'),
        ('Organic Earl Grey Loose Tea', 'beverage', 12.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', 'Bergamot infused Ceylon black tea tin'),
        ('Artisanal Espresso Beans 250g', 'beverage', 14.00, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80', 'Single origin Ethiopian Arabica coffee beans'),
        ('Hand-poured Amber Soy Candle', 'keepsake', 18.00, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80', 'Scented with French Vanilla & Oakmoss'),
        ('Cuddle Teddy Bear Plushie (10")', 'keepsake', 15.00, 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=400&q=80', 'Ultra soft hypoallergenic plush toy'),
        ('Engraved Stainless Tumbler', 'keepsake', 22.00, 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=400&q=80', 'Double-wall insulated rose gold tumbler'),
        ('Fresh Lavender & Rose Bouquet', 'keepsake', 24.00, 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=400&q=80', 'Dried everlasting floral arrangement'),
        ('Gold Foil Calligraphy Greeting Card', 'card', 4.50, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80', 'Custom printed greeting card with your personal note'),
        ('Minimalist Botanical Gift Card', 'card', 4.00, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80', 'Handmade cotton paper card with dried floral seal')
    ]

    cursor.executemany('''
    INSERT INTO custom_items (name, category, price, image, description)
    VALUES (?, ?, ?, ?, ?)
    ''', custom_items)

    conn.commit()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
