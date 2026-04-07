'use client';

import { cn } from '@/shared/lib/cn';

type MenuStatus = 'prefill' | 'published' | 'locked';

type Props = {
  status: MenuStatus;
};

const STATUS_CONFIG: Record<MenuStatus, { label: string; className: string }> = {
  prefill: { label: 'Chưa đăng', className: 'bg-muted text-muted-foreground' },
  published: { label: 'Đã đăng', className: 'bg-green-100 text-green-700' },
  locked: { label: 'Đã chốt', className: 'bg-red-100 text-red-700' },
};

export function MenuStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', config.className)}>
      {config.label}
    </span>
  );
}
