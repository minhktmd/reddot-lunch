'use client';

import { cn } from '@/shared/lib/cn';

import { useToggleAutoOrder } from '../hooks/use-toggle-auto-order';

type AutoOrderToggleProps = {
  employeeId: string;
  autoOrder: boolean;
};

function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        'focus:ring-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
        checked ? 'bg-blue-600' : 'bg-muted',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <span
        className={cn(
          'bg-background inline-block h-4 w-4 transform rounded-full shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function AutoOrderToggle({ employeeId, autoOrder }: AutoOrderToggleProps) {
  const toggle = useToggleAutoOrder(employeeId);

  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-4">
      <Switch checked={autoOrder} onCheckedChange={(val) => toggle.mutate(val)} disabled={toggle.isPending} />
      <div>
        <p className="text-foreground text-sm font-medium">Tự động đặt cơm cho tôi</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Hệ thống sẽ tự đặt một món ngẫu nhiên hàng ngày khi admin đăng thực đơn
        </p>
      </div>
    </div>
  );
}
