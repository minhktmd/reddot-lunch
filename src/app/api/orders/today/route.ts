import { NextResponse } from 'next/server';

import { getTodayUTC } from '@/domains/menu';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET() {
  try {
    const today = getTodayUTC();

    const menu = await prisma.menuOfDay.findUnique({ where: { date: today } });

    if (!menu) {
      return NextResponse.json([]);
    }

    const orders = await prisma.order.findMany({
      where: { menuOfDayId: menu.id },
      include: {
        employee: { select: { id: true, name: true } },
        menuOfDayItem: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        quantity: order.quantity,
        isAutoOrder: order.isAutoOrder,
        isPaid: order.isPaid,
        paidAt: order.paidAt?.toISOString() ?? null,
        employee: order.employee,
        menuOfDayItem: {
          id: order.menuOfDayItem.id,
          name: order.menuOfDayItem.name,
          price: order.menuOfDayItem.price,
        },
      })),
    );
  } catch (error) {
    logger.error('[GET /api/orders/today]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
