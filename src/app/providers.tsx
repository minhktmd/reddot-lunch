'use client';

import { Providers as SharedProviders } from '@/shared/providers';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SharedProviders>{children}</SharedProviders>;
}
