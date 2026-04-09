import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/config/env';
import { buildMenuUpdatedMessage, didItemsChange } from '@/features/slack-notifications';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { postChannel } from '@/shared/lib/slack';

import type { ExternalDishItem } from '@/domains/menu';

const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().int().min(1),
      sideDishes: z.string().optional(),
    })
  ),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const result = updateItemsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const menu = await prisma.menuOfDay.findUnique({ where: { id } });

    if (!menu) {
      return NextResponse.json({ message: 'Không tìm thấy thực đơn' }, { status: 404 });
    }

    if (!menu.isPublished) {
      return NextResponse.json({ message: 'Thực đơn chưa được đăng' }, { status: 400 });
    }

    if (menu.isLocked) {
      return NextResponse.json({ message: 'Thực đơn đã bị chốt, không thể chỉnh sửa' }, { status: 403 });
    }

    const { items: submittedItems } = result.data;
    const externalDishes = (menu.externalDishes as ExternalDishItem[]) ?? [];

    if (submittedItems.length === 0 && externalDishes.length === 0) {
      return NextResponse.json({ message: 'Cần ít nhất một món ăn hoặc món ăn ngoài' }, { status: 400 });
    }
    const submittedNames = new Set(submittedItems.map((i) => i.name));

    const existingItems = await prisma.menuOfDayItem.findMany({
      where: { menuOfDayId: id },
    });

    const itemsBefore = existingItems.map((item) => ({
      name: item.name,
      price: item.price,
      sideDishes: item.sideDishes,
    }));

    const itemsToRemove = existingItems.filter((item) => !submittedNames.has(item.name));

    // All in a single transaction: cascade-delete orders, delete removed items, upsert submitted items
    const updated = await prisma.$transaction(async (tx) => {
      // For removed items: delete their orders first, then delete the items
      for (const item of itemsToRemove) {
        await tx.order.deleteMany({ where: { menuOfDayItemId: item.id } });
        await tx.menuOfDayItem.delete({ where: { id: item.id } });
      }

      // Upsert submitted items by (menuOfDayId, name)
      for (const item of submittedItems) {
        await tx.menuOfDayItem.upsert({
          where: { menuOfDayId_name: { menuOfDayId: id, name: item.name } },
          create: {
            menuOfDayId: id,
            name: item.name,
            price: item.price,
            sideDishes: item.sideDishes ?? null,
          },
          update: {
            price: item.price,
            sideDishes: item.sideDishes ?? null,
          },
        });
      }

      return tx.menuOfDay.findUnique({
        where: { id },
        include: { items: { include: { _count: { select: { orders: true } } } } },
      });
    });

    revalidateTag('menu-today', { expire: 0 });

    const itemsAfter = updated!.items.map((item) => ({
      name: item.name,
      price: item.price,
      sideDishes: item.sideDishes,
    }));

    if (didItemsChange(itemsBefore, itemsAfter)) {
      postChannel(buildMenuUpdatedMessage(menu.date, itemsAfter, env.NEXT_PUBLIC_APP_URL)).catch((err) =>
        logger.error('Slack menu-updated notification failed', err)
      );
    }

    return NextResponse.json({
      id: updated!.id,
      date: updated!.date.toISOString(),
      isPublished: updated!.isPublished,
      isLocked: updated!.isLocked,
      externalDishes: (updated!.externalDishes as ExternalDishItem[]) ?? [],
      items: updated!.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        sideDishes: item.sideDishes,
        orderCount: item._count.orders,
      })),
    });
  } catch (error) {
    logger.error('[PATCH /api/menu/[id]/items]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
