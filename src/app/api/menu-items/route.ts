import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'

    const menuItems = await prisma.menuItem.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        menuOfDayItems: {
          orderBy: { menuOfDay: { date: 'desc' } },
          take: 1,
          select: { price: true, sideDishes: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        lastUsedPrice: item.menuOfDayItems[0]?.price ?? null,
        lastUsedSideDishes: item.menuOfDayItems[0]?.sideDishes ?? null,
      }))
    )
  } catch (error) {
    logger.error('[GET /api/menu-items]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ message: 'Tên món là bắt buộc' }, { status: 400 })
    }

    const name = body.name.trim()

    const menuItem = await prisma.menuItem.create({
      data: { name },
    })

    return NextResponse.json({
      id: menuItem.id,
      name: menuItem.name,
      isActive: menuItem.isActive,
      createdAt: menuItem.createdAt.toISOString(),
    })
  } catch (error) {
    logger.error('[POST /api/menu-items]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
