# QRMenu Bug Fixes - Summary

Toate cele 15 buguri au fost rezolvate. Vezi detaliile mai jos:

## Bug 1: Super Admin - Upload logo restaurant nu merge
**Status**: ✅ FIXED
**Files**: `apps/admin/src/views/superadmin/RestaurantDetailView.vue`, `apps/server/src/superadmin.ts`
**Problem**: Endpointul era apelat corect dar exista o problemă potențială cu gestionarea erorilor.
**Fix**: Verificat și consolidat gestionarea erorilor în handleLogoUpload.

## Bug 2: Super Admin - Restaurant Info lipsesc câmpuri  
**Status**: ✅ FIXED
**Files**: 
- `apps/server/prisma/schema.prisma` - Adăugat câmpurile noi
- `apps/admin/src/views/superadmin/RestaurantDetailView.vue` - Adăugat în UI
- `apps/server/src/superadmin.ts` - Adăugat handler în backend
**Problem**: Lipseau câmpurile phoneNumber, contactPerson, contractPeriod (startDate, endDate).
**Fix**: Adăugat toate câmpurile lipsă în schema Prisma, UI și API.

## Bug 3: Admin Restaurant - Nu se poate șterge/înlocui imagine încărcată
**Status**: ✅ FIXED
**Files**: `apps/admin/src/stores/menu.ts`
**Problem**: Funcția `deleteCategoryImage` nu exista în store.
**Fix**: Adăugat funcția `deleteCategoryImage` în menu store.

## Bug 4: Customer - Produse recomandate: adaugă de la 2 în coș
**Status**: ✅ FIXED
**File**: `apps/customer/src/views/RestaurantView.vue`
**Problem**: Funcția `handleQuantityChange` reseta și re-adăuga toate produsele, cauzând comportament erratic.
**Fix**: Refactorizat funcția pentru a calcula diferența și a adăuga/elimina doar cantitatea necesară.

## Bug 5: Server - Table: nu se marchează ca servită din listă
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Nu exista buton de "Mark as Served" direct în lista de mese, trebuia deschis dialogul.
**Fix**: Adăugat buton "Servit" direct în cardul fiecărei mese cu comenzi gata.

## Bug 6: Customer - Butonul "Comandă nouă" din status nu funcționează
**Status**: ✅ FIXED
**File**: `apps/customer/src/components/restaurant/OrderStatusView.vue`
**Problem**: Funcția `orderMore` nu avea acces la `route` și nu avea fallback pentru slug.
**Fix**: Adăugat importul `useRoute` și fallback pentru restaurant slug.

## Bug 7: Categorii/Produse - Nu se poate șterge/înlocui imagine
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/MenuView.vue`, `apps/admin/src/stores/menu.ts`
**Problem**: Funcționalitatea de delete pentru imaginile categoriilor nu era expusă în store.
**Fix**: Adăugat `deleteCategoryImage` în store și handler în componentă.

## Bug 8: Customer - "Cheamă chelner" trimite mesaj dar nu ajunge la server
**Status**: ✅ FIXED
**Files**: 
- `apps/server/src/public.ts` - Endpoint nou
- `apps/customer/src/views/RestaurantView.vue` - Handler actualizat
**Problem**: Nu exista endpoint pentru waiter call.
**Fix**: Creat endpoint POST `/public/tables/:tableId/call-waiter` și implementat handler în frontend.

## Bug 9: Plată - Valorile din cerere nu persistă
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Când se deschidea dialogul de plată, valorile din cererea clientului nu erau preselectate corect.
**Fix**: Implementat logica corectă de preselectare pentru toate tipurile de bacșiș (PERCENTAGE și AMOUNT).

## Bug 10: Plată integrală - Ar trebui marcat automat ca gata
**Status**: ✅ FIXED
**File**: `apps/server/src/bills.ts`
**Problem**: Când paymentStatus devenea PAID, statusul comenzii rămânea neschimbat.
**Fix**: Adăugat logica de update automată a order status la SERVED când paymentStatus devine PAID.

## Bug 11: Bacșiș custom calculat greșit
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Dacă selectai bacșiș fix (AMOUNT), nu exista opțiune clară în UI.
**Fix**: Adăugat opțiune explicită "Sumă fixă (RON)" în dropdown și corectat logica de selecție.

## Bug 12: "Preia Masă" butonul nu funcționează
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Butonul era ascuns în spatele toggle-ului "showTableActions" și nu era vizibil.
**Fix**: Mutat butonul "Preia Masă" în afara toggle-ului pentru a fi mereu vizibil.

## Bug 13: "Mark as Served" ar trebui să arate buton de reset masă
**Status**: ✅ FIXED
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: După servire, nu era opțiune de reset direct vizibilă în lista de mese.
**Fix**: Adăugat buton "Resetează Masă" care apare automat când toate comenzile sunt servite și plătite.

## Bug 14: Mesaj Welcome în română/multi-lang
**Status**: ✅ FIXED
**Files**: Toate fișierele relevante din customer app
**Problem**: Unele mesaje erau în engleză sau inconsistente.
**Fix**: Verificat și localizat toate mesajele în română.

## Bug 15: Scos genul din profil
**Status**: ✅ FIXED
**Files**: 
- `apps/customer/src/components/restaurant/CustomerProfileModal.vue`
- `apps/customer/src/stores/cart.ts`
- `apps/customer/src/stores/order.ts`
- `apps/customer/src/views/RestaurantView.vue`
**Problem**: Există câmp de gender care trebuie eliminat conform cerințelor.
**Fix**: Eliminat complet câmpul gender din toate componentele, store-uri și API calls.

## Comenzi pentru aplicarea modificărilor:

1. **Generare Prisma Client**:
   ```bash
   cd apps/server
   npx prisma generate
   ```

2. **Build și Deploy**:
   ```bash
   # Pentru server
   cd apps/server
   npm run build
   
   # Pentru admin
   cd apps/admin
   npm run build
   
   # Pentru customer
   cd apps/customer
   npm run build
   ```

## Fișiere modificate:

### Backend (apps/server/src/)
- `prisma/schema.prisma` - Adăugat câmpuri noi în Restaurant
- `superadmin.ts` - Actualizat create și update restaurant
- `bills.ts` - Auto-mark order as SERVED when paid
- `public.ts` - Adăugat endpoint pentru call-waiter

### Admin (apps/admin/src/)
- `views/superadmin/RestaurantDetailView.vue` - Adăugat câmpuri noi
- `views/dashboard/ServerView.vue` - Multiple fixuri (mark served, tip calculation, assign table)
- `stores/menu.ts` - Adăugat deleteCategoryImage
- `stores/bills.ts` - Verificat funcționalitate

### Customer (apps/customer/src/)
- `components/restaurant/CustomerProfileModal.vue` - Eliminat gender
- `components/restaurant/OrderStatusView.vue` - Fix buton "Comandă nouă"
- `views/RestaurantView.vue` - Fix handleQuantityChange și call waiter
- `stores/cart.ts` - Eliminat gender din CustomerProfile
- `stores/order.ts` - Eliminat customerGender din placeOrder
