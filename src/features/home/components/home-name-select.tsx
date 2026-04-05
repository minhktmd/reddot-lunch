'use client';

import { useState } from 'react';

import { EmployeeSelect } from '@/domains/employee';
import type { EmployeeListItem } from '@/domains/employee';

type HomeNameSelectProps = {
  employees: EmployeeListItem[];
  onConfirm: (employeeId: string) => void;
};

export function HomeNameSelect({ employees, onConfirm }: HomeNameSelectProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) onConfirm(selectedId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🍱</div>
          <h1 className="text-xl font-bold text-gray-900">Đặt cơm văn phòng</h1>
          <p className="mt-1 text-sm text-gray-500">Chọn tên của bạn để bắt đầu</p>
        </div>

        <div className="space-y-4">
          <EmployeeSelect employees={employees} value={selectedId} onChange={setSelectedId} />

          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
