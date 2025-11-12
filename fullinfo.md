# PickNTrust – Full Technical Information

This document captures the complete, practical picture of the website: architecture, database, SPA routes, API endpoints, slugs/categories, banners, bots, scripts, deployment and Nginx, plus key troubleshooting notes. Use this file to quickly locate and understand components across the stack.

## Architecture Overview
- Client: React SPA using `wouter` routing, located in `client/`
- Server: Node.js + Express (ESM) in `server/`, mixed TS/JS
- Database: SQLite via `better-sqlite3` and Drizzle (`server/db.js`, `server/config/database.ts`)
- Bots: Telegram-based automation, master webhook in `server/routes.ts`
- Assets/Widgets/Banners: Managed through server routes, admin UI under SPA pages
- Deployment: PM2 for Node process, Nginx reverse proxy serving HTTP; multiple deployment scripts

## Key Paths
- Client SPA: `client/src/App.tsx`, pages under `client/src/pages/`
- Server entrypoints: `server/index.ts` or built `dist/server/index.js`; primary API in `server/routes.ts`
- DB config: `server/config/database.ts` (resolves `database.sqlite` path)
- Raw DB init: `db.js` (fallback CREATE TABLE definitions + sample travel categories)
- Nginx configs/scripts: root `*.conf`, `fix-nginx-*.ps1`, `deploy-ubuntu.sh`, `deploy-ec2-linux.sh`
- Scripts: `scripts/` (seed, migrate, deploy, checks)

## SPA Routes (client)
- Home and general: `home.tsx`, `search.tsx`, `not-found.tsx`, `affiliate-disclosure.tsx`, `how-it-works.tsx`, `privacy-policy.tsx`, `terms-of-service.tsx`
- Content pages: `blog.tsx`, `blog-post.tsx`, `videos.tsx`, `apps.tsx`, `wishlist.tsx`
- Categories: `browse-categories.tsx`, `category.tsx`, `DynamicPage.tsx`
- Picks pages: `prime-picks.tsx`, `value-picks.tsx`, `click-picks.tsx`, `global-picks.tsx`, `deals-hub.tsx`, `loot-box.tsx`, `top-picks.tsx`, `trending.tsx`
- Travel: `travel-picks.tsx`, `flights.tsx`, `hotels.tsx`
- Services & Advertise: `services.tsx`, `advertise.tsx`, `advertise-register.tsx`, `advertise-dashboard.tsx`, `advertise-checkout.tsx`, `admin-payments.tsx`
- Admin & Bot: `admin.tsx`, `admin-new.tsx`, `BannerAdmin.tsx`, `BotAdmin.tsx`, `logo-preview.tsx`, `timer-demo.tsx`, `NavigationManagement.tsx`

## API Overview (server)
- Core & health: `GET /`, `GET /health`, `GET /api/status`, debug endpoints in `routes.ts`
- Products & categories: `GET /api/products`, `GET /api/products/category/:category`, `GET /api/categories`, page-filtered products `GET /api/products/page/:page`, categories-by-page `GET /api/categories/page/:page`
- Travel categories: `server/travel-categories-routes.ts` – `GET /api/travel/categories`, `GET /api/travel/deals`, `GET /api/travel/products/category/:category`, `GET /api/travel/deals/count`
- Banners: Static config and Dynamic banners – admin CRUD + order + toggle endpoints
- Widgets: Admin CRUD, public widgets by page/position; reorder and toggle supported
- Blog & videos: CRUD endpoints, `GET /api/blog`, `GET /api/blog/:slug`, `GET /api/video-content`
- Payments: Stripe intents, Razorpay orders/verify; `GET /api/payment/settings` and admin activation/update
- Affiliate system: configure, build URLs, bulk-processing, validate, click tracking
- URL Processing: `POST /api/process-url`, bulk URLs, resolve, detect platforms, scrape, convert affiliate, queue control, Telegram URL processing; `GET /api/process/status`, `GET /api/process/platforms`
- Credentials: Admin CRUD, testing, initialization; mark as used, health & stats endpoints
- Unified content: CRUD, feature/active toggles; categories by page type
- Image proxy: `GET /image` + stats; `POST /image/clean`
- RSS feeds: Admin CRUD, test/run aggregation; `GET` aggregation stats
- Bot admin: Commission rates, affiliate tags (CRUD), performance placeholders; toggle/restart/init bots; `GET /api/bot/status`
- Bot webhook: Master webhook `POST /webhook/master/:token` and alias `POST /api/webhook/master/:token` with token verification and processing deferral

Tip: A comprehensive list is discoverable in `server/routes.ts` and `routes.js` (legacy). Travel-related endpoints in `server/travel-categories-routes.ts`.

## Slugs & Categories
- Slug generation (client): `client/src/components/admin/NavigationManagement.tsx` `generateSlug(name)` lowercases, replaces non-alphanumerics with `-`, collapses dashes, trims sides
- Category matching (server): `routes.js` normalizes `:category` param, tokenizes, matches with `LIKE` and synonyms for broad matching; travel categories map under `travel-picks-bot.ts`
- Auto-categorization (server): `server/url-processing-service.ts` `determineCategory()` uses keywords in name/description; `server/enhanced-smart-categorization.ts` augments rules
- Product-bulk-notes: `product-bulk-notes.html` clarifies product vs blog slugs are separate

## Banners & Widgets
- Static banners: Config per page (`GET /api/static/:page`), admin endpoints for creating/updating/deleting banners and static config
- Dynamic banners: Admin CRUD, reorder, toggle; import static banners → dynamic
- Widgets: Admin-side creation/update/delete; public fetch by page and position; seed/reset scripts under `scripts/`

