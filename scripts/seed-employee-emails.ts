/**
 * One-off script to seed email addresses for existing employees.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-employee-emails.ts
 */

import { db } from './_db';

const EMAIL_MAP: Record<string, string> = {
  'Lê Minh Đức': 'duc.le@reddotlabs.com',
  'Nguyễn Thị Hồng Lê': 'le.nguyen@reddotlabs.io',
  'Vũ Thị Thủy': 'thuy.vu@reddotlabs.com',
  'Phan Huyền Trang': 'trang.phan@reddotlabs.io',
  'Trần Thị Như Trang': 'nhutrang25.tran@gmail.com',
  'Phạm Thị Vân Anh': 'vananh.pham@reddotlabs.io',
  'Nguyễn Hồng Hải': 'hai.nguyen@reddotlabs.com',
  'Hồ Bá Hưng': 'hung.ho@reddotlabs.io',
  'Phạm Thị Trà': 'tra.pham@reddotlabs.com',
  'Nguyễn Thị Thu Hiền': 'hien.nguyen@reddotlabs.io',
  'Ngô Thị Hiền': 'hien.ngo@reddotlabs.io',
  'Lê Thanh Hoa': 'hoa.le@reddotlabs.com',
  'Vũ Ngọc Anh': 'ngocanh.vu@reddotlabs.com',
  'Nguyễn Văn Duy': 'duy.nguyen@reddotlabs.com',
  'Chu Việt Long': 'long.chu@reddotlabs.com',
  'Nguyễn Ngọc Hiếu': 'hieu.nguyen@reddotlabs.io',
  'Đông Văn Trung': 'trung.dong@reddotlabs.com',
  'Nguyễn Thị Huyền Trang': 'trang.nguyen@reddotlabs.com',
  'Thân Văn Hải': 'hai.than@reddotlabs.io',
  'Đặng Đức Mạnh': 'manh.dang@reddotlabs.com',
  'Phạm Gia Cường': 'cuong.pham@reddotlabs.com',
  'Trần Đức Phụng': 'phung.tran@reddotlabs.com',
  'Phạm Văn Tưởng': 'tuong.pham@reddotlabs.io',
  'Đoàn Hồng Quảng': 'quang.doan@reddotlabs.com',
  'Nguyễn Minh Tuấn': 'tuan.nguyen@reddotlabs.com',
  'Trần Nhật Linh': 'nhatlinh.tran@reddotlabs.com',
  'Nguyễn Mai Anh': 'maianh.nguyen@reddotlabs.io',
  'Nguyễn Tuấn Minh': 'minh.nguyen@reddotlabs.com',
  'Phạm Hoàng Hà': 'ha.pham@reddotlabs.io',
  'Đỗ Trung Kiên': 'kien.do@reddotlabs.com',
  'Triệu Thị Hợp': 'hop.trieu@reddotlabs.com',
  'Đỗ Văn Hoàng': 'hoang.do@reddotlabs.com',
  'Đậu Thị Hà Linh': 'linh.dau@reddotlabs.com',
  'Ngô Duy Nghĩa': 'nghia.ngo@reddotlabs.com',
  'Phạm Quang Hưng': 'hung.pham@reddotlabs.com',
  'Phạm Văn Chung': 'chung.pham@reddotlabs.com',
};

async function seedEmails() {
  console.log(`📧 Updating emails for ${Object.keys(EMAIL_MAP).length} employees...`);

  let updated = 0;
  let notFound = 0;

  for (const [name, email] of Object.entries(EMAIL_MAP)) {
    const employee = await db.employee.findFirst({ where: { name } });

    if (!employee) {
      console.warn(`⚠️  Not found: "${name}" — skipping`);
      notFound++;
      continue;
    }

    await db.employee.update({ where: { id: employee.id }, data: { email } });
    console.log(`✅ ${name} → ${email}`);
    updated++;
  }

  console.log(`\n✨ Done. Updated: ${updated}, Not found: ${notFound}`);
}

seedEmails()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
