import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { parseDateParam } from '@/domains/menu';
import { prisma } from '@/shared/lib/prisma';
import { logger } from '@/shared/lib/logger';

const unpaySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = unpaySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId, date } = result.data;
    const parsedDate = parseDateParam(date);

    await prisma.order.updateMany({
      where: {
        employeeId,
        menuOfDay: { date: parsedDate },
        isPaid: true,
      },
      data: { isPaid: false, paidAt: null },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[PATCH /api/orders/unpay]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
