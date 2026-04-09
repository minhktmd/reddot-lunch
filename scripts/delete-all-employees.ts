/**
 * Hard-delete ALL employees and their related data.
 *
 * Usage:
 *   pnpm db:delete-employees
 *
 * Deletes (in order):
 *   1. LedgerEntry[] — all ledger entries (FK to Employee)
 *   2. Order[]       — all orders (FK to Employee)
 *   3. Employee[]    — all employees
 *
 * Safe to run multiple times (idempotent).
 */

import { db } from './_db';

async function deleteAllEmployees() {
  const result = await db.$transaction(async (tx) => {
    const deletedEntries = await tx.ledgerEntry.deleteMany();
    const deletedOrders = await tx.order.deleteMany();
    const deletedEmployees = await tx.employee.deleteMany();

    return { entries: deletedEntries.count, orders: deletedOrders.count, employees: deletedEmployees.count };
  });

  console.log(`🗑  Deleted ${result.entries} ledger entries`);
  console.log(`🗑  Deleted ${result.orders} orders`);
  console.log(`🗑  Deleted ${result.employees} employees`);
  console.log('✨ Done. All employees, orders, and ledger entries have been removed.');
}

deleteAllEmployees()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
