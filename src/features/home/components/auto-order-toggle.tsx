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
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
        checked ? 'bg-blue-600' : 'bg-gray-200',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function AutoOrderToggle({ employeeId, autoOrder }: AutoOrderToggleProps) {
  const toggle = useToggleAutoOrder(employeeId);

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
      <Switch
        checked={autoOrder}
        onCheckedChange={(val) => toggle.mutate(val)}
        disabled={toggle.isPending}
      />
      <div>
        <p className="text-sm font-medium text-gray-900">Tự động đặt cơm cho tôi</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Hệ thống sẽ tự đặt một món ngẫu nhiên khi admin đăng thực đơn
        </p>
      </div>
    </div>
  );
}
