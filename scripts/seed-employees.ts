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
  { name: 'Lê Minh Đức', role: 'member', email: 'duc.le@reddotlabs.com' },
  { name: 'Nguyễn Thị Hồng Lê', role: 'member', email: 'le.nguyen@reddotlabs.io' },
  { name: 'Vũ Thị Thủy', role: 'member', email: 'thuy.vu@reddotlabs.com' },
  { name: 'Phan Huyền Trang', role: 'member', email: 'trang.phan@reddotlabs.io' },
  { name: 'Trần Thị Như Trang', role: 'member', email: 'nhutrang25.tran@gmail.com' },
  { name: 'Phạm Thị Vân Anh', role: 'member', email: 'vananh.pham@reddotlabs.io' },
  { name: 'Nguyễn Hồng Hải', role: 'member', email: 'hai.nguyen@reddotlabs.com' },
  { name: 'Hồ Bá Hưng', role: 'member', email: 'hung.ho@reddotlabs.io' },
  { name: 'Phạm Thị Trà', role: 'member', email: 'tra.pham@reddotlabs.com' },
  { name: 'Nguyễn Thị Thu Hiền', role: 'member', email: 'hien.nguyen@reddotlabs.io' },
  { name: 'Ngô Thị Hiền', role: 'member', email: 'hien.ngo@reddotlabs.io' },
  { name: 'Lê Thanh Hoa', role: 'member', email: 'hoa.le@reddotlabs.com' },
  { name: 'Vũ Ngọc Anh', role: 'admin', email: 'ngocanh.vu@reddotlabs.com' },
  { name: 'Nguyễn Văn Duy', role: 'member', email: 'duy.nguyen@reddotlabs.com' },
  { name: 'Chu Việt Long', role: 'member', email: 'long.chu@reddotlabs.com' },
  { name: 'Nguyễn Ngọc Hiếu', role: 'member', email: 'hieu.nguyen@reddotlabs.io' },
  { name: 'Đông Văn Trung', role: 'member', email: 'trung.dong@reddotlabs.com' },
  { name: 'Nguyễn Thị Huyền Trang', role: 'member', email: 'trang.nguyen@reddotlabs.com' },
  { name: 'Thân Văn Hải', role: 'member', email: 'hai.than@reddotlabs.io' },
  { name: 'Đặng Đức Mạnh', role: 'member', email: 'manh.dang@reddotlabs.com' },
  { name: 'Phạm Gia Cường', role: 'member', email: 'cuong.pham@reddotlabs.com' },
  { name: 'Trần Đức Phụng', role: 'member', email: 'phung.tran@reddotlabs.com' },
  { name: 'Phạm Văn Tưởng', role: 'member', email: 'tuong.pham@reddotlabs.io' },
  { name: 'Đoàn Hồng Quảng', role: 'member', email: 'quang.doan@reddotlabs.com' },
  { name: 'Nguyễn Minh Tuấn', role: 'member', email: 'tuan.nguyen@reddotlabs.com' },
  { name: 'Trần Nhật Linh', role: 'member', email: 'nhatlinh.tran@reddotlabs.com' },
  { name: 'Nguyễn Mai Anh', role: 'member', email: 'maianh.nguyen@reddotlabs.io' },
  { name: 'Nguyễn Tuấn Minh', role: 'member', email: 'minh.nguyen@reddotlabs.com' },
  { name: 'Phạm Hoàng Hà', role: 'member', email: 'ha.pham@reddotlabs.io' },
  { name: 'Đỗ Trung Kiên', role: 'member', email: 'kien.do@reddotlabs.com' },
  { name: 'Triệu Thị Hợp', role: 'member', email: 'hop.trieu@reddotlabs.com' },
  { name: 'Đỗ Văn Hoàng', role: 'member', email: 'hoang.do@reddotlabs.com' },
  { name: 'Đậu Thị Hà Linh', role: 'member', email: 'linh.dau@reddotlabs.com' },
  { name: 'Ngô Duy Nghĩa', role: 'member', email: 'nghia.ngo@reddotlabs.com' },
  { name: 'Phạm Quang Hưng', role: 'member', email: 'hung.pham@reddotlabs.com' },
  { name: 'Phạm Văn Chung', role: 'member', email: 'chung.pham@reddotlabs.com' },
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
        email: e.email,
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
