# Deploying QR Menu to Vercel (and Running All Apps Together)

This guide explains how to run **admin**, **customer**, and **server** together in production, with the frontends on **Vercel** and the API on a separate host.

---

## Important: The Server Cannot Run on Vercel

Your **server** uses **Express + Socket.IO** (long‑running process + WebSockets). Vercel runs **serverless functions** (short-lived, request/response only). WebSockets and persistent Node servers are **not** supported on Vercel.

**Approach:**

| App       | Where to deploy | Notes                                  |
|----------|------------------|----------------------------------------|
| **admin**   | Vercel           | Vue + Vite SPA                         |
| **customer**| Vercel           | Vue + Vite SPA                         |
| **server**  | Railway, Render, Fly.io, etc. | Express + Socket.IO + Prisma |

So you’ll have **two Vercel projects** (admin + customer) and **one backend** elsewhere. All three run “in tandem” by using the same API and Socket URLs.

---

## 1. Deploy the Server First (Railway / Render / Fly.io)

The frontends will call this API and Socket URL. Deploy the server **before** configuring Vercel.

**Prisma:** For production deploys on Render/Railway, `@prisma/client` and `prisma` must be in **dependencies** (not devDependencies) in `apps/server/package.json`. The start command includes `prisma generate &&` before `node apps/server/dist/index.js` so the client is generated in the runtime environment.

### Option A: Railway

**Per-service config (separate admin, customer, server):**

Each app has its own `railway.toml`: `apps/server/railway.toml`, `apps/admin/railway.toml`, `apps/customer/railway.toml`. When Railway auto-imports the monorepo, it creates a service per package. **Assign each service its Config file path** so they no longer all run the server:

| Service   | Root Directory | Config file                | What it runs                    |
|-----------|----------------|----------------------------|---------------------------------|
| **server**  | `/`            | `/apps/server/railway.toml`  | Express + Socket.IO API         |
| **admin**   | `/`            | `/apps/admin/railway.toml`   | Vue admin SPA (build + serve)   |
| **customer**| `/`            | `/apps/customer/railway.toml`| Vue customer SPA (build + serve)|

