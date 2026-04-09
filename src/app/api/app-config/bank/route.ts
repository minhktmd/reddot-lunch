import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const saveBankConfigSchema = z.object({
  bankCode: z.string().min(1),
  bankAccount: z.string().min(1),
  bankAccountName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = saveBankConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const { bankCode, bankAccount, bankAccountName } = result.data;

    const config = await prisma.appConfig.upsert({
      where: { id: 'singleton' },
      update: { bankCode, bankAccount, bankAccountName },
      create: { id: 'singleton', bankCode, bankAccount, bankAccountName },
    });

    revalidateTag('config', { expire: 0 });

    return NextResponse.json({
      bankCode: config.bankCode,
      bankAccount: config.bankAccount,
      bankAccountName: config.bankAccountName,
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('[POST /api/app-config/bank]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
