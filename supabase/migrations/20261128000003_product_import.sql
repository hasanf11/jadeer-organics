-- Ja'deer Organics — import products from Excel (Admin → Products → Import).
--
-- The website reads and checks the Excel file, then sends the products here.
-- Everything is saved in ONE transaction: if any product fails, nothing is
-- saved, so the shop never ends up half-imported.
--
-- Products are matched by their web address (slug) and sizes by their name
-- (e.g. "500 ml"). A value that is missing (null) keeps what is already saved.
-- Stock changes are written to the stock history like any other adjustment.
-- Safe to run more than once.

create or replace function public.admin_import_products(p_products jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  p jsonb;
  v jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_old_stock integer;
  v_new_stock integer;
  v_sort integer;
  v_products_created integer := 0;
  v_products_updated integer := 0;
  v_sizes_created integer := 0;
  v_sizes_updated integer := 0;
begin
  if not public.is_active_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_products) is distinct from 'array' or jsonb_array_length(p_products) > 1000 then
    raise exception 'INVALID_IMPORT';
  end if;

  for p in select value from jsonb_array_elements(p_products) loop
    v_product_id := null;
    select id into v_product_id from public.products where slug = p->>'slug' for update;

    if v_product_id is null then
      insert into public.products (
        name, name_ar, slug, category_id, tagline, tagline_ar, description, description_ar,
        ingredients, ingredients_ar, how_to_use, how_to_use_ar, badges, is_featured, status, sort_order
      ) values (
        p->>'name',
        coalesce(p->>'name_ar', ''),
        p->>'slug',
        (p->>'category_id')::uuid,
        coalesce(p->>'tagline', ''),
        coalesce(p->>'tagline_ar', ''),
        coalesce(p->>'description', ''),
        coalesce(p->>'description_ar', ''),
        coalesce(p->>'ingredients', ''),
        coalesce(p->>'ingredients_ar', ''),
        coalesce(p->>'how_to_use', ''),
        coalesce(p->>'how_to_use_ar', ''),
        case when jsonb_typeof(p->'badges') = 'array'
             then array(select jsonb_array_elements_text(p->'badges')) else '{}'::text[] end,
        coalesce((p->>'is_featured')::boolean, false),
        coalesce(p->>'status', 'published'),
        coalesce((p->>'sort_order')::integer, 0)
      )
      returning id into v_product_id;
      v_products_created := v_products_created + 1;
    else
      update public.products set
        name = coalesce(p->>'name', name),
        name_ar = coalesce(p->>'name_ar', name_ar),
        category_id = coalesce((p->>'category_id')::uuid, category_id),
        tagline = coalesce(p->>'tagline', tagline),
        tagline_ar = coalesce(p->>'tagline_ar', tagline_ar),
        description = coalesce(p->>'description', description),
        description_ar = coalesce(p->>'description_ar', description_ar),
        ingredients = coalesce(p->>'ingredients', ingredients),
        ingredients_ar = coalesce(p->>'ingredients_ar', ingredients_ar),
        how_to_use = coalesce(p->>'how_to_use', how_to_use),
        how_to_use_ar = coalesce(p->>'how_to_use_ar', how_to_use_ar),
        badges = case when jsonb_typeof(p->'badges') = 'array'
                      then array(select jsonb_array_elements_text(p->'badges')) else badges end,
        is_featured = coalesce((p->>'is_featured')::boolean, is_featured),
        status = coalesce(p->>'status', status),
        sort_order = coalesce((p->>'sort_order')::integer, sort_order)
      where id = v_product_id;
      v_products_updated := v_products_updated + 1;
    end if;

    for v in select value from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) loop
      v_variant_id := null;
      v_old_stock := null;
      v_new_stock := (v->>'stock')::integer;

      select id, stock_quantity into v_variant_id, v_old_stock
        from public.product_variants
       where product_id = v_product_id and lower(label) = lower(v->>'label')
       for update;

      if v_variant_id is null then
        select coalesce(max(sort_order) + 1, 0) into v_sort
          from public.product_variants where product_id = v_product_id;

        insert into public.product_variants (product_id, label, label_ar, sku, price_cents, compare_at_cents, stock_quantity, sort_order)
        values (
          v_product_id,
          v->>'label',
          coalesce(v->>'label_ar', ''),
          nullif(v->>'sku', ''),
          (v->>'price_cents')::integer,
          nullif((v->>'compare_at_cents')::integer, 0),
          coalesce(v_new_stock, 0),
          v_sort
        )
        returning id into v_variant_id;

        if coalesce(v_new_stock, 0) > 0 then
          insert into public.stock_movements (variant_id, change, reason, note, created_by)
          values (v_variant_id, v_new_stock, 'received', 'Excel import', v_admin);
        end if;
        v_sizes_created := v_sizes_created + 1;
      else
        update public.product_variants set
          label_ar = coalesce(v->>'label_ar', label_ar),
          sku = case when v ? 'sku' and v->>'sku' is not null then nullif(v->>'sku', '') else sku end,
          price_cents = coalesce((v->>'price_cents')::integer, price_cents),
          -- 0 removes the "before sale" price; empty keeps it.
          compare_at_cents = case when v->>'compare_at_cents' is null then compare_at_cents
                                  else nullif((v->>'compare_at_cents')::integer, 0) end,
          stock_quantity = coalesce(v_new_stock, stock_quantity)
        where id = v_variant_id;

        if v_new_stock is not null and v_new_stock <> v_old_stock then
          insert into public.stock_movements (variant_id, change, reason, note, created_by)
          values (v_variant_id, v_new_stock - v_old_stock, 'correction', 'Excel import', v_admin);
        end if;
        v_sizes_updated := v_sizes_updated + 1;
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'products_created', v_products_created,
    'products_updated', v_products_updated,
    'sizes_created', v_sizes_created,
    'sizes_updated', v_sizes_updated
  );
end;
$$;

revoke all on function public.admin_import_products(jsonb) from public, anon, authenticated;
grant execute on function public.admin_import_products(jsonb) to authenticated;
