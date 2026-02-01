# Quick Setup Commands

## After Schema Changes - Run These Commands

### 1. Navigate to Server Directory
```bash
cd apps/server
```

### 2. ✅ Generate Prisma Client (ALREADY COMPLETED)
```bash
npx prisma generate
```
**Status: Done** - Prisma client has been regenerated with the new schema changes.

### 3. ✅ Create and Apply Migration (COMPLETED)
```bash
npx prisma migrate dev --name add_table_categories_and_impersonation
```
**Status: Done** - Migration `20260201152925_add_table_categories_and_impersonation` applied.

### 4. ✅ Seed Database with Test Data (COMPLETED)
```bash
npx prisma db seed
```
**Status: Done** - Database seeded with test data.

## Alternative: Reset Database Completely

If you want to start fresh (WARNING: Deletes all data):

```bash
cd apps/server
npx prisma migrate reset
# This will automatically run seeds after reset
```

## Verify Changes

```bash
# View database in Prisma Studio
npx prisma studio

# Check migration status
npx prisma migrate status
```

## Common Issues

### Issue: TypeScript errors about missing fields
**Solution:** Run `npx prisma generate`

### Issue: Database schema out of sync
**Solution:** Run `npx prisma migrate dev`

### Issue: Need fresh test data
**Solution:** Run `npx prisma db seed`

## Default Product Images

All seed products now have a default image:
- URL: `https://picsum.photos/seed/picsum/300/300`
- Type: `image`
- Random but deterministic image from Picsum

## Demo Users After Seed

| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@gmail.com | PParolamea00 |
| Restaurant Admin | admin@gmail.com | password |
| Kitchen | kitchen@gmail.com | password |
| Waiter 1 | waiter@gmail.com | password |
| Waiter 2 | waiter2@gmail.com | password |

## Table Categories Created

1. **Indoors** - Tables 1-4 (4, 4, 6, 2 chairs)
2. **Terrace** - Tables 5-7 (4, 4, 6 chairs)
3. **Bar** - Bar 1-3 (2 chairs each)

Total: 10 tables across 3 categories
