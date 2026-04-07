import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/config/env';
import { type ExternalDishItem, getTodayUTC } from '@/domains/menu';
import { buildAutoOrderMessage, buildMenuPublishedMessage } from '@/features/slack-notifications';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { postChannel, postDM } from '@/shared/lib/slack';

const externalDishItemSchema = z.object({
  name: z.string().min(1),
  orderUrl: z.string().url(),
});

const publishMenuSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().int().min(1),
      sideDishes: z.string().optional(),
    })
  ),
  externalDishes: z.array(externalDishItemSchema).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = publishMenuSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { items, externalDishes } = result.data;

    if (items.length === 0 && externalDishes.length === 0) {
      return NextResponse.json(
        { message: 'Thêm ít nhất một món ăn hoặc một món ăn ngoài trước khi đăng' },
        { status: 400 }
      );
    }

    const today = getTodayUTC();

    const existing = await prisma.menuOfDay.findUnique({ where: { date: today } });
    if (existing) {
      return NextResponse.json({ message: 'Thực đơn hôm nay đã được đăng' }, { status: 409 });
    }

    // Create MenuOfDay + items + auto orders in a transaction
    const menu = await prisma.$transaction(async (tx) => {
      const menuOfDay = await tx.menuOfDay.create({
        data: {
          date: today,
          isPublished: true,
          externalDishes: externalDishes,
          items: {
            create: items.map((item) => ({
              name: item.name,
              price: item.price,
              sideDishes: item.sideDishes ?? null,
            })),
          },
        },
        include: { items: true },
      });

      // Auto orders only when standard items exist
      if (menuOfDay.items.length > 0) {
        const employees = await tx.employee.findMany({
          where: { isActive: true, autoOrder: true },
        });

        for (const employee of employees) {
          const existingOrder = await tx.order.count({
            where: { menuOfDayId: menuOfDay.id, employeeId: employee.id },
          });
          if (existingOrder > 0) continue;

          const randomItem = menuOfDay.items[Math.floor(Math.random() * menuOfDay.items.length)];
          await tx.order.create({
            data: {
              menuOfDayId: menuOfDay.id,
              employeeId: employee.id,
              menuOfDayItemId: randomItem.id,
              quantity: 1,
              isAutoOrder: true,
            },
          });
        }
      }

      return menuOfDay;
    });

    revalidateTag('menu-today', { expire: 0 });
    revalidateTag('menu-suggestions', { expire: 0 });

    // Slack notifications (outside transaction — failures should not roll back the publish)
    if (items.length > 0) {
      const appUrl = env.NEXT_PUBLIC_APP_URL;

      const channelMessage = buildMenuPublishedMessage(
        today,
        items.map((item) => ({ name: item.name, price: item.price, sideDishes: item.sideDishes ?? null })),
        appUrl
      );
      await postChannel(channelMessage);

      // DMs to auto-order employees
      const autoOrderedEmployees = await prisma.order.findMany({
        where: { menuOfDayId: menu.id, isAutoOrder: true },
        include: {
          employee: true,
          menuOfDayItem: true,
        },
      });

      await Promise.allSettled(
        autoOrderedEmployees
          .filter((o) => o.employee.slackId)
          .map((o) =>
            postDM(o.employee.slackId!, buildAutoOrderMessage(o.menuOfDayItem.name, o.menuOfDayItem.price, appUrl))
          )
      );
    }

    return NextResponse.json({
      id: menu.id,
      date: menu.date.toISOString(),
      isPublished: menu.isPublished,
      isLocked: menu.isLocked,
      items: menu.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        sideDishes: item.sideDishes,
      })),
      externalDishes: (menu.externalDishes as ExternalDishItem[]) ?? [],
    });
  } catch (error) {
    logger.error('[POST /api/menu/publish]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
