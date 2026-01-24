# QR Menu - Multi-tenant SaaS QR Menu + Live Table Ordering

A real-time QR menu ordering system built with Vue 3, Node.js, and Prisma.

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create `.env` files in each app directory:

#### `apps/server/.env`

```env
# Server Port
PORT=3000

# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (change in production!)
JWT_SECRET="supersecret_dev_key_change_in_production"

# Customer App URL (for QR code generation)
# This is the public URL where customers access the menu
# In development, this is usually http://localhost:5173
# In production, use your deployed customer app URL
CUSTOMER_APP_URL="http://localhost:5173"
```

#### `apps/customer/.env`

```env
# API URL (backend server)
VITE_API_URL=http://localhost:3000/api

# Socket.IO URL (for real-time updates)
VITE_SOCKET_URL=http://localhost:3000
```

#### `apps/admin/.env`

```env
# API URL (backend server)
VITE_API_URL=http://localhost:3000/api

# Socket.IO URL (for real-time updates)
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Set Up Database

```bash
# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

This creates a demo restaurant:
- **Email:** `admin@demo.com`
- **Password:** `password`
- **Restaurant Slug:** `demo`

### 4. Start Development Servers

```bash
# Start all apps in parallel
pnpm dev

# Or start individually:
pnpm dev:server    # Server on http://localhost:3000
pnpm dev:customer  # Customer app on http://localhost:5173
pnpm dev:admin     # Admin app on http://localhost:5174
```

## Environment Variables Reference

### Server (`apps/server/.env`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `DATABASE_URL` | Prisma database connection string | `file:./prisma/dev.db` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | `supersecret_dev_key` | Yes (change in production!) |
| `CUSTOMER_APP_URL` | Public URL of customer app (for QR codes) | `http://localhost:5173` | Yes |

### Customer App (`apps/customer/.env`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` | No |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:3000` | No |

### Admin App (`apps/admin/.env`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` | No |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:3000` | No |

## Important: Customer App URL

The `CUSTOMER_APP_URL` in the server `.env` file is **critical** for QR code generation. This URL is embedded in the QR codes that customers scan.

- **Development:** Use `http://localhost:5173` (or whatever port Vite assigns)
- **Production:** Use your deployed customer app URL (e.g., `https://menu.yourdomain.com`)

When customers scan a QR code, they'll be redirected to: `${CUSTOMER_APP_URL}/r/{restaurantSlug}/menu?t={token}`

## Project Structure

```
QRMenu/
├── apps/
│   ├── server/          # Node.js + Express + Prisma backend
│   ├── customer/        # Vue 3 customer-facing PWA
│   └── admin/           # Vue 3 admin dashboard
├── packages/
│   └── shared/          # Shared TypeScript types
└── package.json         # Root workspace config
```

## Available Scripts

### Root Level

- `pnpm dev` - Start all apps in parallel
- `pnpm dev:server` - Start server only
- `pnpm dev:customer` - Start customer app only
- `pnpm dev:admin` - Start admin app only
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with demo data
- `pnpm db:studio` - Open Prisma Studio (database GUI)

## Features

### Core Features
- ✅ Multi-tenant restaurant management
- ✅ QR code generation per table
- ✅ Real-time order updates via Socket.IO
- ✅ Live orders board for admins
- ✅ Kitchen display mode (fullscreen)
- ✅ PWA support for customer app
- ✅ Table session management
- ✅ Order status tracking
- ✅ Server role and table ownership management
- ✅ Bill request and payment processing
- ✅ Customer profile management (name, gender, avatar)
- ✅ Table reset with automatic order filtering
- ✅ Server assignment and targeted order routing
- ✅ Reusable QR codes (remain valid after table reset)

### UI/UX Features
- ✅ Icon-based status and information badges
- ✅ Collapsible action buttons in server view
- ✅ Tab-based payment and tip selection
- ✅ Custom tip input with drawer interface
- ✅ Persistent tip selection across bill refreshes
- ✅ Dark mode compatible notifications
- ✅ Visual table representation with chair positioning

See [CHANGELOG.md](./CHANGELOG.md) for detailed recent updates.

## Production Deployment

1. **Update environment variables** for production URLs
2. **Change `JWT_SECRET`** to a secure random string
3. **Switch database** from SQLite to PostgreSQL (update `DATABASE_URL`)
4. **Build apps:** `pnpm build`
5. **Deploy** server, customer app, and admin app

## License

ISC
