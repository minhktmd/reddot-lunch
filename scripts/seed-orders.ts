/**
 * One-off script to seed today's lunch orders for a list of employees.
 *
 * Usage:
 *   pnpm db:seed-orders
 *
 * Idempotent — skips employees who already have an order on today's menu.
 */

import { getTodayUTC } from '@/domains/menu/lib/date';

import { db } from './_db';

const orders = [
  { email: 'trung.dong@reddotlabs.com', dishName: 'Cơm vịt om sấu' },
  { email: 'thuy.vu@reddotlabs.com', dishName: 'Cơm vịt om sấu' },
  { email: 'manh.dang@reddotlabs.com', dishName: 'Cơm vịt om sấu' },
  { email: 'hieu.nguyen@reddotlabs.io', dishName: 'Cơm cá basa kho tộ' },
  { email: 'long.chu@reddotlabs.com', dishName: 'Cơm cá basa kho tộ' },
  { email: 'hai.than@reddotlabs.io', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'phung.tran@reddotlabs.com', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'nghia.ngo@reddotlabs.com', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'kien.do@reddotlabs.com', dishName: 'Cơm vịt om sấu' },
  { email: 'hung.pham@reddotlabs.com', dishName: 'Cơm cá basa kho tộ' },
  { email: 'hoang.do@reddotlabs.com', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'minh.nguyen@reddotlabs.com', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'duy.nguyen@reddotlabs.com', dishName: 'Cơm thịt heo quay giòn bì' },
  { email: 'tuan.nguyen@reddotlabs.com', dishName: 'Cơm cá basa kho tộ' },
];

function formatDateVN(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

async function seedOrders() {
  console.log(`🍽️  Seeding ${orders.length} orders...`);

  const todayUTC = getTodayUTC();
  const menu = await db.menuOfDay.findFirst({
    where: { date: todayUTC, isPublished: true },
    include: { items: true },
  });

  if (!menu) {
    console.error('❌ No published menu found for today.');
    process.exit(1);
  }

  console.log(`📋 Menu found: ${menu.id} (${menu.items.length} items)`);

  const dateNote = formatDateVN(new Date());
  let inserted = 0;
  let skipped = 0;
  let warnings = 0;

  for (const { email, dishName } of orders) {
    const employee = await db.employee.findFirst({ where: { email } });
    if (!employee) {
      console.warn(`⚠️  ${email} — employee not found, skipping`);
      warnings++;
      continue;
    }

    const menuItem = menu.items.find((item) => item.name === dishName);
    if (!menuItem) {
      console.warn(`⚠️  ${email} — dish "${dishName}" not found in today's menu, skipping`);
      warnings++;
      continue;
    }

    const existingOrder = await db.order.findFirst({
      where: { menuOfDayId: menu.id, employeeId: employee.id },
    });
    if (existingOrder) {
      console.log(`⏭️  ${email} (${employee.name}) — skipped — order already exists`);
      skipped++;
      continue;
    }

    await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          menuOfDayId: menu.id,
          employeeId: employee.id,
          menuOfDayItemId: menuItem.id,
          quantity: 1,
          isAutoOrder: false,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          employeeId: employee.id,
          amount: -(menuItem.price * 1),
          type: 'order_debit',
          orderId: newOrder.id,
          note: dateNote,
          createdBy: null,
        },
      });
    });

    console.log(`✅ ${email} (${employee.name}) → ${dishName} (-${menuItem.price.toLocaleString('vi-VN')}đ)`);
    inserted++;
  }

  console.log(`\n✨ Done. Inserted: ${inserted}, Skipped: ${skipped}, Warnings: ${warnings}`);
}

seedOrders()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
