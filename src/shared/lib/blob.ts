import { put } from '@vercel/blob';

import { env } from '@/config/env';

export async function uploadQRCode(file: File): Promise<string> {
  const { url } = await put('payment-qr', file, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return `${url}?t=${Date.now()}`;
}
