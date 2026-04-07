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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="bg-card w-full max-w-sm min-w-90 rounded-xl px-8 py-12 shadow-md">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🍱</div>
          <h1 className="text-foreground text-2xl font-bold">Đặt cơm văn phòng</h1>
          <p className="text-muted-foreground mt-1 text-sm">Chọn tên của bạn để bắt đầu</p>
        </div>

        <div className="flex flex-col gap-4">
          <EmployeeSelect employees={employees} value={selectedId} onChange={setSelectedId} />

          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full cursor-pointer rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
