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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full min-w-[360px] max-w-sm rounded-xl bg-card px-8 py-12 shadow-md">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🍱</div>
          <h1 className="text-2xl font-bold text-foreground">Đặt cơm văn phòng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chọn tên của bạn để bắt đầu</p>
        </div>

        <div className="flex flex-col gap-4">
          <EmployeeSelect employees={employees} value={selectedId} onChange={setSelectedId} />

          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="h-11 w-full cursor-pointer rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed"
          >
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
