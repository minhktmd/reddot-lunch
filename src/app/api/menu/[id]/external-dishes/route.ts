import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

import type { ExternalDishItem } from '@/domains/menu';

const externalDishItemSchema = z.object({
  name: z.string().min(1),
  orderUrl: z.string().url(),
});

const saveExternalDishesSchema = z.object({
  externalDishes: z.array(externalDishItemSchema),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = saveExternalDishesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: parsed.error.flatten() }, { status: 400 });
    }

    const menu = await prisma.menuOfDay.findUnique({ where: { id } });
    if (!menu) {
      return NextResponse.json({ message: 'Không tìm thấy thực đơn' }, { status: 404 });
    }

    if (menu.isLocked) {
      return NextResponse.json({ message: 'Thực đơn đã chốt, không thể chỉnh sửa' }, { status: 403 });
    }

    const updated = await prisma.menuOfDay.update({
      where: { id },
      data: { externalDishes: parsed.data.externalDishes },
    });

    revalidateTag('menu-today', 'default');

    return NextResponse.json({
      externalDishes: (updated.externalDishes as ExternalDishItem[]) ?? [],
    });
  } catch (error) {
    logger.error('[PATCH /api/menu/[id]/external-dishes]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
