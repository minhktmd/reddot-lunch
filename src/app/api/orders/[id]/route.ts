import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const updateOrderSchema = z.object({
  menuOfDayItemId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const result = updateOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { menuOfDay: true },
    });

    if (!order) {
      return NextResponse.json({ message: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    if (!order.menuOfDay.isPublished || order.menuOfDay.isLocked) {
      return NextResponse.json({ message: 'Không thể sửa đơn lúc này' }, { status: 403 });
    }

    if (result.data.menuOfDayItemId) {
      const newItem = await prisma.menuOfDayItem.findUnique({ where: { id: result.data.menuOfDayItemId } });
      if (!newItem || newItem.menuOfDayId !== order.menuOfDayId) {
        return NextResponse.json({ message: 'Món không thuộc thực đơn hôm nay' }, { status: 400 });
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: result.data,
      include: { menuOfDayItem: true },
    });

    return NextResponse.json({
      id: updated.id,
      quantity: updated.quantity,
      isAutoOrder: updated.isAutoOrder,
      isPaid: updated.isPaid,
      paidAt: updated.paidAt?.toISOString() ?? null,
      menuOfDayItem: {
        id: updated.menuOfDayItem.id,
        name: updated.menuOfDayItem.name,
        price: updated.menuOfDayItem.price,
        sideDishes: updated.menuOfDayItem.sideDishes,
      },
    });
  } catch (error) {
    logger.error('[PATCH /api/orders/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { menuOfDay: true },
    });

    if (!order) {
      return NextResponse.json({ message: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    if (!order.menuOfDay.isPublished || order.menuOfDay.isLocked) {
      return NextResponse.json({ message: 'Không thể hủy đơn lúc này' }, { status: 403 });
    }

    await prisma.order.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[DELETE /api/orders/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
