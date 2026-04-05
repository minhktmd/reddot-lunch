// Shared Prisma client for scripts — NOT the singleton from shared/lib/prisma.ts
// Scripts run as standalone Node processes, so no hot-reload concern.
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  log: ['query', 'warn', 'error'],
});
