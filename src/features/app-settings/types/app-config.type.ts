import { z } from 'zod';

export const appConfigResponseSchema = z.object({
  id: z.string(),
  qrCodeUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type AppConfigResponse = z.infer<typeof appConfigResponseSchema>;
