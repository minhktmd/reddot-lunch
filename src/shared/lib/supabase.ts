import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

const BUCKET = 'qr-codes';
const QR_PATH = 'payment-qr.png';

// Server-side client using service role key — never expose to the browser
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Uploads a QR code image to Supabase Storage and returns the public URL.
 * Overwrites the existing file at `qr-codes/payment-qr.png`.
 */
export async function uploadQRCode(file: File): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(QR_PATH, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(`Failed to upload QR code: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(QR_PATH);
  return data.publicUrl;
}
