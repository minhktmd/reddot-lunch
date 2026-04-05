import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/shared/lib/prisma';
import { logger } from '@/shared/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { name?: string; isActive?: boolean };

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Món ăn không tồn tại' }, { status: 404 });
    }

    const data: { name?: string; isActive?: boolean } = {};

    if (typeof body.name === 'string' && body.name.trim().length > 0) {
      data.name = body.name.trim();
    }

    if (typeof body.isActive === 'boolean') {
      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Không có dữ liệu cập nhật' }, { status: 400 });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('[PATCH /api/menu-items/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
