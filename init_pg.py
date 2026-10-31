import os
import hashlib
import json
import pg8000.native

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except Exception:
    pass

DB_HOST = os.environ.get('SUPABASE_DB_HOST', 'aws-0-ap-south-1.pooler.supabase.com')
DB_USER = os.environ.get('SUPABASE_DB_USER', 'postgres.mitqeainyathndvbzsrr')
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', 'ItShouldBeADifficultPassword')
DB_NAME = os.environ.get('SUPABASE_DB_NAME', 'postgres')
DB_PORT = int(os.environ.get('SUPABASE_DB_PORT', 5432))

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_postgres():
    print(f"Connecting to Supabase PostgreSQL Pooler at {DB_HOST}:{DB_PORT}...")
    conn = pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        ssl_context=True
    )
    print("Connected to Supabase PostgreSQL successfully!")

    # Users Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # Products Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # System Config Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS system_config (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value TEXT NOT NULL
    );
    ''')

    # Custom Items Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS custom_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        image TEXT NOT NULL,
        description TEXT
    );
    ''')

    # Orders Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        user_id INT,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_address TEXT NOT NULL,
        delivery_date VARCHAR(100) NOT NULL,
        gift_message TEXT,
        items TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        payment_status VARCHAR(100) DEFAULT 'Paid (Stripe)',
        order_status VARCHAR(100) DEFAULT 'Processing',
        tracking_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_time_slot VARCHAR(100) DEFAULT '10 AM - 1 PM',
        is_surprise_gift INT DEFAULT 0,
        secret_message TEXT DEFAULT '',
        payment_method VARCHAR(100) DEFAULT 'Credit Card (Stripe)',
        cod_fee NUMERIC DEFAULT 0.0,
        payment_details TEXT DEFAULT '{}'
    );
    ''')

    # Mobile OTP Audit Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS mobile_otp_audit (
        id SERIAL PRIMARY KEY,
        mobile VARCHAR(50) NOT NULL,
        otp_code VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'VERIFIED',
        user_id INT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # Wishlists Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
    );
    ''')

    # Reviews Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        rating NUMERIC NOT NULL DEFAULT 5.0,
        comment TEXT NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # Gift Cards Table
    conn.run('''
    CREATE TABLE IF NOT EXISTS gift_cards (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        initial_balance NUMERIC NOT NULL,
        current_balance NUMERIC NOT NULL,
        is_active INT DEFAULT 1,
        expiry_date VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # Discounts Table
    conn.run('''
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # Seed Admin User if missing
    admin_pw = hash_password('admin123')
    user_pw = hash_password('user123')

    users_check = conn.run("SELECT id FROM users WHERE email = 'admin@kawaiora.com'")
    if not users_check:
        conn.run(
            "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)",
            name='KawaiOra Concierge Admin', email='admin@kawaiora.com', password=admin_pw, role='admin'
        )
        conn.run(
            "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)",
            name='Admin Manager', email='admin@gifthampers.com', password=admin_pw, role='admin'
        )
        conn.run(
            "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)",
            name='Sarah Jenkins', email='sarah@example.com', password=user_pw, role='user'
        )
        print("Seeded Admin & User Accounts.")

    # Seed Discounts if missing
    disc_check = conn.run("SELECT id FROM discounts WHERE code = 'KAWAI15'")
    if not disc_check:
        conn.run(
            "INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES (:code, 15.0, 'percentage', 15.0, 0.0, 0, 5, 'all', 1)",
            code='KAWAI15'
        )
        conn.run(
            "INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES (:code, 10.0, 'percentage', 10.0, 0.0, 0, 3, 'all', 1)",
            code='WELCOME10'
        )
        conn.run(
            "INSERT INTO discounts (code, percentage, discount_type, discount_value, min_spend, max_uses, times_used, applicable_category, is_active) VALUES (:code, 25.0, 'percentage', 25.0, 100.0, 100, 12, 'all', 1)",
            code='FESTIVE25'
        )
        print("Seeded Discounts & VIP Promo Codes.")

    # Seed Gift Cards if missing
    gift_check = conn.run("SELECT COUNT(*) FROM gift_cards")
    if gift_check[0][0] == 0:
        conn.run("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('GIFT500', 500.0, 500.0, 1)")
        conn.run("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('HAMPER1000', 1000.0, 1000.0, 1)")
        conn.run("INSERT INTO gift_cards (code, initial_balance, current_balance, is_active) VALUES ('LUXURY2000', 2000.0, 2000.0, 1)")
        print("Seeded Gift Cards.")

    # Seed Products if missing
    prod_check = conn.run("SELECT COUNT(*) FROM products")
    if prod_check[0][0] == 0:
        hampers = [
            ('Grand Royal Celebration Hamper', 'Luxury', 149.99, 179.99, 4.9, 48, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80']), 'The pinnacle of elegance featuring imported French sparkling wine, artisanal Swiss chocolates, truffle crackers, and handcrafted candles.', json.dumps(['Domaine Vintage Brut 750ml', 'Lindt Excellence Dark Collection 200g', 'Artisanal White Truffle Crackers', 'Hand-poured Soy Candle (Lavender & Vanilla)', 'Gold Satin Gift Box']), 'Bestseller', 30),
            ('Artisanal Chocolate & Wine Opulence', 'Romantic', 119.50, 135.00, 4.8, 32, 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80']), 'Express your feelings with aged Pinot Noir, handcrafted belgian truffles, dark chocolate almond bark, and a plush romantic card.', json.dumps(['Napa Valley Cabernet Sauvignon', 'Belgian Chocolate Truffle Box (16pcs)', 'Organic Raspberry Jam', 'Rose Gold Stainless Tumbler', 'Romantic Greeting Card']), 'Trending', 25),
            ('Executive Corporate Achievement Crate', 'Corporate', 189.00, 210.00, 5.0, 19, 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80']), 'Make a lasting professional impression with premium single malt whiskey, roasted macadamia nuts, leather journal, and luxury pen set.', json.dumps(['Glenfiddich 12 Year Single Malt', 'Smoked Honey Macadamias 150g', 'Genuine Leather Daily Planner', 'Parker Ballpoint Pen', 'Rustic Oak Wooden Crate']), 'Corporate Fav', 40),
            ('Sweet Birthday Delight Basket', 'Birthday', 79.99, 89.99, 4.7, 56, 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80']), 'Bring joy on their special day with colorful birthday macarons, gourmet caramel popcorn, birthday confetti, and a soft teddy bear.', json.dumps(['Assorted French Macarons (12pcs)', 'Gourmet Salted Caramel Popcorn', 'Huggy Bear Plushie (8")', 'Sparkling Cider 750ml', 'Custom Birthday Card']), 'Popular', 50),
            ('Zen Wellness & Spa Retreat Hamper', 'Wellness', 95.00, 110.00, 4.9, 27, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80']), 'Recharge mind and soul with organic herbal chamomile tea, silk eye mask, eucalyptus bath salts, and essential oil diffuser.', json.dumps(['Loose Leaf Chamomile Tea', '100% Mulberry Silk Sleep Mask', 'Dead Sea Eucalyptus Bath Salts', 'Ultrasonic Aroma Diffuser', 'Sandalwood Incense Sticks']), 'Relaxation', 35),
            ('Festival Sunshine & Treats Basket', 'Festive', 85.50, 99.00, 4.8, 41, 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80', json.dumps(['https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80']), 'Spread holiday cheer with organic honey, butter cookies, roasted pistachios, dried fruits, and festive golden ornaments.', json.dumps(['Danish Butter Cookies Tin', 'Raw Organic Wildflower Honey', 'Roasted Salted Pistachios 200g', 'Dried Apricots & Figs Box', 'Golden Gift Ornament']), 'Festive Special', 45)
        ]
        for h in hampers:
            conn.run(
                "INSERT INTO products (name, category, price, original_price, rating, reviews_count, image, images, description, items, tag, stock) VALUES (:name, :cat, :price, :orig, :rat, :rev, :img, :imgs, :desc, :items, :tag, :stock)",
                name=h[0], cat=h[1], price=h[2], orig=h[3], rat=h[4], rev=h[5], img=h[6], imgs=h[7], desc=h[8], items=h[9], tag=h[10], stock=h[11]
            )
        print("Seeded Products in Supabase PostgreSQL.")

    print("Supabase PostgreSQL Database initialization complete!")

if __name__ == '__main__':
    init_postgres()
