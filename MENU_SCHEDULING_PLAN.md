# Menu Scheduling Implementation Plan

## Feature: Menu Scheduling (Program Meniu)

### Scenarii:
1. **Mic Dejun** 07:00-11:00 - Omletă, cafea, croissant
2. **Prânz** 11:00-17:00 - Ciorbe, fel principal, desert
3. **Cină** 17:00-22:00 - Grill, paste, vin
4. **Weekend Special** - Meniu diferit sâmbătă/duminică

### Model de date:
- Fiecare categorie poate avea program propriu
- Sau fiecare produs individual
- Suport pentru zile specifice (Luni, Marți, etc.)
- Suport pentru excepții (închis de sărbători)

### UI:
- Admin: Time picker pentru fiecare categorie/produs
- Customer: Badge "Disponibil acum" / "Disponibil de la ora X"
- Produse indisponibile - gri out sau ascunse complet

### API:
- GET /menu - returnează doar produsele disponibile la ora curentă
- POST /menu/categories/:id/schedule - setează program
