-- Ja'deer Organics — store schema.
--
-- Security model
--   * Row level security is enabled on every table.
--   * Website visitors (anon) can only READ published catalog data,
--     active stores, delivery zones, approved reviews and store settings.
--   * Every visitor write (orders, messages, reviews, newsletter, stock
--     alerts, unfinished checkouts) goes through the website's server,
--     which validates input, applies rate limits and uses the secret key.
--   * Administrators sign in with Supabase Auth and must be listed in
--     public.admin_users; every admin policy checks that membership.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy "Users read their own admin membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

create function public.is_active_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and is_active = true
  );
$$;

revoke all on function public.is_active_admin() from public, anon, authenticated;
grant execute on function public.is_active_admin() to authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Store settings (one row)
-- ---------------------------------------------------------------------

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  store_name text not null default 'Ja''deer Organics' check (char_length(store_name) between 1 and 80),
  tagline text not null default 'Organic. Preservative-free. Pesticide-free.' check (char_length(tagline) <= 200),
  phone text not null default '' check (char_length(phone) <= 40),
  whatsapp text not null default '' check (char_length(whatsapp) <= 40),
  email text not null default '' check (char_length(email) <= 254),
  instagram_url text not null default 'https://www.instagram.com/jadeer.organics/' check (char_length(instagram_url) <= 300),
  facebook_url text not null default '' check (char_length(facebook_url) <= 300),
  tiktok_url text not null default '' check (char_length(tiktok_url) <= 300),
  announcement_enabled boolean not null default true,
  announcement_text text not null default 'Cash on delivery all over Lebanon · Free delivery on orders over $50' check (char_length(announcement_text) <= 200),
  free_delivery_threshold_cents integer not null default 5000 check (free_delivery_threshold_cents >= 0),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold between 0 and 1000),
  accepting_orders boolean not null default true,
  order_notice text not null default 'Orders placed before 4 PM are delivered the same or next working day.' check (char_length(order_notice) <= 300),
  updated_at timestamptz not null default now()
);

create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

insert into public.store_settings (id) values (1);

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from public, anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
grant update on table public.store_settings to authenticated;

create policy "Everyone reads store settings" on public.store_settings
for select to anon, authenticated using (true);
create policy "Admins update store settings" on public.store_settings
for update to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  name_ar text not null default '' check (char_length(name_ar) <= 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  description text not null default '' check (char_length(description) <= 1000),
  color text not null default '#3f8f3a' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  emoji text not null default '🌿' check (char_length(emoji) <= 8),
  image_path text check (image_path is null or char_length(image_path) <= 400),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  name_ar text not null default '' check (char_length(name_ar) <= 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 130),
  tagline text not null default '' check (char_length(tagline) <= 200),
  description text not null default '' check (char_length(description) <= 10000),
  ingredients text not null default '' check (char_length(ingredients) <= 3000),
  how_to_use text not null default '' check (char_length(how_to_use) <= 3000),
  badges text[] not null default '{}' check (
    badges <@ array['organic','keto','vegan','sugar-free','gluten-free','preservative-free','cold-pressed','local','raw','new','bestseller']::text[]
  ),
  art_shape text not null default 'bottle' check (art_shape in ('bottle','tall-bottle','jar','tin','squeeze','pump','tube','box','pouch','sachet')),
  art_color text not null default '#3f8f3a' check (art_color ~ '^#[0-9A-Fa-f]{6}$'),
  art_background text not null default '#eaf4dc' check (art_background ~ '^#[0-9A-Fa-f]{6}$'),
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status, sort_order);

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- A product is sold in one or more sizes (e.g. 250 ml, 500 ml).
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (label = btrim(label) and char_length(label) between 1 and 40),
  sku text check (sku is null or char_length(sku) <= 60),
  price_cents integer not null check (price_cents between 0 and 10000000),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents between 0 and 10000000),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_variants_unique_label on public.product_variants(product_id, lower(label));
create index product_variants_product_idx on public.product_variants(product_id, sort_order);

