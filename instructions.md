# Cursor AI Prompt — SaaS QR Menu + Live Ordering (Vue 3 + Node.js + Prisma)

You are building a **multi-tenant SaaS** product: **QR Menu + Live Table Ordering** (no online payments, no customer accounts).
The system must be **real-time** (live orders + notifications) and optimized for mobile/tablet on the customer side.

## IMPORTANT (Cursor Behavior)
- Use your **Memory** to retain decisions, naming conventions, folder structure, and UI patterns across files.
- Use available **MCPs** (Model Context Protocol) to speed up UI implementation, especially for **shadcn-vue** components.
- For UI building: **prefer shadcn-vue components** and search in memory / MCP / docs for existing components before writing custom HTML.
- Target shadcn-vue docs components list and use them extensively (Drawer, Dialog, Button, Card, Tabs, Form, Input, Select, Table, Toast/Sonner, Sheet, Sidebar, etc.).
- Customer UI must be **mobile/tablet only** (no desktop layout; just responsive for mobile and tablets).

## Tech Stack
### Backend
- Node.js (TypeScript)
- REST API + **Socket.IO** for realtime
- Prisma ORM
- SQLite in development, PostgreSQL in production
- Auth: restaurant admin login only (no customer auth)
- Multi-tenant: path-based (no subdomains)

### Frontends
1) **Customer QR Menu App (Vue 3 + Vite + TS)**
   - Mobile/tablet only
   - shadcn-vue UI
   - PWA support
   - No customer login
   - Table context comes from QR scan (token) and stored locally

2) **Restaurant Admin App (Vue 3 + Vite + TS)**
   - shadcn-vue UI
   - Login for restaurant admins/staff
   - Manage categories/products/modifiers/tables/QR codes
   - Live orders board
   - Kitchen display mode (full screen)

(Optionally: a small internal Super Admin section can be part of Admin app or separate route.)

## Multi-Tenancy & URLs (No Subdomains)
- Public (customer) menu routes:
  - `/r/:restaurantSlug` (menu homepage)
  - `/r/:restaurantSlug/menu?t=<tableToken>` (table context entry)
- Admin routes:
  - `/admin` (restaurant admin login)
  - `/admin/:restaurantId/*` (dashboard)
- Super admin routes (platform owner):
  - `/superadmin/*`

Each request must resolve the tenant by `restaurantSlug` (public) or `restaurantId` (admin after login).

## Roles & Permissions
Implement role-based access control for admin users:
- `SUPER_ADMIN` (platform owner)
- `RESTAURANT_OWNER` / `RESTAURANT_ADMIN`
- `STAFF` (optional)
- `KITCHEN` (optional)

Restaurants can invite/create staff users under their tenant.

## Core Features (MVP)
### Customer (QR Menu)
- Browse categories and products (big images, clean UI)
- Product details open in a **Drawer** (shadcn-vue Drawer)
- Add to cart
- Place order to the kitchen (no payment)
- Optional: add notes (e.g., “no onions”)
- Show order status updates (received / preparing / ready / served)

### Admin (Restaurant)
- CRUD categories
- CRUD products:
  - name, description, price, images
  - availability toggle
  - optional modifiers (sizes, extras)
- Manage tables:
  - Table 1, 2, 3… (custom name)
  - Generate QR codes per table
- Live orders board:
  - realtime list of incoming orders
  - update order status
- Kitchen mode:
  - fullscreen live queue for kitchen
  - large typography, sound/visual cues for new orders

### Realtime
- Use Socket.IO:
  - customer order submitted -> admin/kitchen receives instantly
  - status changes -> customer sees instantly
- Ensure tenant isolation in Socket.IO rooms (by restaurantId)

## PWA + Table Token Behavior (Critical UX)
- Customer app is a PWA.
- Table context comes from QR scan URL query param `t=<tableToken>`.
- On first open via QR scan:
  1) validate token on server
  2) store `{restaurantSlug, tableId, token, issuedAt}` in localStorage or IndexedDB
