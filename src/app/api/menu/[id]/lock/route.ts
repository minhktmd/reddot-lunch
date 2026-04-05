import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/lib/logger'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const menu = await prisma.menuOfDay.findUnique({ where: { id } })

    if (!menu) {
      return NextResponse.json({ message: 'Không tìm thấy thực đơn' }, { status: 404 })
    }

    if (!menu.isPublished) {
      return NextResponse.json({ message: 'Thực đơn chưa được đăng' }, { status: 400 })
    }

    if (menu.isLocked) {
      return NextResponse.json({ message: 'Thực đơn đã bị chốt' }, { status: 400 })
    }

    const updated = await prisma.menuOfDay.update({
      where: { id },
      data: { isLocked: true },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({
      id: updated.id,
      date: updated.date.toISOString(),
      isPublished: updated.isPublished,
      isLocked: updated.isLocked,
      items: updated.items.map((item) => ({
        id: item.id,
        price: item.price,
        sideDishes: item.sideDishes,
        menuItem: item.menuItem,
      })),
    })
  } catch (error) {
    logger.error('[POST /api/menu/[id]/lock]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
