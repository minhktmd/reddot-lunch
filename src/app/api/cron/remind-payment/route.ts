import { NextRequest, NextResponse } from 'next/server';

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

    const unpaidEmployees = await prisma.order.findMany({
      where: { menuOfDayId: menu.id, isPaid: false },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    if (unpaidEmployees.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'everyone paid' });
    }

    await postChannel(
      `💰 ${unpaidEmployees.length} người chưa trả tiền cơm hôm nay. Trả tại: ${env.NEXT_PUBLIC_APP_URL}`,
    );

    return NextResponse.json({ ok: true, reminded: unpaidEmployees.length });
  } catch (error) {
    logger.error('[cron/remind-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
