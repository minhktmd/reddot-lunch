import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const payAllSchema = z.object({
  employeeId: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = payAllSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId } = result.data;

    await prisma.order.updateMany({
      where: { employeeId, isPaid: false },
      data: { isPaid: true, paidAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[PATCH /api/orders/pay]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
