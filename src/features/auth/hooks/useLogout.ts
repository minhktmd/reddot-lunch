'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { routes } from '@/config/routes';
import { logger } from '@/shared/lib/logger';

import { logout } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.push(routes.login);
    },
    onError: (error: Error) => {
      logger.error('logout failed', error);
      toast.error('Failed to log out. Please try again.');
    },
  });
}
