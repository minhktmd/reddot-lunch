'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { EMPLOYEE_ROLE, type EmployeeListItem } from '@/domains/employee';
import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/atoms/select';

import { useEditEmployee } from '../hooks/use-edit-employee';
import { editEmployeeSchema, type EditEmployeeInput } from '../types/employee-management.type';

type EmployeeRowEditProps = {
  employee: EmployeeListItem;
  onCancel: () => void;
};

export function EmployeeRowEdit({ employee, onCancel }: EmployeeRowEditProps) {
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
    editEmployee({ id: employee.id, ...data }, { onSuccess: onCancel });
  };

  return (
    <tr className="bg-blue-50">
      <td colSpan={7} className="px-4 py-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-2">
          <div className="flex flex-col gap-1">
            <Input placeholder="Tên *" {...register('name')} className="w-40" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Input placeholder="Email" {...register('email')} className="w-44" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Input placeholder="Slack ID" {...register('slackId')} className="w-32" />
            <p className="text-xs text-muted-foreground">Slack member ID, ví dụ: U012AB3CD</p>
          </div>

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPLOYEE_ROLE.MEMBER}>Thành viên</SelectItem>
                  <SelectItem value={EMPLOYEE_ROLE.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
              Hủy
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}
