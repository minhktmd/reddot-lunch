import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '@/config/env'
import { getTodayUTC } from '@/domains/menu'
import { buildAutoOrderMessage, buildMenuPublishedMessage } from '@/features/slack-notifications'
import { logger } from '@/shared/lib/logger'
import { prisma } from '@/shared/lib/prisma'
import { postChannel, postDM } from '@/shared/lib/slack'

const publishMenuSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemName: z.string().min(1),
        price: z.number().int().min(1),
        sideDishes: z.string().optional(),
      })
    )
    .min(1, 'Cần ít nhất một món'),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const result = publishMenuSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 })
    }

    const { items } = result.data
    const today = getTodayUTC()

    const existing = await prisma.menuOfDay.findUnique({ where: { date: today } })
    if (existing) {
      return NextResponse.json({ message: 'Thực đơn hôm nay đã được đăng' }, { status: 409 })
    }

    // Resolve or create MenuItem for each item name (case-insensitive)
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const existing = await prisma.menuItem.findFirst({
          where: { name: { equals: item.menuItemName, mode: 'insensitive' }, isActive: true },
        })
        const menuItem = existing ?? (await prisma.menuItem.create({ data: { name: item.menuItemName } }))
        return { menuItem, price: item.price, sideDishes: item.sideDishes ?? null }
      })
    )

    // Create MenuOfDay + items + auto orders in a transaction
    const menu = await prisma.$transaction(async (tx) => {
      const menuOfDay = await tx.menuOfDay.create({
        data: {
          date: today,
          isPublished: true,
          items: {
            create: resolvedItems.map((r) => ({
              menuItemId: r.menuItem.id,
              price: r.price,
              sideDishes: r.sideDishes,
            })),
          },
        },
        include: {
          items: {
            include: { menuItem: { select: { id: true, name: true } } },
          },
        },
      })

      // Auto orders for eligible employees
      const employees = await tx.employee.findMany({
        where: { isActive: true, autoOrder: true },
      })

      for (const employee of employees) {
        const existingOrder = await tx.order.count({
          where: { menuOfDayId: menuOfDay.id, employeeId: employee.id },
        })
        if (existingOrder > 0) continue

        const randomItem = menuOfDay.items[Math.floor(Math.random() * menuOfDay.items.length)]
        await tx.order.create({
          data: {
            menuOfDayId: menuOfDay.id,
            employeeId: employee.id,
            menuOfDayItemId: randomItem.id,
            quantity: 1,
            isAutoOrder: true,
          },
        })
      }

      return menuOfDay
    })

    // Slack notifications (outside transaction — failures should not roll back the publish)
    const appUrl = env.NEXT_PUBLIC_APP_URL;

    const channelMessage = buildMenuPublishedMessage(
      today,
      resolvedItems.map((r) => ({ menuItemName: r.menuItem.name, price: r.price, sideDishes: r.sideDishes })),
      appUrl,
    );
    await postChannel(channelMessage);

    // DMs to auto-order employees
    const autoOrderedEmployees = await prisma.order.findMany({
      where: { menuOfDayId: menu.id, isAutoOrder: true },
      include: {
        employee: true,
        menuOfDayItem: { include: { menuItem: true } },
      },
    });

    await Promise.allSettled(
      autoOrderedEmployees
        .filter((o) => o.employee.slackId)
        .map((o) =>
          postDM(
            o.employee.slackId!,
            buildAutoOrderMessage(o.menuOfDayItem.menuItem.name, o.menuOfDayItem.price, appUrl),
          ),
        ),
    );

    return NextResponse.json({
      id: menu.id,
      date: menu.date.toISOString(),
      isPublished: menu.isPublished,
      isLocked: menu.isLocked,
      items: menu.items.map((item) => ({
        id: item.id,
        price: item.price,
        sideDishes: item.sideDishes,
        menuItem: item.menuItem,
      })),
    })
  } catch (error) {
    logger.error('[POST /api/menu/publish]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