1. Create a [Railway](https://railway.app) project and connect your repo.
2. For each service (server, admin, customer): set **Root Directory** = `/`, and **Config file** = the path above. Railway uses that config for build/start, so server runs the API, admin/customer run their Vue apps.
3. Add **environment variables** for the **server** service (see below). Admin/customer only need `VITE_API_URL` and `VITE_SOCKET_URL` if you use them on Railway; typically you deploy those on Vercel.

**To ignore admin and customer on Railway:**

If you deploy admin and customer on **Vercel** (recommended), use **only the server** on Railway:

1. Create a **single** Railway service for the server. Set **Root Directory** = `/`, **Config file** = `/apps/server/railway.toml`.
2. **Remove** any auto-created admin and customer services (delete them in the Railway dashboard). Deploy admin and customer to Vercel instead.

**Before you commit (Railway rebuilds on push):**

1. **Configure Railway first:** The root `railway.toml` was removed. Each service uses a config under `apps/`. In the Railway dashboard, for every service you keep:
   - Set **Root Directory** = `/`
   - Set **Config file** = `/apps/server/railway.toml` (server) or `/apps/admin/railway.toml`, `/apps/customer/railway.toml` if you use those.
2. If you **ignore** admin/customer: **delete** those services *before* you push, so only the server remains.
3. Ensure **env vars** (e.g. `DATABASE_URL`, `JWT_SECRET`, …) are set for the server service.

Then commit and push. Railway will rebuild using the per-app configs.

**Environment variables** (for the **server** service only):

   ```env
   PORT=3000
   DATABASE_URL=          # e.g. PostgreSQL URL from Railway Postgres or Neon
   JWT_SECRET=            # strong random secret
   CUSTOMER_APP_URL=      # e.g. https://customer-xxx.vercel.app (set after Vercel deploy)
   ADMIN_APP_URL=         # e.g. https://admin-xxx.vercel.app
   ```

   If you use S3 for uploads, add `AWS_*` (or your storage) vars too.

4. Add **PostgreSQL** (Railway Postgres or external like Neon). Use that `DATABASE_URL`.  
   **Note:** The app currently uses SQLite. For production you’ll need to switch Prisma to PostgreSQL and run migrations. Until then, you can keep SQLite only if your host supports a persistent volume (e.g. Render disk).

5. Run migrations:  
   `pnpm exec prisma migrate deploy` (from `apps/server`, or via Railway’s deploy command).

6. Deploy and note the public URL, e.g. `https://your-server.up.railway.app`.  
   **API base:** `https://your-server.up.railway.app/api`  
   **Socket base:** `https://your-server.up.railway.app`

### Option B: Render

**Using `render.yaml` (recommended, repo root):**

1. Create a **Web Service** on [Render](https://render.com), connect the repo.
2. Use the **Blueprint** from `render.yaml` (or create a service and match its settings): **Root Directory** = `/` (repo root), **Build** = `corepack enable && pnpm install && pnpm --filter @qr-menu/server exec prisma generate && pnpm --filter @qr-menu/server run build`, **Start** = `pnpm --filter @qr-menu/server exec prisma generate && node apps/server/dist/index.js` (Prisma generate runs in the runtime environment before start).
3. Add env vars in the Dashboard: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CUSTOMER_APP_URL`, `ADMIN_APP_URL`, etc.
4. Use Render Postgres or an external DB; run `prisma migrate deploy`.
5. Use the Render service URL as your API and Socket base.

**Or, using Root Directory `apps/server`:**

1. **Root Directory:** `apps/server`
2. **Build:** `pnpm install && pnpm exec prisma generate && pnpm run build`
3. **Start:** `pnpm run start`
4. Add the same env vars; run migrations; use the service URL as API/Socket base.

---

## 2. Deploy Admin and Customer to Vercel

You’ll create **two Vercel projects**, both from the same repo, each with a different **Root Directory**.

### One-time setup (per app)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import your **QRMenu** Git repository.
3. **Do not** deploy yet — configure first.

### Project 1: Admin

| Setting            | Value                    |
|--------------------|--------------------------|
| **Root Directory** | `apps/admin`             |
| **Framework Preset** | Vite (or leave default) |
| **Build Command**  | `pnpm run build`         |
| **Output Directory** | `dist`                 |
| **Install Command** | `pnpm install`          |

**Environment variables** (Production, Preview, Development):

| Name              | Value                                      |
|-------------------|--------------------------------------------|
| `VITE_API_URL`    | `https://YOUR_SERVER_URL/api`              |
| `VITE_SOCKET_URL` | `https://YOUR_SERVER_URL`                  |

Replace `YOUR_SERVER_URL` with your Railway/Render URL (no trailing slash).

**Optional:** `vercel.json` in `apps/admin` sets `buildCommand`, `outputDirectory`, SPA rewrites, and `PRISMA_SKIP_POSTINSTALL_GENERATE=1` (skips Prisma’s postinstall during install; admin has no schema). The table above matches that.

Click **Deploy**. Note the admin URL (e.g. `https://qr-menu-admin-xxx.vercel.app`).

---

### Project 2: Customer

| Setting            | Value                    |
|--------------------|--------------------------|
| **Root Directory** | `apps/customer`          |
| **Framework Preset** | Vite (or leave default) |
| **Build Command**  | `pnpm run build`         |
| **Output Directory** | `dist`                 |
| **Install Command** | `pnpm install`          |

**Environment variables:**

| Name              | Value                                      |
|-------------------|--------------------------------------------|
| `VITE_API_URL`    | `https://YOUR_SERVER_URL/api`              |
| `VITE_SOCKET_URL` | `https://YOUR_SERVER_URL`                  |

Customer’s `vercel.json` also sets `PRISMA_SKIP_POSTINSTALL_GENERATE=1` for the same reason.

Deploy and note the customer URL (e.g. `https://qr-menu-customer-xxx.vercel.app`).

---

## 3. Connect Everything

1. **Server env (Railway/Render):**  
   Set `CUSTOMER_APP_URL` and `ADMIN_APP_URL` to your **actual** Vercel URLs (customer and admin).  
   Redeploy the server if you had used placeholders.

2. **CORS:**  
   Your server uses `cors()`. If you use custom domains for admin/customer, ensure the server allows those origins (or keeps a permissive setup for now).

3. **Frontends:**  
   They already use `VITE_API_URL` and `VITE_SOCKET_URL`. As long as those point to your deployed server, admin and customer will use the same API and Socket.IO in tandem.

---

## 4. Monorepo Notes

- **pnpm:** Vercel detects `pnpm-lock.yaml` and uses `pnpm install`. With **Root Directory** set to `apps/admin` or `apps/customer`, install still runs from the **repo root** (where the lockfile lives), so the workspace is installed correctly.
- **Build:** Runs from the chosen Root Directory, so `pnpm run build` uses that app’s `package.json` and produces `dist/`.
- **`vercel.json`:** Both `apps/admin` and `apps/customer` have a `vercel.json` (build, output, SPA rewrites). Vercel uses the one in the project’s Root Directory.

---

## 5. Summary Checklist

- [ ] Server deployed (Railway/Render/etc.) with PostgreSQL (or SQLite + persistent disk).
- [ ] `DATABASE_URL`, `JWT_SECRET`, `CUSTOMER_APP_URL`, `ADMIN_APP_URL` set on server.
- [ ] Migrations run: `prisma migrate deploy`.
- [ ] Server URL noted (e.g. `https://your-server.up.railway.app`).
- [ ] Vercel **admin** project: Root `apps/admin`, `VITE_API_URL` + `VITE_SOCKET_URL` set, deployed.
- [ ] Vercel **customer** project: Root `apps/customer`, `VITE_API_URL` + `VITE_SOCKET_URL` set, deployed.
- [ ] Server `CUSTOMER_APP_URL` and `ADMIN_APP_URL` updated to final Vercel URLs.

After this, admin, customer, and server all run together: frontends on Vercel, API + Socket.IO on your chosen host.
