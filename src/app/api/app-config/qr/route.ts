import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import { uploadQRCode } from '@/shared/lib/blob';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    const existing = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });
    const publicUrl = await uploadQRCode(file, existing?.qrCodeUrl);

    const config = await prisma.appConfig.upsert({
      where: { id: 'singleton' },
      update: { qrCodeUrl: publicUrl },
      create: { id: 'singleton', qrCodeUrl: publicUrl },
    });

    revalidateTag('config', { expire: 0 });

    return NextResponse.json({
      id: config.id,
      qrCodeUrl: config.qrCodeUrl,
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('[POST /api/app-config/qr]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
