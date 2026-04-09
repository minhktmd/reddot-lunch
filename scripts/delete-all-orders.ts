/**
 * Hard-delete ALL orders in the system.
 *
 * Usage:
 *   pnpm db:delete-orders
 *
 * Deletes (in order):
 *   1. LedgerEntry[] — all order debit entries
 *   2. Order[]       — all orders
 *
 * MenuOfDay, MenuOfDayItem, and Employee records are NOT touched.
 * Safe to run multiple times (idempotent).
 */

import { db } from './_db';

async function deleteAllOrders() {
  const result = await db.$transaction(async (tx) => {
    const deletedEntries = await tx.ledgerEntry.deleteMany({
      where: { type: 'order_debit' },
    });
    const deletedOrders = await tx.order.deleteMany();

    return { entries: deletedEntries.count, orders: deletedOrders.count };
  });

  console.log(`🗑  Deleted ${result.entries} ledger entries`);
  console.log(`🗑  Deleted ${result.orders} orders`);
  console.log('✨ Done. All orders and their ledger entries have been removed.');
}

deleteAllOrders()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
