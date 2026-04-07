'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, UtensilsCrossed, Users, BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { getTodayAdminOrders } from '@/features/admin-dashboard';
import { getMenuSuggestions } from '@/features/menu-management';
import { ThemeToggle } from '@/shared/components/atoms/theme-toggle';
import { queryKeys } from '@/shared/constants/query-keys';
import { cn } from '@/shared/lib/cn';

import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Thực đơn hôm nay', icon: UtensilsCrossed },
  { href: '/admin/employees', label: 'Nhân viên', icon: Users },
  { href: '/admin/report', label: 'Báo cáo tháng', icon: BarChart2 },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

function DesktopSidebar({ pathname, onPrefetch }: { pathname: string; onPrefetch: (href: string) => void }) {
  return (
    <aside className="md:border-border md:bg-card hidden md:flex md:w-60 md:flex-col md:border-r">
      <div className="border-border flex h-14 items-center justify-between border-b px-4">
        <Link href="/admin" className="text-lg font-semibold">
          Admin
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => onPrefetch(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileBottomNav({ pathname, onPrefetch }: { pathname: string; onPrefetch: (href: string) => void }) {
  return (
    <nav className="border-border bg-card fixed inset-x-0 bottom-0 z-50 border-t md:hidden">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => onPrefetch(item.href)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function usePrefetchHandlers() {
  const queryClient = useQueryClient();

  const handlePrefetch = useCallback(
    (href: string) => {
      if (href === '/admin') {
        queryClient.prefetchQuery({ queryKey: queryKeys.orders.today, queryFn: getTodayAdminOrders });
      } else if (href === '/admin/menu') {
        queryClient.prefetchQuery({ queryKey: queryKeys.menu.suggestions, queryFn: getMenuSuggestions });
      }
    },
    [queryClient]
  );

  return handlePrefetch;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handlePrefetch = usePrefetchHandlers();

  return (
    <div className="bg-background flex h-dvh">
      <DesktopSidebar pathname={pathname} onPrefetch={handlePrefetch} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <MobileBottomNav pathname={pathname} onPrefetch={handlePrefetch} />
    </div>
  );
}
