/**
 * Hard-delete ALL orders in the system.
 *
 * Usage:
 *   pnpm db:delete-orders
 *
 * Deletes:
 *   1. Order[] — all orders
 *
 * MenuOfDay, MenuOfDayItem, and Employee records are NOT touched.
 * Safe to run multiple times (idempotent).
 */

import { db } from './_db';

async function deleteAllOrders() {
  const { count } = await db.order.deleteMany();

  console.log(`🗑  Deleted ${count} orders`);
  console.log('✨ Done. All orders have been removed.');
}

deleteAllOrders()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
