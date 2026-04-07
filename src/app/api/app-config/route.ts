import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const getCachedConfig = unstable_cache(
  async () => {
    const config = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });

    return {
      id: config?.id ?? 'singleton',
      qrCodeUrl: config?.qrCodeUrl ?? null,
      updatedAt: config?.updatedAt?.toISOString() ?? null,
    };
  },
  ['config'],
  { revalidate: 300, tags: ['config'] }
);

export async function GET() {
  try {
    const data = await getCachedConfig();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[GET /api/app-config]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
