/**
 * Reset today's menu and all related orders.
 *
 * Usage:
 *   pnpm db:reset-today
 *
 * Deletes (in order):
 *   1. Order[]         — all orders for today's menu
 *   2. MenuOfDayItem[] — all items in today's menu
 *   3. MenuOfDay       — today's menu record
 *
 * Safe to run multiple times (idempotent).
 */

import { getTodayUTC } from '../src/domains/menu/lib/date';

import { db } from './_db';

async function resetToday() {
  const today = getTodayUTC();
  console.log(`🔍 Looking for today's menu (${today.toISOString()})...`);

  const menu = await db.menuOfDay.findUnique({
    where: { date: today },
    include: {
      _count: { select: { items: true, orders: true } },
    },
  });

  if (!menu) {
    console.log('No menu found for today. Nothing to reset.');
    return;
  }

  console.log(`✅ Found menu: ${menu.id} (isPublished: ${menu.isPublished}, isLocked: ${menu.isLocked})`);

  const result = await db.$transaction(async (tx) => {
    const deletedOrders = await tx.order.deleteMany({
      where: { menuOfDayId: menu.id },
    });

    const deletedItems = await tx.menuOfDayItem.deleteMany({
      where: { menuOfDayId: menu.id },
    });

    await tx.menuOfDay.delete({
      where: { id: menu.id },
    });

    return { orders: deletedOrders.count, items: deletedItems.count };
  });

  console.log(`🗑  Deleted ${result.orders} orders`);
  console.log(`🗑  Deleted ${result.items} menu items`);
  console.log(`🗑  Deleted menu of day`);
  console.log(`✨ Reset complete. Today is clean — ready for a new test run.`);
}

resetToday()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
