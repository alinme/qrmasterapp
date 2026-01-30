# QRMenu Bug Fixes - Log

## Bug 1: Super Admin upload logo nu merge
**File**: `apps/admin/src/views/superadmin/RestaurantDetailView.vue`
**Problem**: Uploadul pare să funcționeze, dar să verificăm endpoint-ul
**Fix**: Verificat că endpointul POST `/superadmin/restaurants/:id/logo` există și funcționează corect în superadmin.ts

## Bug 2: Super Admin - adaugă câmpuri în Restaurant
**Files**: 
- `apps/server/prisma/schema.prisma` - adăugat câmpuri
- `apps/admin/src/views/superadmin/RestaurantDetailView.vue` - adăugat UI
- `apps/server/src/superadmin.ts` - adăugat handler pentru noile câmpuri
**Fields**: phoneNumber, contactPerson, contractStartDate, contractEndDate

## Bug 3: Admin Restaurant - ștergere/înlocuire imagini nu merge
**File**: `apps/admin/src/views/dashboard/MenuView.vue`
**Problem**: Funcția deleteImage nu apela backend-ul corect pentru ștergerea imaginilor de categorie
**Fix**: Adăugat endpoint pentru ștergerea imaginii de categorie și implementat în UI

## Bug 4: Customer - produse recomandate adaugă de la 2 în coș
**File**: `apps/customer/src/components/ItemCard.vue` sau `apps/customer/src/views/RestaurantView.vue`
**Problem**: Cantitatea pornea de la 2 în loc de 1 pentru produsele recomandate
**Fix**: Verificat și corectat inițializarea cantității în ProductDrawer

## Bug 5: Server - Table: nu se marchează ca servită din listă
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Nu exista buton de "Mark as Served" direct în cardul mesei pentru comenzile READY
**Fix**: Adăugat buton direct în cardul mesei pentru mark as served când sunt comenzi READY

## Bug 6: Customer - Butonul "Comandă nouă" din status nu funcționează
**File**: `apps/customer/src/components/restaurant/OrderStatusView.vue`
**Problem**: Funcția `orderMore` naviga corect, dar trebuie verificat dacă există problemă cu router
**Fix**: Verificat și corectat navigarea către meniu

## Bug 7: Categorii/Produse - ștergere/înlocuire imagini
**File**: `apps/admin/src/views/dashboard/MenuView.vue`
**Problem**: Similar cu #3, funcționalitatea de delete/replace nu era complet implementată pentru categorii
**Fix**: Implementat ștergerea și înlocuirea imaginilor pentru categorii

## Bug 8: Customer - "Cheamă chelner" nu ajunge la server
**Files**: 
- `apps/customer/src/components/restaurant/ServiceDrawer.vue` - emite eveniment
- `apps/customer/src/views/RestaurantView.vue` - handleCallWaiter doar loghează
- `apps/server/src/public.ts` - creat endpoint nou
**Problem**: Nu exista endpoint pentru waiter call, doar pentru bill request
**Fix**: Creat endpoint nou pentru waiter call și implementat handler în frontend care trimite la server

## Bug 9: Plată - Valorile din cerere nu persistă
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Când se deschidea dialogul de plată, valorile din cererea clientului nu erau preselectate corect
**Fix**: Implementat preselectarea corectă a valorilor din bill request în processBillRequest

## Bug 10: Plată integrală - Ar trebui marcat automat ca gata
**File**: `apps/server/src/bills.ts`
**Problem**: Când paymentStatus e PAID, statusul comenzii nu devenea automat SERVED
**Fix**: Adăugat logica de update automată a statusului la PAID - mark as SERVED

## Bug 11: Bacșiș custom calculat greșit
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Dacă puneai 10 lei bacșiș, calcula 16% în loc să pună 10 lei fix
**Fix**: Corectat calculul pentru tipul AMOUNT să folosească valoarea fixă direct

## Bug 12: "Preia Masă" butonul nu funcționează
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: Butonul exista dar nu funcționa corect - handleAssignTable nu era definit sau apelat corect
**Fix**: Verificat și corectat implementarea funcției handleAssignTable

## Bug 13: "Mark as Served" ar trebui să arate buton de reset masă
**File**: `apps/admin/src/views/dashboard/ServerView.vue`
**Problem**: După servire, nu era opțiune de reset direct vizibilă
**Fix**: Adăugat buton de reset masă vizibil după mark as served

## Bug 14: Mesaj Welcome în română
**Files**: Multiple fișiere cu mesaje hardcodate în engleză
**Problem**: Mesajele erau în engleză sau inconsistente
**Fix**: Localizat toate mesajele relevante în română

## Bug 15: Scos genul din profil
**File**: `apps/customer/src/components/restaurant/CustomerProfileModal.vue`
**Problem**: Există câmp de gender care trebuie eliminat
**Fix**: Eliminat câmpul gender din modal și din toate referințele
