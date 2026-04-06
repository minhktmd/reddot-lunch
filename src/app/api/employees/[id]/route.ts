import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { EMPLOYEE_ROLE } from '@/domains/employee';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  slackId: z.string().nullable().optional(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]).optional(),
  autoOrder: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const ordersDeleted = await tx.order.deleteMany({ where: { employeeId: id } });
      await tx.employee.delete({ where: { id } });
      return { deleted: true, ordersDeleted: ordersDeleted.count };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[DELETE /api/employees/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const result = updateEmployeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(employee);
  } catch (error) {
    logger.error('[PATCH /api/employees/[id]]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
