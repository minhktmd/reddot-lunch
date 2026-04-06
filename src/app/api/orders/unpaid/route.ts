import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ message: 'employeeId là bắt buộc' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { employeeId, isPaid: false },
      include: {
        menuOfDay: { select: { id: true, date: true } },
        menuOfDayItem: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        quantity: order.quantity,
        isPaid: false as const,
        menuOfDay: {
          id: order.menuOfDay.id,
          date: order.menuOfDay.date.toISOString(),
        },
        menuOfDayItem: {
          id: order.menuOfDayItem.id,
          name: order.menuOfDayItem.name,
          price: order.menuOfDayItem.price,
        },
      })),
    );
  } catch (error) {
    logger.error('[GET /api/orders/unpaid]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
