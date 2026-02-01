# Table Categories and User Impersonation Implementation

## Summary

This document outlines the implementation of two major features:
1. **Table Categories** - Group tables by location/area (e.g., Indoors, Terrace, Bar)
2. **User Impersonation** - Allow admins to impersonate other users (especially waiters)

## 1. Table Categories

### Database Schema Changes

#### New Model: `TableCategory`
```prisma
model TableCategory {
  id           String     @id @default(uuid())
  name         String     // e.g., "Indoors", "Terrace", "Bar", "VIP"
  description  String?    // Optional description
  sortOrder    Int        @default(0)
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  tables       Table[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([restaurantId])
}
```

#### Updated `Table` Model
- Added `categoryId` field (nullable)
- Added `category` relation to `TableCategory`

#### Updated `Restaurant` Model
- Added `tableCategories` relation

### API Endpoints (apps/server/src/tables.ts)

#### Table Category Endpoints
- **GET `/api/tables/categories`** - Get all table categories for restaurant
- **POST `/api/tables/categories`** - Create new table category
  - Body: `{ name, description?, sortOrder? }`
- **PUT `/api/tables/categories/:categoryId`** - Update table category
  - Body: `{ name, description?, sortOrder? }`
- **DELETE `/api/tables/categories/:categoryId`** - Delete table category
  - Prevents deletion if category has tables

#### Updated Table Endpoints
- **GET `/api/tables`** - Now includes `category` relation
- **POST `/api/tables`** - Now accepts `categoryId` field
- **PUT `/api/tables/:tableId`** - Now accepts `categoryId` field

### Seed Data (apps/server/prisma/seed.ts)

Created 3 default table categories:
1. **Indoors** (4 tables: Table 1-4, varying chairs)
2. **Terrace** (3 tables: Table 5-7)
3. **Bar** (3 tables: Bar 1-3, 2 chairs each)

Total: 10 tables across 3 categories

Also added **2nd waiter** (`waiter2@gmail.com`) for testing impersonation

## 2. User Impersonation

### Database Schema Changes

#### Updated `User` Model
Added impersonation tracking fields:
- `impersonating` (String?) - User ID being impersonated
- `impersonatedBy` (String?) - User ID who started impersonation  
- `impersonationStart` (DateTime?) - When impersonation started

### API Endpoints (apps/server/src/auth.ts)

#### Impersonation Endpoints
- **POST `/api/auth/impersonate`** - Start impersonating a user
  - Body: `{ targetUserId }`
  - Permissions: Only `SUPER_ADMIN` and `RESTAURANT_ADMIN`
  - `RESTAURANT_ADMIN` can only impersonate users in their restaurant
  - Returns new JWT token with impersonated user's role
  - Token expires in 1 day (shorter than normal)

- **POST `/api/auth/stop-impersonation`** - Stop impersonating
  - Clears impersonation fields
  - Returns original user's JWT token

#### Updated Login Endpoint
- Now returns `impersonating` and `impersonatedBy` fields in user object

### Frontend Changes (apps/admin)

#### Auth Store (src/stores/auth.ts)
Added functions:
- `impersonate(targetUserId)` - Start impersonating a user
- `stopImpersonation()` - Stop impersonating and return to original user
- `isImpersonating` (computed) - Check if currently impersonating
- `originalUser` (computed) - Get original user info from localStorage

Stores original user and token in localStorage during impersonation

#### Users View (src/views/superadmin/UsersView.vue)
- Added "Impersonate" button for users with `SERVER` role
- Button uses `UserCircle` icon
- Clicking prompts confirmation and starts impersonation
- Redirects to dashboard after successful impersonation

#### Dashboard Layout (src/views/dashboard/DashboardLayout.vue)
- Added **Impersonation Banner** at top of dashboard
- Shows when `authStore.isImpersonating` is true
- Displays:
  - Warning icon
  - Current impersonated user email
  - Original user email
  - "Stop Impersonation" button
- Amber background for high visibility

#### Login View (src/views/LoginView.vue)
- Updated to include 2nd waiter in demo users list:
  - `waiter@gmail.com` - Waiter 1
  - `waiter2@gmail.com` - Waiter 2

## Required Steps After Schema Changes

### 1. Generate Prisma Client
```bash
cd apps/server
npx prisma generate
```

### 2. Run Database Migration
```bash
npx prisma migrate dev --name add_table_categories_and_impersonation
```

### 3. Seed Database
```bash
npx prisma db seed
```

## Usage Examples

### Table Categories

1. **View Categories**
   - Admin navigates to Tables view
   - Categories are fetched automatically
   - Tables are grouped by category

2. **Create Category**
   ```typescript
   POST /api/tables/categories
   {
     "name": "VIP Section",
     "description": "Private VIP area",
     "sortOrder": 3
   }
   ```

