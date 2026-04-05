import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/shared/lib/prisma';
import { logger } from '@/shared/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "YYYY-MM"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ message: 'Tham số month không hợp lệ' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!employee) {
      return NextResponse.json({ message: 'Nhân viên không tồn tại' }, { status: 404 });
    }

    const [year, m] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate = new Date(Date.UTC(year, m, 1));

    const orders = await prisma.order.findMany({
      where: {
        employeeId: id,
        menuOfDay: {
          date: { gte: startDate, lt: endDate },
        },
      },
      include: {
        menuOfDay: { select: { date: true } },
        menuOfDayItem: {
          select: {
            price: true,
            menuItem: { select: { name: true } },
          },
        },
      },
      orderBy: { menuOfDay: { date: 'asc' } },
    });

    const result = orders.map((order) => ({
      date: order.menuOfDay.date.toISOString(),
      menuItemName: order.menuOfDayItem.menuItem.name,
      quantity: order.quantity,
      unitPrice: order.menuOfDayItem.price,
      subtotal: order.quantity * order.menuOfDayItem.price,
      isPaid: order.isPaid,
    }));

    return NextResponse.json({ employee, month, orders: result });
  } catch (error) {
    logger.error('[GET /api/report/employee/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
