-- Demo activity for showing the shop before launch.
-- Run in the Supabase SQL editor. Remove it with remove-demo-data.sql.
-- Demo customers use fictional +1 202 555 01xx numbers and example.com
-- emails, so WhatsApp and email buttons never reach a real person.

do $$
declare
  names text[] := array['Maya Haddad','Ali Khalil','Nour Saad','Hassan Fakih','Lara Mansour','Rami Daher','Sara Hamdan','Karim Nasser','Yasmine Chami','Omar Zein','Dana Azar','Fatima Hijazi','Jad Rizk','Rania Sleiman','Ziad Moussa','Hiba Dagher'];
  statuses text[] := array['delivered','delivered','delivered','delivered','out_for_delivery','preparing','confirmed','pending','cancelled'];
  v_zone record;
  v_order uuid;
  v_day integer;
  v_status text;
  v_sub integer;
  v_fee integer;
  v_lines integer;
  v_variant record;
  v_qty integer;
  v_customer integer;
  i integer;
  j integer;
begin
  for i in 1..46 loop
    v_day := floor(random() * 30)::int;
    v_status := case when v_day > 3 then statuses[1 + floor(random() * 4)::int] else statuses[1 + floor(random() * array_length(statuses, 1))::int] end;
    if random() < 0.06 then v_status := 'cancelled'; end if;
    v_customer := 1 + floor(random() * array_length(names, 1))::int;
    select * into v_zone from public.delivery_zones order by random() limit 1;

    insert into public.orders (
      checkout_key, request_hash, tracking_token_hash, customer_name, customer_phone, customer_email,
      delivery_zone_id, delivery_zone_name, delivery_address, customer_notes,
      subtotal_cents, delivery_fee_cents, total_cents, status, payment_status, paid_at, stock_returned, created_at
    ) values (
      gen_random_uuid(), repeat('0', 64), encode(extensions.gen_random_bytes(32), 'hex'),
      names[v_customer], '+1202555' || lpad((100 + v_customer)::text, 4, '0'),
      case when random() < 0.5 then lower(replace(names[v_customer], ' ', '.')) || '@example.com' end,
      v_zone.id, v_zone.name, 'Demo street ' || (1 + floor(random() * 40))::int || ', building ' || (1 + floor(random() * 9))::int, '',
      0, 0, 0, v_status,
      case when v_status = 'delivered' then 'paid' else 'unpaid' end,
      case when v_status = 'delivered' then now() - make_interval(days => v_day) + interval '5 hours' end,
      v_status = 'cancelled',
      now() - make_interval(days => v_day, hours => floor(random() * 10)::int, mins => floor(random() * 60)::int)
    ) returning id into v_order;

    v_sub := 0;
    v_lines := 1 + floor(random() * 4)::int;
    for j in 1..v_lines loop
      select v.id, v.label, v.price_cents, p.id as product_id, p.name, p.slug into v_variant
        from public.product_variants v join public.products p on p.id = v.product_id
       where p.status = 'published' and not exists (select 1 from public.order_items oi where oi.order_id = v_order and oi.variant_id = v.id)
       order by random() limit 1;
      v_qty := 1 + floor(random() * 3)::int;
      insert into public.order_items (order_id, product_id, variant_id, product_name, product_slug, variant_label, unit_price_cents, quantity, line_total_cents)
      values (v_order, v_variant.product_id, v_variant.id, v_variant.name, v_variant.slug, v_variant.label, v_variant.price_cents, v_qty, v_variant.price_cents * v_qty);
      v_sub := v_sub + v_variant.price_cents * v_qty;
    end loop;

    v_fee := case when v_sub >= 5000 then 0 else v_zone.fee_cents end;
    update public.orders set subtotal_cents = v_sub, delivery_fee_cents = v_fee, total_cents = v_sub + v_fee where id = v_order;
    insert into public.order_events (order_id, kind, to_value, created_at) values (v_order, 'placed', 'pending', now() - make_interval(days => v_day));
    if v_status <> 'pending' then
      insert into public.order_events (order_id, kind, from_value, to_value, note, created_at)
      values (v_order, 'status', 'pending', v_status, 'demo', now() - make_interval(days => v_day) + interval '1 hour');
    end if;
  end loop;
end $$;

insert into public.reviews (product_id, author_name, rating, body, status, created_at)
select p.id, r.author, r.rating, r.body, r.status, now() - make_interval(days => r.ago)
  from (values
    ('extra-virgin-olive-oil', 'Maya H. (demo)', 5, 'The best olive oil I have tasted outside my grandmother''s village. Peppery and fresh!', 'approved', 3),
    ('healthy-ketchup', 'Ali K. (demo)', 5, 'My kids finally eat ketchup that I''m happy to give them. No weird ingredients.', 'approved', 6),
    ('pomegranate-molasses', 'Nour S. (demo)', 5, 'Real dibs rimman, tangy and thick. My fattoush has never been better.', 'approved', 9),
    ('japanese-matcha', 'Lara M. (demo)', 4, 'Smooth and very green. Perfect for my morning latte.', 'approved', 12),
    ('jallab-syrup', 'Rami D. (demo)', 5, 'Tastes exactly like summer in Lebanon 🍇', 'approved', 15),
    ('keto-ketchup', 'Sara H. (demo)', 5, 'Finally a keto ketchup that tastes like the real thing!', 'pending', 1),
    ('date-tahini-spread', 'Karim N. (demo)', 4, 'Addictive on toast in the morning.', 'pending', 0)
  ) as r(slug, author, rating, body, status, ago)
  join public.products p on p.slug = r.slug;

insert into public.contact_messages (name, phone, email, topic, message, created_at) values
  ('Yasmine C. (demo)', '+12025550150', '', 'wholesale', 'Hello! I own a small organic corner in Jbeil and would love to stock your syrups and sauces. Can you send me your wholesale prices?', now() - interval '5 hours'),
  ('Omar Z. (demo)', '', 'omar.demo@example.com', 'product', 'Is your collagen suitable for pregnant women?', now() - interval '1 day');

insert into public.stock_alerts (variant_id, name, phone)
select v.id, 'Dana A. (demo)', '+12025550160'
  from public.product_variants v join public.products p on p.id = v.product_id
 where p.slug in ('licorice-syrup', 'green-apple-syrup');

insert into public.checkout_leads (phone, name, zone_name, items, subtotal_cents, updated_at) values
  ('+12025550170', 'Hiba D. (demo)', 'Beirut', '[{"name":"Japanese Matcha","label":"50 g","quantity":1},{"name":"Collagen Peptides","label":"300 g","quantity":1}]', 5300, now() - interval '3 hours');

insert into public.newsletter_subscribers (email) values
  ('maya.demo@example.com'), ('ali.demo@example.com'), ('nour.demo@example.com'), ('lara.demo@example.com')
on conflict do nothing;