3. **Assign Table to Category**
   ```typescript
   PUT /api/tables/:tableId
   {
     "name": "Table 11",
     "categoryId": "<category-id>"
   }
   ```

### User Impersonation

1. **Impersonate a Waiter**
   - Super Admin or Restaurant Admin goes to Users view
   - Clicks "Impersonate" button on a SERVER user
   - Confirms the action
   - Dashboard loads with impersonated user's role and permissions
   - Amber banner appears at top showing impersonation status

2. **Stop Impersonation**
   - Click "Stop Impersonation" button in amber banner
   - Returns to original user session
   - Banner disappears

3. **Use Case: Testing Waiter Features**
   - Admin wants to test waiter table assignment
   - Impersonates waiter account
   - Navigates to Tables view as waiter
   - Assigns tables to self
   - Stops impersonation when done

## Security Notes

### Impersonation Security
- Only `SUPER_ADMIN` and `RESTAURANT_ADMIN` can impersonate
- `RESTAURANT_ADMIN` cannot impersonate users from other restaurants
- Impersonation tokens expire faster (1 day vs 7 days)
- Impersonation is tracked in database (`impersonatedBy`, `impersonationStart`)
- Original user credentials stored only in frontend localStorage
- Clear audit trail of who impersonated whom and when

### Table Categories Security
- All category operations require authentication
- Users can only access categories for their restaurant
- Cannot delete categories that have tables assigned
- Categories cascade delete when restaurant is deleted

## Testing Checklist

### Table Categories
- [ ] Create new table category
- [ ] Update table category name/description/sortOrder
- [ ] Delete empty table category
- [ ] Verify cannot delete category with tables
- [ ] Assign table to category
- [ ] Move table between categories
- [ ] Remove table from category (set categoryId to null)
- [ ] Verify tables grouped correctly in UI

### Impersonation
- [ ] Super Admin can impersonate any user
- [ ] Restaurant Admin can impersonate users in their restaurant
- [ ] Restaurant Admin cannot impersonate users from other restaurants
- [ ] Kitchen and Server roles cannot impersonate
- [ ] Impersonation banner appears when impersonating
- [ ] Original user email shown in banner
- [ ] Stop impersonation returns to original user
- [ ] Impersonated user has correct permissions/role
- [ ] Login view shows both waiters
- [ ] Quick login works for waiter2

## Demo Users (Updated)

After running seed:

```
Super Admin:
- email: super@gmail.com
- password: PParolamea00
- Can impersonate anyone

Restaurant Admin:
- email: admin@gmail.com  
- password: password
- Can impersonate restaurant users

Kitchen:
- email: kitchen@gmail.com
- password: password
- Cannot impersonate

Waiters:
- email: waiter@gmail.com
- password: password
- Cannot impersonate

- email: waiter2@gmail.com
- password: password
- Cannot impersonate
```

## Future Enhancements

### Table Categories
- [ ] Allow filtering/searching tables by category
- [ ] Add category icons or colors
- [ ] Category-based table map/floor plan view
- [ ] Assign multiple servers per category
- [ ] Category-specific settings (auto-assign rules, etc.)

### Impersonation
- [ ] Add impersonation audit log view
- [ ] Add time limit warnings for long impersonations
- [ ] Add "Switch User" dropdown for quick impersonation
- [ ] Add impersonation activity tracking
- [ ] Add notifications when someone impersonates you
- [ ] Add permission to allow/disallow being impersonated

## Files Modified

### Backend
- `apps/server/prisma/schema.prisma` - Added TableCategory model, updated User and Table models
- `apps/server/prisma/seed.ts` - Added table categories and 2nd waiter
- `apps/server/src/auth.ts` - Added impersonation endpoints
- `apps/server/src/tables.ts` - Added category endpoints, updated table endpoints

### Frontend
- `apps/admin/src/stores/auth.ts` - Added impersonation functions
- `apps/admin/src/views/superadmin/UsersView.vue` - Added impersonate button
- `apps/admin/src/views/dashboard/DashboardLayout.vue` - Added impersonation banner
- `apps/admin/src/views/LoginView.vue` - Added waiter2 to demo users

## Troubleshooting

### Prisma Client Errors
If you see TypeScript errors about missing `tableCategory` or `impersonating` fields:
```bash
cd apps/server
npx prisma generate
```

### Database Schema Out of Sync
```bash
cd apps/server
npx prisma migrate reset  # Warning: Deletes all data
npx prisma db seed
```

### Impersonation Not Working
- Check JWT_SECRET is set in server .env
- Verify user has SUPER_ADMIN or RESTAURANT_ADMIN role
- Check browser localStorage for originalUser and originalToken
- Verify auth header is being sent with requests

### Categories Not Showing
- Verify `npx prisma generate` was run after schema changes
- Check restaurant ID matches between tables and categories
- Verify API endpoint `/api/tables/categories` returns data
- Check browser console for errors
