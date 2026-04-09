import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { getTodayUTC } from '@/domains/menu';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { postChannel } from '@/shared/lib/slack';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const menu = await prisma.menuOfDay.findFirst({
      where: { date: getTodayUTC(), isPublished: true },
    });
    if (!menu) {
      return NextResponse.json({ ok: true, skipped: 'no menu today' });
    }

    const grouped = await prisma.ledgerEntry.groupBy({
      by: ['employeeId'],
      _sum: { amount: true },
    });
    const inDebtCount = grouped.filter((g) => (g._sum.amount ?? 0) < 0).length;

    if (inDebtCount === 0) {
      return NextResponse.json({ ok: true, skipped: 'no one in debt' });
    }

    await postChannel(`💰 ${inDebtCount} người đang có số dư âm. Vào đây để nạp tiền: ${env.NEXT_PUBLIC_APP_URL}`);

    return NextResponse.json({ ok: true, reminded: inDebtCount });
  } catch (error) {
    logger.error('[cron/remind-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
