'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { routes } from '@/config/routes';

import { login } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

import type { LoginPayload } from '../types/auth.type';

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      queryClient.invalidateQueries();
      router.push(routes.home);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
