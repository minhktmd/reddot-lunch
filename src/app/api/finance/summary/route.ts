import { NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET() {
  try {
    const [employees, grouped, totalResult] = await Promise.all([
      prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.ledgerEntry.groupBy({
        by: ['employeeId'],
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
    ]);

    const balanceMap = new Map(grouped.map((g) => [g.employeeId, g._sum.amount ?? 0]));

    return NextResponse.json({
      fundBalance: totalResult._sum.amount ?? 0,
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        balance: balanceMap.get(e.id) ?? 0,
      })),
    });
  } catch (error) {
    logger.error('[GET /api/finance/summary]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
