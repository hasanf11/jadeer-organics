# Ja'deer Organics — online shop

A colourful, mobile-first online shop for **Ja'deer Organics** (Lebanon), with a full
administration panel. Cash on delivery only, no customer accounts.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4,
Supabase (Postgres, Auth, Storage), GSAP + Lenis and React Bits–style effects.

## What's inside

**Two separate languages**: English at `/` and Arabic (right-to-left) at `/ar`, each
with its own fonts (DM Serif Display + Plus Jakarta Sans / El Messiri + Almarai), texts,
product content, emails and WhatsApp messages. A switch in the header/menu moves between
the same page in both languages; search engines get `hreflang` links for both.

**Shop**
- Home page with an animated aurora hero, swapping product cards, colourful category
  tiles, bestsellers, keto & gift banners, recipes, Instagram feed, shops, partners
- Shop with instant search and filters (category, keto, vegan, sugar-free…, in stock, sort)
- Category pages, product pages (sizes, quantity, buy now, share, reviews, "notify me
  when back in stock", sticky add-to-bag bar on phones), wishlist, bag drawer with
  free-delivery meter and "goes well with"
- One-page cash-on-delivery checkout (delivery areas & fees, promo codes, saved details)
- Private order tracking link + "Track my order" with order number and phone, and
  "My orders" (orders placed on this device, no account needed)
- Order emails (confirmation and every status change, in the customer's language) and
  a notification email to the shop for each new order and contact message
- Our stores (tap to open the Google Maps app), Offers, Journal (recipes), Wholesale,
  Our story, Contact, FAQ, Delivery, Privacy, Terms, friendly 404
- Phone tab bar (Home · Shop · Search · Saved · Bag), full-screen menu, floating WhatsApp button

**Admin** (`/admin`)
- Dashboard: sales chart, best sellers, orders by area, items to handle, low stock
- Orders: status flow (New → Confirmed → Preparing → Out for delivery → Delivered),
  one-tap WhatsApp messages for each status (in the customer's language, with their
  tracking link), payment, private notes, history, printable invoice, resend email,
  bulk status changes, printable delivery slips (selected or by status), Excel export
- Products: details, Arabic names, labels, sizes & prices (sale prices), stock,
  photo upload (auto-optimised), illustration designer, duplicate, publish/draft
- Import from Excel (Products → Import from Excel): download the template or the current
  products, fill one row per size, see a preview with any mistakes (row by row) and
  import everything in one go — new products are added, existing ones updated, stock
  changes saved in the stock history; all or nothing
- Inventory (receive stock, corrections, movement history), categories, promo codes
- Customers (grouped by phone, loyal/top badges), unfinished checkouts follow-up,
  reviews moderation, contact messages, stock alerts, mailing list (+ Excel export)
- Stores & maps (paste a Google Maps link), delivery areas & fees, retail partners, settings

**Security**: row level security on every table, all visitor writes go through validated
server actions with rate limiting and spam traps, prices/stock/discounts are re-checked
in a database transaction, private order links are stored as hashes, admin login is
rate limited, strict security headers (CSP, HSTS, frame blocking), uploads re-encoded.

**SEO**: per-page titles/descriptions, canonical URLs, Open Graph share image,
JSON-LD (Organization, GroceryStore with map, Product with prices & ratings,
Breadcrumbs, FAQ), sitemap with images, robots.txt, web app manifest.

## Setup

1. **Supabase**: create a project, then in the SQL editor run, in order:
   - `supabase/migrations/20261126000001_schema.sql`
   - `supabase/migrations/20261127000002_arabic_and_order_links.sql`
   - `supabase/migrations/20261128000003_product_import.sql` (Excel product import)
   - `supabase/seed.sql` (categories, 35 products, shops, delivery areas, partners, `WELCOME10`)
   - `supabase/seed-arabic.sql` (Arabic texts for all of the above)
   - `supabase/seed-photos.sql` (product photos from `public/photos/`, plus 5 new
     products as drafts: Olive Oil & Truffle, Apple Cinnamon Syrup, Apricot Syrup,
     Organic Black Tea, Natracare — check their prices, then publish them)

   All of these are safe to run again.
2. **Environment**: copy `.env.example` to `.env.local` and fill in the keys from
   Supabase → Project Settings → API keys. On Vercel, add the same variables under
   Settings → Environment Variables. Set `SITE_URL` to the real domain once it's ready
   (search engines are told not to index the site until then).

   **Emails** (optional but recommended): create a free [Resend](https://resend.com)
   account, verify the shop's domain and set `RESEND_API_KEY`, `ORDER_EMAIL_FROM`
   (e.g. `Ja'deer Organics <orders@jadeerorganics.com>`) and `SHOP_NOTIFY_EMAIL` (where
   new-order and message alerts go). Without them the shop works normally, just without emails.
3. **Install & run**
   ```bash
   npm install
   npm run dev
   ```
4. **Create the owner's admin account**
   ```bash
   npm run admin:create -- owner@example.com "a-strong-password" "Rasha"
   ```
   Then sign in at `/login`.

### Demo data (for presenting the shop)

Run `supabase/demo/add-demo-data.sql` in the SQL editor to fill the admin with 46 demo
orders over 30 days, reviews, messages, stock alerts, an unfinished checkout and
subscribers. Before launch, run `supabase/demo/remove-demo-data.sql` — it removes only
demo records.

### Photos

Product photos come from the shop's Instagram posts (`public/photos/` and `public/instagram/`).
Upload full-size photos from **Admin → Products → Photos**; the first photo is the
main one. Products without a photo show a colourful illustration you can design in the
product form.

### Local development with a local database

```bash
npx supabase start
npx supabase db reset   # applies the migrations, seed.sql and seed-arabic.sql
```
