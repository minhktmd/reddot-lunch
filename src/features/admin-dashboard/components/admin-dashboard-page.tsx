'use client';

import Link from 'next/link';

import type { EmployeePayment } from '../types/admin-dashboard.type';
import { useTodayMenu } from '../hooks/use-today-menu';
import { useTodayOrders } from '../hooks/use-today-orders';
import { useLockMenu } from '../hooks/use-lock-menu';
import { useUnlockMenu } from '../hooks/use-unlock-menu';
import { DashboardStatusBar } from './dashboard-status-bar';
import { DashboardOrderSummary } from './dashboard-order-summary';
import { DashboardKitchenSummary } from './dashboard-kitchen-summary';
import { DashboardPaymentStatus } from './dashboard-payment-status';

export function AdminDashboardPage() {
  const { data: menuResponse, isLoading: isMenuLoading } = useTodayMenu();
  const { data: todayOrders = [], isLoading: isOrdersLoading } = useTodayOrders();
  const { mutate: lock, isPending: isLocking } = useLockMenu();
  const { mutate: unlock, isPending: isUnlocking } = useUnlockMenu();

  const isLoading = isMenuLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  const hasPublishedMenu =
    menuResponse?.status === 'exists' && menuResponse.menu.isPublished;

  if (!hasPublishedMenu) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Hôm nay chưa có thực đơn.</p>
        <Link
          href="/admin/menu"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tạo thực đơn
        </Link>
      </div>
    );
  }

  const menu = menuResponse.menu;

  // Derived data — computed client-side from orders
  const employeeOrderMap = todayOrders.reduce<
    Record<string, { name: string; totalAmount: number; hasPaid: boolean; paidAt: string | null }>
  >((acc, order) => {
    const { id, name } = order.employee;
    if (!acc[id]) {
      acc[id] = { name, totalAmount: 0, hasPaid: false, paidAt: null };
    }
    acc[id].totalAmount += order.quantity * order.menuOfDayItem.price;
    if (order.isPaid) {
      acc[id].hasPaid = true;
      if (!acc[id].paidAt && order.paidAt) acc[id].paidAt = order.paidAt;
    }
    return acc;
  }, {});

  const paidEmployees: EmployeePayment[] = [];
  const unpaidEmployees: EmployeePayment[] = [];

  for (const [employeeId, { name, totalAmount, hasPaid, paidAt }] of Object.entries(employeeOrderMap)) {
    const entry: EmployeePayment = { employeeId, employeeName: name, totalAmount, paidAt };
    if (hasPaid) {
      paidEmployees.push(entry);
    } else {
      unpaidEmployees.push(entry);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <DashboardStatusBar
        menu={menu}
        onLock={() => lock(menu.id)}
        onUnlock={() => unlock(menu.id)}
        isLocking={isLocking}
        isUnlocking={isUnlocking}
      />
      <DashboardKitchenSummary orders={todayOrders} />
      <DashboardOrderSummary orders={todayOrders} />
      <DashboardPaymentStatus paidEmployees={paidEmployees} unpaidEmployees={unpaidEmployees} />
    </div>
  );
}
