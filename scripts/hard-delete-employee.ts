/**
 * Hard delete an employee and ALL related data.
 *
 * Usage:
 *   pnpm tsx scripts/hard-delete-employee.ts <employeeId>
 *   pnpm tsx scripts/hard-delete-employee.ts <employeeId> --dry-run
 *
 * What gets deleted (in order):
 *   1. LedgerEntry[]     — all ledger entries for this employee
 *   2. Order[]           — all orders placed by this employee
 *   3. Employee          — the employee record itself
 *
 * MenuOfDay / MenuOfDayItem are NOT touched —
 * they belong to the menu, not the employee.
 */

import { db } from './_db';

async function hardDeleteEmployee(employeeId: string, dryRun: boolean) {
  // 1. Verify employee exists
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { _count: { select: { orders: true, ledgerEntries: true } } },
  });

  if (!employee) {
    console.error(`❌ Employee not found: ${employeeId}`);
    process.exit(1);
  }

  console.log(`\nEmployee found:`);
  console.log(`  Name:           ${employee.name}`);
  console.log(`  Email:          ${employee.email ?? '—'}`);
  console.log(`  Active:         ${employee.isActive}`);
  console.log(`  Orders:         ${employee._count.orders}`);
  console.log(`  Ledger entries: ${employee._count.ledgerEntries}`);
  console.log(`  Mode:           ${dryRun ? 'DRY RUN (no changes)' : '⚠️  LIVE DELETE'}`);

  if (dryRun) {
    console.log('\n✅ Dry run complete. Nothing was changed.');
    return;
  }

  // 2. Confirm
  console.log('\nThis will permanently delete:');
  console.log(`  - ${employee._count.ledgerEntries} ledger entry/entries`);
  console.log(`  - ${employee._count.orders} order(s)`);
  console.log(`  - The employee record`);
  console.log('\nProceeding in 3 seconds... (Ctrl+C to abort)');
  await new Promise((r) => setTimeout(r, 3000));

  // 3. Delete inside a transaction
  const result = await db.$transaction(async (tx) => {
    const deletedEntries = await tx.ledgerEntry.deleteMany({
      where: { employeeId },
    });

    const deletedOrders = await tx.order.deleteMany({
      where: { employeeId },
    });

    await tx.employee.delete({
      where: { id: employeeId },
    });

    return { entries: deletedEntries.count, orders: deletedOrders.count };
  });

  console.log(
    `\n✅ Done. Deleted ${result.entries} ledger entry/entries, ${result.orders} order(s), and employee "${employee.name}".`
  );
}

// --- Entry point ---
const args = process.argv.slice(2);
const employeeId = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');

if (!employeeId) {
  console.error('Usage: pnpm tsx scripts/hard-delete-employee.ts <employeeId> [--dry-run]');
  process.exit(1);
}

hardDeleteEmployee(employeeId, dryRun)
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
