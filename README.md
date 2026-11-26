# Ja'deer Organics — online shop

A colourful, mobile-first online shop for **Ja'deer Organics** (Lebanon), with a full
administration panel. Cash on delivery only, no customer accounts.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4,
Supabase (Postgres, Auth, Storage), GSAP + Lenis and React Bits–style effects.

## What's inside

**Shop**
- Home page with her Instagram imagery, rotating headline, category "story" circles,
  bestsellers, keto & gift banners, Instagram feed, shops with Google Maps, partners
- Shop with instant search and filters (category, keto, vegan, sugar-free…, in stock, sort)
- Category pages, product pages (sizes, quantity, buy now, share, reviews, "notify me
  when back in stock", sticky add-to-bag bar on phones), wishlist, bag drawer with
  free-delivery meter and "goes well with"
- One-page cash-on-delivery checkout (delivery areas & fees, promo codes, saved details)
- Private order tracking link + "Track my order" with order number and phone
- Our stores (tap to open the Google Maps app), Our story, Contact, FAQ, Delivery,
  Privacy, Terms, friendly 404
- Phone tab bar (Home · Shop · Search · Saved · Bag), floating WhatsApp button

**Admin** (`/admin`)
- Dashboard: sales chart, best sellers, orders by area, items to handle, low stock
- Orders: status flow (New → Confirmed → Preparing → Out for delivery → Delivered),
  one-tap WhatsApp messages for each status, payment, private notes, history,
  printable invoice, Excel export
- Products: details, Arabic names, labels, sizes & prices (sale prices), stock,
  photo upload (auto-optimised), illustration designer, duplicate, publish/draft
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
   - `supabase/seed.sql` (categories, 35 products, shops, delivery areas, partners, `WELCOME10`)
2. **Environment**: copy `.env.example` to `.env.local` and fill in the keys from
   Supabase → Project Settings → API keys. On Vercel, add the same variables under
   Settings → Environment Variables. Set `SITE_URL` to the real domain once it's ready
   (search engines are told not to index the site until then).
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

Product photos currently come from the shop's Instagram posts (`public/instagram/`).
Upload full-size photos from **Admin → Products → Photos**; the first photo is the
main one. Products without a photo show a colourful illustration you can design in the
product form.

### Local development with a local database

```bash
npx supabase start
npx supabase db reset   # applies the migration and seed.sql
```