create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  -- Either a path inside the "catalog" storage bucket, or a site path
  -- starting with "/" (images shipped with the website).
  path text not null check (char_length(path) between 1 and 400),
  alt text not null default '' check (char_length(alt) <= 200),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id, sort_order);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

revoke all on table public.categories, public.products, public.product_variants, public.product_images
from public, anon, authenticated;

grant select on table public.categories, public.products, public.product_variants, public.product_images
to anon, authenticated;
grant insert, update, delete on table public.categories, public.products, public.product_variants, public.product_images
to authenticated;

create policy "Visitors read active categories" on public.categories
for select to anon, authenticated using (is_active);
create policy "Admins read categories" on public.categories
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins write categories" on public.categories
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

create policy "Visitors read published products" on public.products
for select to anon, authenticated using (status = 'published');
create policy "Admins read products" on public.products
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins write products" on public.products
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

create policy "Visitors read sizes of published products" on public.product_variants
for select to anon, authenticated
using (
  is_active and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'
  )
);
create policy "Admins read sizes" on public.product_variants
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins write sizes" on public.product_variants
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

create policy "Visitors read images of published products" on public.product_images
for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "Admins read images" on public.product_images
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins write images" on public.product_images
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

-- Stock history (receiving, corrections, orders).
create table public.stock_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  change integer not null check (change <> 0),
  reason text not null check (reason in ('received','correction','damaged','order','order_cancelled','order_reopened')),
  note text not null default '' check (char_length(note) <= 300),
  order_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_variant_idx on public.stock_movements(variant_id, created_at desc);

alter table public.stock_movements enable row level security;
revoke all on table public.stock_movements from public, anon, authenticated;
grant select on table public.stock_movements to authenticated;
create policy "Admins read stock movements" on public.stock_movements
for select to authenticated using ((select public.is_active_admin()));

-- ---------------------------------------------------------------------
-- Shops, delivery, partners
-- ---------------------------------------------------------------------

create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  name_ar text not null default '' check (char_length(name_ar) <= 80),
  area text not null default '' check (char_length(area) <= 80),
  address text not null default '' check (char_length(address) <= 300),
  phone text not null default '' check (char_length(phone) <= 40),
  hours text not null default '' check (char_length(hours) <= 200),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  maps_query text not null default '' check (char_length(maps_query) <= 200),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger store_locations_set_updated_at before update on public.store_locations
for each row execute function public.set_updated_at();

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  fee_cents integer not null default 0 check (fee_cents between 0 and 100000),
  eta text not null default '' check (char_length(eta) <= 60),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index delivery_zones_name_unique on public.delivery_zones(lower(name));

create trigger delivery_zones_set_updated_at before update on public.delivery_zones
for each row execute function public.set_updated_at();

create table public.retail_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  url text not null default '' check (char_length(url) <= 300 and (url = '' or url ~ '^https://')),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

alter table public.store_locations enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.retail_partners enable row level security;

revoke all on table public.store_locations, public.delivery_zones, public.retail_partners
from public, anon, authenticated;
grant select on table public.store_locations, public.delivery_zones, public.retail_partners
to anon, authenticated;
grant insert, update, delete on table public.store_locations, public.delivery_zones, public.retail_partners
to authenticated;

create policy "Visitors read active shops" on public.store_locations
for select to anon, authenticated using (is_active);
create policy "Admins manage shops" on public.store_locations
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

create policy "Visitors read active zones" on public.delivery_zones
for select to anon, authenticated using (is_active);
create policy "Admins manage zones" on public.delivery_zones
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

create policy "Visitors read active partners" on public.retail_partners
for select to anon, authenticated using (is_active);
create policy "Admins manage partners" on public.retail_partners
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

-- ---------------------------------------------------------------------
-- Promo codes
-- ---------------------------------------------------------------------

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description text not null default '' check (char_length(description) <= 200),
  kind text not null check (kind in ('percent','fixed','free_delivery')),
  value integer not null default 0 check (value >= 0),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_percent_range check (kind <> 'percent' or value between 1 and 90),
  constraint promotions_dates check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index promotions_code_unique on public.promotions(code);

create trigger promotions_set_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

