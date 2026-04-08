/**
 * Seed employees into the database.
 *
 * Usage:
 *   pnpm db:seed-employees
 *
 * Safe to re-run — skips employees whose name already exists.
 */

import { db } from './_db';

const employees = [
  { name: 'Lê Minh Đức', role: 'member' },
  { name: 'Nguyễn Thị Hồng Lê', role: 'member' },
  { name: 'Vũ Thị Thủy', role: 'member' },
  { name: 'Phan Huyền Trang', role: 'member' },
  { name: 'Trần Thị Như Trang', role: 'member' },
  { name: 'Phạm Thị Vân Anh', role: 'member' },
  { name: 'Nguyễn Hồng Hải', role: 'member' },
  { name: 'Hồ Bá Hưng', role: 'member' },
  { name: 'Phạm Thị Trà', role: 'member' },
  { name: 'Nguyễn Thị Thu Hiền', role: 'member' },
  { name: 'Ngô Thị Hiền', role: 'member' },
  { name: 'Lê Thanh Hoa', role: 'member' },
  { name: 'Vũ Ngọc Anh', role: 'admin' },
  { name: 'Nguyễn Văn Duy', role: 'member' },
  { name: 'Chu Việt Long', role: 'member' },
  { name: 'Nguyễn Ngọc Hiếu', role: 'member' },
  { name: 'Đông Văn Trung', role: 'member' },
  { name: 'Nguyễn Thị Huyền Trang', role: 'member' },
  { name: 'Thân Văn Hải', role: 'member' },
  { name: 'Đặng Đức Mạnh', role: 'member' },
  { name: 'Phạm Gia Cường', role: 'member' },
  { name: 'Trần Đức Phụng', role: 'member' },
  { name: 'Phạm Văn Tưởng', role: 'member' },
  { name: 'Đoàn Hồng Quảng', role: 'member' },
  { name: 'Nguyễn Minh Tuấn', role: 'member' },
  { name: 'Trần Nhật Linh', role: 'member' },
  { name: 'Nguyễn Mai Anh', role: 'member' },
  { name: 'Nguyễn Tuấn Minh', role: 'member' },
  { name: 'Phạm Hoàng Hà', role: 'member' },
  { name: 'Đỗ Trung Kiên', role: 'member' },
  { name: 'Triệu Thị Hợp', role: 'member' },
  { name: 'Đỗ Văn Hoàng', role: 'member' },
  { name: 'Đậu Thị Hà Linh', role: 'member' },
  { name: 'Ngô Duy Nghĩa', role: 'member' },
  { name: 'Phạm Quang Hưng', role: 'member' },
] as const;

async function seed() {
  console.log(`👥 Seeding ${employees.length} employees...`);

  // Fetch existing names in one query
  const existing = await db.employee.findMany({
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  const toInsert = employees.filter((e) => !existingNames.has(e.name));
  const skipped = employees.length - toInsert.length;

  if (toInsert.length > 0) {
    await db.employee.createMany({
      data: toInsert.map((e) => ({
        name: e.name,
        role: e.role,
        isActive: true,
        autoOrder: false,
      })),
    });
  }

  console.log(`✅ Inserted ${toInsert.length} employees (${skipped} skipped — already exist)`);
  console.log('✨ Done.');
}

seed()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
