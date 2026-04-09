import { type NextRequest, NextResponse } from 'next/server';

import { computeBalance } from '@/domains/ledger';
import { logger } from '@/shared/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ message: 'employeeId là bắt buộc' }, { status: 400 });
    }

    const balance = await computeBalance(employeeId);
    return NextResponse.json({ employeeId, balance });
  } catch (error) {
    logger.error('[GET /api/finance/balance]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