alter table public.promotions enable row level security;
revoke all on table public.promotions from public, anon, authenticated;
grant select, insert, update, delete on table public.promotions to authenticated;
create policy "Admins manage promotions" on public.promotions
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));

-- ---------------------------------------------------------------------
-- Orders (cash on delivery, no customer accounts)
-- ---------------------------------------------------------------------

create sequence public.order_number_seq start with 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.order_number_seq'),
  checkout_key uuid not null unique,
  request_hash text not null check (char_length(request_hash) = 64),
  tracking_token_hash text not null unique check (char_length(tracking_token_hash) = 64),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 100),
  customer_phone text not null check (customer_phone ~ '^\+[1-9][0-9]{6,14}$'),
  customer_email text check (customer_email is null or char_length(customer_email) <= 254),
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  delivery_zone_name text not null,
  delivery_address text not null check (char_length(btrim(delivery_address)) between 5 and 500),
  customer_notes text not null default '' check (char_length(customer_notes) <= 1000),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  promo_code text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  payment_method text not null default 'cash_on_delivery' check (payment_method = 'cash_on_delivery'),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  paid_at timestamptz,
  stock_returned boolean not null default false,
  admin_notes text not null default '' check (char_length(admin_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.order_number_seq owned by public.orders.order_number;

create index orders_created_idx on public.orders(created_at desc);
create index orders_status_idx on public.orders(status, created_at desc);
create index orders_phone_idx on public.orders(customer_phone);

create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  variant_label text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index order_items_order_idx on public.order_items(order_id);
create index order_items_variant_idx on public.order_items(variant_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('placed','status','payment','note')),
  from_value text,
  to_value text,
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events(order_id, created_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

revoke all on table public.orders, public.order_items, public.order_events from public, anon, authenticated;
grant select on table public.orders, public.order_items, public.order_events to authenticated;
grant update (admin_notes) on table public.orders to authenticated;

create policy "Admins read orders" on public.orders
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins edit order notes" on public.orders
for update to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
create policy "Admins read order items" on public.order_items
for select to authenticated using ((select public.is_active_admin()));
create policy "Admins read order history" on public.order_events
for select to authenticated using ((select public.is_active_admin()));

-- ---------------------------------------------------------------------
-- Visitor submissions (written by the website server only)
-- ---------------------------------------------------------------------

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  phone text not null default '' check (char_length(phone) <= 40),
  email text not null default '' check (char_length(email) <= 254),
  topic text not null default 'general' check (topic in ('general','order','wholesale','product','feedback')),
  message text not null check (char_length(btrim(message)) between 5 and 3000),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);
create unique index newsletter_email_unique on public.newsletter_subscribers(lower(email));

create table public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 100),
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index stock_alerts_waiting_unique on public.stock_alerts(variant_id, phone) where notified_at is null;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 2 and 60),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 5 and 1500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews(product_id, status, created_at desc);

create table public.checkout_leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  name text not null default '' check (char_length(name) <= 100),
  zone_name text not null default '' check (char_length(zone_name) <= 80),
  items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);

alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.stock_alerts enable row level security;
alter table public.reviews enable row level security;
alter table public.checkout_leads enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table public.contact_messages, public.newsletter_subscribers, public.stock_alerts,
  public.reviews, public.checkout_leads, public.rate_limits
from public, anon, authenticated;

grant select, update, delete on table public.contact_messages, public.stock_alerts,
  public.reviews, public.checkout_leads to authenticated;
grant select, delete on table public.newsletter_subscribers to authenticated;
grant select on table public.reviews to anon;

