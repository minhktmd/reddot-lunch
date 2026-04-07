'use client';

import { useEffect, useState } from 'react';

import { useEmployees } from '@/domains/employee';

import { useHomeStore } from '../stores/home.store';

import { AutoOrderToggle } from './auto-order-toggle';
import { HomeHeader } from './home-header';
import { HomeNameSelect } from './home-name-select';
import { HomeTabs } from './home-tabs';

export function HomePage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const { selectedEmployeeId, setSelectedEmployee, clearSelectedEmployee } = useHomeStore();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Validate stored employee is still active in the system
  useEffect(() => {
    if (!isHydrated || !selectedEmployeeId || employeesLoading) return;
    const isValid = employees.some((e) => e.id === selectedEmployeeId && e.isActive);
    if (!isValid) {
      clearSelectedEmployee();
    }
  }, [isHydrated, selectedEmployeeId, employees, employeesLoading, clearSelectedEmployee]);

  if (!isHydrated || employeesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Đang tải...</div>
      </div>
    );
  }

  if (!selectedEmployeeId) {
    return <HomeNameSelect employees={employees.filter((e) => e.isActive)} onConfirm={setSelectedEmployee} />;
  }

  const employee = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="bg-background min-h-screen">
      <HomeHeader employeeName={employee?.name ?? ''} onChangeName={clearSelectedEmployee} />

      <HomeTabs employeeId={selectedEmployeeId} />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <AutoOrderToggle employeeId={selectedEmployeeId} autoOrder={employee?.autoOrder ?? false} />
      </div>
    </div>
  );
}
