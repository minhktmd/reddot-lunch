import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { computeBalance } from '@/domains/ledger';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const topupSchema = z.object({
  employeeId: z.string().min(1),
  amount: z.number().int().min(1000),
  createdBy: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = topupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId, amount, createdBy } = result.data;

    await prisma.ledgerEntry.create({
      data: {
        employeeId,
        amount,
        type: 'topup',
        createdBy: createdBy ?? employeeId,
      },
    });

    const balance = await computeBalance(employeeId);
    return NextResponse.json({ employeeId, balance });
  } catch (error) {
    logger.error('[POST /api/finance/topup]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
