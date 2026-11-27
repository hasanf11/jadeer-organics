-- Ja'deer Organics — product photos from the shop's latest Instagram posts
-- (files in public/photos/) and the products those posts introduced.
--
-- Safe to run more than once:
-- * New products are added as DRAFTS (hidden). Check the price and stock in
--   Admin → Products, then set them to "Published".
-- * For each product listed below, the old starter photos from public/instagram/
--   are replaced by the new ones. Photos uploaded from the admin are kept, and the
--   new photos are placed after them.

begin;

-- 1. Products seen on Instagram that were not in the shop yet (drafts) ---------

insert into public.products (
  category_id, name, name_ar, slug, tagline, tagline_ar, description, description_ar,
  ingredients, ingredients_ar, how_to_use, how_to_use_ar,
  badges, art_shape, art_color, art_background, is_featured, status, sort_order
)
select c.id, s.name, s.name_ar, s.slug, s.tagline, s.tagline_ar, s.description, s.description_ar,
       s.ingredients, s.ingredients_ar, s.how_to_use, s.how_to_use_ar,
       s.badges, s.shape, s.color, s.bg, false, 'draft', s.sort
  from (values
    ('oils-vinegars', 'Olive Oil & Truffle', 'زيت زيتون بالكمأة', 'olive-oil-truffle',
     'Liquid gold, with a truffle twist.', 'ذهب سائل بلمسة من الكمأة.',
     'Our organic Lebanese extra virgin olive oil, infused with truffle for a deep, earthy aroma. A few drops turn pasta, eggs, potatoes or a simple slice of bread into something special.',
     'زيت الزيتون اللبناني البكر الممتاز العضوي من جدير، منكّه بالكمأة لرائحة غنية وعميقة. بضع قطرات تحوّل المعكرونة والبيض والبطاطا أو حتى قطعة خبز إلى طبق مميز.',
     'Organic extra virgin olive oil, truffle aroma.', 'زيت زيتون بكر ممتاز عضوي، نكهة الكمأة.',
     'Drizzle over finished dishes; do not heat. Store away from light.', 'يُرش على الأطباق بعد تحضيرها، ولا يُسخّن. يُحفظ بعيداً عن الضوء.',
     array['organic','cold-pressed','vegan'], 'tall-bottle', '#4a5a1c', '#efe9d2', 6),
    ('natural-syrups', 'Apple Cinnamon Syrup', 'شراب التفاح والقرفة', 'apple-cinnamon-syrup',
     'Crisp apple, warm cinnamon, nothing artificial.', 'تفاح منعش وقرفة دافئة، بلا أي مواد اصطناعية.',
     'Made from organically grown apples and a touch of cinnamon. Mix with cold water, sparkling water or tea for a cosy, naturally fruity drink.',
     'مصنوع من تفاح مزروع عضوياً مع لمسة من القرفة. امزجه بالماء البارد أو الماء الفوّار أو الشاي لمشروب دافئ بنكهة الفاكهة الطبيعية.',
     'Organic apple juice, organic cane sugar, cinnamon.', 'عصير تفاح عضوي، سكر قصب عضوي، قرفة.',
     'Mix 1 part syrup with 5 parts water. Refrigerate after opening.', 'امزج جزءاً من الشراب مع ٥ أجزاء من الماء. يُحفظ في البراد بعد الفتح.',
     array['organic','preservative-free','vegan'], 'tall-bottle', '#7a8f2a', '#eef3d6', 8),
    ('natural-syrups', 'Apricot Syrup', 'شراب المشمش', 'apricot-syrup',
     'Sunny apricots in every glass.', 'مشمش مشمس في كل كوب.',
     'A bright, fruity syrup made from organically grown apricots. Lovely with cold water, over ice or in desserts.',
     'شراب منعش بطعم الفاكهة مصنوع من مشمش مزروع عضوياً. رائع مع الماء البارد أو الثلج أو في الحلويات.',
     'Organic apricot, organic cane sugar.', 'مشمش عضوي، سكر قصب عضوي.',
     'Mix 1 part syrup with 5 parts water. Refrigerate after opening.', 'امزج جزءاً من الشراب مع ٥ أجزاء من الماء. يُحفظ في البراد بعد الفتح.',
     array['organic','preservative-free','vegan'], 'tall-bottle', '#e0782a', '#fde7cf', 9),
    ('teas-wellness', 'Organic Black Tea', 'شاي أسود عضوي', 'organic-black-tea',
     'Bold, smooth energy — naturally sugar-free.', 'طاقة غنية وناعمة — خالٍ طبيعياً من السكر.',
     'Whole-leaf organic black tea with a rich, malty taste. Natural caffeine for lasting energy and focus, and full of polyphenols.',
     'شاي أسود عضوي بأوراق كاملة وطعم غني. كافيين طبيعي لطاقة وتركيز يدومان، وغني بالبوليفينول.',
     '100% organic black tea leaves.', 'أوراق شاي أسود عضوي ١٠٠٪.',
     'Steep 1 teaspoon in 250 ml of boiling water for 3–5 minutes.', 'انقع ملعقة صغيرة في ٢٥٠ مل من الماء المغلي لمدة ٣–٥ دقائق.',
     array['organic','sugar-free','vegan'], 'tin', '#a3213f', '#f7e1e4', 3),
    ('body-care', 'Natracare Organic Cotton Pads', 'فوط ناتراكير من القطن العضوي', 'natracare-organic-cotton',
     'What touches your skin matters most.', 'ما يلامس بشرتك هو الأهم.',
     'Natracare pads, liners and wipes are made with organic cotton and plant-based materials — no plastics, no perfumes, no chlorine bleaching. Breathable, gentle and kinder to the planet.',
     'فوط وبطانات ومناديل ناتراكير مصنوعة من القطن العضوي ومواد نباتية — بلا بلاستيك ولا عطور ولا تبييض بالكلور. تسمح بمرور الهواء، لطيفة على البشرة وعلى الكوكب.',
     'Organic cotton, plant-based materials.', 'قطن عضوي، مواد نباتية.',
     'Choose the size that suits you. Dispose of responsibly.', 'اختاري الحجم المناسب لك. يُتخلّص منها بطريقة مسؤولة.',
     array['organic','vegan'], 'box', '#146b66', '#dcefe9', 7)
  ) as s(category, name, name_ar, slug, tagline, tagline_ar, description, description_ar,
         ingredients, ingredients_ar, how_to_use, how_to_use_ar, badges, shape, color, bg, sort)
  join public.categories c on c.slug = s.category
