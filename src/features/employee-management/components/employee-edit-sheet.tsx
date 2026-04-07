'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { EMPLOYEE_ROLE, type EmployeeListItem } from '@/domains/employee';
import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';
import { Label } from '@/shared/components/atoms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/atoms/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/atoms/sheet';

import { useEditEmployee } from '../hooks/use-edit-employee';
import { editEmployeeSchema, type EditEmployeeInput } from '../types/employee-management.type';

type EmployeeEditSheetProps = {
  employee: EmployeeListItem | null;
  onClose: () => void;
};

export function EmployeeEditSheet({ employee, onClose }: EmployeeEditSheetProps) {
  const open = employee !== null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sửa thông tin nhân viên</SheetTitle>
          <SheetDescription>Chỉnh sửa thông tin và nhấn Lưu để cập nhật.</SheetDescription>
        </SheetHeader>
        {employee && <EmployeeEditForm employee={employee} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function EmployeeEditForm({ employee, onClose }: { employee: EmployeeListItem; onClose: () => void }) {
  const { mutate: editEmployee, isPending } = useEditEmployee();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditEmployeeInput>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      name: employee.name,
      email: employee.email ?? '',
      slackId: employee.slackId ?? '',
      role: employee.role,
    },
  });

  const onSubmit = (data: EditEmployeeInput) => {
    editEmployee({ id: employee.id, ...data }, { onSuccess: onClose });
  };

  return (
    <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Tên *</Label>
          <Input id="edit-name" placeholder="Tên nhân viên" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-email">Email</Label>
          <Input id="edit-email" placeholder="Email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-slackId">Slack ID</Label>
          <Input id="edit-slackId" placeholder="Slack ID" {...register('slackId')} />
          <p className="text-muted-foreground text-xs">Slack member ID, ví dụ: U012AB3CD</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Vai trò</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPLOYEE_ROLE.MEMBER}>Thành viên</SelectItem>
                  <SelectItem value={EMPLOYEE_ROLE.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <SheetFooter>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
}
