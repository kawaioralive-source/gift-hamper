# KawaiOra Deployment & Custom Domain Guide (`kawaiora.com`)

This document provides complete instructions for deploying **KawaiOra Artisan Hampers** with Supabase DB integration, HTTPS/SSL certificates, and custom domain binding (`kawaiora.com`).

---

## 1. Production Environment Variables (`.env`)

```env
SUPABASE_URL=https://qeptxbbzsnzwgulxigle.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_UvAnIPMAC2g7ayTrg0duUw_ekACengE
SUPABASE_SECRET_KEY=your_supabase_secret_key_here
SUPABASE_JWKS_URL=https://qeptxbbzsnzwgulxigle.supabase.co/auth/v1/.well-known/jwks.json

JWT_SECRET=kawaiora_botanical_secret_key_2026_secure
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
PORT=5000
PROJECT_URL=https://kawaiora.com

# PostgreSQL Connection Pooler (IPv4 Compatible for Prisma / Drizzle / Python pg8000)
DATABASE_URL="postgresql://postgres.mitqeainyathndvbzsrr:ItShouldBeADifficultPassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# PostgreSQL Direct Connection (Session Mode for Migrations)
DIRECT_URL="postgresql://postgres.mitqeainyathndvbzsrr:ItShouldBeADifficultPassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

### Prisma / Drizzle ORM Configuration (`prisma/schema.prisma` or `.env.local`)
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```


---

## 2. Cloud Server Deployment (Render / Railway / VPS / EC2)

1. **Install Dependencies**:
   ```bash
   py -m pip install -r requirements.txt
   ```
2. **Initialize Database**:
   ```bash
   py database.py
   ```
3. **Run Production WSGI Server**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

---

## 3. Custom Domain Setup (`kawaiora.com`)

### DNS Configuration
In your Domain Registrar (Cloudflare, Namecheap, GoDaddy):
- **A Record**: `@` -> `YOUR_SERVER_IP`
- **CNAME Record**: `www` -> `kawaiora.com`

### Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/kawaiora.com`:
```nginx
server {
    listen 80;
    server_name kawaiora.com www.kawaiora.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & test Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/kawaiora.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Automatic Free SSL/HTTPS Certificate (Certbot)
Run Certbot for free automatic SSL/HTTPS certificate setup:
```bash
sudo certbot --nginx -d kawaiora.com -d www.kawaiora.com
```

---

## 4. Accounts & Credentials

- **Concierge Admin Email**: `admin@kawaiora.com` (Password: `admin123`)
- **Alternative Admin Email**: `admin@gifthampers.com` (Password: `admin123`)
- **Customer Email**: `sarah@example.com` (Password: `user123`)
- **VIP Inner Circle Promo Code**: `KAWAI15` (15% Off)
- **Welcome Promo Code**: `WELCOME10` (10% Off)
- **Supabase Project URL**: `https://mitqeainyathndvbzsrr.supabase.co`
- **Supabase JWKS URL**: `https://mitqeainyathndvbzsrr.supabase.co/auth/v1/.well-known/jwks.json`
- **Merchant UPI VPA**: `7686008@ybl`
