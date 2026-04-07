'use client';

import { useState } from 'react';

import { useEmployeesAll } from '../hooks/use-employees-all';

import { EmployeeRow } from './employee-row';
import { EmployeeRowEdit } from './employee-row-edit';

export function EmployeeTable() {
  const { data: employees, isLoading, isError } = useEmployeesAll();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Đang tải...</p>;
  }

  if (isError) {
    return <p className="py-8 text-center text-sm text-red-500">Không thể tải danh sách nhân viên.</p>;
  }

  if (!employees || employees.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Chưa có nhân viên nào.</p>;
  }

  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="w-full min-w-175 text-left">
        <thead className="border-border bg-muted text-muted-foreground border-b text-xs font-medium tracking-wide uppercase">
          <tr>
            <th className="px-4 py-3">Tên</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Slack ID</th>
            <th className="px-4 py-3">Vai trò</th>
            <th className="px-4 py-3 text-center">Tự động đặt</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) =>
            editingId === employee.id ? (
              <EmployeeRowEdit key={employee.id} employee={employee} onCancel={() => setEditingId(null)} />
            ) : (
              <EmployeeRow key={employee.id} employee={employee} onEdit={() => setEditingId(employee.id)} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
