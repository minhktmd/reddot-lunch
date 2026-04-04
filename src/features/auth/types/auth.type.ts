import { z } from 'zod';

import { userSchema } from '@/domains/user';

// ——— Schemas ———

export const loginPayloadSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

// ——— Derived types ———

export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
