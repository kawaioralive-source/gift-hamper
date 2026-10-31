const { Client } = require('pg');

async function ensureStorage() {
  const connectionString = 'postgresql://postgres:daxmu8-sajgih-seThok@db.qeptxbbzsnzwgulxigle.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  await client.query(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
    ON CONFLICT (id) DO UPDATE SET public = true;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for product-images'
      ) THEN
        CREATE POLICY "Public Access for product-images" ON storage.objects
        FOR ALL TO anon, authenticated, service_role
        USING (bucket_id = 'product-images')
        WITH CHECK (bucket_id = 'product-images');
      END IF;
    END $$;
  `);

  console.log('Storage bucket product-images configured!');
  await client.end();
}

ensureStorage();
