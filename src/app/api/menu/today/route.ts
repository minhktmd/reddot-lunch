import { NextResponse } from 'next/server';

import { getTodayUTC } from '@/domains/menu';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

import type { ExternalDishItem } from '@/domains/menu';

export async function GET() {
  try {
    const today = getTodayUTC();

    const menu = await prisma.menuOfDay.findUnique({
      where: { date: today },
      include: { items: true },
    });

    if (menu) {
      return NextResponse.json({
        status: 'exists',
        menu: {
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
        },
      });
    }

    // No menu today — prefill from most recent day that has items
    const previous = await prisma.menuOfDay.findFirst({
      where: { items: { some: {} } },
      orderBy: { date: 'desc' },
      include: { items: true },
    });

    const prefillItems =
      previous?.items.map((item) => ({
        name: item.name,
        price: item.price,
        sideDishes: item.sideDishes,
      })) ?? [];

    return NextResponse.json({ status: 'prefill', items: prefillItems });
  } catch (error) {
    logger.error('[GET /api/menu/today]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
