import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['admin', 'member']),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
