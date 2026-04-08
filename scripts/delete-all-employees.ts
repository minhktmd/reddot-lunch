/**
 * Hard-delete ALL employees and their related orders.
 *
 * Usage:
 *   pnpm db:delete-employees
 *
 * Deletes (in order):
 *   1. Order[]    — all orders (FK to Employee)
 *   2. Employee[] — all employees
 *
 * Safe to run multiple times (idempotent).
 */

import { db } from './_db';

async function deleteAllEmployees() {
  const result = await db.$transaction(async (tx) => {
    const deletedOrders = await tx.order.deleteMany();
    const deletedEmployees = await tx.employee.deleteMany();

    return { orders: deletedOrders.count, employees: deletedEmployees.count };
  });

  console.log(`🗑  Deleted ${result.orders} orders`);
  console.log(`🗑  Deleted ${result.employees} employees`);
  console.log('✨ Done. All employees and related orders have been removed.');
}

deleteAllEmployees()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
