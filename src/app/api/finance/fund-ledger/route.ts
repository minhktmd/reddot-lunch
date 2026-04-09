import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const TZ = 'Asia/Ho_Chi_Minh';

function formatDateKey(d: Date) {
  return format(toZonedTime(d, TZ), 'yyyy-MM-dd');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month') ?? format(toZonedTime(new Date(), TZ), 'yyyy-MM');
    const [year, month] = monthStr.split('-').map(Number);
    const monthStart = fromZonedTime(new Date(year, month - 1, 1), TZ);
    const monthEnd = fromZonedTime(new Date(year, month, 1), TZ);

    const [entries, menuDays] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { type: { in: ['topup', 'adjustment'] }, createdAt: { gte: monthStart, lt: monthEnd } },
        include: { employee: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.menuOfDay.findMany({
        where: { date: { gte: monthStart, lt: monthEnd }, isPublished: true, orders: { some: {} } },
        include: {
          orders: {
            include: {
              menuOfDayItem: { select: { name: true, price: true } },
              employee: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const lunchItems = menuDays.map((day) => {
      const dishMap = new Map<
        string,
        { quantity: number; subtotal: number; employeeMap: Map<string, number> }
      >();
      for (const order of day.orders) {
        const existing = dishMap.get(order.menuOfDayItem.name) ?? {
          quantity: 0,
          subtotal: 0,
          employeeMap: new Map<string, number>(),
        };
        existing.quantity += order.quantity;
        existing.subtotal += order.quantity * order.menuOfDayItem.price;
        existing.employeeMap.set(
          order.employee.name,
          (existing.employeeMap.get(order.employee.name) ?? 0) + order.quantity,
        );
        dishMap.set(order.menuOfDayItem.name, existing);
      }
      const dishes = Array.from(dishMap.entries())
        .map(([name, { quantity, subtotal, employeeMap }]) => ({
          name,
          quantity,
          subtotal,
          employees: Array.from(employeeMap.entries())
            .map(([empName, qty]) => ({ name: empName, quantity: qty }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => b.quantity - a.quantity);
      const totalAmount = dishes.reduce((sum, d) => sum + d.subtotal, 0);
      return {
        type: 'lunch_day' as const,
        date: formatDateKey(day.date),
        totalAmount: -totalAmount,
        orderCount: dishes.reduce((sum, d) => sum + d.quantity, 0),
        dishes,
      };
    });

    const entryItems = entries.map((e) => ({
      type: e.type as 'topup' | 'adjustment',
      date: formatDateKey(e.createdAt),
      amount: e.amount,
      employeeName: e.employee.name,
      note: e.note,
    }));

    const allItems = [...lunchItems, ...entryItems].sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({ month: monthStr, items: allItems });
  } catch (error) {
    logger.error('[GET /api/finance/fund-ledger]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
