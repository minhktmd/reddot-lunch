import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ message: 'employeeId là bắt buộc' }, { status: 400 });
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      entries.map((e) => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        note: e.note,
        orderId: e.orderId,
        createdAt: e.createdAt.toISOString(),
        createdBy: e.createdBy,
      }))
    );
  } catch (error) {
    logger.error('[GET /api/finance/ledger]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
