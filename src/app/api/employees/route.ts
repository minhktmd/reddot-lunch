import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { EMPLOYEE_ROLE } from '@/domains/employee';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  slackId: z.string().optional().nullable(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const employees = await prisma.employee.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(employees);
  } catch (error) {
    logger.error('[GET /api/employees]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = createEmployeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ', errors: result.error.flatten() }, { status: 400 });
    }

    const { name, email, slackId, role } = result.data;

    const employee = await prisma.employee.create({
      data: {
        name,
        email: email ?? null,
        slackId: slackId ?? null,
        role: role ?? EMPLOYEE_ROLE.MEMBER,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    logger.error('[POST /api/employees]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
