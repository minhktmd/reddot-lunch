'use client';

import Link from 'next/link';

import { useLockMenu } from '../hooks/use-lock-menu';
import { useTodayMenu } from '../hooks/use-today-menu';
import { useTodayOrders } from '../hooks/use-today-orders';
import { useUnlockMenu } from '../hooks/use-unlock-menu';

import { DashboardBalanceOverview } from './dashboard-balance-overview';
import { DashboardKitchenSummary } from './dashboard-kitchen-summary';
import { DashboardOrderSummary } from './dashboard-order-summary';
import { DashboardStatusBar } from './dashboard-status-bar';

export function AdminDashboardPage() {
  const { data: menuResponse, isLoading: isMenuLoading } = useTodayMenu();
  const { data: todayOrders = [], isLoading: isOrdersLoading } = useTodayOrders();
  const { mutate: lock, isPending: isLocking } = useLockMenu();
  const { mutate: unlock, isPending: isUnlocking } = useUnlockMenu();

  const isLoading = isMenuLoading || isOrdersLoading;

  if (isLoading) {
    return <div className="text-muted-foreground flex min-h-50 items-center justify-center">Đang tải...</div>;
  }

  const hasPublishedMenu = menuResponse?.status === 'exists' && menuResponse.menu.isPublished;

  if (!hasPublishedMenu) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Hôm nay chưa có thực đơn.</p>
        <Link
          href="/admin/menu"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          Tạo thực đơn
        </Link>
      </div>
    );
  }

  const menu = menuResponse.menu;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <DashboardStatusBar
        menu={menu}
        onLock={() => lock(menu.id)}
        onUnlock={() => unlock(menu.id)}
        isLocking={isLocking}
        isUnlocking={isUnlocking}
      />
      <DashboardKitchenSummary orders={todayOrders} />
      <DashboardOrderSummary orders={todayOrders} />
      <DashboardBalanceOverview />
    </div>
  );
}
