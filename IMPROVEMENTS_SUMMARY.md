# QRMenu Improvements - Implementation Summary

## 1. Super Admin Vizibilitate (Confidențialitate)

### Changes Made:

#### Server-side (apps/server/src/superadmin.ts):
- **Get all users endpoint**: Added filter to exclude users with role `SUPER_ADMIN`
- **Get single restaurant endpoint**: Added filter to exclude SUPER_ADMIN users from the `users` include
- **Update restaurant endpoint**: Added filter to exclude SUPER_ADMIN users from the response
- **Create restaurant endpoint**: Added filter to exclude SUPER_ADMIN users from the response
- **Upload logo endpoint**: Added filter to exclude SUPER_ADMIN users from the response

#### Server-side (apps/server/src/users.ts):
- **Get staff endpoint**: Changed role filter from `['STAFF', 'KITCHEN', 'RESTAURANT_ADMIN']` to `['STAFF', 'KITCHEN']` to exclude RESTAURANT_ADMIN

#### Frontend:
- No changes needed as the backend now filters appropriately

---

## 2. Feedback la Save (UX)

### Changes Made:

#### Stores:

**apps/admin/src/stores/superadmin.ts:**
- Added `isSaving` ref to track save state
- Updated `createUser`, `updateUser`, `deleteUser` to set `isSaving` during API calls

**apps/admin/src/stores/staff.ts:**
- Added `isSaving` ref to track save state
- Updated `createStaff`, `updateStaff`, `deleteStaff` to set `isSaving` during API calls

**apps/admin/src/stores/orders.ts:**
- Added `isSaving` ref to track save state
- Updated `updateOrderStatus`, `reviewOrder` to set `isSaving` during API calls
- Added `claimOrder` function for the new kitchen workflow

#### UI Components:

**apps/admin/src/views/superadmin/UsersView.vue:**
- Added `:loading` and `:disabled` props to Save button
- Added disabled state to Cancel button during save
- Added skeleton loader while loading users

**apps/admin/src/views/superadmin/RestaurantDetailView.vue:**
- Added `:loading` and `:disabled` props to Save buttons (both restaurant and user dialogs)
- Added disabled state to Cancel buttons during save

**apps/admin/src/views/dashboard/StaffView.vue:**
- Added `:loading` and `:disabled` props to Save button
- Added disabled state to Cancel button during save
- Added skeleton loader while loading staff

