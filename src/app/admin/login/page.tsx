import { Suspense } from 'react';

import { AdminLoginPage } from '@/features/admin-login';

export default function Page() {
  return (
    <Suspense>
      <AdminLoginPage />
    </Suspense>
  );
}
