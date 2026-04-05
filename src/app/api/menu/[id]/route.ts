import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/lib/logger'

const patchMenuSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    menuItemName: z.string().min(1),
    price: z.number().int().min(1),
    sideDishes: z.string().optional(),
  }),
  z.object({
    action: z.literal('edit'),
    menuOfDayItemId: z.string().min(1),
    price: z.number().int().min(1).optional(),
    sideDishes: z.string().optional(),
  }),
  z.object({
    action: z.literal('remove'),
    menuOfDayItemId: z.string().min(1),
  }),
])

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body: unknown = await request.json()
    const result = patchMenuSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 })
    }

    const menu = await prisma.menuOfDay.findUnique({
      where: { id },
      include: { items: { include: { menuItem: { select: { id: true, name: true } } } } },
    })

    if (!menu) {
      return NextResponse.json({ message: 'Không tìm thấy thực đơn' }, { status: 404 })
    }

    if (menu.isLocked) {
      return NextResponse.json({ message: 'Thực đơn đã bị chốt, không thể chỉnh sửa' }, { status: 403 })
    }

    const data = result.data

    if (data.action === 'add') {
      const existing = await prisma.menuItem.findFirst({
        where: { name: { equals: data.menuItemName, mode: 'insensitive' }, isActive: true },
      })
      const menuItem = existing ?? (await prisma.menuItem.create({ data: { name: data.menuItemName } }))

      await prisma.menuOfDayItem.create({
        data: {
          menuOfDayId: id,
          menuItemId: menuItem.id,
          price: data.price,
          sideDishes: data.sideDishes ?? null,
        },
      })
    }

    if (data.action === 'edit') {
      const item = await prisma.menuOfDayItem.findFirst({
        where: { id: data.menuOfDayItemId, menuOfDayId: id },
      })

      if (!item) {
        return NextResponse.json({ message: 'Không tìm thấy món' }, { status: 404 })
      }

      await prisma.menuOfDayItem.update({
        where: { id: data.menuOfDayItemId },
        data: {
          price: data.price ?? item.price,
          sideDishes: data.sideDishes !== undefined ? data.sideDishes || null : item.sideDishes,
        },
      })
    }

    if (data.action === 'remove') {
      const item = await prisma.menuOfDayItem.findFirst({
        where: { id: data.menuOfDayItemId, menuOfDayId: id },
        include: { _count: { select: { orders: true } } },
      })

      if (!item) {
        return NextResponse.json({ message: 'Không tìm thấy món' }, { status: 404 })
      }

      if (item._count.orders > 0) {
        return NextResponse.json(
          { message: 'Không thể xóa món đã có đơn hàng. Hủy đơn hàng trước.' },
          { status: 409 }
        )
      }

      await prisma.menuOfDayItem.delete({ where: { id: data.menuOfDayItemId } })
    }

    // Return updated menu
    const updated = await prisma.menuOfDay.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({
      id: updated!.id,
      date: updated!.date.toISOString(),
      isPublished: updated!.isPublished,
      isLocked: updated!.isLocked,
      items: updated!.items.map((item) => ({
        id: item.id,
        price: item.price,
        sideDishes: item.sideDishes,
        menuItem: item.menuItem,
      })),
    })
  } catch (error) {
    logger.error('[PATCH /api/menu/[id]]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
