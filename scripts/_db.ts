// Shared Prisma client for scripts — NOT the singleton from shared/lib/prisma.ts
// Scripts run as standalone Node processes, so no hot-reload concern.
// Must use withAccelerate() because the database is Prisma Postgres (via Accelerate).
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export const db = new PrismaClient({
  log: ['query', 'warn', 'error'],
}).$extends(withAccelerate());
