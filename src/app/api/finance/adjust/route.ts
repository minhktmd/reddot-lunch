import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { computeBalance } from '@/domains/ledger';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const adjustSchema = z.object({
  employeeId: z.string().min(1),
  targetBalance: z.number().int(),
  note: z.string().optional(),
  adminEmployeeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = adjustSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId, targetBalance, note, adminEmployeeId } = result.data;

    const currentBalance = await computeBalance(employeeId);
    const delta = targetBalance - currentBalance;

    if (delta === 0) {
      return NextResponse.json({ employeeId, balance: currentBalance });
    }

    await prisma.ledgerEntry.create({
      data: {
        employeeId,
        amount: delta,
        type: 'adjustment',
        note: note ?? 'Admin adjustment',
        createdBy: adminEmployeeId,
      },
    });

    return NextResponse.json({ employeeId, balance: targetBalance });
  } catch (error) {
    logger.error('[POST /api/finance/adjust]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
