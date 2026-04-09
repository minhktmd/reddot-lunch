import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const formatDateVN = (d: Date) => format(toZonedTime(d, 'Asia/Ho_Chi_Minh'), 'dd/MM/yyyy');

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

    const newMenuOfDayItemId = result.data.menuOfDayItemId ?? order.menuOfDayItemId;
    const newQuantity = result.data.quantity ?? order.quantity;

    if (result.data.menuOfDayItemId) {
      const newItem = await prisma.menuOfDayItem.findUnique({ where: { id: result.data.menuOfDayItemId } });
      if (!newItem || newItem.menuOfDayId !== order.menuOfDayId) {
        return NextResponse.json({ message: 'Món không thuộc thực đơn hôm nay' }, { status: 400 });
      }
    }

    const newItem = await prisma.menuOfDayItem.findUnique({ where: { id: newMenuOfDayItemId } });

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { menuOfDayItemId: newMenuOfDayItemId, quantity: newQuantity },
        include: { menuOfDayItem: true },
      });
      await tx.ledgerEntry.deleteMany({ where: { orderId: id } });
      await tx.ledgerEntry.create({
        data: {
          employeeId: order.employeeId,
          amount: -(newItem!.price * newQuantity),
          type: 'order_debit',
          orderId: id,
          note: formatDateVN(order.menuOfDay.date),
          createdBy: null,
        },
      });
      return updatedOrder;
    });

    return NextResponse.json({
      id: updated.id,
      quantity: updated.quantity,
      isAutoOrder: updated.isAutoOrder,
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

    await prisma.$transaction([
      prisma.order.delete({ where: { id } }),
      prisma.ledgerEntry.deleteMany({ where: { orderId: id } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[DELETE /api/orders/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
