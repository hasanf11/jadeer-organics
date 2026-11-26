-- Arabic version of the shop, order language, private order links for
-- WhatsApp / email, and email bookkeeping.

begin;

-- Arabic content ------------------------------------------------------

alter table public.categories
  add column if not exists description_ar text not null default '' check (char_length(description_ar) <= 1000);

alter table public.products
  add column if not exists tagline_ar text not null default '' check (char_length(tagline_ar) <= 200),
  add column if not exists description_ar text not null default '' check (char_length(description_ar) <= 10000),
  add column if not exists ingredients_ar text not null default '' check (char_length(ingredients_ar) <= 3000),
  add column if not exists how_to_use_ar text not null default '' check (char_length(how_to_use_ar) <= 3000);

alter table public.product_variants
  add column if not exists label_ar text not null default '' check (char_length(label_ar) <= 40);

alter table public.store_locations
  add column if not exists area_ar text not null default '' check (char_length(area_ar) <= 80),
  add column if not exists address_ar text not null default '' check (char_length(address_ar) <= 300),
  add column if not exists hours_ar text not null default '' check (char_length(hours_ar) <= 200);

alter table public.delivery_zones
  add column if not exists name_ar text not null default '' check (char_length(name_ar) <= 80),
  add column if not exists eta_ar text not null default '' check (char_length(eta_ar) <= 60);

alter table public.store_settings
  add column if not exists announcement_text_ar text not null default 'الدفع عند الاستلام في كل لبنان · توصيل مجاني للطلبات فوق ٥٠$' check (char_length(announcement_text_ar) <= 200),
  add column if not exists order_notice_ar text not null default 'الطلبات قبل الساعة ٤ عصراً تصل في اليوم نفسه أو يوم العمل التالي.' check (char_length(order_notice_ar) <= 300);

update public.store_settings
   set announcement_text = 'Cash on delivery all over Lebanon · Free delivery on orders over $50'
 where announcement_text like 'Cash on delivery all over Lebanon %Free delivery on orders over $50';

-- Orders: language, private link and email bookkeeping ----------------

alter table public.orders
  add column if not exists locale text not null default 'en' check (locale in ('en', 'ar')),
  add column if not exists tracking_token text check (tracking_token is null or tracking_token ~ '^[A-Za-z0-9_-]{43}$'),
  add column if not exists confirmation_email_sent_at timestamptz;

-- Admins may read orders (including the private link, so they can share
-- it on WhatsApp); only the server writes it.

drop function if exists public.create_guest_order(uuid, text, text, text, text, text, uuid, text, text, jsonb, text, integer);

create function public.create_guest_order(
  p_checkout_key uuid,
  p_request_hash text,
  p_tracking_token text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_zone_id uuid,
  p_address text,
  p_notes text,
  p_items jsonb,
  p_promo_code text,
  p_expected_total_cents integer,
  p_locale text
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
  v_token_hash text;
begin
  if p_tracking_token is null or p_tracking_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'INVALID_CHECKOUT_REQUEST';
  end if;
  v_token_hash := encode(extensions.digest(p_tracking_token, 'sha256'), 'hex');

  select * into v_existing from public.orders where checkout_key = p_checkout_key;
  if found then
    if v_existing.request_hash = p_request_hash and v_existing.tracking_token_hash = v_token_hash then
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
      'variantId', v_variant.id, 'productId', v_variant.product_id,
      'productName', v_variant.product_name, 'productSlug', v_variant.product_slug,
      'label', v_variant.label, 'price', v_variant.price_cents, 'quantity', v_quantity
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
    select * into v_promo from public.promotions where code = upper(btrim(p_promo_code)) for update;
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
    checkout_key, request_hash, tracking_token_hash, tracking_token, locale,
    customer_name, customer_phone, customer_email,
    delivery_zone_id, delivery_zone_name, delivery_address, customer_notes,
    subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code
  ) values (
    p_checkout_key, p_request_hash, v_token_hash, p_tracking_token,
    case when p_locale = 'ar' then 'ar' else 'en' end,
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
      v_order_id, (v_line->>'productId')::uuid, (v_line->>'variantId')::uuid,
      v_line->>'productName', v_line->>'productSlug', v_line->>'label',
      (v_line->>'price')::integer, (v_line->>'quantity')::integer,
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

  insert into public.order_events (order_id, kind, to_value) values (v_order_id, 'placed', 'pending');

  return jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_number, 'repeated', false);
end;
$$;

revoke all on function public.create_guest_order(uuid, text, text, text, text, text, uuid, text, text, jsonb, text, integer, text)
from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid, text, text, text, text, text, uuid, text, text, jsonb, text, integer, text)
to service_role;

-- Bulk-friendly: confirm many orders at once uses admin_set_order_status.

commit;
