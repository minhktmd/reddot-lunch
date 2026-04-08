import { del, put } from '@vercel/blob';

import { env } from '@/config/env';

export async function uploadQRCode(file: File, oldUrl?: string | null): Promise<string> {
  const uploadPromise = put(`payment-qr-${Date.now()}`, file, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  const deletePromise = oldUrl
    ? del(oldUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch(() => {
        // Old blob may already be gone — not critical
      })
    : undefined;

  const [{ url }] = await Promise.all([uploadPromise, deletePromise]);

  return url;
}