## Bots
- Master webhook: `server/routes.ts` `POST /webhook/master/:token` (+ `/api/webhook/master/:token` alias). Verifies against `MASTER_BOT_TOKEN` and allowed tokens, respects admin toggle, processes asynchronously via `TelegramBotManager`
- Travel Picks bot: `server/travel-picks-bot.ts` with `TRAVEL_CATEGORIES` mapping and affiliate templates; saves to `travel_products`
- Locking: `server/bot-lock-manager.ts` ensures single polling instance per token; `server/conflict-free-bot-manager.ts` orchestrates bots without 409 conflicts
- Status: `server/bot-status-routes.ts` `GET /api/bot/status` queries Telegram API for webhook info
- Admin UI: `client/src/pages/BotAdmin.tsx` method selection (Telegram/Scraping/API), bot list and priorities

## Database
- Engine: SQLite (`better-sqlite3`), resolved via `server/config/database.ts` → `database.sqlite` in project root (prod avoids `dist` paths). Env override: `DATABASE_URL` supports `file:` prefix
- Tables (fallback init in `db.js`):
  - `categories(id, name, icon, color, description)`
  - `affiliate_networks(id, name, slug unique, description, commission_rate, tracking_params, logo_url, is_active, join_url)`
  - `products(id, name, description, price, original_price, image_url, affiliate_url, affiliate_network_id, category, gender, rating, review_count, discount, is_new, is_featured, is_service, has_timer, timer_duration, timer_start_time, created_at)`
  - `blog_posts(id, title, excerpt, content, category, tags, image_url, video_url, published_at, created_at, read_time, slug, has_timer, timer_duration, timer_start_time)`
  - `announcements(...)` banner styling fields + `is_active`, timestamps
  - `newsletter_subscribers(id, email unique, subscribed_at)`
  - `admin_users(id, username unique, email unique, password_hash, reset_token, reset_token_expiry, last_login, created_at, is_active)`
  - `video_content(...)` including `platform`, `category`, `tags`, timers
  - `canva_settings(...)`, `canva_posts(...)`, `canva_templates(...)`
  - Travel: `travel_categories(name, slug, icon, color, description, isActive, displayOrder, createdAt, updatedAt)` with sample inserts
- Utilities: Multiple schema-check scripts (`check-*.cjs/js`, `fix-database-schema*.cjs/ps1`) for migrations and table introspection

## Nginx
- Reverse proxy: `proxy_pass http://127.0.0.1:5000` (some scripts target `3000`); security/CORS headers included
- Typical configs:
  - `nginx-domain-fix.conf`: `server_name pickntrust.com www.pickntrust.com`, proxy `/` and CORS preflight handling
  - `nginx-spa-fix.conf`: serves SPA static root and proxies `/api` + `/health`
  - Deployment scripts (`deploy-ubuntu.sh`, `deploy-ec2-linux.sh`) write Nginx server blocks and reload via `nginx -t` + `systemctl`
- Fix scripts: `fix-nginx-final.ps1`, `fix-nginx-config.ps1`, `fix-nginx-proxy.ps1`, `fix-website-*.ps1` verify ports and reload Nginx

## Scripts Inventory (highlights)
- Seed/migrate: `seed-form-categories.cjs`, `seed-form-flags.sql`, `seed-meta-rss.sql`, `migrate-delimited-categories-to-hierarchy.cjs`, `migrate-unified-content.cjs`, `update-unified-schema.cjs`
- Widgets: `seed-widgets*.ps1`, `reset-widgets.cjs`, `purge-widgets.sh`, `fix-fallback-widget.cjs`, `trigger-import-static.ps1`
- Categories/tags: `standardize-categories.cjs`, `normalize-categories.cjs`, `tag-pages.sql`, `tag-top-picks.sql`, `run-tag-pages.cjs`, `run-tag-top-picks.cjs`
- Deploy/PM2: `deploy-to-domain.ps1`, `pm2-refresh-ecosystem.ps1`, `restart-backend-ec2.ps1`, `restart-backend-mumma.ps1`
- Checks: `check-db.cjs`, `check-pages.cjs`, `check-display-pages.cjs`, `check-nav-tabs.cjs`, `verify-admin-endpoints.ps1`
- Travel tables: `drop-travel-tables.cjs`, `add-top-picks-triggers.sql`, `run-add-top-picks-triggers.cjs`

## Deployment & PM2
- PM2: `pm2 start dist/server/index.js --name "pickntrust"` (see `deploy-ubuntu.sh`, `deploy-ec2-linux.sh`)
- Env vars: `MASTER_BOT_TOKEN`, various `*_BOT_TOKEN`s, `DATABASE_URL`, `NODE_ENV`, `ALLOW_ANY_BOT_TOKEN`, `DEV_WEBHOOK_TOKEN`
- Health verification: scripts curl `http://127.0.0.1:5000/health` and HTTP `:80`

## Troubleshooting Notes
- Webhook auth: ensure env tokens are correct; alias endpoint `/api/webhook/master/:token` available
- DB path: production avoids `dist`; `server/config/database.ts` resolves to project root. Set `DATABASE_URL=file:./database.sqlite` to override
- Nginx routing: confirm backend port (5000 vs 3000) and SPA vs API proxy blocks; always run `nginx -t` then reload
- Category matching: if a category query returns too broad/narrow results, adjust tokenization/synonyms logic in `routes.js`
- Slug issues: use `NavigationManagement.tsx` auto-slug or sanitize manually with the same rules

This file is intentionally concise but references the exact code locations for exhaustive details. For full endpoint lists and behaviors, inspect `server/routes.ts`, `routes.js`, and specialized routers under `server/`.