**New Component: apps/admin/src/components/ui/skeleton/**
- Created Skeleton.vue component for loading states
- Created index.ts export file

---

## 3. Notificări Comenzi în Timp Real

### Changes Made:

#### ServerView.vue (apps/admin/src/views/dashboard/ServerView.vue):
- Added persistent popup dialog for new orders (`newOrderPopupOpen`, `newOrderPopupOrder`)
- Added `showNewOrderPopup()`, `closeNewOrderPopup()`, `handleReviewFromPopup()` functions
- Popup shows: Table name, order items, total, customer notes
- Popup has two buttons: "Închide" (close) and "Revizuiește" (review)
- Popup uses purple border styling to distinguish from bill requests
- Sound notification already existed and is triggered

#### AppSidebar.vue (apps/admin/src/components/AppSidebar.vue):
- Added badge on "Server" menu item showing count of pending review orders (`SERVER_REVIEW` status)
- Badge uses destructive (red) variant for visibility
- Connected to ordersStore to get real-time updates
- Auto-connects to socket on mount

---

## 4. Workflow Bucătărie Îmbunătățit

### Changes Made:

#### Database Schema (apps/server/prisma/schema.prisma):
- Updated Order model status comment to include PENDING
- Added `claimedAt DateTime?` field to track when chef claims an order

#### Server Order Routes (apps/server/src/orderRoutes.ts):
- Updated `/review` endpoint: When sending to kitchen, status changes to `PENDING` (not PREPARING)
- Added new endpoint `POST /:orderId/claim`: Allows chef to claim a PENDING order, changes status to PREPARING, sets `claimedAt`
- Updated valid statuses to include `PENDING`

#### KitchenView.vue (apps/admin/src/views/dashboard/KitchenView.vue):
- Complete rewrite of the view
- **New Sections:**
  - **În Așteptare (PENDING)**: Orders waiting for chef to claim, with "Preia Comanda" button
  - **În Preparare (PREPARING)**: Orders being prepared, with visible timer showing elapsed time since claimed
  - **Gata de Servit (READY)**: Completed orders
- **Timer Feature:**
  - Timer shows elapsed time in MM:SS format
  - Timer color changes based on elapsed time:
    - Green (< 5 min)
    - Yellow (5-10 min)
    - Orange (10-15 min)
    - Red + pulse animation (> 15 min)
  - Timer updates every second
- **Claim Order:** Button changes status from PENDING to PREPARING
- **Mark Ready:** Button changes status from PREPARING to READY

#### Orders Store (apps/admin/src/stores/orders.ts):
- Added `claimOrder(orderId)` function that calls the new claim endpoint

---

## 5. Statusuri Comandă Extinse

### New Order Flow:
1. **SERVER_REVIEW** - Server reviews the order (can edit, add notes)
2. **PENDING** - Order sent to kitchen, waiting for chef to claim
3. **PREPARING** - Chef claimed the order, timer starts
4. **READY** - Order is ready to be served
5. **SERVED** - Order has been served to customer

### Files Modified:
- Prisma schema: Updated status enum documentation
- orderRoutes.ts: Updated review endpoint and added claim endpoint
- KitchenView.vue: Updated to handle all 5 statuses with proper UI

---

## Complete File List:

### Server:
1. `apps/server/prisma/schema.prisma` - Added claimedAt field
2. `apps/server/src/superadmin.ts` - Filter SUPER_ADMIN from responses
3. `apps/server/src/users.ts` - Filter RESTAURANT_ADMIN from staff list
4. `apps/server/src/orderRoutes.ts` - Added PENDING status and claim endpoint

### Frontend:
1. `apps/admin/src/stores/superadmin.ts` - Added isSaving state
2. `apps/admin/src/stores/staff.ts` - Added isSaving state
3. `apps/admin/src/stores/orders.ts` - Added isSaving state and claimOrder function
4. `apps/admin/src/views/superadmin/UsersView.vue` - Loading states + skeleton
5. `apps/admin/src/views/superadmin/RestaurantDetailView.vue` - Loading states
6. `apps/admin/src/views/dashboard/StaffView.vue` - Loading states + skeleton
7. `apps/admin/src/views/dashboard/ServerView.vue` - New order popup
8. `apps/admin/src/views/dashboard/KitchenView.vue` - New workflow with timer
9. `apps/admin/src/components/AppSidebar.vue` - Badge for pending orders
10. `apps/admin/src/components/ui/skeleton/Skeleton.vue` - New component
11. `apps/admin/src/components/ui/skeleton/index.ts` - New component

---

## Testing Notes:

1. **Super Admin Visibility:**
   - Log in as Super Admin → Users list should not show other SUPER_ADMIN users
   - Restaurant details should not show SUPER_ADMIN users
   - Restaurant Admin should not see themselves in Staff list

2. **Save Feedback:**
   - Click Save in any form → Button should show loading spinner and be disabled
   - Cancel button should also be disabled during save

3. **New Order Notifications:**
   - Place order from customer app
   - Server should see persistent popup with order details
   - Sidebar badge should show count of pending review orders
   - Sound should play

4. **Kitchen Workflow:**
   - Server sends order to kitchen → Status becomes PENDING
   - Kitchen view shows order in "În Așteptare" section
   - Chef clicks "Preia Comanda" → Status becomes PREPARING, timer starts
   - Timer shows elapsed time with color coding
   - Chef clicks "Marchează Gata" → Status becomes READY

5. **Status Flow:**
   - Customer places order → SERVER_REVIEW
   - Server reviews and sends → PENDING
   - Chef claims → PREPARING (with timer)
   - Chef marks ready → READY
   - Server marks served → SERVED

---

## Database Migration:

After deploying, run Prisma migration to add the claimedAt field:

```bash
cd apps/server
npx prisma migrate dev --name add_claimed_at_to_order
```

Or for production:

```bash
cd apps/server
npx prisma migrate deploy
```
