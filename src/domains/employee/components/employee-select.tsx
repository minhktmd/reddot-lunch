'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/atoms/select';

import type { EmployeeListItem } from '../types/employee.type';

type EmployeeSelectProps = {
  employees: EmployeeListItem[];
  value: string | null;
  onChange: (id: string) => void;

  disabled?: boolean;
  placeholder?: string;
};

export function EmployeeSelect({
  employees,
  value,
  onChange,
  disabled,
  placeholder = 'Chọn tên của bạn',
}: EmployeeSelectProps) {
  return (
    <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
