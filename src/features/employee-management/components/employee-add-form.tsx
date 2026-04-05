'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { EMPLOYEE_ROLE } from '@/domains/employee';
import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/atoms/select';

import { useAddEmployee } from '../hooks/use-add-employee';
import { addEmployeeSchema, type AddEmployeeInput } from '../types/employee-management.type';

export function EmployeeAddForm() {
  const { mutate: addEmployee, isPending } = useAddEmployee();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddEmployeeInput>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: { role: EMPLOYEE_ROLE.MEMBER },
  });

  const onSubmit = (data: AddEmployeeInput) => {
    addEmployee(data, { onSuccess: () => reset() });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div className="flex flex-col gap-1">
        <Input placeholder="Tên *" {...register('name')} className="w-40" />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Input placeholder="Email" {...register('email')} className="w-44" />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <Input placeholder="Slack ID" {...register('slackId')} className="w-32" />

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

      <Button type="submit" disabled={isPending} size="md">
        {isPending ? 'Đang thêm...' : 'Thêm'}
      </Button>
    </form>
  );
}