- When opening the installed PWA from home screen:
  - if valid stored context exists -> go directly to menu
  - if missing/invalid -> show a **Splash / Scan Screen** instructing the user to scan the QR code again
- Include a “Scan again” UX (instructions; if camera scanning is complex, just instruct user to scan using device camera and deep link back into the PWA)

Security:
- Make tableToken signed and short-lived (or revocable) if possible.
- Prevent cross-restaurant token usage.

## Data Model (Prisma) — Suggested Entities
- Tenant:
  - `Restaurant` (id, slug, name, address, settings)
- Auth:
  - `User` (id, email, passwordHash, role, restaurantId)
- Menu:
  - `Category` (id, restaurantId, name, sortOrder)
  - `Product` (id, restaurantId, categoryId, name, description, price, isAvailable)
  - `ProductImage` (id, productId, url)
  - Optional `ModifierGroup`, `ModifierOption` (for extras/sizes)
- Tables:
  - `Table` (id, restaurantId, name, qrTokenSeed/status)
  - `TableSession` (id, tableId, token, createdAt, expiresAt, revokedAt)
- Orders:
  - `Order` (id, restaurantId, tableId, status, total, notes, createdAt)
  - `OrderItem` (id, orderId, productId, qty, priceSnapshot, notes)
  - Optional `OrderItemModifier` (extras)
- Events:
  - `OrderEvent` (id, orderId, type, payload, createdAt)

## Project Structure (Monorepo)
Create a monorepo using `pnpm` workspaces:
- `apps/server` (Node + TS + Prisma)
- `apps/customer` (Vue 3 + shadcn-vue + PWA)
- `apps/admin` (Vue 3 + shadcn-vue)

Shared:
- `packages/shared` for shared types (DTOs, enums like OrderStatus)
- `packages/ui` optional (if you want common UI wrappers), but keep simple at MVP.

## UI Requirements (shadcn-vue)
- Use shadcn-vue components as the default building blocks.
- Customer UI:
  - big product cards, large images
  - category list / tabs
  - product details in Drawer
  - cart in Sheet/Drawer
  - toast notifications (Sonner/Toast)
- Admin UI:
  - Sidebar + main content layout
  - DataTable for products/categories/orders
  - Forms using shadcn-vue Form + Input/Select/Textarea
  - Dialogs for confirmations
- Always search for an existing component in shadcn-vue docs/MCP/memory before building custom.

## Implementation Plan (Step-by-Step)
1) Scaffold monorepo + tooling (pnpm, TS configs, lint)
2) Server:
   - Prisma schema + migrations for SQLite
   - REST endpoints:
     - public menu (categories/products)
     - table token validation
     - create order
     - order status fetch
   - Admin endpoints:
     - auth (login)
     - CRUD categories/products/tables
     - order management
   - Socket.IO:
     - rooms per restaurantId
     - events: `order:created`, `order:updated`, `kitchen:ping`
3) Customer app:
   - Routes: restaurant menu, product drawer, cart, status screen
   - PWA config + offline caching for menu assets (optional)
   - Table token storage + splash scan screen fallback
4) Admin app:
   - Login
   - Dashboard: categories/products/tables
   - QR generation view (create/download)
   - Live Orders board + Kitchen fullscreen route
5) Polish:
   - Seed data
   - Minimal theming
   - Error handling + tenant isolation tests

## Deliverables
- Working local dev setup (SQLite)
- Clear `.env.example` files for each app
- Scripts: `pnpm dev`, `pnpm db:migrate`, `pnpm db:seed`
- Production-ready migration path to PostgreSQL
- Basic documentation in `README.md`

## Non-Goals (Explicit)
- No online payments
- No customer accounts
- No customer profiles / loyalty / etc. (MVP only)

Now start implementing with best-practice defaults, clean code, and shadcn-vue-first UI approach.
