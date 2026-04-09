import { EmployeeAddForm, EmployeeTable } from '@/features/employee-management';

export default function EmployeesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-foreground mb-6 text-2xl font-semibold">Quản lý nhân viên</h1>
      <div className="flex flex-col gap-6">
        <EmployeeAddForm />
        <EmployeeTable />
      </div>
    </main>
  );
}