on conflict (slug) do nothing;

-- Starting sizes for the new products (check the prices before publishing).
insert into public.product_variants (product_id, label, label_ar, price_cents, stock_quantity, sort_order)
select p.id, v.label, v.label_ar, v.price, 0, 0
  from (values
    ('olive-oil-truffle', '250 ml', '٢٥٠ مل', 1400),
    ('apple-cinnamon-syrup', '500 ml', '٥٠٠ مل', 700),
    ('apricot-syrup', '500 ml', '٥٠٠ مل', 700),
    ('organic-black-tea', '100 g', '١٠٠ غ', 900),
    ('natracare-organic-cotton', 'Pack', 'علبة', 600)
  ) as v(slug, label, label_ar, price)
  join public.products p on p.slug = v.slug
 where not exists (select 1 from public.product_variants x where x.product_id = p.id);

-- 2. Photos ------------------------------------------------------------------

create temporary table seed_photos (slug text, file text, sort integer) on commit drop;
insert into seed_photos values
  ('healthy-ketchup', 'ketchup-rocks', 0),
  ('chili-ketchup', 'chili-ketchup-net', 0), ('chili-ketchup', 'chili-twist', 1),
  ('bbq-sauce', 'bbq-jar', 0), ('bbq-sauce', 'keto-bbq-dip', 1),
  ('keto-bbq-sauce', 'keto-bbq-dip', 0),
  ('mustard', 'mustard-jar', 0), ('mustard', 'mustard-burger', 1),
  ('olive-oil-mayo', 'mayo-trio', 0),
  ('chili-mayo', 'mayo-trio', 0),
  ('pesto-mayo', 'mayo-trio', 0),
  ('extra-virgin-olive-oil', 'olive-oil-hummus', 0), ('extra-virgin-olive-oil', 'trio-shelf', 1),
  ('olive-oil-truffle', 'truffle-olive-oil', 0),
  ('balsamic-vinegar', 'balsamic-drizzle', 0), ('balsamic-vinegar', 'vinegar-trio', 1),
  ('apple-cider-vinegar', 'vinegar-trio', 0),
  ('pomegranate-molasses', 'trio-shelf', 0), ('pomegranate-molasses', 'vinegar-trio', 1),
  ('jadeer-trio', 'trio-shelf', 0),
  ('lemonade-syrup', 'lemonade-syrup', 0), ('lemonade-syrup', 'syrup-collection', 1),
  ('apple-cinnamon-syrup', 'apple-cinnamon-syrup', 0), ('apple-cinnamon-syrup', 'syrup-collection', 1),
  ('apricot-syrup', 'syrup-collection', 0),
  ('date-tahini-spread', 'date-tahini', 0),
  ('japanese-matcha', 'matcha', 0),
  ('organic-green-tea', 'green-tea', 0),
  ('organic-black-tea', 'black-tea', 0),
  ('collagen-peptides', 'collagen', 0),
  ('lemon-verbena-deodorant', 'deodorants', 0),
  ('aloe-vera-deodorant', 'deodorants', 0),
  ('plant-based-body-wash', 'body-wash', 0),
  ('organic-sun-protection', 'sun-protection', 0),
  ('smooth-shampoo', 'shampoo', 0),
  ('organic-face-cream', 'face-care', 0),
  ('natracare-organic-cotton', 'natracare', 0);

-- Remove the old starter photos of these products (admin uploads are kept).
delete from public.product_images i
 using public.products p
 where i.product_id = p.id
   and i.path like '/instagram/%'
   and p.slug in (select slug from seed_photos);

insert into public.product_images (product_id, path, alt, sort_order)
select p.id, '/photos/' || s.file || '.webp', p.name,
       s.sort + coalesce((select max(x.sort_order) + 1 from public.product_images x
                           where x.product_id = p.id and x.path not like '/photos/%'), 0)
  from seed_photos s
  join public.products p on p.slug = s.slug
 where not exists (
   select 1 from public.product_images x
    where x.product_id = p.id and x.path = '/photos/' || s.file || '.webp'
 );

commit;
