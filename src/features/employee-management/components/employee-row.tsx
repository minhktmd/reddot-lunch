'use client';

import { useState } from 'react';

import { EMPLOYEE_ROLE, type EmployeeListItem } from '@/domains/employee';
import { Button } from '@/shared/components/atoms/button';
import { cn } from '@/shared/lib/cn';

import { useToggleEmployeeActive } from '../hooks/use-edit-employee';

import { EmployeeDeleteDialog } from './employee-delete-dialog';

type EmployeeRowProps = {
  employee: EmployeeListItem;
  onEdit: () => void;
};

export function EmployeeRow({ employee, onEdit }: EmployeeRowProps) {
  const { mutate: toggleActive, isPending } = useToggleEmployeeActive();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isInactive = !employee.isActive;

  const handleToggleActive = () => {
    toggleActive({ id: employee.id, isActive: !employee.isActive });
  };

  return (
    <>
      <tr className={cn('border-b border-border transition-colors hover:bg-muted/50', isInactive && 'opacity-50')}>
        <td className="px-4 py-3 text-sm font-medium text-foreground">{employee.name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{employee.email ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{employee.slackId ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {employee.role === EMPLOYEE_ROLE.ADMIN ? 'Admin' : 'Thành viên'}
        </td>
        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{employee.autoOrder ? '✓' : '—'}</td>
        <td className="px-4 py-3 text-sm">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              employee.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            )}
          >
            {employee.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Sửa
            </Button>
            <Button
              variant={employee.isActive ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleToggleActive}
              disabled={isPending}
              aria-label={employee.isActive ? `Vô hiệu hóa ${employee.name}` : `Kích hoạt ${employee.name}`}
            >
              {employee.isActive ? 'Vô hiệu' : 'Kích hoạt'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              aria-label={`Xóa ${employee.name}`}
              className="bg-red-100 text-red-700 hover:bg-red-200"
            >
              Xóa
            </Button>
          </div>
        </td>
      </tr>
      <EmployeeDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employee={{ id: employee.id, name: employee.name }}
      />
    </>
  );
}
