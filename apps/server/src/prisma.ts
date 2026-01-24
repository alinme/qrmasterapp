import { PrismaClient } from '@prisma/client';

// Prisma 7: DATABASE_URL is read from environment automatically
// The datasource url is configured in prisma/config.ts for migrations
const prisma = new PrismaClient();

export default prisma;
