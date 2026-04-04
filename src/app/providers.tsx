'use client';

// App-level provider composition.
// Lives in app/ (not shared/) because it imports from features/.
// shared/providers/ contains only dependency-free providers.

import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth';
import { Providers as SharedProviders } from '@/shared/providers';
import { registerTokenGetter } from '@/shared/services/api';

function AuthTokenRegistrar() {
  useEffect(() => {
    registerTokenGetter(() => useAuthStore.getState().accessToken);
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SharedProviders>
      <AuthTokenRegistrar />
      {children}
    </SharedProviders>
  );
}
