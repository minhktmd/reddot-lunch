import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { parseDateParam } from '@/domains/menu';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const createOrderSchema = z.object({
  employeeId: z.string().min(1),
  menuOfDayItemId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');

    if (!employeeId || !date) {
      return NextResponse.json({ message: 'employeeId và date là bắt buộc' }, { status: 400 });
    }

    const menuOfDay = await prisma.menuOfDay.findUnique({
      where: { date: parseDateParam(date) },
    });

    if (!menuOfDay) {
      return NextResponse.json([]);
    }

    const orders = await prisma.order.findMany({
      where: { menuOfDayId: menuOfDay.id, employeeId },
      include: { menuOfDayItem: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        quantity: order.quantity,
        isAutoOrder: order.isAutoOrder,
        isPaid: order.isPaid,
        paidAt: order.paidAt?.toISOString() ?? null,
        menuOfDayItem: {
          id: order.menuOfDayItem.id,
          name: order.menuOfDayItem.name,
          price: order.menuOfDayItem.price,
          sideDishes: order.menuOfDayItem.sideDishes,
        },
      }))
    );
  } catch (error) {
    logger.error('[GET /api/orders]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId, menuOfDayItemId, quantity } = result.data;

    const menuOfDayItem = await prisma.menuOfDayItem.findUnique({
      where: { id: menuOfDayItemId },
      include: { menuOfDay: true },
    });

    if (!menuOfDayItem) {
      return NextResponse.json({ message: 'Món không tồn tại' }, { status: 404 });
    }

    if (!menuOfDayItem.menuOfDay.isPublished || menuOfDayItem.menuOfDay.isLocked) {
      return NextResponse.json({ message: 'Không thể đặt món lúc này' }, { status: 403 });
    }

    const order = await prisma.order.create({
      data: {
        menuOfDayId: menuOfDayItem.menuOfDayId,
        employeeId,
        menuOfDayItemId,
        quantity,
      },
      include: { menuOfDayItem: true },
    });

    return NextResponse.json(
      {
        id: order.id,
        quantity: order.quantity,
        isAutoOrder: order.isAutoOrder,
        isPaid: order.isPaid,
        paidAt: order.paidAt?.toISOString() ?? null,
        menuOfDayItem: {
          id: order.menuOfDayItem.id,
          name: order.menuOfDayItem.name,
          price: order.menuOfDayItem.price,
          sideDishes: order.menuOfDayItem.sideDishes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[POST /api/orders]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