create policy "Admins manage messages" on public.contact_messages
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
create policy "Admins manage subscribers" on public.newsletter_subscribers
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
create policy "Admins manage stock alerts" on public.stock_alerts
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
create policy "Admins manage reviews" on public.reviews
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
create policy "Visitors read approved reviews" on public.reviews
for select to anon, authenticated
using (status = 'approved' and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "Admins manage unfinished checkouts" on public.checkout_leads
for all to authenticated
using ((select public.is_active_admin())) with check ((select public.is_active_admin()));
-- rate_limits: no policies, only the server (service role) uses it.

-- ---------------------------------------------------------------------
-- Rate limiting (server only)
-- ---------------------------------------------------------------------

create function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_key is null or char_length(p_key) > 200 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  -- Occasionally clear out old keys.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------
-- Checkout: place a cash-on-delivery order (server only)
-- ---------------------------------------------------------------------

-- Works out the promo discount for a subtotal and delivery fee.
create function public.promo_discount(p_promo public.promotions, p_subtotal integer, p_delivery integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_promo.kind
    when 'percent' then floor(p_subtotal * p_promo.value / 100.0)::integer
    when 'fixed' then least(p_promo.value, p_subtotal)
    when 'free_delivery' then p_delivery
    else 0
  end;
$$;

revoke all on function public.promo_discount(public.promotions, integer, integer) from public, anon, authenticated;

create function public.create_guest_order(
  p_checkout_key uuid,
  p_request_hash text,
  p_tracking_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_zone_id uuid,
  p_address text,
  p_notes text,
  p_items jsonb,
  p_promo_code text,
  p_expected_total_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_settings public.store_settings%rowtype;
  v_zone public.delivery_zones%rowtype;
  v_promo public.promotions%rowtype;
  v_item jsonb;
  v_variant record;
  v_order_id uuid;
  v_order_number integer;
  v_subtotal integer := 0;
  v_delivery integer := 0;
  v_discount integer := 0;
  v_total integer;
  v_lines jsonb := '[]'::jsonb;
  v_line jsonb;
  v_seen uuid[] := '{}';
  v_variant_id uuid;
  v_quantity integer;
begin
  -- The same checkout submitted twice returns the first order.
  select * into v_existing from public.orders where checkout_key = p_checkout_key;
  if found then
    if v_existing.request_hash = p_request_hash then
      return jsonb_build_object('orderId', v_existing.id, 'orderNumber', v_existing.order_number, 'repeated', true);
    end if;
    raise exception 'INVALID_CHECKOUT_REQUEST';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if not coalesce(v_settings.accepting_orders, false) then
    raise exception 'STORE_CLOSED';
  end if;

  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 2 and 100 then
    raise exception 'INVALID_CUSTOMER_NAME';
  end if;
  if p_customer_phone is null or p_customer_phone !~ '^\+[1-9][0-9]{6,14}$' then
    raise exception 'INVALID_CUSTOMER_PHONE';
  end if;
  if p_customer_email is not null and (char_length(p_customer_email) > 254 or p_customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'INVALID_CUSTOMER_EMAIL';
  end if;
  if p_address is null or char_length(btrim(p_address)) not between 5 and 500 then
    raise exception 'INVALID_DELIVERY_ADDRESS';
  end if;
  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'INVALID_CUSTOMER_NOTES';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_CART';
  end if;

  select * into v_zone from public.delivery_zones where id = p_zone_id and is_active;
  if not found then
    raise exception 'DELIVERY_ZONE_UNAVAILABLE';
  end if;

  -- Lock every size in a fixed order so two checkouts cannot oversell.
  for v_item in
    select value from jsonb_array_elements(p_items) order by value->>'variantId'
  loop
    begin
      v_variant_id := (v_item->>'variantId')::uuid;
      v_quantity := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'INVALID_CART';
    end;

    if v_variant_id is null or v_quantity is null or v_quantity not between 1 and 99 then
      raise exception 'INVALID_CART';
    end if;
    if v_variant_id = any(v_seen) then
      raise exception 'INVALID_CART';
    end if;
    v_seen := v_seen || v_variant_id;

    select v.id, v.label, v.price_cents, v.stock_quantity, v.is_active,
           p.id as product_id, p.name as product_name, p.slug as product_slug, p.status
      into v_variant
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = v_variant_id
       for update of v;

    if not found or not v_variant.is_active or v_variant.status <> 'published' then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if v_variant.stock_quantity < v_quantity then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    v_subtotal := v_subtotal + v_variant.price_cents * v_quantity;
    v_lines := v_lines || jsonb_build_object(
      'variantId', v_variant.id,
      'productId', v_variant.product_id,
      'productName', v_variant.product_name,
      'productSlug', v_variant.product_slug,
      'label', v_variant.label,
      'price', v_variant.price_cents,
      'quantity', v_quantity
    );
  end loop;

  if v_subtotal < v_settings.min_order_cents then
    raise exception 'BELOW_MINIMUM';
  end if;

  v_delivery := case
    when v_settings.free_delivery_threshold_cents > 0 and v_subtotal >= v_settings.free_delivery_threshold_cents then 0
    else v_zone.fee_cents
  end;

  if p_promo_code is not null and btrim(p_promo_code) <> '' then
    select * into v_promo from public.promotions
     where code = upper(btrim(p_promo_code))
       for update;
    if not found or not v_promo.is_active
       or (v_promo.starts_at is not null and v_promo.starts_at > now())
       or (v_promo.ends_at is not null and v_promo.ends_at <= now())
       or (v_promo.max_uses is not null and v_promo.uses_count >= v_promo.max_uses) then
      raise exception 'PROMO_UNAVAILABLE';
    end if;
    if v_subtotal < v_promo.min_order_cents then
      raise exception 'PROMO_MINIMUM';
    end if;
    v_discount := public.promo_discount(v_promo, v_subtotal, v_delivery);
    if v_discount <= 0 then
      raise exception 'PROMO_NO_DISCOUNT';
    end if;
  end if;

  v_total := greatest(0, v_subtotal + v_delivery - v_discount);

  if p_expected_total_cents is distinct from v_total then
    raise exception 'TOTAL_CHANGED';
  end if;

  insert into public.orders (
    checkout_key, request_hash, tracking_token_hash,
    customer_name, customer_phone, customer_email,
    delivery_zone_id, delivery_zone_name, delivery_address, customer_notes,
    subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code
  ) values (
    p_checkout_key, p_request_hash, p_tracking_token_hash,
    btrim(p_customer_name), p_customer_phone, nullif(btrim(coalesce(p_customer_email, '')), ''),
    v_zone.id, v_zone.name, btrim(p_address), btrim(coalesce(p_notes, '')),
    v_subtotal, v_discount, v_delivery, v_total,
    case when v_discount > 0 then v_promo.code end
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_slug, variant_label,
      unit_price_cents, quantity, line_total_cents
    ) values (
      v_order_id,
      (v_line->>'productId')::uuid,
      (v_line->>'variantId')::uuid,
      v_line->>'productName',
      v_line->>'productSlug',
      v_line->>'label',
      (v_line->>'price')::integer,
      (v_line->>'quantity')::integer,
      (v_line->>'price')::integer * (v_line->>'quantity')::integer
    );

    update public.product_variants
       set stock_quantity = stock_quantity - (v_line->>'quantity')::integer
     where id = (v_line->>'variantId')::uuid;

    insert into public.stock_movements (variant_id, change, reason, order_id)
    values ((v_line->>'variantId')::uuid, -(v_line->>'quantity')::integer, 'order', v_order_id);
  end loop;

  if v_discount > 0 then
    update public.promotions set uses_count = uses_count + 1 where id = v_promo.id;
  end if;

  insert into public.order_events (order_id, kind, to_value)
  values (v_order_id, 'placed', 'pending');

  return jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_number, 'repeated', false);
end;
$$;

revoke all on function public.create_guest_order(uuid, text, text, text, text, text, uuid, text, text, jsonb, text, integer)
from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid, text, text, text, text, text, uuid, text, text, jsonb, text, integer)
to service_role;

-- ---------------------------------------------------------------------
-- Admin operations
-- ---------------------------------------------------------------------

-- Move an order to a new status. Cancelling puts its items back in
-- stock; reopening a cancelled order takes them out again if available.
create function public.admin_set_order_status(p_order_id uuid, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_stock integer;
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_status not in ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if char_length(coalesce(p_note, '')) > 300 then
    raise exception 'INVALID_NOTE';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status = p_status then
    return;
  end if;

  if p_status = 'cancelled' and not v_order.stock_returned then
    for v_item in
      select variant_id, quantity from public.order_items
       where order_id = p_order_id and variant_id is not null
       order by variant_id
    loop
      update public.product_variants set stock_quantity = stock_quantity + v_item.quantity
       where id = v_item.variant_id;
      insert into public.stock_movements (variant_id, change, reason, order_id, created_by)
      values (v_item.variant_id, v_item.quantity, 'order_cancelled', p_order_id, auth.uid());
    end loop;
    update public.orders set stock_returned = true where id = p_order_id;
  elsif v_order.status = 'cancelled' and v_order.stock_returned then
    for v_item in
      select variant_id, quantity from public.order_items
       where order_id = p_order_id and variant_id is not null
       order by variant_id
    loop
      select stock_quantity into v_stock from public.product_variants
       where id = v_item.variant_id for update;
      if coalesce(v_stock, 0) < v_item.quantity then
        raise exception 'INSUFFICIENT_STOCK';
      end if;
      update public.product_variants set stock_quantity = stock_quantity - v_item.quantity
       where id = v_item.variant_id;
      insert into public.stock_movements (variant_id, change, reason, order_id, created_by)
      values (v_item.variant_id, -v_item.quantity, 'order_reopened', p_order_id, auth.uid());
    end loop;
    update public.orders set stock_returned = false where id = p_order_id;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  -- Delivered cash orders are paid.
  if p_status = 'delivered' and v_order.payment_status = 'unpaid' then
    update public.orders set payment_status = 'paid', paid_at = now() where id = p_order_id;
    insert into public.order_events (order_id, kind, from_value, to_value, created_by)
    values (p_order_id, 'payment', 'unpaid', 'paid', auth.uid());
  end if;

  insert into public.order_events (order_id, kind, from_value, to_value, note, created_by)
  values (p_order_id, 'status', v_order.status, p_status, coalesce(p_note, ''), auth.uid());
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;

create function public.admin_set_order_payment(p_order_id uuid, p_payment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_payment not in ('unpaid','paid','refunded') then
    raise exception 'INVALID_PAYMENT';
  end if;

  select payment_status into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_old = p_payment then
    return;
  end if;

  update public.orders
     set payment_status = p_payment,
         paid_at = case when p_payment = 'paid' then now() else null end
   where id = p_order_id;

  insert into public.order_events (order_id, kind, from_value, to_value, created_by)
  values (p_order_id, 'payment', v_old, p_payment, auth.uid());
end;
$$;

revoke all on function public.admin_set_order_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_order_payment(uuid, text) to authenticated;

create function public.admin_adjust_stock(p_variant_id uuid, p_change integer, p_reason text, p_note text default '')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_change is null or p_change = 0 or abs(p_change) > 100000 then
    raise exception 'INVALID_CHANGE';
  end if;
  if p_reason not in ('received','correction','damaged') then
    raise exception 'INVALID_REASON';
  end if;
  if char_length(coalesce(p_note, '')) > 300 then
    raise exception 'INVALID_NOTE';
  end if;

  select stock_quantity into v_stock from public.product_variants where id = p_variant_id for update;
  if not found then
    raise exception 'VARIANT_NOT_FOUND';
  end if;
  if v_stock + p_change < 0 then
    raise exception 'NEGATIVE_STOCK';
  end if;

  update public.product_variants set stock_quantity = stock_quantity + p_change
   where id = p_variant_id
  returning stock_quantity into v_stock;

  insert into public.stock_movements (variant_id, change, reason, note, created_by)
  values (p_variant_id, p_change, p_reason, coalesce(p_note, ''), auth.uid());

  return v_stock;
end;
$$;

revoke all on function public.admin_adjust_stock(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.admin_adjust_stock(uuid, integer, text, text) to authenticated;

-- Sales overview for the admin dashboard.
create function public.admin_sales_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED';
  end if;

  p_days := least(greatest(coalesce(p_days, 30), 1), 365);
  v_since := date_trunc('day', now() at time zone 'Asia/Beirut') at time zone 'Asia/Beirut' - make_interval(days => p_days - 1);

  with sold as (
    select * from public.orders where created_at >= v_since and status <> 'cancelled'
  ),
  days as (
    select generate_series(
      (v_since at time zone 'Asia/Beirut')::date,
      (now() at time zone 'Asia/Beirut')::date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select d.day,
           coalesce(sum(s.total_cents), 0)::bigint as revenue,
           count(s.id)::integer as orders
      from days d
      left join sold s on (s.created_at at time zone 'Asia/Beirut')::date = d.day
     group by d.day
     order by d.day
  ),
  top as (
    select oi.product_name, sum(oi.quantity)::integer as quantity, sum(oi.line_total_cents)::bigint as revenue
      from public.order_items oi
      join sold s on s.id = oi.order_id
     group by oi.product_name
     order by quantity desc, revenue desc
     limit 6
  ),
  zones as (
    select delivery_zone_name as zone, count(*)::integer as orders
      from sold group by delivery_zone_name order by orders desc limit 6
  )
  select jsonb_build_object(
    'days', p_days,
    'revenue', coalesce((select sum(total_cents) from sold), 0),
    'orders', (select count(*) from sold),
    'items', coalesce((select sum(oi.quantity) from public.order_items oi join sold s on s.id = oi.order_id), 0),
    'average', coalesce((select round(avg(total_cents)) from sold), 0),
    'collected', coalesce((select sum(total_cents) from sold where payment_status = 'paid'), 0),
    'customers', (select count(distinct customer_phone) from sold),
    'cancelled', (select count(*) from public.orders where created_at >= v_since and status = 'cancelled'),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'revenue', revenue, 'orders', orders)) from daily), '[]'::jsonb),
    'topProducts', coalesce((select jsonb_agg(jsonb_build_object('name', product_name, 'quantity', quantity, 'revenue', revenue)) from top), '[]'::jsonb),
    'zones', coalesce((select jsonb_agg(jsonb_build_object('zone', zone, 'orders', orders)) from zones), '[]'::jsonb),
    'statusCounts', coalesce((select jsonb_object_agg(status, c) from (select status, count(*) c from public.orders group by status) x), '{}'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_sales_overview(integer) from public, anon, authenticated;
grant execute on function public.admin_sales_overview(integer) to authenticated;

-- Customers are grouped by phone number (there are no accounts).
create function public.admin_customers(p_search text default '')
returns table (
  phone text,
  name text,
  email text,
  orders integer,
  delivered integer,
  spent_cents bigint,
  first_order timestamptz,
  last_order timestamptz,
  last_zone text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED';
  end if;

  return query
  select o.customer_phone,
         (array_agg(o.customer_name order by o.created_at desc))[1],
         (array_agg(o.customer_email order by o.created_at desc) filter (where o.customer_email is not null))[1],
         count(*)::integer,
         count(*) filter (where o.status = 'delivered')::integer,
         coalesce(sum(o.total_cents) filter (where o.status <> 'cancelled'), 0)::bigint,
         min(o.created_at),
         max(o.created_at),
         (array_agg(o.delivery_zone_name order by o.created_at desc))[1]
    from public.orders o
   where coalesce(p_search, '') = ''
      or o.customer_phone ilike '%' || p_search || '%'
      or o.customer_name ilike '%' || p_search || '%'
   group by o.customer_phone
   order by max(o.created_at) desc
   limit 500;
end;
$$;

revoke all on function public.admin_customers(text) from public, anon, authenticated;
grant execute on function public.admin_customers(text) to authenticated;

-- ---------------------------------------------------------------------
-- Storage: public catalog images, uploaded by admins only
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do nothing;

create policy "Admins upload catalog images" on storage.objects
for insert to authenticated
with check (bucket_id = 'catalog' and (select public.is_active_admin()));

create policy "Admins update catalog images" on storage.objects
for update to authenticated
using (bucket_id = 'catalog' and (select public.is_active_admin()))
with check (bucket_id = 'catalog' and (select public.is_active_admin()));

create policy "Admins delete catalog images" on storage.objects
for delete to authenticated
using (bucket_id = 'catalog' and (select public.is_active_admin()));

commit;
