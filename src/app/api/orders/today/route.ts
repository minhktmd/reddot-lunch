import { NextResponse } from 'next/server'

import { getTodayUTC } from '@/domains/menu'
import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/lib/logger'

export async function GET() {
  try {
    const today = getTodayUTC()

    const menu = await prisma.menuOfDay.findUnique({ where: { date: today } })

    if (!menu) {
      return NextResponse.json([])
    }

    const orders = await prisma.order.findMany({
      where: { menuOfDayId: menu.id },
      include: {
        employee: { select: { id: true, name: true } },
        menuOfDayItem: {
          include: {
            menuItem: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        quantity: order.quantity,
        isAutoOrder: order.isAutoOrder,
        isPaid: order.isPaid,
        paidAt: order.paidAt?.toISOString() ?? null,
        employee: order.employee,
        menuOfDayItem: {
          id: order.menuOfDayItem.id,
          price: order.menuOfDayItem.price,
          menuItem: order.menuOfDayItem.menuItem,
        },
      }))
    )
  } catch (error) {
    logger.error('[GET /api/orders/today]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
