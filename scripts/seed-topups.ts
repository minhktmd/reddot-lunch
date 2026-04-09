/**
 * One-off script to seed today's top-up ledger entries for a list of employees.
 *
 * Usage:
 *   pnpm db:seed-topups
 *
 * Idempotent — skips employees who already have a matching topup entry today.
 */

import { db } from './_db';

const topups = [
  { email: 'hai.nguyen@reddotlabs.com', amount: 500000 },
  { email: 'ngocanhvu@reddotlabs.com', amount: 100000000 },
  { email: 'kien.do@reddotlabs.com', amount: 1005000 },
  { email: 'minh.nguyen@reddotlabs.com', amount: 500000 },
  { email: 'duy.nguyen@reddotlabs.com', amount: 45000 },
  { email: 'hoang.do@reddotlabs.com', amount: 100000 },
  { email: 'hung.pham@reddotlabs.com', amount: 500000 },
  { email: 'nghia.ngo@reddotlabs.com', amount: 500000 },
  { email: 'hai.than@reddotlabs.io', amount: 100000 },
  { email: 'thuy.vu@reddotlabs.com', amount: 45000 },
  { email: 'phung.tran@reddotlabs.com', amount: 45000 },
  { email: 'quang.doan@reddotlabs.com', amount: 45000 },
  { email: 'hieu.nguyen@reddotlabs.io', amount: 45000 },
  { email: 'manh.dang@reddotlabs.com', amount: 45000 },
  { email: 'trung.dong@reddotlabs.com', amount: 45000 },
  { email: 'long.chu@reddotlabs.com', amount: 45000 },
];

const SKIP_EMAILS = new Set(['minh.nguyen@reddotlabs.com']);

async function seedTopups() {
  console.log(`💰 Seeding ${topups.length} top-up entries...`);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let inserted = 0;
  let skipped = 0;

  for (const { email, amount } of topups) {
    if (SKIP_EMAILS.has(email)) {
      console.log(`⏭️  ${email} — skipped — already added via UI`);
      skipped++;
      continue;
    }

    const employee = await db.employee.findFirst({ where: { email } });

    if (!employee) {
      console.warn(`⚠️  ${email} — not found in DB, skipping`);
      skipped++;
      continue;
    }

    const existing = await db.ledgerEntry.findFirst({
      where: {
        employeeId: employee.id,
        type: 'topup',
        amount,
        createdAt: { gte: todayStart },
      },
    });

    if (existing) {
      console.log(`⏭️  ${email} (${employee.name}) — skipped — already exists`);
      skipped++;
      continue;
    }

    await db.ledgerEntry.create({
      data: {
        employeeId: employee.id,
        amount,
        type: 'topup',
        note: null,
        createdBy: employee.id,
      },
    });

    console.log(`✅ ${email} (${employee.name}) → +${amount.toLocaleString('vi-VN')}đ`);
    inserted++;
  }

  console.log(`\n✨ Done. Inserted: ${inserted}, Skipped: ${skipped}`);
}

seedTopups()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
