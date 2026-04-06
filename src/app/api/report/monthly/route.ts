import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "YYYY-MM"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ message: 'Tham số month không hợp lệ' }, { status: 400 });
    }

    const [year, m] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate = new Date(Date.UTC(year, m, 1));

    const orders = await prisma.order.findMany({
      where: {
        menuOfDay: {
          date: { gte: startDate, lt: endDate },
        },
      },
      include: {
        employee: { select: { id: true, name: true } },
        menuOfDay: { select: { date: true } },
        menuOfDayItem: { select: { price: true } },
      },
    });

    // Group by employee
    const employeeMap = new Map<
      string,
      {
        employee: { id: string; name: string };
        days: Set<string>;
        totalPortions: number;
        totalAmount: number;
        paidAmount: number;
        unpaidAmount: number;
      }
    >();

    for (const order of orders) {
      const empId = order.employee.id;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employee: order.employee,
          days: new Set(),
          totalPortions: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        });
      }
      const entry = employeeMap.get(empId)!;
      entry.days.add(order.menuOfDay.date.toISOString());
      const subtotal = order.quantity * order.menuOfDayItem.price;
      entry.totalPortions += order.quantity;
      entry.totalAmount += subtotal;
      if (order.isPaid) {
        entry.paidAmount += subtotal;
      } else {
        entry.unpaidAmount += subtotal;
      }
    }

    const rows = Array.from(employeeMap.values())
      .map((entry) => ({
        employee: entry.employee,
        daysOrdered: entry.days.size,
        totalPortions: entry.totalPortions,
        totalAmount: entry.totalAmount,
        paidAmount: entry.paidAmount,
        unpaidAmount: entry.unpaidAmount,
      }))
      .sort((a, b) => a.employee.name.localeCompare(b.employee.name));

    return NextResponse.json({ month, rows });
  } catch (error) {
    logger.error('[GET /api/report/monthly]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
