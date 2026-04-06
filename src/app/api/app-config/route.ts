import { NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });

    return NextResponse.json({
      id: config?.id ?? 'singleton',
      qrCodeUrl: config?.qrCodeUrl ?? null,
      updatedAt: config?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error('[GET /api/app-config]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
