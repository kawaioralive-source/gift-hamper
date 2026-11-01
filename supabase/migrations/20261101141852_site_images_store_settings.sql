alter table public.homepage_config
  add column if not exists site_images_data jsonb not null default '{}'::jsonb;
