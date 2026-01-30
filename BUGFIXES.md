# QRMenu Bug Fixes - Progress Tracker

## Bug List & Status

### 🔴 CRITICAL BUGS
- [ ] 1. Super Admin - Upload logo restaurant nu merge
- [ ] 2. Super Admin - Restaurant Info lipsesc câmpuri (phone, contact person, contract period)
- [ ] 3. Admin Restaurant - Ștergere/înlocuire imagini nu merge
- [x] 4. Customer - Produse recomandate adaugă de la 2 în coș (ar trebui 1) - FIXED
- [ ] 5. Server - Mark as served din lista de mese
- [ ] 6. Customer - Buton "Comandă nouă" din status nu funcționează
- [ ] 7. Categorii/Produse - Ștergere/înlocuire imagini
- [ ] 8. Customer - "Cheamă chelner" nu ajunge la server
- [ ] 9. Plată - Valorile din cerere nu persistă (bacșiș)
- [ ] 10. Plată integrală - Auto mark as SERVED
- [ ] 11. Bacșiș custom - Calcul greșit (procent vs sumă fixă)
- [ ] 12. "Preia Masă" butonul nu funcționează
- [ ] 13. Mark as Served → arată buton reset masă
- [x] 14. Mesaj Welcome în română - FIXED
- [x] 15. Scos genul din profil - FIXED

## Modified Files
1. `apps/customer/src/components/ItemCard.vue` - Removed duplicate onQuantityChange emit
2. `apps/server/src/public.ts` - Removed customerGender from order creation
3. `apps/server/prisma/schema.prisma` - Removed customerGender field from Order model
4. `apps/admin/src/components/orders/ServerReviewDialog.vue` - Changed gender emoji to generic
5. `apps/admin/src/views/dashboard/KitchenView.vue` - Changed gender emoji to generic
6. `apps/admin/src/views/dashboard/OrdersView.vue` - Changed gender emoji to generic
7. `apps/admin/src/views/dashboard/ServerView.vue` - Changed gender emoji to generic
8. `apps/customer/src/views/ScanView.vue` - Translated welcome page to Romanian
